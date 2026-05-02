import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LiveOrderMap from '../../components/maps/LiveOrderMap';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import type { OrdersStackParamList } from '../../navigation/types';
import { subscribeOrderUpdates } from '../../services/orderSocket';
import type { OrderPhase } from '../../store/orderStore';
import { useOrderStore } from '../../store/orderStore';
import { radius, spacing, typography } from '../../theme';

const PHASES: { id: OrderPhase; label: string }[] = [
  { id: 'placed', label: 'Placed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'delivered', label: 'Delivered' },
];

type Props = NativeStackScreenProps<OrdersStackParamList, 'Track'>;

export function OrderTrackingScreen({}: Props) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const active = useOrderStore((s) => s.active);

  const isLiveCourier = active?.source === 'live';
  const activeIdx =
    active != null ? Math.max(0, PHASES.findIndex((x) => x.id === active.phase)) : 0;

  useEffect(() => {
    if (!active?.id || active.source !== 'live') return undefined;
    return subscribeOrderUpdates(active.id, (patch) => {
      const current = useOrderStore.getState().active;
      if (!current || current.id !== patch.id) return;
      useOrderStore.getState().setActive({
        ...current,
        phase: patch.phase,
        riderLat: patch.riderLat,
        riderLng: patch.riderLng,
        restaurantName: patch.restaurantName,
        totalINR: patch.totalINR,
        source: 'live',
      });
    });
  }, [active?.id, active?.source]);

  useEffect(() => {
    if (!active || active.source === 'live') return undefined;
    const timer = setInterval(() => {
      const courier = useOrderStore.getState().active;
      if (!courier || courier.source === 'live' || courier.phase === 'delivered') {
        return;
      }
      const wave = Date.now() / 1200;
      useOrderStore.getState().setActive({
        ...courier,
        riderLat: courier.riderLat + 0.00035 * Math.sin(wave),
        riderLng: courier.riderLng + 0.0003 * Math.cos(wave),
      });
    }, 2300);
    return () => clearInterval(timer);
  }, [active?.id, active?.source]);

  const region = useMemo(() => {
    if (!active) {
      return {
        latitude: 28.6139,
        longitude: 77.209,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return {
      latitude: active.riderLat,
      longitude: active.riderLng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }, [active]);

  if (!active) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.heroIcon,
            { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
          ]}
        >
          <Ionicons name="location-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[typography.subtitle, { color: colors.text }]}>
          No courier on the map yet
        </Text>
        <Text
          style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}
        >
          Checkout streams live coordinates over Socket.IO. Offline OTP sessions keep a silky
          mock pin for demos.
        </Text>
      </View>
    );
  }

  const sheetBody = (
    <>
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[typography.overline, { color: colors.textSecondary }]}>
            Active order · {active.id.slice(0, 8)}
          </Text>
          <Text style={[typography.subtitle, { color: colors.text }]}>
            {active.restaurantName}
          </Text>
        </View>
        <View style={styles.badgeWrap}>
          {isLiveCourier ? (
            <View style={[styles.livePill, { backgroundColor: colors.success + '22' }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[typography.caption, { color: colors.success, fontWeight: '800' }]}>
                LIVE
              </Text>
            </View>
          ) : (
            <View style={[styles.livePill, { backgroundColor: colors.chip }]}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                OFFLINE DEMO
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[typography.title, { color: colors.primary, fontSize: 26 }]}>
        ₹{active.totalINR}{' '}
        <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '500' }]}>
          prepaid · demo
        </Text>
      </Text>

      <View style={[styles.timelineTrack, { backgroundColor: colors.border }]}>
        {PHASES.map((phase, idx) => {
          const lit = idx <= activeIdx;
          return (
            <View
              key={phase.id}
              style={[
                styles.timelineSeg,
                { backgroundColor: lit ? colors.primary : colors.surfaceElevated },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.stepLabels}>
        {PHASES.map((p, index) => {
          const lit = PHASES.findIndex((x) => x.id === active.phase) >= index;
          return (
            <Text
              key={p.id}
              numberOfLines={1}
              style={[
                typography.caption,
                {
                  flex: 1,
                  textAlign: 'center',
                  color: lit ? colors.text : colors.textTertiary,
                  fontWeight: lit ? '800' : '500',
                  fontSize: 10,
                },
              ]}
            >
              {p.label}
            </Text>
          );
        })}
      </View>

      {!isLiveCourier && (
        <Pressable
          onPress={() =>
            useOrderStore.getState().setActive({
              ...active,
              phase: 'delivered',
            })
          }
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => ({
            paddingVertical: spacing.sm,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            Mark delivered (offline)
          </Text>
        </Pressable>
      )}
    </>
  );

  const tint = resolvedScheme === 'dark' ? 'dark' : 'light';
  const sheetChrome = Platform.select({
    ios: undefined,
    default: colors.surfaceElevated,
  });

  return (
    <View style={{ flex: 1 }}>
      <LiveOrderMap
        style={{ flex: 1 }}
        region={region}
        courier={{
          latitude: active.riderLat,
          longitude: active.riderLng,
          restaurantName: active.restaurantName,
        }}
        darkTiles={colors.background === '#000000'}
        onCourierPress={
          Platform.OS === 'web' ? undefined : () => Haptics.selectionAsync()
        }
      />

      {Platform.OS === 'ios' ? (
        <BlurView
          tint={tint}
          intensity={resolvedScheme === 'dark' ? 52 : 70}
          style={[
            styles.sheetBlur,
            { borderColor: colors.border },
          ]}
        >
          {sheetBody}
        </BlurView>
      ) : (
        <View
          style={[
            styles.sheetAndroid,
            { borderColor: colors.border, backgroundColor: sheetChrome },
          ]}
        >
          {sheetBody}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg + 8,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sheetBlur: {
    position: 'absolute',
    left: spacing.screenGutter - 4,
    right: spacing.screenGutter - 4,
    bottom: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + 2,
    overflow: 'hidden',
  },
  sheetAndroid: {
    position: 'absolute',
    left: spacing.screenGutter - 4,
    right: spacing.screenGutter - 4,
    bottom: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  badgeWrap: { alignItems: 'flex-end', justifyContent: 'center', minHeight: 40 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  timelineTrack: {
    flexDirection: 'row',
    height: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    gap: 4,
    marginVertical: spacing.md,
    paddingHorizontal: 2,
  },
  timelineSeg: { flex: 1, borderRadius: radius.pill },
  stepLabels: { flexDirection: 'row', marginBottom: spacing.sm },
});
