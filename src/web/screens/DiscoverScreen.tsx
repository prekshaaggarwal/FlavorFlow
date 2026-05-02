import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RESTAURANTS_WEB, type WebRestaurant } from '../data';
import { Card, FoodImage, GhostButton, PrimaryButton, Section, Tag } from '../primitives';
import { useFlavorWeb } from '../state';

export function DiscoverScreen() {
  const { palette, navigate, toast } = useFlavorWeb();
  const [stack, setStack] = useState<WebRestaurant[]>(() => [...RESTAURANTS_WEB]);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const top = stack[stack.length - 1];
  const next = stack[stack.length - 2];

  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > 110) finalize('right');
        else if (g.dx < -110) finalize('left');
        else
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 6,
          }).start();
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ).current;

  const finalize = (direction: 'left' | 'right') => {
    if (!top) return;
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: direction === 'right' ? 600 : -600, y: 0 },
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start(() => {
      if (direction === 'right') {
        setLiked((prev) => [...prev, top.id]);
        toast({ title: `Loved ${top.name} 💚`, body: 'Added to your wishlist for tonight.' });
      } else {
        setPassed((prev) => [...prev, top.id]);
      }
      setStack((prev) => prev.slice(0, -1));
      pan.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
    });
  };

  const reset = () => {
    setStack([...RESTAURANTS_WEB]);
    setLiked([]);
    setPassed([]);
  };

  const rotate = pan.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: ['-18deg', '0deg', '18deg'],
  });
  const likeOpacity = pan.x.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOpacity = pan.x.interpolate({ inputRange: [-120, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const allDone = stack.length === 0;

  return (
    <View style={{ gap: 18 }}>
      <Section
        title="Swipe to discover"
        subtitle="Right-swipe to save to a wishlist, left-swipe to skip. Builds your AI palate."
      >
        <View style={styles.deck}>
          {next && !allDone ? (
            <View style={[styles.swipeCard, styles.swipeCardBack, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
              <SwipeFace restaurant={next} />
            </View>
          ) : null}

          {top ? (
            <Animated.View
              {...responder.panHandlers}
              style={[
                styles.swipeCard,
                {
                  backgroundColor: palette.surfaceElevated,
                  borderColor: palette.border,
                  transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
                  opacity,
                },
              ]}
            >
              <SwipeFace restaurant={top} />
              <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                <Text style={styles.stampText}>LOVE IT</Text>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
                <Text style={styles.stampText}>PASS</Text>
              </Animated.View>
            </Animated.View>
          ) : (
            <View style={[styles.swipeCard, styles.empty, { borderColor: palette.border, backgroundColor: palette.surfaceElevated }]}>
              <Text style={{ fontSize: 40 }}>🎯</Text>
              <Text style={{ color: palette.text, fontWeight: '800', fontSize: 18 }}>
                Deck cleared
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
                You loved {liked.length}, passed on {passed.length}. Reshuffle or jump back home.
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 8 }}>
          <Pressable
            disabled={allDone}
            onPress={() => finalize('left')}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                borderColor: palette.danger,
                backgroundColor: pressed ? palette.danger : 'transparent',
                opacity: allDone ? 0.4 : 1,
              },
            ]}
          >
            <Text style={{ color: palette.danger, fontWeight: '900', fontSize: 22 }}>✕</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (top) {
                navigate({ name: 'restaurant', restaurantId: top.id });
              }
            }}
            disabled={!top}
            style={({ pressed }) => [
              styles.peekBtn,
              {
                borderColor: palette.border,
                backgroundColor: pressed ? palette.surfaceHover : palette.surfaceElevated,
                opacity: top ? 1 : 0.4,
              },
            ]}
          >
            <Text style={{ color: palette.text, fontWeight: '700', fontSize: 12 }}>Peek menu</Text>
          </Pressable>
          <Pressable
            disabled={allDone}
            onPress={() => finalize('right')}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                borderColor: palette.success,
                backgroundColor: pressed ? palette.success : 'transparent',
                opacity: allDone ? 0.4 : 1,
              },
            ]}
          >
            <Text style={{ color: palette.success, fontWeight: '900', fontSize: 22 }}>♡</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 4 }}>
          {allDone ? (
            <PrimaryButton label="Reshuffle deck" icon="♻︎" onPress={reset} />
          ) : null}
          <GhostButton label="Back home" onPress={() => navigate({ name: 'home' })} icon="🏠" />
        </View>
      </Section>

      {liked.length > 0 ? (
        <Card>
          <Text style={{ color: palette.text, fontWeight: '800' }}>Loved tonight</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {liked.map((id) => {
              const r = RESTAURANTS_WEB.find((x) => x.id === id)!;
              return (
                <Pressable
                  key={id}
                  onPress={() => navigate({ name: 'restaurant', restaurantId: id })}
                  style={({ pressed }) => [styles.likedChip, { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 }]}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>♡ {r.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function SwipeFace({ restaurant }: { restaurant: WebRestaurant }) {
  const { palette } = useFlavorWeb();
  return (
    <>
      <View style={styles.swipeBg}>
        <FoodImage
          url={restaurant.coverUrl}
          letter={restaurant.name.charAt(0)}
          tint={restaurant.imageTint}
          rounded={0}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      </View>
      <View style={{ padding: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: palette.text, fontWeight: '900', fontSize: 22, flex: 1 }} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: palette.overlay }}>
            <Text style={{ color: palette.text, fontWeight: '900' }}>★ {restaurant.rating}</Text>
          </View>
        </View>
        <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
          {restaurant.cuisines.join(' · ')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {restaurant.tags.map((t) => (
            <Tag key={t} label={t} color={palette.primary} />
          ))}
          <Tag label={`Hygiene ${restaurant.hygieneRating}`} color={palette.success} />
        </View>
        <Text style={{ color: palette.text, fontSize: 13, marginTop: 8 }}>
          🔥 {restaurant.liveOrders} orders flowing right now · {restaurant.etaMins}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  deck: { height: 420, alignItems: 'center', justifyContent: 'center' },
  swipeCard: {
    position: 'absolute',
    width: 320,
    height: 400,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  swipeCardBack: {
    transform: [{ scale: 0.95 }],
    opacity: 0.5,
  },
  swipeBg: { height: 220, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  stamp: {
    position: 'absolute',
    top: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 4,
  },
  likeStamp: { right: 24, borderColor: '#22C55E', transform: [{ rotate: '-12deg' }] },
  passStamp: { left: 24, borderColor: '#EF4444', transform: [{ rotate: '12deg' }] },
  stampText: { color: '#fff', fontWeight: '900', letterSpacing: 2 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
