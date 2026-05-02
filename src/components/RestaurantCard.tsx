import React from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFlavorTheme } from '../hooks/useFlavorTheme';
import type { Restaurant } from '../services/restaurants';
import { cardShadow, radius, spacing, typography } from '../theme';

type Props = {
  restaurant: Restaurant;
  onPress: (e?: GestureResponderEvent) => void;
};

export function RestaurantCard({ restaurant, onPress }: Props) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const shadow = cardShadow(resolvedScheme);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Opens restaurant menu"
      accessibilityLabel={`${restaurant.name}, rated ${restaurant.rating}`}
      style={({ pressed }) => [
        styles.card,
        shadow,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          transform: pressed ? [{ scale: 0.985 }] : undefined,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: restaurant.imageTint }]}>
        <Text style={styles.thumbLetter}>{restaurant.name.charAt(0)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[typography.subtitle, { color: colors.text, flex: 1 }]}
            numberOfLines={2}
          >
            {restaurant.name}
          </Text>
          <View
            style={[styles.ratingPill, { backgroundColor: colors.overlay }]}
          >
            <Text style={[styles.ratingLabel, { color: colors.text }]}>
              ★ {restaurant.rating}
            </Text>
          </View>
        </View>
        <Text
          style={[typography.caption, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {restaurant.cuisines.join(' · ')}
        </Text>
        <View style={styles.footer}>
          <View
            style={[
              styles.etaChip,
              {
                backgroundColor: colors.chip,
                borderColor: `${colors.primary}${resolvedScheme === 'dark' ? '55' : '33'}`,
              },
            ]}
          >
            <Text style={[styles.etaChipText, { color: colors.primary }]}>
              {restaurant.etaMins}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            ₹{restaurant.deliveryFeeINR} delivery
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm + 2,
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'stretch',
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: {
    ...typography.display,
    fontSize: 40,
    color: '#fff',
    opacity: 0.95,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  body: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
  titleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  ratingPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  etaChip: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
  },
  etaChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
