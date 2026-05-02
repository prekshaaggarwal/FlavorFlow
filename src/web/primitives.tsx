import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { useFlavorWeb } from './state';

export function Section({
  title,
  subtitle,
  action,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useFlavorWeb();
  return (
    <View style={[{ gap: 10 }, style]}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sectionSub, { color: palette.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  hoverable,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  hoverable?: boolean;
}) {
  const { palette } = useFlavorWeb();
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={(pressableState) => {
          const hovered = 'hovered' in pressableState ? Boolean((pressableState as { hovered?: boolean }).hovered) : false;
          return [
            styles.card,
            {
              borderColor: palette.border,
              backgroundColor: palette.surfaceElevated,
              opacity: pressableState.pressed ? 0.92 : 1,
              transform: pressableState.pressed ? [{ scale: 0.99 }] : undefined,
            },
            hoverable && hovered ? { backgroundColor: palette.surfaceHover } : null,
            style,
          ];
        }}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View
      style={[
        styles.card,
        { borderColor: palette.border, backgroundColor: palette.surfaceElevated },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
  tone = 'default',
  emoji,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  emoji?: string;
}) {
  const { palette } = useFlavorWeb();
  const toneBg =
    tone === 'success'
      ? palette.success + '22'
      : tone === 'warning'
      ? palette.warning + '22'
      : tone === 'danger'
      ? palette.danger + '22'
      : palette.surfaceElevated;
  const toneText =
    tone === 'success'
      ? palette.success
      : tone === 'warning'
      ? palette.warning
      : tone === 'danger'
      ? palette.danger
      : active
      ? '#fff'
      : palette.textSecondary;
  const Wrap: React.ElementType = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.pill,
        {
          borderColor: active ? palette.primary : palette.border,
          backgroundColor: active ? palette.primary : toneBg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {emoji ? <Text style={{ fontSize: 13 }}>{emoji}</Text> : null}
      <Text style={[styles.pillLabel, { color: toneText, fontWeight: active ? '800' : '700' }]}>
        {label}
      </Text>
    </Wrap>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  full,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  icon?: string;
}) {
  const { palette } = useFlavorWeb();
  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.primaryBtn,
        {
          backgroundColor: disabled ? palette.border : palette.primary,
          opacity: pressed ? 0.85 : 1,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon ? <Text style={styles.btnIcon}>{icon}</Text> : null}
          <Text style={styles.primaryBtnLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  full,
  icon,
}: {
  label: string;
  onPress: () => void;
  full?: boolean;
  icon?: string;
}) {
  const { palette } = useFlavorWeb();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostBtn,
        {
          borderColor: palette.border,
          backgroundColor: pressed ? palette.surfaceHover : 'transparent',
          alignSelf: full ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {icon ? <Text style={[styles.btnIcon, { color: palette.text }]}>{icon}</Text> : null}
      <Text style={[styles.ghostBtnLabel, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function SkeletonBar({ width = 200, height = 14 }: { width?: number | string; height?: number }) {
  const { palette } = useFlavorWeb();
  const pulse = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 850,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={{
        width: width as number,
        height,
        borderRadius: 8,
        backgroundColor: palette.border,
        opacity: pulse,
      }}
    />
  );
}

export function Avatar({
  letter,
  color,
  size = 36,
}: {
  letter: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: size * 0.42 }}>
        {letter}
      </Text>
    </View>
  );
}

export function Divider({ vertical }: { vertical?: boolean }) {
  const { palette } = useFlavorWeb();
  return (
    <View
      style={
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: palette.border }
          : { height: 1, alignSelf: 'stretch', backgroundColor: palette.border }
      }
    />
  );
}

export function FoodImage({
  url,
  emoji,
  tint,
  style,
  rounded,
  letter,
}: {
  url?: string;
  emoji?: string;
  tint: string;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  letter?: string;
}) {
  const [errored, setErrored] = useState(false);
  const showFallback = !url || errored;

  if (showFallback) {
    return (
      <LinearGradient
        colors={[tint, tint + 'aa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.imageBox,
          { borderRadius: rounded ?? 12 },
          style,
        ]}
      >
        {emoji ? (
          <Text style={styles.fallbackEmoji}>{emoji}</Text>
        ) : letter ? (
          <Text style={styles.fallbackLetter}>{letter}</Text>
        ) : null}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.imageBox, { borderRadius: rounded ?? 12, backgroundColor: tint }, style]}>
      <Image
        source={{ uri: url }}
        onError={() => setErrored(true)}
        style={[
          {
            width: '100%',
            height: '100%',
            borderRadius: rounded ?? 12,
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

export function Tag({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <View
      style={{
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: color + '22',
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, fontWeight: '500' },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  pillLabel: { fontSize: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryBtnLabel: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  ghostBtnLabel: { fontSize: 13, fontWeight: '700' },
  btnIcon: { fontSize: 14 },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBox: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: { fontSize: 36, opacity: 0.92 },
  fallbackLetter: { color: '#fff', fontSize: 30, fontWeight: '900', opacity: 0.9 },
});
