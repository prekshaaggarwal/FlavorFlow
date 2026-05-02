import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { HomeScreen } from '../screens/home/HomeScreen';
import { RestaurantDetailScreen } from '../screens/restaurant/RestaurantDetailScreen';
import type { HomeStackParamList } from './types';
import { useFlavorStackScreenOptions } from './useFlavorStackScreenOptions';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  const screenOptions = useFlavorStackScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            fontWeight: '800',
          },
          title: 'Discover',
        }}
      />
      <Stack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ headerTitle: '', headerBackTitle: '' }}
      />
    </Stack.Navigator>
  );
}
