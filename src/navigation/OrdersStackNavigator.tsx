import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { OrderTrackingScreen } from '../screens/orders/OrderTrackingScreen';
import type { OrdersStackParamList } from './types';
import { useFlavorStackScreenOptions } from './useFlavorStackScreenOptions';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export function OrdersStackNavigator() {
  const screenOptions = useFlavorStackScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Track"
        component={OrderTrackingScreen}
        options={{
          headerLargeTitle: false,
          title: 'Delivery',
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
