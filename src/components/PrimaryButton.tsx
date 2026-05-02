import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFlavorTheme } from '../hooks/useFlavorTheme';
import { radius, spacing, typography } from '../theme';

type Props = {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: Props) {
  const { colors } = useFlavorTheme();
  const isPrimary = variant === 'primary';

  const handlePress = () => {
    if (disabled || loading) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void onPress();
  };

  if (isPrimary && disabled) {
    return (
      <View
        style={[
          styles.pressFrame,
          { backgroundColor: colors.border + 'CC', opacity: 0.55 },
        ]}
      >
        <View style={[styles.gradientFill, { opacity: 0.95 }]}>
          <Text
            style={[
              typography.subtitle,
              { color: colors.textSecondary, fontSize: 16 },
            ]}
          >
            {title}
          </Text>
        </View>
      </View>
    );
  }

  if (isPrimary && !disabled) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
        style={({ pressed }) => [
          styles.pressFrame,
          pressed && !loading ? styles.pressFrameSink : null,
          loading ? { opacity: 0.75 } : null,
        ]}
      >
        <LinearGradient
          colors={[colors.primaryMuted, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[typography.subtitle, styles.gradientLabel]}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      style={({ pressed }) => [
        styles.ghostShell,
        {
          borderColor: colors.border,
          backgroundColor:
            pressed && !loading ? colors.overlay : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={[typography.subtitle, { color: colors.text, fontSize: 16 }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressFrame: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  pressFrameSink: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  gradientFill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 6,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  gradientLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  ghostShell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    minHeight: 52,
  },
});
