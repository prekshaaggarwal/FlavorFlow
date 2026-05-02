import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar, Card, GhostButton, Pill, PrimaryButton, Section, Tag } from '../primitives';
import { useFlavorWeb } from '../state';

const PHASES = [
  { id: 'placed', label: 'Placed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'delivered', label: 'Delivered' },
] as const;

export function TrackingScreen() {
  const { state, dispatch, palette, navigate, newChatMessage, toast } = useFlavorWeb();
  const order =
    state.orders.find((o) => o.id === state.activeOrderId) ?? state.orders[0];
  const [chatDraft, setChatDraft] = useState('');
  const [calling, setCalling] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  if (!order) {
    return (
      <Card>
        <Text style={{ color: palette.text, fontWeight: '900', fontSize: 20 }}>
          No active orders
        </Text>
        <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
          Place an order from any restaurant and tracking lights up here.
        </Text>
        <PrimaryButton
          label="Browse home"
          onPress={() => navigate({ name: 'home' })}
          icon="🏠"
        />
      </Card>
    );
  }

  const phaseIdx = PHASES.findIndex((p) => p.id === order.phase);

  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;
    setChatDraft('');
    newChatMessage('rider', 'user', text);
    setTimeout(() => {
      const reply =
        text.toLowerCase().includes('eta') || text.toLowerCase().includes('how long')
          ? `${order.etaMinutes} min, traffic is light. Almost there.`
          : text.toLowerCase().includes('door')
          ? 'Got it — leaving at door, no buzzer.'
          : text.toLowerCase().includes('thanks') || text.toLowerCase().includes('thank')
          ? "Anytime! Enjoy 🙌"
          : 'Copy that, on it.';
      newChatMessage('rider', 'rider', reply);
    }, 1200);
  };

  const startMaskedCall = () => {
    setCalling(true);
    toast({
      title: 'Connecting via masked number',
      body: '(This demo runs the bridge locally; production routes via Twilio/Plivo.)',
      tone: 'info',
    });
    setTimeout(() => setCalling(false), 2400);
  };

  return (
    <View style={{ gap: 18 }}>
      <Section title="Live tracking" subtitle="Updates stream every few seconds, mirroring the native Socket.IO build.">
        <LinearGradient
          colors={[palette.primarySoft, palette.surfaceElevated]}
          style={[styles.heroCard, { borderColor: palette.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: palette.primary, fontWeight: '900', fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Order {order.id}
              </Text>
              <Text style={{ color: palette.text, fontSize: 22, fontWeight: '900' }}>
                {order.restaurantName}
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                {order.itemSummary}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: palette.primary, fontWeight: '900', fontSize: 36 }}>
                {order.etaMinutes}
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 11 }}>min ETA</Text>
            </View>
          </View>

          <PhaseTimeline phaseIdx={phaseIdx} palette={palette} />
          <CourierLane progress={order.riderProgress} palette={palette} phase={order.phase} />
        </LinearGradient>
      </Section>

      <Section title="Your courier">
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar letter={order.riderName.charAt(0)} color={palette.accent} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '900' }}>{order.riderName}</Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                ★ {order.riderRating} · 1,420 deliveries · masked number
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <Tag label="ID verified" color={palette.success} />
                <Tag label="Helmet on" color={palette.success} />
                {order.contactless ? <Tag label="Contactless" color={palette.accent} /> : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <PrimaryButton
                label={calling ? 'Connecting…' : 'Call'}
                icon="📞"
                onPress={startMaskedCall}
                loading={calling}
              />
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Chat with courier">
        <Card>
          <View style={{ gap: 6, maxHeight: 260 }}>
            {state.riderChat.length === 0 ? (
              <Text style={{ color: palette.textTertiary, fontSize: 12 }}>
                No messages yet — say hi 👋
              </Text>
            ) : null}
            {state.riderChat.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  {
                    alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor:
                      m.from === 'user' ? palette.primary : palette.surfaceHover,
                  },
                ]}
              >
                <Text style={{ color: m.from === 'user' ? '#fff' : palette.text, fontSize: 13 }}>
                  {m.text}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TextInput
              value={chatDraft}
              onChangeText={setChatDraft}
              placeholder="Message courier (auto-translated)"
              placeholderTextColor={palette.textTertiary}
              onSubmitEditing={sendChat}
              style={[
                styles.input,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.surface },
              ]}
            />
            <PrimaryButton label="Send" onPress={sendChat} icon="↗︎" />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {['Where are you?', 'Door is open', 'Leave at gate', 'Bring change please'].map((s) => (
              <Pill
                key={s}
                label={s}
                onPress={() => {
                  newChatMessage('rider', 'user', s);
                  setTimeout(() => newChatMessage('rider', 'rider', 'Copy.'), 800);
                }}
              />
            ))}
          </View>
        </Card>
      </Section>

      <Section title="Drop-off proof">
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                backgroundColor: palette.surfaceHover,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 28 }}>{photoOpen ? '🖼️' : order.photoProofEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '800' }}>
                {photoOpen ? 'Drop-off photo received' : 'Photo posts on delivery'}
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                Sealed-pack verification + courier hand-off snap.
              </Text>
            </View>
            <GhostButton
              label={photoOpen ? 'Hide' : 'Preview'}
              onPress={() => setPhotoOpen((o) => !o)}
              icon="📷"
            />
          </View>
        </Card>
      </Section>

      <Section title="Care options">
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <GhostButton
            label="Order insurance"
            onPress={() =>
              toast({
                title: order.insurance ? 'Insurance active' : 'Insurance not enabled',
                body: order.insurance
                  ? 'Refund triggers automatically if anything goes sideways.'
                  : 'Enable on your next order at checkout.',
                tone: order.insurance ? 'success' : 'warning',
              })
            }
            icon="🛡️"
          />
          <GhostButton
            label="Issue with the order"
            onPress={() => navigate({ name: 'support' })}
            icon="💬"
          />
          <GhostButton
            label="Reorder this"
            onPress={() => {
              dispatch({ type: 'CART_CLEAR' });
              navigate({ name: 'restaurant', restaurantId: order.restaurantId });
              toast({
                title: 'Reorder ready',
                body: 'Same kitchen — pick the same plates fast.',
                tone: 'info',
              });
            }}
            icon="🔁"
          />
        </View>
      </Section>
    </View>
  );
}

