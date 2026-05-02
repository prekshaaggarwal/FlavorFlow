import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import {
  type Allergen,
  type Badge,
  BADGE_CATALOG,
  type DietaryTag,
  type Foodie,
  FOODIES,
  type LoyaltyTier,
  LOYALTY_TIERS,
  type MoodId,
  type Poll,
  POLLS,
  type WebMenuItem,
  type WebRestaurant,
} from './data';
import { palettes, type ThemeName } from './theme';

export type Route =
  | { name: 'login' }
  | { name: 'otp'; phone: string }
  | { name: 'home' }
  | { name: 'discover' }
  | { name: 'roulette' }
  | { name: 'restaurant'; restaurantId: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'tracking' }
  | { name: 'rewards' }
  | { name: 'social' }
  | { name: 'foodie'; foodieId: string }
  | { name: 'wallet' }
  | { name: 'support' }
  | { name: 'profile' };

export type CartLine = {
  uid: string;
  restaurantId: string;
  item: WebMenuItem;
  quantity: number;
  customizations?: Record<string, string>;
  spice?: 'mild' | 'medium' | 'fire';
  notes?: string;
};

export type OrderPhase =
  | 'placed'
  | 'preparing'
  | 'on_the_way'
  | 'nearby'
  | 'delivered';

export type ActiveOrder = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  totalINR: number;
  itemSummary: string;
  phase: OrderPhase;
  etaMinutes: number;
  riderName: string;
  riderRating: number;
  riderProgress: number;
  scheduledFor?: string;
  address: string;
  instructions: string;
  contactless: boolean;
  groupOrder?: boolean;
  insurance: boolean;
  paymentLabel: string;
  photoProofEmoji: string;
};

export type Toast = {
  id: number;
  title: string;
  body?: string;
  emoji?: string;
  tone?: 'info' | 'success' | 'warning';
};

export type ChatMessage = {
  id: number;
  from: 'user' | 'bot' | 'rider';
  text: string;
  ts: number;
};

export type Wishlist = { id: string; name: string; restaurantIds: string[] };

export type SavedAddress = {
  id: string;
  /** e.g. Home, Work, Other */
  label: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  /** Contact phone for this drop */
  phoneContact?: string;
  isDefault: boolean;
};

export function formatAddress(a: SavedAddress): string {
  const cityPin =
    a.city && a.pincode ? `${a.city} ${a.pincode}` : a.city ?? (a.pincode ? String(a.pincode) : '');
  const parts = [a.line1, a.line2, a.landmark, cityPin].filter(Boolean) as string[];
  return parts.join(', ');
}

export function resolveSelectedAddress(
  addresses: SavedAddress[],
  selectedAddressId: string | null
): SavedAddress | null {
  if (addresses.length === 0) return null;
  const picked = selectedAddressId ? addresses.find((x) => x.id === selectedAddressId) : null;
  return picked ?? addresses.find((adr) => adr.isDefault) ?? addresses[0] ?? null;
}

export type WalletTxn = {
  id: string;
  label: string;
  amountINR: number;
  ts: number;
  type: 'credit' | 'debit';
};

type SubscriptionPlan = 'none' | 'pro_monthly';

export type State = {
  route: Route;
  routeStack: Route[];
  authed: boolean;
  phone: string;
  name: string;
  themeName: ThemeName;
  mood: MoodId | null;
  dietary: DietaryTag[];
  allergens: Allergen[];
  caloriesCap: number | null;
  cart: CartLine[];
  orders: ActiveOrder[];
  activeOrderId: string | null;
  scratchCards: { id: string; revealed: boolean; reward: string }[];
  badges: Badge[];
  streakDays: number;
  xp: number;
  tier: LoyaltyTier;
  walletINR: number;
  walletTxns: WalletTxn[];
  subscription: SubscriptionPlan;
  followingFoodies: string[];
  storyLikes: Record<string, boolean>;
  polls: Poll[];
  pollVotes: Record<string, number>;
  wishlists: Wishlist[];
  toasts: Toast[];
  riderChat: ChatMessage[];
  supportChat: ChatMessage[];
  geoOfferDismissed: boolean;
  addresses: SavedAddress[];
  selectedAddressId: string | null;
  authProvider: 'phone' | 'google';
  contactEmail?: string;
};

