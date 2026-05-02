import { LinearGradient } from 'expo-linear-gradient';
import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useFlavorTheme } from '../hooks/useFlavorTheme';

export function AuthBackdrop({ children }: PropsWithChildren) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const top = resolvedScheme === 'dark' ? '#050505' : '#FFF8F3';
  const warmOrb = `${colors.primary}22`;

  return (
    <LinearGradient
      colors={
        resolvedScheme === 'dark'
          ? [top, colors.background]
          : [top, '#FFFCFA', colors.background]
      }
      locations={resolvedScheme === 'dark' ? [0, 1] : [0, 0.52, 1]}
      style={styles.flex}
    >
      <View pointerEvents="none" style={styles.orbLarge}>
        <View style={[styles.orbCircle, { backgroundColor: warmOrb }]} />
      </View>
      <View pointerEvents="none" style={styles.orbSmall}>
        <View
          style={[
            styles.orbBubble,
            {
              borderColor: `${colors.primary}33`,
              backgroundColor: `${colors.surfaceElevated}44`,
            },
          ]}
        />
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  orbLarge: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  orbCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    marginTop: -48,
    marginRight: -70,
    transform: [{ rotate: '-12deg' }],
  },
  orbSmall: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  orbBubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: '18%',
    marginLeft: -40,
    borderWidth: 1.5,
  },
});
