import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { type Route, useFlavorWeb } from './state';

export type NavLink = {
  id: string;
  label: string;
  icon: string;
  route: Route;
  match: (r: Route) => boolean;
};

export const NAV_LINKS: NavLink[] = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    route: { name: 'home' },
    match: (r) =>
      r.name === 'home' ||
      r.name === 'discover' ||
      r.name === 'roulette' ||
      r.name === 'restaurant',
  },
  {
    id: 'tracking',
    label: 'Track',
    icon: '🛵',
    route: { name: 'tracking' },
    match: (r) => r.name === 'tracking',
  },
  {
    id: 'rewards',
    label: 'Rewards',
    icon: '🎁',
    route: { name: 'rewards' },
    match: (r) => r.name === 'rewards',
  },
  {
    id: 'social',
    label: 'Social',
    icon: '✨',
    route: { name: 'social' },
    match: (r) => r.name === 'social' || r.name === 'foodie',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: '👛',
    route: { name: 'wallet' },
    match: (r) => r.name === 'wallet',
  },
  {
    id: 'support',
    label: 'Help',
    icon: '💬',
    route: { name: 'support' },
    match: (r) => r.name === 'support',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    route: { name: 'profile' },
    match: (r) => r.name === 'profile' || r.name === 'cart' || r.name === 'checkout',
  },
];

export function TopBar() {
  const { state, palette, navigate, dispatch } = useFlavorWeb();
  const { width } = useWindowDimensions();
  const compact = width < 760;

  const cartCount = state.cart.reduce((n, l) => n + l.quantity, 0);
  const activeOrder = state.orders.find((o) => o.id === state.activeOrderId);

  return (
    <View style={[styles.topBar, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <Pressable
        onPress={() => navigate({ name: state.authed ? 'home' : 'login' })}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 })}
      >
        <View style={[styles.logoMark, { backgroundColor: palette.primary }]}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>FF</Text>
        </View>
        <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>
          FlavorFlow
        </Text>
        {!compact ? (
          <View style={[styles.envChip, { backgroundColor: palette.chip }]}>
            <Text style={{ color: palette.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
              WEB · DEMO
            </Text>
          </View>
        ) : null}
      </Pressable>

      {state.authed ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 4, paddingHorizontal: 6 }}
          style={{ flex: 1 }}
        >
          {NAV_LINKS.map((link) => {
            const active = link.match(state.route);
            return (
              <Pressable
                key={link.id}
                onPress={() => navigate(link.route)}
                style={(pressableState) => {
                  const hovered =
                    'hovered' in pressableState
                      ? Boolean((pressableState as { hovered?: boolean }).hovered)
                      : false;
                  return [
                  styles.navBtn,
                  {
                    backgroundColor: active
                      ? palette.primary
                      : hovered
                      ? palette.surfaceHover
                      : 'transparent',
                    opacity: pressableState.pressed ? 0.85 : 1,
                  },
                ];
                }}
              >
                <Text style={{ fontSize: 14 }}>{link.icon}</Text>
                <Text
                  style={{
                    color: active ? '#fff' : palette.text,
                    fontSize: 12,
                    fontWeight: active ? '900' : '700',
                  }}
                >
                  {link.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {state.authed ? (
          <>
            {activeOrder && activeOrder.phase !== 'delivered' ? (
              <Pressable
                onPress={() => navigate({ name: 'tracking' })}
                style={({ pressed }) => [
                  styles.activeOrderChip,
                  { borderColor: palette.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[styles.liveDot, { backgroundColor: palette.danger }]} />
                <Text style={{ color: palette.text, fontSize: 11, fontWeight: '800' }} numberOfLines={1}>
                  {activeOrder.etaMinutes}m · {activeOrder.restaurantName}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => navigate({ name: 'cart' })}
              style={({ pressed }) => [styles.iconBtn, { borderColor: palette.border, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={{ color: palette.text, fontSize: 16 }}>🛒</Text>
              {cartCount > 0 ? (
                <View style={[styles.cartBadge, { backgroundColor: palette.primary }]}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() =>
                dispatch({
                  type: 'THEME',
                  theme:
                    state.themeName === 'dark'
                      ? 'light'
                      : state.themeName === 'light'
                      ? 'festive-diwali'
                      : state.themeName === 'festive-diwali'
                      ? 'festive-xmas'
                      : 'dark',
                })
              }
              style={({ pressed }) => [styles.iconBtn, { borderColor: palette.border, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={{ color: palette.text, fontSize: 14 }}>
                {state.themeName === 'light' ? '☀️' : state.themeName.startsWith('festive') ? '🎉' : '🌙'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>demo · web preview</Text>
        )}
      </View>
    </View>
  );
}

export function ToastHost() {
  const { state, palette } = useFlavorWeb();
  return (
    <View pointerEvents="box-none" style={styles.toastHost}>
      {state.toasts.slice(-3).map((t) => (
        <ToastBubble key={t.id} toast={t} palette={palette} />
      ))}
    </View>
  );
}

function ToastBubble({
  toast,
  palette,
}: {
  toast: ReturnType<typeof useFlavorWeb>['state']['toasts'][number];
  palette: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide]);
  const tone =
    toast.tone === 'success' ? palette.success : toast.tone === 'warning' ? palette.warning : palette.primary;
  const opacity = slide;
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: palette.surfaceElevated,
          borderColor: tone,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {toast.emoji ? <Text style={{ fontSize: 22 }}>{toast.emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontWeight: '900', fontSize: 13 }}>{toast.title}</Text>
        {toast.body ? (
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>{toast.body}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function GeoOfferBanner() {
  const { state, dispatch, palette, navigate } = useFlavorWeb();
  if (!state.authed || state.geoOfferDismissed) return null;
  return (
    <LinearGradient
      colors={[palette.accent, palette.primary]}
      style={styles.geo}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={styles.geoEmoji}>📍</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>
          You're near Sakura Bowls
        </Text>
        <Text style={{ color: '#fff', fontSize: 11 }}>
          Geo-triggered: 15% off Aburi Bowl until 9pm.
        </Text>
      </View>
      <Pressable
        onPress={() => navigate({ name: 'restaurant', restaurantId: 'r3' })}
        style={({ pressed }) => [
          styles.geoCta,
          { backgroundColor: pressed ? '#ffffff22' : '#ffffff33' },
        ]}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>Open menu</Text>
      </Pressable>
      <Pressable
        onPress={() => dispatch({ type: 'DISMISS_GEO_OFFER' })}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 4 })}
      >
        <Text style={{ color: '#fff', fontWeight: '900' }}>×</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOrderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 220,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  toastHost: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    gap: 8,
    width: 320,
    maxWidth: '92%',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  geo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  geoEmoji: { fontSize: 22 },
  geoCta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