/** Line shown in profile header for “how you signed in”. */
export function formatAuthContactSubtitle(
  state: Pick<State, 'authProvider' | 'phone' | 'contactEmail'>
): string {
  if (state.authProvider === 'google' && state.contactEmail) return state.contactEmail;
  const normalized = state.phone.replace(/\D/g, '');
  if (normalized.length >= 10) return `+91 ${normalized.slice(-10)}`;
  return state.phone || state.contactEmail || 'demo';
}

const tierFor = (xp: number): LoyaltyTier => {
  let current: LoyaltyTier = 'Bronze';
  for (const t of LOYALTY_TIERS) if (xp >= t.threshold) current = t.id;
  return current;
};

const initialState: State = {
  route: { name: 'login' },
  routeStack: [],
  authed: false,
  phone: '',
  name: 'You',
  themeName: 'dark',
  mood: null,
  dietary: [],
  allergens: [],
  caloriesCap: null,
  cart: [],
  orders: [],
  activeOrderId: null,
  scratchCards: [
    { id: 'sc1', revealed: false, reward: '₹50 cashback' },
    { id: 'sc2', revealed: false, reward: 'Free delivery × 3' },
    { id: 'sc3', revealed: false, reward: '20% off next order' },
  ],
  badges: BADGE_CATALOG,
  streakDays: 4,
  xp: 1820,
  tier: tierFor(1820),
  walletINR: 480,
  walletTxns: [
    { id: 'w1', label: 'Welcome bonus', amountINR: 200, ts: Date.now() - 86400000 * 6, type: 'credit' },
    { id: 'w2', label: 'Order #FFL-3210', amountINR: -120, ts: Date.now() - 86400000 * 3, type: 'debit' },
    { id: 'w3', label: 'Referral · Aarav M.', amountINR: 100, ts: Date.now() - 86400000 * 2, type: 'credit' },
    { id: 'w4', label: 'Top-up · UPI', amountINR: 300, ts: Date.now() - 86400000, type: 'credit' },
  ],
  subscription: 'none',
  followingFoodies: [FOODIES[2].id],
  storyLikes: {},
  polls: POLLS,
  pollVotes: {},
  wishlists: [
    { id: 'wl1', name: 'Late-night cravings', restaurantIds: ['r1', 'r2', 'r4'] },
    { id: 'wl2', name: 'Healthy weekdays', restaurantIds: ['r3', 'r6'] },
  ],
  toasts: [],
  riderChat: [],
  supportChat: [
    {
      id: 1,
      from: 'bot',
      ts: Date.now(),
      text:
        "Hi, I'm FlavorBot. I can help with order issues, refunds, allergens, and more. What's up?",
    },
  ],
  geoOfferDismissed: false,
  addresses: [
    {
      id: 'addr-home-1',
      label: 'Home',
      line1: '402, Maple Heights',
      line2: 'Indiranagar',
      landmark: 'Near 12th Main',
      city: 'Bangalore',
      pincode: '560008',
      phoneContact: '+91 9876543210',
      isDefault: true,
    },
    {
      id: 'addr-work-1',
      label: 'Work',
      line1: 'WeWork Prestige Atlantis',
      line2: '1st Floor, Vittal Mallya Rd',
      city: 'Bangalore',
      pincode: '560001',
      isDefault: false,
    },
  ],
  selectedAddressId: 'addr-home-1',
  authProvider: 'phone',
};

