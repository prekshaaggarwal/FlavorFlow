import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CartStackParamList } from '../../navigation/types';
import type { MainTabParamList } from '../../navigation/types';
import { placeOrder } from '../../services/api';
import { scheduleOrderStatusDemo } from '../../services/notify';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useOrderStore, type TrackedOrder } from '../../store/orderStore';
import { cardShadow, radius, spacing, typography } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<CartStackParamList, 'Checkout'>,
  BottomTabScreenProps<MainTabParamList, 'CartTab'>
>;

export function CheckoutScreen({ navigation }: Props) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const setActive = useOrderStore((s) => s.setActive);
  const panelShadow = cardShadow(resolvedScheme);

  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (sum, l) => sum + l.item.priceINR * l.quantity,
      0
    );
    const delivery = lines[0]?.restaurantId
      ? Math.min(59, Math.max(19, Math.round(subtotal * 0.05)))
      : 0;
    const tax = Math.round(subtotal * 0.05);
    return { subtotal, delivery, tax, grand: subtotal + delivery + tax };
  }, [lines]);

  const navigateToTracking = () => {
    navigation.getParent()?.navigate('Orders', { screen: 'Track' });
  };

  const placeOrderFlow = async () => {
    if (!lines.length) return;
    const session = useAuthStore.getState().session;
    if (!session) {
      Alert.alert('Sign in required', 'Log in with OTP before placing an order.');
      return;
    }

    const restaurantId = lines[0].restaurantId;
    const restaurantName = lines[0].restaurantName;
    const items = lines.map((line) => ({
      menuItemId: line.item.id,
      quantity: line.quantity,
    }));

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const useRemoteApi = session.token !== 'offline-demo-token';
    if (useRemoteApi) {
      const result = await placeOrder(session.token, {
        restaurantId,
        items,
      });
      if (result.ok && result.order) {
        clear();
        setActive({ ...result.order, source: 'live' });
        await scheduleOrderStatusDemo(
          'FlavorFlow • Order update',
          `${restaurantName} is on it. Socket tracking is live.`
        );
        navigateToTracking();
        return;
      }
      Alert.alert(
        'Could not place order',
        result.message ?? 'Check that Docker services and the API are running.'
      );
      return;
    }

    clear();
    const offlineOrder: TrackedOrder = {
      id: `ff-${Math.random().toString(36).slice(2, 10)}`,
      restaurantName,
      totalINR: totals.grand,
      phase: 'preparing',
      riderLat: 28.6139,
      riderLng: 77.209,
      source: 'local',
    };
    setActive(offlineOrder);
    await scheduleOrderStatusDemo(
      'FlavorFlow • Order update',
      `${restaurantName} is prepping your bowls (offline demo).`
    );
    navigateToTracking();
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.wrap, { paddingBottom: spacing.xxl }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.summary,
          panelShadow,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        <Text style={[typography.overline, { color: colors.primary }]}>
          Summary
        </Text>
        <Text style={[typography.subtitle, { color: colors.text }]}>
          Order review
        </Text>
        {lines.map((l) => (
          <View key={l.key} style={styles.line}>
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
              {l.quantity}× {l.item.name}
            </Text>
            <Text style={[typography.body, { color: colors.text, fontVariant: ['tabular-nums'] }]}>
              ₹{l.item.priceINR * l.quantity}
            </Text>
          </View>
        ))}
        <View style={[styles.line, { marginTop: spacing.sm }]}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Delivery partner fee
          </Text>
          <Text style={[typography.body, { color: colors.text, fontVariant: ['tabular-nums'] }]}>
            ₹{totals.delivery}
          </Text>
        </View>
        <View style={styles.line}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Taxes & charges (5% food levy est.)
          </Text>
          <Text style={[typography.body, { color: colors.text, fontVariant: ['tabular-nums'] }]}>
            ₹{totals.tax}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.line}>
          <Text style={[typography.subtitle, { color: colors.text }]}>Total due</Text>
          <Text style={[typography.subtitle, { color: colors.primary, fontSize: 22 }]}>
            ₹{totals.grand}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.trustRow,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        <Ionicons name="shield-checkmark" size={22} color={colors.success} />
        <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>
          Demo gateway — swap in Razorpay/Stripe intents next. Postgres + sockets already wired behind this button.
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.screenGutter, gap: spacing.sm }}>
        <PrimaryButton title="Pay & place order" onPress={placeOrderFlow} disabled={!lines.length} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: spacing.lg },
  summary: {
    marginHorizontal: spacing.screenGutter,
    marginTop: spacing.md,
    borderRadius: radius.lg + 4,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  trustRow: {
    marginHorizontal: spacing.screenGutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
});
