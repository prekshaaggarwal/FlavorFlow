import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { RESTAURANTS_WEB } from './src/web/data';
import { GeoOfferBanner, NAV_LINKS, ToastHost, TopBar } from './src/web/Shell';
import { FlavorWebStateProvider, useFlavorWeb } from './src/web/state';
import { LoginScreen, OtpScreen } from './src/web/screens/AuthScreens';
import { HomeScreen } from './src/web/screens/HomeScreen';
import { DiscoverScreen } from './src/web/screens/DiscoverScreen';
import { RouletteScreen } from './src/web/screens/RouletteScreen';
import { RestaurantScreen } from './src/web/screens/RestaurantScreen';
import { CartScreen } from './src/web/screens/CartScreen';
import { CheckoutScreen } from './src/web/screens/CheckoutScreen';
import { TrackingScreen } from './src/web/screens/TrackingScreen';
import { RewardsScreen } from './src/web/screens/RewardsScreen';
import { SocialScreen } from './src/web/screens/SocialScreen';
import { WalletScreen } from './src/web/screens/WalletScreen';
import { SupportScreen } from './src/web/screens/SupportScreen';
import { ProfileScreen } from './src/web/screens/ProfileScreen';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <FlavorWebStateProvider restaurants={RESTAURANTS_WEB}>
      <Shell />
    </FlavorWebStateProvider>
  );
}

function Shell() {
  const { state, palette } = useFlavorWeb();
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <TopBar />
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          !state.authed ? styles.scrollUnauthed : { paddingBottom: compact && state.authed ? 100 : 40 },
        ]}
      >
        <View style={[styles.container, { maxWidth: state.authed ? 1080 : 520 }]}>
          {state.authed ? <GeoOfferBanner /> : null}
          <ScreenSwitch />
        </View>
      </ScrollView>
      {state.authed && compact ? <BottomDock /> : null}
      <ToastHost />
    </View>
  );
}

function ScreenSwitch() {
  const { state } = useFlavorWeb();
  const route = state.route;
  switch (route.name) {
    case 'login':
      return <LoginScreen />;
    case 'otp':
      return <OtpScreen phone={route.phone} />;
    case 'home':
      return <HomeScreen />;
    case 'discover':
      return <DiscoverScreen />;
    case 'roulette':
      return <RouletteScreen />;
    case 'restaurant':
      return <RestaurantScreen restaurantId={route.restaurantId} />;
    case 'cart':
      return <CartScreen />;
    case 'checkout':
      return <CheckoutScreen />;
    case 'tracking':
      return <TrackingScreen />;
    case 'rewards':
      return <RewardsScreen />;
    case 'social':
      return <SocialScreen />;
    case 'wallet':
      return <WalletScreen />;
    case 'support':
      return <SupportScreen />;
    case 'profile':
      return <ProfileScreen />;
    default:
      return <HomeScreen />;
  }
}

function BottomDock() {
  const { state, navigate, palette } = useFlavorWeb();
  const links = NAV_LINKS.slice(0, 5);
  return (
    <View style={[styles.bottomDock, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      {links.map((link) => {
        const active = link.match(state.route);
        return (
          <Pressable
            key={link.id}
            onPress={() => navigate(link.route)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: active ? palette.primarySoft : 'transparent',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{link.icon}</Text>
            <Text
              style={{
                color: active ? palette.text : palette.textSecondary,
                fontSize: 10,
                fontWeight: active ? '900' : '700',
              }}
            >
              {link.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: '100%' },
  scroll: { paddingBottom: 60 },
  scrollUnauthed: { justifyContent: 'center', minHeight: '100%' },
  container: {
    width: '100%',
    alignSelf: 'center',
    padding: 18,
    gap: 14,
  },
  bottomDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
});
