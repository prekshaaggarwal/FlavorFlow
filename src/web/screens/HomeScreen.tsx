import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  type DietaryTag,
  MOODS,
  RESTAURANTS_WEB,
  VOICE_QUERY_HINTS,
  type WebRestaurant,
} from '../data';
import { Card, FoodImage, Pill, PrimaryButton, Section, SkeletonBar, Tag } from '../primitives';
import { describeQuery, isQueryEmpty, parseQuery, searchDishes } from '../search';
import { useFlavorWeb } from '../state';

const DIETARY: { id: DietaryTag; label: string }[] = [
  { id: 'veg', label: 'Veg' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'keto', label: 'Keto' },
  { id: 'low-carb', label: 'Low-carb' },
  { id: 'high-protein', label: 'High protein' },
  { id: 'gluten-free', label: 'Gluten-free' },
];

export function HomeScreen() {
  const { state, dispatch, navigate, palette, toast } = useFlavorWeb();
  const [search, setSearch] = useState('');
  const [voicing, setVoicing] = useState(false);
  const [voiceHintIdx, setVoiceHintIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!voicing) return undefined;
    const t = setInterval(() => setVoiceHintIdx((i) => (i + 1) % VOICE_QUERY_HINTS.length), 1400);
    return () => clearInterval(t);
  }, [voicing]);

  const startVoice = () => {
    if (
      typeof window !== 'undefined' &&
      // @ts-ignore - browser global
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      try {
        // @ts-ignore
        const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new Rec();
        rec.lang = 'en-IN';
        rec.interimResults = false;
        setVoicing(true);
        rec.onresult = (e: any) => {
          const text = e.results?.[0]?.[0]?.transcript ?? '';
          setSearch(text);
          setVoicing(false);
          toast({ title: 'Heard you 🎙️', body: text, tone: 'info' });
        };
        rec.onerror = () => setVoicing(false);
        rec.onend = () => setVoicing(false);
        rec.start();
        return;
      } catch {
        // fall through to demo mode
      }
    }
    setVoicing(true);
    setTimeout(() => {
      const sample = VOICE_QUERY_HINTS[Math.floor(Math.random() * VOICE_QUERY_HINTS.length)];
      setSearch(sample);
      setVoicing(false);
      toast({
        title: 'Voice search',
        body: `Demo capture: "${sample}". Open in Chrome desktop for live mic.`,
      });
    }, 1500);
  };

  const trimmed = search.trim();
  const parsed = useMemo(() => parseQuery(trimmed), [trimmed]);
  const queryActive = !isQueryEmpty(parsed);
  const dishMatches = useMemo(() => {
    if (!queryActive) return [];
    let results = searchDishes(trimmed).results;
    if (state.mood) {
      results = results.filter((d) => d.restaurant.moods.includes(state.mood!));
    }
    return results.slice(0, 12);
  }, [trimmed, queryActive, state.mood]);
  const queryDesc = describeQuery(parsed);

  // Restaurant feed: respects mood/dietary/allergens/cal cap, plus dish-search hits.
  const filtered = useMemo(() => {
    const matchedRestaurantIds = new Set(dishMatches.map((d) => d.restaurant.id));
    let list = RESTAURANTS_WEB.slice();

    if (state.mood) list = list.filter((r) => r.moods.includes(state.mood!));
    if (state.dietary.length > 0) {
      list = list.filter((r) =>
        r.menu.some((m) => (m.dietary ?? []).some((d) => state.dietary.includes(d)))
      );
    }
    if (state.allergens.length > 0) {
      list = list.filter((r) =>
        r.menu.some((m) => !(m.allergens ?? []).some((a) => state.allergens.includes(a)))
      );
    }
    if (state.caloriesCap) {
      list = list.filter((r) =>
        r.menu.some((m) => (m.calories ?? 0) <= state.caloriesCap!)
      );
    }

    if (queryActive && matchedRestaurantIds.size > 0) {
      list = list.filter((r) => matchedRestaurantIds.has(r.id));
      // Sort by how many top dish matches the restaurant has, then trending.
      const counts: Record<string, number> = {};
      for (const m of dishMatches)
        counts[m.restaurant.id] = (counts[m.restaurant.id] ?? 0) + 1;
      list.sort(
        (a, b) =>
          (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || b.trendingScore - a.trendingScore
      );
    } else {
      list.sort((a, b) => b.trendingScore - a.trendingScore);
    }

    return list;
  }, [state.mood, state.dietary, state.allergens, state.caloriesCap, dishMatches, queryActive]);

  const trending = useMemo(() => {
    const mood = state.mood;
    const list =
      mood == null
        ? RESTAURANTS_WEB.slice()
        : RESTAURANTS_WEB.filter((r) => r.moods.includes(mood));
    return list.sort((a, b) => b.trendingScore - a.trendingScore);
  }, [state.mood]);
  const moodLabel = state.mood ? MOODS.find((m) => m.id === state.mood)?.label : null;

  const isFollowing = state.followingFoodies.length > 0;

  return (
    <View style={{ gap: 18 }}>
      <LinearGradient
        colors={[palette.primarySoft, palette.bgGradient[1]]}
        style={[styles.welcome, { borderColor: palette.border }]}
      >
        <Text style={[styles.overline, { color: palette.primary }]}>
          Hi {state.name} · {state.tier} tier · {state.streakDays}-day streak 🔥
        </Text>
        <Text style={[styles.display, { color: palette.text }]}>What are you craving?</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Try natural language: "spicy pasta under ₹350", "healthy bowls", "late-night
          burger". Voice-search the same way.
        </Text>

        <View style={[styles.searchRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={{ color: palette.textTertiary, fontSize: 16 }}>🔎</Text>
          <TextInput
            placeholder={voicing ? VOICE_QUERY_HINTS[voiceHintIdx] : 'Try "spicy pasta", "vegan bowl", "biryani under ₹300"…'}
            placeholderTextColor={palette.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: palette.text }]}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch('')}
              style={({ pressed }) => [
                styles.clearBtn,
                { backgroundColor: palette.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={{ color: palette.text, fontSize: 12, fontWeight: '900' }}>×</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={startVoice}
            style={({ pressed }) => [
              styles.micBtn,
              {
                backgroundColor: voicing ? palette.danger : palette.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.micBtnLabel}>{voicing ? '● Listening' : '🎙️ Voice'}</Text>
          </Pressable>
        </View>

        {state.mood && moodLabel ? (
          <View
            style={[
              styles.moodActiveBanner,
              { backgroundColor: palette.chip, borderColor: palette.primary },
            ]}
          >
            <Text style={{ color: palette.text, fontWeight: '800', fontSize: 12 }}>
              Mood: {MOODS.find((m) => m.id === state.mood)?.emoji}{' '}
              {moodLabel}
              {queryActive ? ' · also narrowing search matches' : ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear mood filter"
              hitSlop={8}
              onPress={() => dispatch({ type: 'MOOD', mood: null })}
            >
              <Text style={{ color: palette.primary, fontWeight: '800', fontSize: 11 }}>Clear mood</Text>
            </Pressable>
          </View>
        ) : null}
        {queryActive ? (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {queryDesc.map((d) => (
              <Tag key={d} label={d} color={palette.primary} />
            ))}
          </View>
        ) : (
          <View style={styles.shortcutRow}>
            <Pressable
              onPress={() => navigate({ name: 'discover' })}
              style={({ pressed }) => [
                styles.shortcut,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceElevated,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.shortcutTitle, { color: palette.text }]}>🃏 Swipe to discover</Text>
              <Text style={[styles.shortcutSub, { color: palette.textSecondary }]}>
                Tinder-style cards. Right = love it, left = pass.
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigate({ name: 'roulette' })}
              style={({ pressed }) => [
                styles.shortcut,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceElevated,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.shortcutTitle, { color: palette.text }]}>🎡 Cuisine roulette</Text>
              <Text style={[styles.shortcutSub, { color: palette.textSecondary }]}>
                Indecisive? Spin and let fate plate up.
              </Text>
            </Pressable>
          </View>
        )}
      </LinearGradient>

      {queryActive ? (
        <Section
          title={`${dishMatches.length} matching dish${dishMatches.length === 1 ? '' : 'es'}`}
          subtitle="Ranked by relevance, spice level, price and cuisine fit."
        >
          {dishMatches.length === 0 ? (
            <Card>
              <Text style={{ color: palette.text, fontWeight: '700' }}>
                No dishes match this query yet.
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                Try loosening the filters — drop the price cap, swap "vegan" for "veg",
                or remove a cuisine word.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {dishMatches.map((m) => (
                <DishResultCard
                  key={m.item.id + m.restaurant.id}
                  match={m}
                  onPressRestaurant={() =>
                    navigate({ name: 'restaurant', restaurantId: m.restaurant.id })
                  }
                />
              ))}
            </View>
          )}
        </Section>
      ) : null}

      <Section
        title="Pick a mood"
        subtitle={
          queryActive
            ? 'Works with search too — kitchens that match both your query & mood bubble up.'
            : 'Tap twice to clear a mood.'
        }
      >
        {/* Avoid nesting horizontal ScrollView inside outer vertical ScrollView on web —
            it often eats pointer events; a wrapping row keeps taps reliable. */}
        <View style={styles.moodGrid}>
          {MOODS.map((m) => {
            const active = state.mood === m.id;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  const active = state.mood === m.id;
                  dispatch({ type: 'MOOD', mood: active ? null : m.id });
                  if (!active) {
                    toast({
                      title: `${m.emoji} ${m.label}`,
                      body: 'Trending, curated kitchens, and search all follow this vibe now.',
                      tone: 'info',
                    });
                  }
                }}
                style={({ pressed }) => [
                  styles.moodPill,
                  {
                    borderColor: active ? palette.primary : palette.border,
                    backgroundColor: active ? palette.primary : palette.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: active ? '#fff' : palette.text, fontSize: 13, fontWeight: '800' }}>
                    {m.label}
                  </Text>
                  <Text
                    style={{
                      color: active ? '#fff' : palette.textSecondary,
                      fontSize: 11,
                    }}
                  >
                    {m.tagline}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Dietary & allergens" subtitle="Filters persist across screens.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {DIETARY.map((d) => {
            const active = state.dietary.includes(d.id);
            return (
              <Pill
                key={d.id}
                label={d.label}
                active={active}
                onPress={() =>
                  dispatch({
                    type: 'DIETARY',
                    tags: active
                      ? state.dietary.filter((t) => t !== d.id)
                      : [...state.dietary, d.id],
                  })
                }
              />
            );
          })}
        </View>
      </Section>

      {!queryActive ? (
        <Section title="Trending nearby" subtitle="Live popularity feed across the city right now.">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 12 }}
          >
            {trending.slice(0, 6).map((r) => (
              <TrendingCard key={r.id} restaurant={r} onPress={() => navigate({ name: 'restaurant', restaurantId: r.id })} />
            ))}
          </ScrollView>
          {state.mood != null && trending.length === 0 ? (
            <Text style={{ color: palette.warning, fontSize: 13, marginTop: 8 }}>
              No trending spots tagged for this mood — clear the mood chip above or switch vibe.
            </Text>
          ) : null}
        </Section>
      ) : null}

      <Section
        title={queryActive ? 'Restaurants serving this' : 'Curated picks'}
        subtitle={
          queryActive
            ? `Kitchens with the strongest matches surface first.${moodLabel ? ` Mood · ${moodLabel}.` : ''}`
            : isFollowing
            ? `Tuned to your ${state.tier} tier and ${state.followingFoodies.length} foodies you follow.${moodLabel ? ` Showing ${moodLabel} moods.` : ''}`
            : moodLabel
            ? `Filtered for “${moodLabel}”. Tap mood again or “Clear mood” to reset.`
            : 'AI suggestions get sharper as you order.'
        }
        action={
          queryActive ? null : (
            <Pressable onPress={() => navigate({ name: 'social' })}>
              <Text style={{ color: palette.primary, fontWeight: '800' }}>Follow foodies →</Text>
            </Pressable>
          )
        }
      >
        {loading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 86,
                      height: 86,
                      borderRadius: 12,
                      backgroundColor: palette.border,
                    }}
                  />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBar width="68%" height={16} />
                    <SkeletonBar width="40%" height={11} />
                    <SkeletonBar width="55%" height={11} />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <Card>
            <Text style={{ color: palette.text, fontWeight: '700' }}>
              Nothing matches these filters yet.
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
              Loosen up a chip or two and we'll cast a wider net.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((r) => (
              <RestaurantRow
                key={r.id}
                restaurant={r}
                onPress={() => navigate({ name: 'restaurant', restaurantId: r.id })}
              />
            ))}
          </View>
        )}
      </Section>

      {!queryActive ? (
        <Card>
          <Text style={[styles.overline, { color: palette.primary }]}>Smart suggestion</Text>
          <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16 }}>
            "People also pair Garlic Knots with Charred Pepperoni — 78% pair."
          </Text>
          <PrimaryButton
            label="Add to next pizza order"
            onPress={() => {
              navigate({ name: 'restaurant', restaurantId: 'r2' });
            }}
            full
            icon="🧠"
          />
        </Card>
      ) : null}
    </View>
  );
}

