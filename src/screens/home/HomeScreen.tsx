import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RestaurantCard } from '../../components/RestaurantCard';
import { RestaurantRowSkeleton } from '../../components/Skeleton';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, HomeStackParamList } from '../../navigation/types';
import { fetchRestaurantsRemote } from '../../services/api';
import {
  type HomeFilterId,
  RESTAURANTS,
  filterRestaurants,
} from '../../services/restaurants';
import { radius, spacing, typography } from '../../theme';

const FILTERS: { id: HomeFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'veg', label: 'Veg-forward' },
  { id: 'topRated', label: 'Top rated' },
  { id: 'fast', label: '~30 min' },
];

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList, 'Explore'>
>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useFlavorTheme();
  const [filter, setFilter] = useState<HomeFilterId>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [inventory, setInventory] = useState(RESTAURANTS);
  const [listing, setListing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remoteList = await fetchRestaurantsRemote();
        if (!cancelled && remoteList.length > 0) setInventory(remoteList);
      } catch {
        if (!cancelled) setInventory(RESTAURANTS);
      } finally {
        if (!cancelled) setListing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => filterRestaurants(inventory, filter),
    [inventory, filter]
  );

  const listData = listing ? [] : filtered;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (async () => {
      try {
        const remoteList = await fetchRestaurantsRemote();
        if (remoteList.length > 0) setInventory(remoteList);
      } catch {
        setInventory(RESTAURANTS);
      } finally {
        setRefreshing(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[typography.overline, { color: colors.primary }]}>
              Curated picks
            </Text>
            <Text style={[typography.title, { color: colors.text, fontWeight: '800', fontSize: 26 }]}>
              Tonight's crave
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Menus hydrate from Postgres, ready for moods, quests, or roulette downstream.
            </Text>
            <View style={styles.chips}>
              {FILTERS.map((f) => {
                const active = f.id === filter;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFilter(f.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: active ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: active ? '800' : '600',
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        data={listData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: spacing.xxl }]}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 220,
              mass: 0.85,
              delay: Math.min(index, 12) * 52,
            }}
          >
            <RestaurantCard
              restaurant={item}
              onPress={() =>
                navigation.navigate('RestaurantDetail', {
                  restaurantId: item.id,
                })
              }
            />
          </MotiView>
        )}
        ListEmptyComponent={
          listing ? (
            <View style={{ paddingVertical: spacing.sm }}>
              {[0, 1, 2].map((row) => (
                <MotiView
                  key={row}
                  from={{ opacity: 0, translateY: 14 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'spring',
                    damping: 22,
                    stiffness: 200,
                    delay: row * 85,
                  }}
                >
                  <RestaurantRowSkeleton />
                </MotiView>
              ))}
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            >
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: spacing.xl,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                Nothing matches these filters yet—dabble with another craving.
              </Text>
            </MotiView>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screenGutter,
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth + 0.33,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  list: { paddingHorizontal: spacing.screenGutter },
});
