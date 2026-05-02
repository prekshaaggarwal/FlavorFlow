import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import type { HomeStackParamList } from '../../navigation/types';
import { fetchRestaurantRemote } from '../../services/api';
import { getRestaurantById, type Restaurant } from '../../services/restaurants';
import { useCartStore } from '../../store/cartStore';
import { cardShadow, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'RestaurantDetail'>;

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const addLine = useCartStore((s) => s.addLine);
  const elevate = cardShadow(resolvedScheme);

  useEffect(() => {
    let cancelled = false;
    const id = route.params.restaurantId;

    (async () => {
      try {
        const remote = await fetchRestaurantRemote(id);
        if (cancelled) return;
        setRestaurant(remote ?? getRestaurantById(id) ?? null);
      } catch {
        if (!cancelled) setRestaurant(getRestaurantById(id) ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route.params.restaurantId]);

  useEffect(() => {
    if (restaurant) {
      navigation.setOptions({
        headerTitle: restaurant.name,
        headerTitleStyle: { fontWeight: '800' },
      });
    }
  }, [navigation, restaurant]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Plating dishes…
        </Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Restaurant unavailable.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroShell, elevate]}>
        <View style={[styles.heroTint, { backgroundColor: restaurant.imageTint }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroInner}>
            <Text style={[typography.overline, { color: 'rgba(255,255,255,0.8)' }]}>
              MENU · {(restaurant.tags.slice(0, 2).length
                ? restaurant.tags.slice(0, 2).join(' · ')
                : 'SIGNATURE'
              ).toUpperCase()}
            </Text>
            <Text style={styles.heroTitle}>{restaurant.name}</Text>
            <Text style={styles.heroSub}>
              ★ {restaurant.rating} · {restaurant.cuisines.join(' · ')} ·{' '}
              {restaurant.etaMins}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[typography.overline, { color: colors.primary, marginBottom: spacing.xs }]}>
        Signature plates
      </Text>

      {restaurant.menu.map((item) => (
        <View
          key={item.id}
          style={[
            styles.row,
            elevate,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
            },
          ]}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <View style={styles.rowTop}>
              <Text style={[typography.subtitle, { color: colors.text }]}>
                {item.name}
              </Text>
              {item.popular && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primary + '2A' },
                  ]}
                >
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '800' }]}>
                    ★ Loved
                  </Text>
                </View>
              )}
            </View>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
            <Text style={[typography.caption, { color: colors.text }]}>
              {item.veg ? '● Veg-forward' : '● Signature protein'} · ₹{item.priceINR}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addLine(restaurant.id, restaurant.name, item);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} to cart`}
            style={({ pressed }) => [
              styles.addBtn,
              {
                borderColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
                backgroundColor:
                  pressed && resolvedScheme === 'light'
                    ? colors.chip
                    : 'transparent',
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '800' }]}>
              ADD +
            </Text>
          </Pressable>
        </View>
      ))}

      <PrimaryButton
        title="Slide into cart"
        onPress={() => {
          navigation.getParent()?.navigate('CartTab', { screen: 'Cart' });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: { padding: spacing.screenGutter, paddingBottom: spacing.xxl, gap: spacing.md },
  heroShell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  heroTint: {
    minHeight: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroInner: { padding: spacing.lg + 4, gap: spacing.sm },
  heroTitle: {
    ...typography.title,
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSub: { ...typography.body, color: 'rgba(255,255,255,0.9)' },
  row: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  badge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: radius.pill },
  addBtn: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
