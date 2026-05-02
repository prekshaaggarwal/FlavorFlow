import { Platform } from 'react-native';

/**
 * Google OAuth for Expo requires platform client IDs from Google Cloud Console
 * (APIs → Credentials → OAuth 2.0 Client IDs).
 *
 * Expo public env vars (bundled):
 * - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID — Web client ID (also used when iOS/Android are unset during dev).
 * - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID — iOS OAuth client (optional fallback: web ID).
 * - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID — Android OAuth client (optional fallback: web ID).
 * - EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID — Extra audience for Expo proxy / standalone if different.
 *
 * Server (FlavorFlow API) should set GOOGLE_OAUTH_CLIENT_IDS to the same comma-separated client IDs so
 * id_tokens can be verified when issuing JWTs.
 */

export type GoogleOAuthRuntimeConfig = {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
  /** Allowed `aud` values when validating tokens (client + expo). */
  allowedAudiences: string[];
};

export function resolveGoogleOAuthConfig(): GoogleOAuthRuntimeConfig | null {
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
  const ios =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    '';
  const android =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    '';
  const extra = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?.trim() || '';

  if (Platform.OS === 'web') {
    if (!web) return null;
    const allowedAudiences = [...new Set([web, ios, android, extra].filter(Boolean))];
    return {
      webClientId: web,
      iosClientId: ios || web,
      androidClientId: android || web,
      allowedAudiences,
    };
  }
  if (Platform.OS === 'ios') {
    if (!ios) return null;
    const allowedAudiences = [...new Set([web, ios, android, extra].filter(Boolean))];
    return {
      webClientId: web || ios,
      iosClientId: ios,
      androidClientId: android || ios,
      allowedAudiences,
    };
  }
  if (!android) return null;
  const allowedAudiences = [...new Set([web, android, ios, extra].filter(Boolean))];
  return {
    webClientId: web || android,
    iosClientId: ios || android,
    androidClientId: android,
    allowedAudiences,
  };
}
