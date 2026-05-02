import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../../components/PrimaryButton';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import type { CartStackParamList } from '../../navigation/types';
import { useCartStore } from '../../store/cartStore';
import { cardShadow, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<CartStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const { lines, decrementLine, addLine } = useCartStore();
  const rowShadow = cardShadow(resolvedScheme);

  const subtotal = lines.reduce(
    (sum, l) => sum + l.item.priceINR * l.quantity,
    0
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={lines}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIconWrap,
                { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
              ]}
            >
              <Ionicons name="fast-food-outline" size={52} color={colors.textSecondary} />
            </View>
            <Text style={[typography.subtitle, { color: colors.text }]}>
              Your basket is airy
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  paddingHorizontal: spacing.lg,
                },
              ]}
            >
              Add dishes from Explore—quantities consolidate per restaurant automatically.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              rowShadow,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
          >
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[typography.subtitle, { color: colors.text }]}>
                {item.item.name}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {item.restaurantName}
              </Text>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                ₹{item.item.priceINR}
              </Text>
            </View>
            <View
              style={[
                styles.qtyRail,
                {
                  borderColor: colors.border,
                  backgroundColor:
                    resolvedScheme === 'dark' ? colors.surface : '#F9FAFB',
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  decrementLine(item.key);
                }}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                hitSlop={12}
                style={styles.qtyBtn}
              >
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '500' }}>
                  −
                </Text>
              </Pressable>
              <Text style={[typography.subtitle, { color: colors.text, minWidth: 22, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>
                {item.quantity}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  addLine(
                    item.restaurantId,
                    item.restaurantName,
                    item.item,
                    1
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                hitSlop={12}
                style={styles.qtyBtn}
              >
                <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '600' }}>
                  +
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {lines.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.border,
              backgroundColor:
                resolvedScheme === 'dark' ? colors.background : '#FEFBF8',
              ...Platform.select({
                ios: {
                  shadowColor: '#00000014',
                  shadowOpacity: 1,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: -2 },
                },
                android: { elevation: 6 },
              }),
            },
          ]}
        >
          <View style={styles.totalRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Subtotal · taxes at checkout
            </Text>
            <Text style={[typography.title, { color: colors.text, fontSize: 22 }]}>
              ₹{subtotal}
            </Text>
          </View>
          <PrimaryButton
            title="Continue to checkout"
            onPress={() => navigation.navigate('Checkout')}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { paddingHorizontal: spacing.screenGutter, paddingTop: spacing.md, gap: spacing.md, flexGrow: 1 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 1.2,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  qtyRail: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  qtyBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.screenGutter,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
});
