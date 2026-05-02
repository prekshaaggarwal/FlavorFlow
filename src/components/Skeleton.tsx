import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useFlavorTheme } from '../hooks/useFlavorTheme';
import { cardShadow, radius, spacing } from '../theme';

export function SkeletonBox({
  height,
  width,
  radiusValue = radius.md,
}: {
  height: number;
  width: number | `${number}%`;
  radiusValue?: number;
}) {
  const { colors } = useFlavorTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.box,
        {
          height,
          width: width as number & string,
          borderRadius: radiusValue,
          backgroundColor: colors.border,
          opacity: pulse,
        },
      ]}
    />
  );
}

export function RestaurantRowSkeleton() {
  const { colors, resolvedScheme } = useFlavorTheme();
  const shadow = cardShadow(resolvedScheme);

  return (
    <View
      style={[
        styles.row,
        shadow,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
      ]}
    >
      <SkeletonBox height={100} width={100} radiusValue={radius.md} />
      <View style={styles.meta}>
        <SkeletonBox height={20} width="68%" radiusValue={8} />
        <SkeletonBox height={14} width="48%" radiusValue={6} />
        <SkeletonBox height={14} width="82%" radiusValue={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm + 2,
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'stretch',
  },
  meta: { flex: 1, gap: spacing.sm + 2, justifyContent: 'center' },
});