function DishResultCard({
  match,
  onPressRestaurant,
}: {
  match: ReturnType<typeof searchDishes>['results'][number];
  onPressRestaurant: () => void;
}) {
  const { palette, dispatch, toast } = useFlavorWeb();
  const { restaurant, item, reasons } = match;
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <FoodImage
          url={item.imageUrl}
          emoji={item.emoji}
          tint={restaurant.imageTint}
          style={{ width: 92, height: 92 }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderWidth: 2,
                borderColor: item.veg ? palette.veg : palette.nonVeg,
                borderRadius: 2,
              }}
            />
            <Text style={{ color: palette.text, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>
              {item.name}
            </Text>
            {(item.spiceLevel ?? 0) >= 2 ? (
              <Tag label={`SPICE ${item.spiceLevel}/3`} color={palette.danger} />
            ) : null}
            {item.popular ? <Tag label="POPULAR" color={palette.primary} /> : null}
          </View>
          <Pressable onPress={onPressRestaurant}>
            <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 12 }}>
              from {restaurant.name} · {restaurant.etaMins}
            </Text>
          </Pressable>
          <Text style={{ color: palette.textSecondary, fontSize: 12 }} numberOfLines={2}>
            {item.description}
          </Text>
          {reasons.length ? (
            <Text style={{ color: palette.textTertiary, fontSize: 11 }} numberOfLines={1}>
              Why: {reasons[0]}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ color: palette.text, fontWeight: '900', fontSize: 16 }}>
            ₹{item.priceINR}
          </Text>
          <PrimaryButton
            label="+ Add"
            onPress={() => {
              dispatch({
                type: 'CART_ADD',
                line: {
                  uid: `${item.id}-${Date.now()}`,
                  restaurantId: restaurant.id,
                  item,
                  quantity: 1,
                },
              });
              toast({
                title: `Added ${item.name}`,
                body: `From ${restaurant.name}.`,
                emoji: '🛒',
                tone: 'success',
              });
            }}
          />
        </View>
      </View>
    </Card>
  );
}

