/**
 * react-native-maps does not bundle for web; keep tracking UI usable in the browser.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import type { CourierPin, RegionLike } from './types';

type Props = {
  style?: StyleProp<ViewStyle>;
  region: RegionLike;
  courier: CourierPin;
  darkTiles?: boolean;
  /** Native marker press; web preview ignores this. */
  onCourierPress?: () => void;
};

export default function LiveOrderMap({
  style,
  courier,
  darkTiles,
  onCourierPress: _onCourierPress,
}: Props) {
  const palette = darkTiles ? '#0f172a' : '#e8eef7';
  const border = darkTiles ? 'rgba(248,250,252,0.08)' : 'rgba(15,23,42,0.1)';

  return (
    <View style={[styles.wrap, style, { backgroundColor: palette }]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: StyleSheet.hairlineWidth, borderColor: border }]} />

      <View style={[styles.marker, { borderColor: '#fff' }]}>
        <View style={[styles.markerFill, { backgroundColor: '#E85D04' }]} />
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.banner,
          {
            backgroundColor: darkTiles ? '#121824' : '#ffffff',
            borderColor: border,
          },
        ]}
      >
        <Text
          style={[
            styles.bannerTitle,
            { color: darkTiles ? '#F8FAFC' : '#0F172A' },
          ]}
        >
          Web map preview
        </Text>
        <Text
          style={[
            styles.bannerSub,
            { color: darkTiles ? '#94A3B8' : '#64748B' },
          ]}
        >
          Expo Go / Android / iOS show the live map. Courier @{' '}
          {courier.latitude.toFixed(4)}, {courier.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

export type { CourierPin } from './types';

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 90,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  markerFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  banner: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    maxWidth: 480,
    alignSelf: 'center',
  },
  bannerTitle: { fontWeight: '800', fontSize: 15 },
  bannerSub: { fontSize: 13, lineHeight: 18 },
});
