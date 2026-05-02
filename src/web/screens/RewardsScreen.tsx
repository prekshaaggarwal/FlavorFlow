import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { LOYALTY_TIERS } from '../data';
import { Card, PrimaryButton, Section, Tag } from '../primitives';
import { useFlavorWeb } from '../state';

export function RewardsScreen() {
  const { state, dispatch, palette, toast } = useFlavorWeb();
  const tier = LOYALTY_TIERS.find((t) => t.id === state.tier)!;
  const tierIdx = LOYALTY_TIERS.findIndex((t) => t.id === state.tier);
  const next = LOYALTY_TIERS[Math.min(LOYALTY_TIERS.length - 1, tierIdx + 1)];
  const nextThreshold = next.threshold;
  const progress = Math.min(1, state.xp / Math.max(1, nextThreshold));

  const today = new Date();
  const last14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return {
      day: d.getDate(),
      label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1),
      hit: i >= 14 - state.streakDays,
    };
  });

  return (
    <View style={{ gap: 18 }}>
      <Section title="Loyalty" subtitle="Earn XP on every order. Tiers unlock bigger perks.">
        <LinearGradient
          colors={[tier.color + 'cc', palette.surfaceElevated]}
          style={[styles.tierCard, { borderColor: palette.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>★</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {tier.id} tier · {state.xp} XP
              </Text>
              <Text style={{ color: '#f8fafc', fontSize: 13 }}>
                {next.id === tier.id
                  ? "You're at the top, royalty 🎉"
                  : `${nextThreshold - state.xp} XP to ${next.id}`}
              </Text>
            </View>
          </View>
          <View style={[styles.progress, { backgroundColor: palette.scrim }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: '#fff' }]} />
          </View>
          <View style={{ gap: 4 }}>
            {tier.perks.map((p) => (
              <Text key={p} style={{ color: '#f8fafc', fontSize: 12 }}>
                ✓ {p}
              </Text>
            ))}
          </View>
        </LinearGradient>
      </Section>

      <Section title="Daily streak" subtitle={`${state.streakDays}-day run. Order today and we'll bump it up.`}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {last14.map((d, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: d.hit ? palette.primary : palette.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: d.hit ? '#fff' : palette.textTertiary, fontSize: 10, fontWeight: '900' }}>
                    {d.day}
                  </Text>
                </View>
                <Text style={{ color: palette.textTertiary, fontSize: 9 }}>{d.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            <Tag label={`+${state.streakDays * 5} XP this week`} color={palette.primary} />
            {state.streakDays >= 3 ? (
              <Tag label="3-day reward unlocked" color={palette.success} />
            ) : null}
            {state.streakDays >= 7 ? (
              <Tag label="🔥 Week-long warrior" color={palette.danger} />
            ) : null}
          </View>
        </Card>
      </Section>

      <Section title="Scratch cards" subtitle="Tap to reveal a post-delivery surprise.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {state.scratchCards.map((c) => (
            <ScratchCard
              key={c.id}
              revealed={c.revealed}
              reward={c.reward}
              onReveal={() => {
                dispatch({ type: 'SCRATCH_REVEAL', id: c.id });
                if (c.reward.includes('cashback')) {
                  const m = c.reward.match(/\d+/);
                  const amt = m ? parseInt(m[0], 10) : 50;
                  dispatch({
                    type: 'WALLET_ADJUST',
                    amount: amt,
                    label: `Scratch · ${c.reward}`,
                  });
                  toast({
                    title: `₹${amt} added to wallet 💰`,
                    body: 'Use it on your next order.',
                    tone: 'success',
                  });
                } else {
                  toast({
                    title: 'Reward unlocked',
                    body: c.reward,
                    tone: 'success',
                  });
                }
              }}
              palette={palette}
            />
          ))}
        </View>
      </Section>

      <Section title="Achievements">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {state.badges.map((b) => (
            <View
              key={b.id}
              style={[
                styles.badge,
                {
                  borderColor: b.unlocked ? palette.primary : palette.border,
                  backgroundColor: b.unlocked
                    ? palette.primarySoft
                    : palette.surfaceElevated,
                  opacity: b.unlocked ? 1 : 0.6,
                },
              ]}
            >
              <Text style={{ fontSize: 28 }}>{b.emoji}</Text>
              <Text style={{ color: palette.text, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
                {b.name}
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 11, textAlign: 'center' }}>
                {b.description}
              </Text>
              {b.unlocked ? (
                <Tag label="Unlocked" color={palette.success} />
              ) : (
                <Tag label="Locked" color={palette.textTertiary} />
              )}
            </View>
          ))}
        </View>
      </Section>

      <Section title="Active quests">
        <Card>
          <Quest
            title="Diwali sweets sprint"
            sub="Order from 3 different sweet kitchens during Diwali week"
            progress={1 / 3}
            reward="₹150 wallet credit"
            palette={palette}
          />
          <Quest
            title="Healthy weekday five"
            sub="5 healthy lunches in a single workweek"
            progress={2 / 5}
            reward="Free salad upgrade × 3"
            palette={palette}
          />
          <Quest
            title="Friend hunt"
            sub="Refer 3 friends; battle them on a leaderboard"
            progress={1 / 3}
            reward="Bronze → Silver bump"
            palette={palette}
          />
        </Card>
      </Section>

      <Section title="Referral battle">
        <Card>
          <Text style={{ color: palette.text, fontWeight: '900' }}>
            You vs Aarav · You're winning by 2 orders 🎉
          </Text>
          <View style={{ gap: 6 }}>
            {[
              { name: 'You', orders: 9, color: palette.primary },
              { name: 'Aarav', orders: 7, color: palette.accent },
              { name: 'Riya', orders: 4, color: palette.success },
            ].map((row) => (
              <View key={row.name} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: palette.text, fontWeight: '700' }}>{row.name}</Text>
                  <Text style={{ color: palette.textSecondary }}>{row.orders} orders</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.border }}>
                  <View
                    style={{
                      width: `${(row.orders / 10) * 100}%`,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: row.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
          <PrimaryButton
            label="Invite a friend"
            icon="📨"
            onPress={() =>
              toast({
                title: 'Invite link copied',
                body: 'flavorflow.app/i/x29 — keep the lead.',
                tone: 'success',
              })
            }
          />
        </Card>
      </Section>
    </View>
  );
}

function Quest({
  title,
  sub,
  progress,
  reward,
  palette,
}: {
  title: string;
  sub: string;
  progress: number;
  reward: string;
  palette: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  return (
    <View style={{ gap: 6, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.text, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>{sub}</Text>
        </View>
        <Tag label={reward} color={palette.primary} />
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.border }}>
        <View
          style={{
            width: `${progress * 100}%`,
            height: 6,
            borderRadius: 3,
            backgroundColor: palette.primary,
          }}
        />
      </View>
    </View>
  );
}

function ScratchCard({
  revealed,
  reward,
  onReveal,
  palette,
}: {
  revealed: boolean;
  reward: string;
  onReveal: () => void;
  palette: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  const flip = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(flip, {
      toValue: revealed ? 1 : 0,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [revealed, flip]);
  const rotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1, 0] });
  const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <Pressable onPress={onReveal} disabled={revealed}>
      <Animated.View style={[styles.scratchWrap, { transform: [{ rotateY: rotate }] }]}>
        <Animated.View
          style={[
            styles.scratchFace,
            {
              backgroundColor: palette.primary,
              opacity: frontOpacity,
            },
          ]}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>?</Text>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>tap to scratch</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.scratchFace,
            styles.scratchBack,
            {
              backgroundColor: palette.surfaceElevated,
              borderColor: palette.primary,
              opacity: backOpacity,
            },
          ]}
        >
          <Text style={{ fontSize: 22 }}>🎁</Text>
          <Text style={{ color: palette.text, fontWeight: '900', textAlign: 'center', fontSize: 12 }}>
            {reward}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tierCard: { padding: 18, borderRadius: 22, gap: 10, borderWidth: 1 },
  tierBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4 },
  badge: {
    width: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    alignItems: 'center',
  },
  scratchWrap: {
    width: 120,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
  },
  scratchFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
  },
  scratchBack: {
    borderWidth: 1,
    transform: [{ rotateY: '180deg' }],
  },
});