function TrendingCard({
  restaurant,
  onPress,
}: {
  restaurant: WebRestaurant;
  onPress: () => void;
}) {
  const { palette } = useFlavorWeb();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trending,
        { borderColor: palette.border, backgroundColor: palette.surfaceElevated, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.trendingThumbWrap}>
        <FoodImage
          url={restaurant.coverUrl}
          letter={restaurant.name.charAt(0)}
          tint={restaurant.imageTint}
          rounded={0}
          style={{ width: '100%', height: '100%' }}
        />
        <View style={[styles.liveBadge, { backgroundColor: palette.danger }]}>
          <View style={styles.liveDot} />
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>
            {restaurant.liveOrders} live
          </Text>
        </View>
      </View>
      <View style={{ padding: 12, gap: 4 }}>
        <Text style={{ color: palette.text, fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={{ color: palette.textSecondary, fontSize: 11 }}>
          ★ {restaurant.rating} · {restaurant.etaMins}
        </Text>
      </View>
    </Pressable>
  );
}

function RestaurantRow({
  restaurant,
  onPress,
}: {
  restaurant: WebRestaurant;
  onPress: () => void;
}) {
  const { palette } = useFlavorWeb();
  return (
    <Card onPress={onPress} hoverable>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <FoodImage
          url={restaurant.coverUrl}
          letter={restaurant.name.charAt(0)}
          tint={restaurant.imageTint}
          style={{ width: 92, height: 92 }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Text style={{ color: palette.text, fontWeight: '800', fontSize: 16, flex: 1 }} numberOfLines={2}>
              {restaurant.name}
            </Text>
            <View style={[styles.ratingPill, { backgroundColor: palette.overlay }]}>
              <Text style={{ color: palette.text, fontSize: 12, fontWeight: '800' }}>
                ★ {restaurant.rating}
              </Text>
            </View>
          </View>
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
            {restaurant.cuisines.join(' · ')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
            <View style={[styles.etaChip, { backgroundColor: palette.chip, borderColor: palette.primary + '55' }]}>
              <Text style={{ color: palette.primary, fontSize: 11, fontWeight: '800' }}>
                {restaurant.etaMins}
              </Text>
            </View>
            <Text style={{ color: palette.textTertiary, fontSize: 11 }}>
              ₹{restaurant.deliveryFeeINR} delivery · {restaurant.distanceKm} km
            </Text>
            <Tag label={`Hygiene ${restaurant.hygieneRating}`} color={palette.success} />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  welcome: { padding: 20, borderRadius: 22, gap: 10, borderWidth: 1 },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  display: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  body: { fontSize: 13, lineHeight: 20 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 6 },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  micBtnLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  shortcutRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  shortcut: { flex: 1, minWidth: 200, padding: 12, borderRadius: 14, borderWidth: 1, gap: 4 },
  shortcutTitle: { fontSize: 13, fontWeight: '800' },
  shortcutSub: { fontSize: 11 },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexGrow: 1,
    flexBasis: 220,
    maxWidth: 360,
  },
  moodActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  trending: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  trendingThumbWrap: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  ratingPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  etaChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
});
