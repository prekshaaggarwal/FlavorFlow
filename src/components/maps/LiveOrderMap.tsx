import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { darkMapStyle } from './mapStyles';
import type { CourierPin } from './types';

type Props = {
  style?: StyleProp<ViewStyle>;
  region: Region;
  courier: CourierPin;
  darkTiles?: boolean;
  onCourierPress?: () => void;
};

export default function LiveOrderMap({
  style,
  region,
  courier,
  darkTiles,
  onCourierPress,
}: Props) {
  return (
    <MapView
      style={style}
      region={region}
      customMapStyle={darkTiles ? darkMapStyle : undefined}
    >
      <Marker
        coordinate={{
          latitude: courier.latitude,
          longitude: courier.longitude,
        }}
        title="Your courier"
        description={courier.restaurantName}
        onPress={onCourierPress}
      />
    </MapView>
  );
}

export type { CourierPin } from './types';