function PhaseTimeline({
  phaseIdx,
  palette,
}: {
  phaseIdx: number;
  palette: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  return (
    <View style={{ gap: 6, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {PHASES.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.phaseSeg,
              {
                backgroundColor: i <= phaseIdx ? palette.primary : palette.border,
              },
            ]}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {PHASES.map((p, i) => (
          <Text
            key={p.id}
            style={{
              flex: 1,
              fontSize: 10,
              textAlign: 'center',
              color: i <= phaseIdx ? palette.text : palette.textTertiary,
              fontWeight: i <= phaseIdx ? '800' : '500',
            }}
          >
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function CourierLane({
  progress,
  palette,
  phase,
}: {
  progress: number;
  palette: ReturnType<typeof useFlavorWeb>['palette'];
  phase: string;
}) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const left = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '90%'],
  });

  return (
    <View style={[styles.lane, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={{ position: 'absolute', left: 12, top: 12, gap: 2 }}>
        <Text style={{ fontSize: 22 }}>🍳</Text>
        <Text style={{ color: palette.textTertiary, fontSize: 10 }}>kitchen</Text>
      </View>
      <View style={{ position: 'absolute', right: 12, top: 12, gap: 2, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 22 }}>🏠</Text>
        <Text style={{ color: palette.textTertiary, fontSize: 10 }}>you</Text>
      </View>
      <Animated.View
        style={[
          styles.courier,
          {
            left,
            backgroundColor: palette.primary,
          },
        ]}
      >
        <Text style={{ fontSize: 18 }}>🛵</Text>
      </Animated.View>
      <View style={[styles.laneFloor, { backgroundColor: palette.border }]} />
      <Text
        style={{
          position: 'absolute',
          bottom: 8,
          alignSelf: 'center',
          color: palette.textSecondary,
          fontSize: 11,
        }}
      >
        {phase === 'delivered'
          ? 'Delivered ✓'
          : `Approx ${(progress * 100).toFixed(0)}% there`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 18, borderRadius: 22, gap: 8, borderWidth: 1 },
  phaseSeg: { flex: 1, height: 6, borderRadius: 3 },
  lane: {
    height: 130,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 14,
    position: 'relative',
  },
  laneFloor: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 36,
    height: 2,
  },
  courier: {
    position: 'absolute',
    bottom: 30,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: '85%',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
});
