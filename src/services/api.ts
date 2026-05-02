import type { TrackedOrder } from '../store/orderStore';
import type { Restaurant } from './restaurants';

export function getPublicApiUrl() {
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8787';
}

export type SendOtpResponse = { ok: boolean; message?: string };

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  try {
    const res = await fetch(`${getPublicApiUrl()}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) return { ok: false, message: await res.text() };
    return { ok: true };
  } catch {
    return { ok: false, message: 'Network error — continuing in offline demo mode.' };
  }
}

export type VerifyOtpResponse = {
  ok: boolean;
  token?: string;
  message?: string;
};

export type ExchangeGoogleResponse =
  | { ok: true; token: string; phone: string; name?: string; email?: string }
  | { ok: false; message: string };

type TokenInfo = {
  aud?: string | string[];
  azp?: string;
  email?: string;
  name?: string;
  exp?: string;
  sub?: string;
};

async function fetchGoogleProfileFromToken(
  idToken: string,
  allowedAudiences: string[]
): Promise<
  | { ok: false; message: string }
  | {
      ok: true;
      sub: string;
      email?: string;
      name?: string;
    }
> {
  if (allowedAudiences.length === 0) {
    return { ok: false, message: 'Google OAuth client IDs are not configured in the app.' };
  }
  try {
    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { method: 'GET' }
    );
    if (!r.ok) return { ok: false, message: 'Could not verify Google token.' };
    const t = (await r.json()) as TokenInfo;
    const audience = typeof t.aud === 'string' ? t.aud : Array.isArray(t.aud) ? t.aud[0] : t.azp;
    if (!audience || !allowedAudiences.includes(audience)) {
      return { ok: false, message: 'Google token audience mismatch. Check OAuth client IDs.' };
    }
    const expSec = Number(t.exp);
    if (!Number.isFinite(expSec) || expSec * 1000 < Date.now() - 120_000) {
      return { ok: false, message: 'Google sign-in expired. Try again.' };
    }
    const sub = typeof t.sub === 'string' ? t.sub : '';
    if (!sub) return { ok: false, message: 'Invalid Google profile.' };
    return { ok: true, sub, email: t.email, name: t.name };
  } catch {
    return { ok: false, message: 'Network error validating Google.' };
  }
}

/** Exchange Google Id Token for an API JWT, or fall back to offline demo session. */
export async function exchangeGoogleIdToken(
  idToken: string,
  opts: { allowedAudiences: string[] }
): Promise<ExchangeGoogleResponse> {
  const profile = await fetchGoogleProfileFromToken(idToken, opts.allowedAudiences);
  if (!profile.ok) return profile;

  const phoneSlug = profile.email || `oauth:${profile.sub.slice(0, 48)}`;
  const fallbackName =
    typeof profile.name === 'string'
      ? profile.name
      : profile.email?.split('@')[0] ?? 'FlavorFlow diner';

  try {
    const res = await fetch(`${getPublicApiUrl()}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      token?: string;
      phone?: string;
      name?: string;
      email?: string;
      message?: string;
    };
    if (res.ok && data.ok && typeof data.token === 'string') {
      return {
        ok: true,
        token: data.token,
        phone: data.phone ?? phoneSlug,
        name: data.name ?? fallbackName,
        email: data.email ?? profile.email,
      };
    }
    if (res.status >= 400 && res.status < 500 && res.status !== 503) {
      return {
        ok: false,
        message:
          typeof data.message === 'string'
            ? data.message
            : `Google sign-in was rejected (${res.status}).`,
      };
    }
  } catch {
    /* unreachable — fall back offline */
  }

  return {
    ok: true,
    token: 'offline-demo-token',
    phone: phoneSlug,
    name: fallbackName,
    email: profile.email,
  };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResponse> {
  try {
    const res = await fetch(`${getPublicApiUrl()}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = (await res.json()) as VerifyOtpResponse;
    return data.ok ? data : { ok: false, message: data.message ?? 'Failed' };
  } catch {
    const offlineAccepted = code === '123456';
    return offlineAccepted
      ? { ok: true, token: 'offline-demo-token' }
      : { ok: false, message: 'Use 123456 when API is unreachable.' };
  }
}

export async function fetchRestaurantsRemote(): Promise<Restaurant[]> {
  const res = await fetch(`${getPublicApiUrl()}/restaurants`);
  if (!res.ok) throw new Error('Unable to load restaurants');
  const data = (await res.json()) as { restaurants: Restaurant[] };
  return data.restaurants ?? [];
}

export async function fetchRestaurantRemote(
  restaurantId: string
): Promise<Restaurant | null> {
  const res = await fetch(
    `${getPublicApiUrl()}/restaurants/${encodeURIComponent(restaurantId)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Unable to load restaurant');
  const data = (await res.json()) as { restaurant: Restaurant };
  return data.restaurant ?? null;
}

export async function placeOrder(
  token: string,
  payload: {
    restaurantId: string;
    items: { menuItemId: string; quantity: number }[];
  }
): Promise<{ ok: boolean; order?: TrackedOrder; message?: string }> {
  try {
    const res = await fetch(`${getPublicApiUrl()}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      order?: TrackedOrder;
      message?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        message:
          typeof data.message === 'string'
            ? data.message
            : (await res.text()) || `HTTP ${res.status}`,
      };
    }
    return { ok: true, order: data.order };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Network error',
    };
  }
}