type Action =
  | { type: 'NAV'; route: Route }
  | { type: 'BACK' }
  | {
      type: 'AUTH';
      phone: string;
      name?: string;
      authProvider?: 'phone' | 'google';
      contactEmail?: string;
    }
  | { type: 'LOGOUT' }
  | { type: 'THEME'; theme: ThemeName }
  | { type: 'MOOD'; mood: MoodId | null }
  | { type: 'DIETARY'; tags: DietaryTag[] }
  | { type: 'ALLERGENS'; tags: Allergen[] }
  | { type: 'CAL_CAP'; value: number | null }
  | { type: 'CART_ADD'; line: CartLine }
  | { type: 'CART_QTY'; uid: string; delta: number }
  | { type: 'CART_REMOVE'; uid: string }
  | { type: 'CART_CLEAR' }
  | { type: 'PLACE_ORDER'; order: ActiveOrder }
  | { type: 'ADVANCE_ORDER'; orderId: string; phase: OrderPhase; progress: number; etaMinutes: number }
  | { type: 'TOAST_ADD'; toast: Toast }
  | { type: 'TOAST_DISMISS'; id: number }
  | { type: 'SCRATCH_REVEAL'; id: string }
  | { type: 'STREAK_INC' }
  | { type: 'XP'; delta: number }
  | { type: 'WALLET_ADJUST'; amount: number; label: string }
  | { type: 'SUBSCRIBE'; plan: SubscriptionPlan }
  | { type: 'TOGGLE_FOLLOW'; foodieId: string }
  | { type: 'TOGGLE_LIKE'; storyId: string }
  | { type: 'POLL_VOTE'; pollId: string; optionIdx: number }
  | { type: 'WISHLIST_TOGGLE'; restaurantId: string; wishlistId: string }
  | { type: 'WISHLIST_NEW'; name: string }
  | { type: 'RIDER_CHAT'; msg: ChatMessage }
  | { type: 'SUPPORT_CHAT'; msg: ChatMessage }
  | { type: 'DISMISS_GEO_OFFER' }
  | { type: 'ADDRESS_ADD'; address: Omit<SavedAddress, 'id'> }
  | { type: 'ADDRESS_UPDATE'; id: string; patch: Partial<Omit<SavedAddress, 'id'>> }
  | { type: 'ADDRESS_DELETE'; id: string }
  | { type: 'ADDRESS_SET_DEFAULT'; id: string }
  | { type: 'ADDRESS_SELECT'; id: string | null };

