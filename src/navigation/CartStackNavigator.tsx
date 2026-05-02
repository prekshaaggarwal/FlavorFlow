import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { CartScreen } from '../screens/cart/CartScreen';
import { CheckoutScreen } from '../screens/checkout/CheckoutScreen';
import type { CartStackParamList } from './types';
import { useFlavorStackScreenOptions } from './useFlavorStackScreenOptions';

const Stack = createNativeStackNavigator<CartStackParamList>();

export function CartStackNavigator() {
  const screenOptions = useFlavorStackScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerLargeTitle: true, title: 'Your basket' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
    </Stack.Navigator>
  );
}
