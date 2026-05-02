import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  FOOD_STORIES,
  FOODIES,
  RESTAURANTS_WEB,
  type Foodie,
  type FoodStory,
  type Poll,
} from '../data';
import {
  Avatar,
  Card,
  FoodImage,
  GhostButton,
  Pill,
  PrimaryButton,
  Section,
  Tag,
} from '../primitives';
import { useFlavorWeb } from '../state';

export function SocialScreen() {
  const { state, dispatch, palette, navigate, toast } = useFlavorWeb();

  return (
    <View style={{ gap: 18 }}>
      <Section title="Food stories" subtitle="Short video reviews from the community.">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {FOOD_STORIES.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </ScrollView>
      </Section>

      <Section
        title="Foodies to follow"
        subtitle="Their orders shape your AI palate. Battle them on the streak leaderboard."
      >
        <View style={{ gap: 10 }}>
          {FOODIES.map((f) => (
            <FoodieRow key={f.id} foodie={f} />
          ))}
        </View>
      </Section>

      <Section title="Live community polls">
        <View style={{ gap: 10 }}>
          {state.polls.map((p) => (
            <PollCard key={p.id} poll={p} />
          ))}
        </View>
      </Section>

      <Section title="Wishlists" subtitle="Curated 'My favorite spots' lists. Share them anywhere.">
        <View style={{ gap: 10 }}>
          {state.wishlists.map((w) => (
            <Card key={w.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: palette.text, fontWeight: '900', flex: 1 }}>
                  {w.name}
                </Text>
                <Tag label={`${w.restaurantIds.length} spots`} color={palette.primary} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {w.restaurantIds.map((id) => {
                  const r = RESTAURANTS_WEB.find((x) => x.id === id);
                  if (!r) return null;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => navigate({ name: 'restaurant', restaurantId: id })}
                      style={({ pressed }) => [
                        styles.wishChip,
                        {
                          backgroundColor: r.imageTint,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                        {r.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <GhostButton
                  label="Copy share link"
                  icon="🔗"
                  onPress={() =>
                    toast({
                      title: 'Wishlist link copied',
                      body: `flavorflow.app/wl/${w.id}`,
                      tone: 'info',
                    })
                  }
                />
              </View>
            </Card>
          ))}
          <Card>
            <Text style={{ color: palette.text, fontWeight: '700' }}>Create a new list</Text>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              Group restaurants by mood, occasion, or season.
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {['Date nights', 'Hangover heroes', 'Office parties', 'Sweet tooth'].map((preset) => (
                <Pill
                  key={preset}
                  label={`+ ${preset}`}
                  onPress={() => {
                    dispatch({ type: 'WISHLIST_NEW', name: preset });
                    toast({ title: `Created '${preset}'`, body: 'Add restaurants from any menu screen.' });
                  }}
                />
              ))}
            </View>
          </Card>
        </View>
      </Section>

      <Section title="Live restaurant streams">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {RESTAURANTS_WEB.slice(0, 4).map((r) => (
            <Pressable
              key={r.id}
              onPress={() =>
                toast({
                  title: 'Live kitchen stream',
                  body: `Watching ${r.name}'s line cooks. (Demo: streaming hooks plug into HLS in build.)`,
                  emoji: '📡',
                })
              }
              style={({ pressed }) => [
                styles.streamCard,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceElevated,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.streamThumb}>
                <FoodImage
                  url={r.coverUrl}
                  letter={r.name.charAt(0)}
                  tint={r.imageTint}
                  rounded={0}
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                />
                <View style={[styles.liveBadge, { backgroundColor: palette.danger }]}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>● LIVE</Text>
                </View>
              </View>
              <View style={{ padding: 10, gap: 4 }}>
                <Text style={{ color: palette.text, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
                  {r.name}
                </Text>
                <Text style={{ color: palette.textSecondary, fontSize: 11 }}>
                  Behind the line · {r.liveOrders * 3} viewers
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Section>
    </View>
  );
}

function StoryCard({ story }: { story: FoodStory }) {
  const { palette, state, dispatch, navigate } = useFlavorWeb();
  const restaurant = RESTAURANTS_WEB.find((r) => r.id === story.restaurantId);
  const liked = !!state.storyLikes[story.id];
  const likeBoost = liked ? 1 : 0;

  return (
    <View
      style={[
        styles.storyCard,
        { borderColor: palette.border, backgroundColor: palette.surfaceElevated },
      ]}
    >
      <View style={styles.storyMedia}>
        <FoodImage
          url={restaurant?.coverUrl}
          emoji={story.videoEmoji}
          tint={restaurant?.imageTint ?? palette.primary}
          rounded={0}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          pointerEvents="none"
        />
        <View style={styles.storyOverlay}>
          <Avatar letter={story.user.charAt(0)} color={story.avatarColor} size={28} />
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{story.user}</Text>
        </View>
        <View style={styles.storyHours}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
            {story.hoursAgo}h
          </Text>
        </View>
      </View>
      <View style={{ padding: 10, gap: 6 }}>
        <Text style={{ color: palette.text, fontSize: 12 }} numberOfLines={2}>
          {story.caption}
        </Text>
        {restaurant ? (
          <Pressable
            onPress={() =>
              navigate({ name: 'restaurant', restaurantId: restaurant.id })
            }
          >
            <Text style={{ color: palette.primary, fontSize: 11, fontWeight: '800' }}>
              → {restaurant.name}
            </Text>
          </Pressable>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pressable onPress={() => dispatch({ type: 'TOGGLE_LIKE', storyId: story.id })}>
            <Text style={{ fontSize: 14 }}>{liked ? '♥' : '♡'}</Text>
          </Pressable>
          <Text style={{ color: palette.textSecondary, fontSize: 11 }}>
            {(story.likes + likeBoost).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

function FoodieRow({ foodie }: { foodie: Foodie }) {
  const { state, dispatch, palette, toast } = useFlavorWeb();
  const isFollowing = state.followingFoodies.includes(foodie.id);
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Avatar letter={foodie.name.charAt(0)} color={foodie.avatarColor} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.text, fontWeight: '800' }}>
            {foodie.name}{' '}
            {foodie.followingYou ? (
              <Text style={{ color: palette.primary, fontSize: 11 }}> · follows you</Text>
            ) : null}
          </Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12 }} numberOfLines={2}>
            {foodie.bio}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <Tag label={`${foodie.followers.toLocaleString()} followers`} color={palette.accent} />
            {foodie.cuisines.map((c) => (
              <Tag key={c} label={c} color={palette.primary} />
            ))}
          </View>
        </View>
        <PrimaryButton
          label={isFollowing ? '✓ Following' : '+ Follow'}
          onPress={() => {
            dispatch({ type: 'TOGGLE_FOLLOW', foodieId: foodie.id });
            toast({
              title: isFollowing ? `Unfollowed ${foodie.name}` : `Following ${foodie.name}`,
              body: isFollowing ? 'Their picks won\'t appear in your feed.' : 'Their picks will weave into your AI feed.',
              tone: 'info',
            });
          }}
        />
      </View>
    </Card>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const { state, dispatch, palette } = useFlavorWeb();
  const voted = state.pollVotes[poll.id];
  return (
    <Card>
      <Text style={{ color: palette.text, fontWeight: '900', fontSize: 15 }}>
        {poll.question}
      </Text>
      <View style={{ gap: 6, marginTop: 4 }}>
        {poll.options.map((opt, i) => {
          const pct = Math.round((opt.votes / Math.max(1, poll.totalVotes)) * 100);
          const myVote = voted === i;
          return (
            <Pressable
              key={i}
              onPress={() =>
                voted === undefined &&
                dispatch({ type: 'POLL_VOTE', pollId: poll.id, optionIdx: i })
              }
              style={({ pressed }) => [
                styles.pollRow,
                {
                  borderColor: myVote ? palette.primary : palette.border,
                  backgroundColor: pressed ? palette.surfaceHover : palette.surfaceElevated,
                  opacity: voted !== undefined && !myVote ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.pollFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: myVote ? palette.primarySoft : palette.overlay,
                  },
                ]}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                <Text style={{ color: palette.text, fontWeight: myVote ? '900' : '700' }}>
                  {opt.label}
                </Text>
                <Text style={{ color: palette.textSecondary, fontWeight: '700' }}>
                  {pct}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: palette.textTertiary, fontSize: 11, marginTop: 6 }}>
        {poll.totalVotes.toLocaleString()} votes
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  storyCard: {
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  storyMedia: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  storyOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  storyHours: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pollRow: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  pollFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  wishChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streamCard: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  streamThumb: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