let toastSeq = 100;
let chatSeq = 100;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'NAV':
      if (action.route.name === state.route.name) return state;
      return {
        ...state,
        route: action.route,
        routeStack: [...state.routeStack, state.route],
      };
    case 'BACK': {
      const stack = state.routeStack;
      if (stack.length === 0) return state;
      const last = stack[stack.length - 1];
      return {
        ...state,
        route: last,
        routeStack: stack.slice(0, -1),
      };
    }
    case 'AUTH': {
      const authProv = action.authProvider ?? 'phone';
      return {
        ...state,
        authed: true,
        phone: action.phone,
        name: action.name ?? state.name,
        authProvider: authProv,
        contactEmail: authProv === 'google' ? action.contactEmail : undefined,
        route: { name: 'home' },
        routeStack: [],
      };
    }
    case 'LOGOUT':
      return {
        ...initialState,
        themeName: state.themeName,
        toasts: [],
      };
    case 'THEME':
      return { ...state, themeName: action.theme };
    case 'MOOD':
      return { ...state, mood: action.mood };
    case 'DIETARY':
      return { ...state, dietary: action.tags };
    case 'ALLERGENS':
      return { ...state, allergens: action.tags };
    case 'CAL_CAP':
      return { ...state, caloriesCap: action.value };
    case 'CART_ADD': {
      const existing = state.cart.find((l) => l.uid === action.line.uid);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((l) =>
            l.uid === action.line.uid ? { ...l, quantity: l.quantity + action.line.quantity } : l
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.line] };
    }
    case 'CART_QTY':
      return {
        ...state,
        cart: state.cart
          .map((l) => (l.uid === action.uid ? { ...l, quantity: l.quantity + action.delta } : l))
          .filter((l) => l.quantity > 0),
      };
    case 'CART_REMOVE':
      return { ...state, cart: state.cart.filter((l) => l.uid !== action.uid) };
    case 'CART_CLEAR':
      return { ...state, cart: [] };
    case 'PLACE_ORDER':
      return {
        ...state,
        orders: [action.order, ...state.orders],
        activeOrderId: action.order.id,
      };
    case 'ADVANCE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? {
                ...o,
                phase: action.phase,
                riderProgress: action.progress,
                etaMinutes: action.etaMinutes,
              }
            : o
        ),
      };
    case 'TOAST_ADD':
      return { ...state, toasts: [...state.toasts, action.toast] };
    case 'TOAST_DISMISS':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'SCRATCH_REVEAL':
      return {
        ...state,
        scratchCards: state.scratchCards.map((c) =>
          c.id === action.id ? { ...c, revealed: true } : c
        ),
      };
    case 'STREAK_INC':
      return { ...state, streakDays: state.streakDays + 1 };
    case 'XP': {
      const xp = Math.max(0, state.xp + action.delta);
      return { ...state, xp, tier: tierFor(xp) };
    }
    case 'WALLET_ADJUST': {
      const amount = action.amount;
      const txn: WalletTxn = {
        id: `w${Date.now()}`,
        label: action.label,
        amountINR: amount,
        ts: Date.now(),
        type: amount >= 0 ? 'credit' : 'debit',
      };
      return {
        ...state,
        walletINR: Math.max(0, state.walletINR + amount),
        walletTxns: [txn, ...state.walletTxns],
      };
    }
    case 'SUBSCRIBE':
      return { ...state, subscription: action.plan };
    case 'TOGGLE_FOLLOW': {
      const follows = state.followingFoodies.includes(action.foodieId)
        ? state.followingFoodies.filter((f) => f !== action.foodieId)
        : [...state.followingFoodies, action.foodieId];
      return { ...state, followingFoodies: follows };
    }
    case 'TOGGLE_LIKE':
      return {
        ...state,
        storyLikes: {
          ...state.storyLikes,
          [action.storyId]: !state.storyLikes[action.storyId],
        },
      };
    case 'POLL_VOTE': {
      if (state.pollVotes[action.pollId] !== undefined) return state;
      const polls = state.polls.map((p) =>
        p.id === action.pollId
          ? {
              ...p,
              totalVotes: p.totalVotes + 1,
              options: p.options.map((o, i) =>
                i === action.optionIdx ? { ...o, votes: o.votes + 1 } : o
              ),
            }
          : p
      );
      return {
        ...state,
        polls,
        pollVotes: { ...state.pollVotes, [action.pollId]: action.optionIdx },
      };
    }
    case 'WISHLIST_TOGGLE':
      return {
        ...state,
        wishlists: state.wishlists.map((w) =>
          w.id === action.wishlistId
            ? {
                ...w,
                restaurantIds: w.restaurantIds.includes(action.restaurantId)
                  ? w.restaurantIds.filter((r) => r !== action.restaurantId)
                  : [...w.restaurantIds, action.restaurantId],
              }
            : w
        ),
      };
    case 'WISHLIST_NEW':
      return {
        ...state,
        wishlists: [
          ...state.wishlists,
          { id: `wl${Date.now()}`, name: action.name, restaurantIds: [] },
        ],
      };
    case 'RIDER_CHAT':
      return { ...state, riderChat: [...state.riderChat, action.msg] };
    case 'SUPPORT_CHAT':
      return { ...state, supportChat: [...state.supportChat, action.msg] };
    case 'DISMISS_GEO_OFFER':
      return { ...state, geoOfferDismissed: true };

    case 'ADDRESS_ADD': {
      const id = `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const makeDefault = action.address.isDefault || state.addresses.length === 0;
      let addresses = state.addresses.map((a) => (makeDefault ? { ...a, isDefault: false } : a));
      addresses = [
        ...addresses,
        {
          ...action.address,
          id,
          isDefault: makeDefault,
        },
      ];
      const selectedAddressId =
        makeDefault ? id : state.selectedAddressId ?? id;
      return { ...state, addresses, selectedAddressId };
    }

    case 'ADDRESS_UPDATE': {
      const addresses = state.addresses.map((a) => {
        if (a.id !== action.id) return a;
        return {
          ...a,
          ...action.patch,
        };
      });
      let nextAddresses = [...addresses];
      if (nextAddresses.some((a) => a.id === action.id && action.patch.isDefault === true)) {
        nextAddresses = nextAddresses.map((a) => ({
          ...a,
          isDefault: a.id === action.id,
        }));
      }
      return {
        ...state,
        addresses: nextAddresses,
        selectedAddressId:
          resolveSelectedAddress(nextAddresses, state.selectedAddressId)?.id ?? state.selectedAddressId,
      };
    }

    case 'ADDRESS_DELETE': {
      const victim = state.addresses.find((a) => a.id === action.id);
      const remaining = state.addresses.filter((a) => a.id !== action.id);
      if (remaining.length === 0) {
        return { ...state, addresses: [], selectedAddressId: null };
      }
      const defaultIdRemaining =
        victim?.isDefault
          ? remaining[0].id
          : state.addresses.find((a) => a.isDefault && a.id !== action.id)?.id ?? remaining[0].id;

      const next = remaining.map((a) => ({ ...a, isDefault: a.id === defaultIdRemaining }));

      const selStale =
        state.selectedAddressId === action.id ||
        !next.some((a) => a.id === state.selectedAddressId);

      const selectedAddressId = selStale
        ? defaultIdRemaining
        : (state.selectedAddressId as string);

      return { ...state, addresses: next, selectedAddressId };
    }

    case 'ADDRESS_SET_DEFAULT': {
      const addresses = state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === action.id,
      }));
      return { ...state, addresses, selectedAddressId: action.id };
    }

    case 'ADDRESS_SELECT':
      return {
        ...state,
        selectedAddressId: action.id,
      };

    default:
      return state;
  }
};

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  navigate: (route: Route) => void;
  back: () => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  newChatMessage: (
    target: 'rider' | 'support',
    from: ChatMessage['from'],
    text: string
  ) => void;
  palette: ReturnType<typeof currentPalette>;
};

const currentPalette = (themeName: ThemeName) => palettes[themeName];

const StateCtx = createContext<Ctx | null>(null);

export function FlavorWebStateProvider({
  children,
  restaurants,
}: {
  children: React.ReactNode;
  restaurants: WebRestaurant[];
}) {
  void restaurants;
  const [state, dispatch] = useReducer(reducer, initialState);
  const orderTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const navigate = useCallback((route: Route) => dispatch({ type: 'NAV', route }), []);
  const back = useCallback(() => dispatch({ type: 'BACK' }), []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastSeq;
    dispatch({ type: 'TOAST_ADD', toast: { ...t, id } });
    setTimeout(() => dispatch({ type: 'TOAST_DISMISS', id }), 4500);
  }, []);

  const newChatMessage = useCallback(
    (target: 'rider' | 'support', from: ChatMessage['from'], text: string) => {
      const msg: ChatMessage = { id: ++chatSeq, from, text, ts: Date.now() };
      dispatch({
        type: target === 'rider' ? 'RIDER_CHAT' : 'SUPPORT_CHAT',
        msg,
      });
    },
    []
  );

  // Drive the active order's phases on a timer to feel real.
  useEffect(() => {
    const orderId = state.activeOrderId;
    if (!orderId) return undefined;
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.phase === 'delivered') return undefined;
    if (orderTimers.current[orderId]) return undefined;

    const phases: OrderPhase[] = ['placed', 'preparing', 'on_the_way', 'nearby', 'delivered'];
    let idx = phases.indexOf(order.phase);
    let progress = order.riderProgress;
    let eta = order.etaMinutes;

    orderTimers.current[orderId] = setInterval(() => {
      progress = Math.min(1, progress + 0.08);
      eta = Math.max(0, eta - 1);
      if (progress > 0.2 && idx < 1) idx = 1;
      if (progress > 0.45 && idx < 2) idx = 2;
      if (progress > 0.8 && idx < 3) idx = 3;
      if (progress >= 1 && idx < 4) {
        idx = 4;
        toast({
          title: 'Order delivered ✅',
          body: 'Tap to leave a review and grab a scratch card.',
          emoji: '🎉',
          tone: 'success',
        });
        clearInterval(orderTimers.current[orderId]);
        delete orderTimers.current[orderId];
      }
      dispatch({
        type: 'ADVANCE_ORDER',
        orderId,
        phase: phases[idx],
        progress,
        etaMinutes: eta,
      });
      if (idx === 2 && progress < 0.5) {
        toast({
          title: 'On the way 🛵',
          body: `${order.riderName} just left ${order.restaurantName}.`,
          tone: 'info',
        });
      }
      if (idx === 3) {
        toast({
          title: 'Nearby 📍',
          body: 'Your courier is two minutes away.',
          emoji: '⏱️',
          tone: 'info',
        });
      }
    }, 3500);

    return () => {
      if (orderTimers.current[orderId]) {
        clearInterval(orderTimers.current[orderId]);
        delete orderTimers.current[orderId];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeOrderId, state.orders.find((o) => o.id === state.activeOrderId)?.phase]);

  // Geo-trigger offer pop-up after auth
  useEffect(() => {
    if (!state.authed || state.geoOfferDismissed) return;
    const t = setTimeout(() => {
      toast({
        title: 'You are near Sakura Bowls 🍣',
        body: '15% off Aburi Bowl until 9pm — geo-triggered.',
        emoji: '📍',
        tone: 'info',
      });
    }, 6500);
    return () => clearTimeout(t);
  }, [state.authed, state.geoOfferDismissed, toast]);

  const palette = useMemo(() => currentPalette(state.themeName), [state.themeName]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      navigate,
      back,
      toast,
      newChatMessage,
      palette,
    }),
    [state, navigate, back, toast, newChatMessage, palette]
  );

  return <StateCtx.Provider value={value}>{children}</StateCtx.Provider>;
}

export function useFlavorWeb() {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error('useFlavorWeb must be inside FlavorWebStateProvider');
  return ctx;
}
