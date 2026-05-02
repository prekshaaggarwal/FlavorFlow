import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { CUISINES_FOR_ROULETTE, RESTAURANTS_WEB } from '../data';
import { Card, GhostButton, PrimaryButton, Section } from '../primitives';
import { useFlavorWeb } from '../state';

export function RouletteScreen() {
  const { palette, navigate, toast } = useFlavorWeb();
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const rot = useRef(new Animated.Value(0)).current;
  const totalRot = useRef(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setPicked(null);
    const idx = Math.floor(Math.random() * CUISINES_FOR_ROULETTE.length);
    const segDeg = 360 / CUISINES_FOR_ROULETTE.length;
    const target = totalRot.current + 360 * 5 + (360 - idx * segDeg - segDeg / 2);
    totalRot.current = target;
    Animated.timing(rot, {
      toValue: target,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setPicked(CUISINES_FOR_ROULETTE[idx]);
      toast({
        title: `Roulette picked ${CUISINES_FOR_ROULETTE[idx]} 🎯`,
        body: 'We filtered the home feed to match.',
        tone: 'info',
      });
    });
  };

  const rotation = rot.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const recommended = picked
    ? RESTAURANTS_WEB.find((r) =>
        r.cuisines.some((c) => c.toLowerCase() === picked.toLowerCase())
      )
    : null;

  return (
    <View style={{ gap: 18 }}>
      <Section
        title="Cuisine roulette"
        subtitle="Indecisive? Spin and let fate plate up. Eight cuisines, weighted to nearby restaurants."
      >
        <View style={styles.wheelWrap}>
          <View
            style={[
              styles.pointer,
              { borderTopColor: palette.primary },
            ]}
          />
          <Animated.View style={[styles.wheel, { borderColor: palette.border, transform: [{ rotate: rotation }] }]}>
            {CUISINES_FOR_ROULETTE.map((c, i) => {
              const colors = [
                '#F59E0B',
                '#7C3AED',
                '#10B981',
                '#EC4899',
                '#0EA5E9',
                '#F43F5E',
                '#84CC16',
                '#EAB308',
              ];
              const angle = (360 / CUISINES_FOR_ROULETTE.length) * i;
              return (
                <View
                  key={c}
                  style={[
                    styles.slice,
                    {
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.sliceContent,
                      {
                        backgroundColor: colors[i % colors.length] + 'cc',
                      },
                    ]}
                  >
                    <Text style={styles.sliceLabel} numberOfLines={1}>
                      {c}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View
              style={[
                styles.wheelHub,
                { backgroundColor: palette.surfaceElevated, borderColor: palette.primary },
              ]}
            >
              <Text style={{ fontSize: 22 }}>🎡</Text>
            </View>
          </Animated.View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
          <PrimaryButton
            label={spinning ? 'Spinning…' : picked ? 'Spin again' : 'Spin the wheel'}
            onPress={spin}
            icon="🎯"
            loading={spinning}
          />
          <GhostButton label="Back home" onPress={() => navigate({ name: 'home' })} icon="🏠" />
        </View>

        {picked ? (
          <LinearGradient
            colors={[palette.primarySoft, palette.surfaceElevated]}
            style={[styles.result, { borderColor: palette.border }]}
          >
            <Text style={{ color: palette.primary, fontWeight: '900', fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Tonight's cuisine
            </Text>
            <Text style={{ color: palette.text, fontSize: 26, fontWeight: '900' }}>{picked}</Text>
            {recommended ? (
              <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
                Best match nearby: {recommended.name} · ★ {recommended.rating} · {recommended.etaMins}
              </Text>
            ) : (
              <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
                We'll surface matches once a restaurant lands in this cuisine.
              </Text>
            )}
            {recommended ? (
              <PrimaryButton
                label={`Open ${recommended.name}`}
                icon="→"
                onPress={() => navigate({ name: 'restaurant', restaurantId: recommended.id })}
              />
            ) : null}
          </LinearGradient>
        ) : (
          <Card>
            <Text style={{ color: palette.text, fontWeight: '700' }}>Tip</Text>
            <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
              Spinning awards 5 XP. 100 XP edges you toward Silver tier.
            </Text>
          </Card>
        )}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  wheelWrap: { alignItems: 'center', paddingVertical: 24 },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -10,
    zIndex: 5,
  },
  wheel: {
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  slice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: '50%',
    left: 0,
    transformOrigin: '100% 0%' as unknown as 'top right',
  },
  sliceContent: {
    flex: 1,
    paddingTop: 8,
    paddingLeft: 18,
  },
  sliceLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  wheelHub: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  result: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
});
