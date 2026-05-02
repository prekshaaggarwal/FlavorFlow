import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { useFlavorTheme } from '../hooks/useFlavorTheme';
import { useCartStore } from '../store/cartStore';
import { CartStackNavigator } from './CartStackNavigator';
import { HomeStackNavigator } from './HomeStackNavigator';
import { OrdersStackNavigator } from './OrdersStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { colors, resolvedScheme } = useFlavorTheme();
  const cartCount = useCartStore((s) =>
    s.lines.reduce((n, l) => n + l.quantity, 0)
  );
  const tabShadow =
    resolvedScheme === 'light'
      ? {
          shadowColor: '#00000018',
          shadowOpacity: Platform.OS === 'ios' ? 1 : undefined,
          shadowRadius: Platform.OS === 'ios' ? 16 : undefined,
          shadowOffset: Platform.OS === 'ios' ? { width: 0, height: -4 } : undefined,
        }
      : {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border },
          tabShadow,
        ],
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Explore"
        component={HomeStackNavigator}
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={focused ? size + 1 : size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackNavigator}
        options={{
          title: 'Cart',
          tabBarBadge:
            cartCount > 99 ? '99+' : cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'cart' : 'cart-outline'}
              size={focused ? size + 1 : size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStackNavigator}
        options={{
          title: 'Track',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'location' : 'location-outline'}
              size={focused ? size + 1 : size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={focused ? size + 1 : size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
