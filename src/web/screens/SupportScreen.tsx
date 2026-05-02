import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, GhostButton, Pill, PrimaryButton, Section, Tag } from '../primitives';
import { useFlavorWeb } from '../state';

const QUICK_QUERIES: { id: string; label: string; reply: string }[] = [
  {
    id: 'cold',
    label: 'Food arrived cold',
    reply: "Got it. We'll instant-refund 30% to your wallet and notify the kitchen. Want to escalate to a human?",
  },
  {
    id: 'missing',
    label: 'Missing item',
    reply: "Sorry about that — we'll refund the missing item now. Photo proof helps us tighten the kitchen process.",
  },
  {
    id: 'late',
    label: 'Order is late',
    reply: "Pulled the live tracker — your courier is 3 stops away. ETA refresh sent to your phone. Want a free delivery credit?",
  },
  {
    id: 'allergen',
    label: 'Allergen concern',
    reply: 'Allergen labels are bold on each dish. I can flag your account and warn you if any restaurant uses suspect ingredients.',
  },
  {
    id: 'refund',
    label: 'I want a full refund',
    reply: 'Order insurance is active on your last order. Tap "Trigger insurance refund" below — wallet gets credited in 30s.',
  },
  {
    id: 'address',
    label: 'Wrong address',
    reply: "If the courier hasn't left yet, I can swap it. Otherwise we'll do a partial refund + reorder.",
  },
];

export function SupportScreen() {
  const { state, palette, navigate, toast, newChatMessage, dispatch } = useFlavorWeb();
  const [draft, setDraft] = useState('');

  const reply = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('refund') || lower.includes('money back')) {
      return "Order insurance covers this. Tap 'Trigger insurance refund' on the order detail page or below — wallet credit in 30s.";
    }
    if (lower.includes('cold') || lower.includes('not hot')) return QUICK_QUERIES[0].reply;
    if (lower.includes('missing')) return QUICK_QUERIES[1].reply;
    if (lower.includes('late') || lower.includes('eta')) return QUICK_QUERIES[2].reply;
    if (lower.includes('allergen') || lower.includes('allergic')) return QUICK_QUERIES[3].reply;
    if (lower.includes('address')) return QUICK_QUERIES[5].reply;
    if (lower.includes('human') || lower.includes('agent') || lower.includes('person')) {
      return 'Connecting you to Priya · senior support. Average wait 90 seconds. Stay here, I will brief them.';
    }
    if (lower.includes('hi') || lower.includes('hello')) {
      return "Hey! What's tripping you up — order issue, allergen, refund, or something else?";
    }
    return "Sorry, I'm new — try one of the quick options below or type 'human' to escalate.";
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    newChatMessage('support', 'user', text);
    setDraft('');
    setTimeout(() => newChatMessage('support', 'bot', reply(text)), 700);
  };

  const refund = () => {
    const lastOrder = state.orders[0];
    const amount = lastOrder?.totalINR ?? 200;
    dispatch({
      type: 'WALLET_ADJUST',
      amount,
      label: `Insurance refund · ${lastOrder?.id ?? 'demo'}`,
    });
    toast({
      title: `₹${amount} refund issued`,
      body: 'Wallet credited instantly. We notified the restaurant.',
      tone: 'success',
    });
    newChatMessage('support', 'bot', `Done — ₹${amount} sent to your wallet. Anything else?`);
  };

  return (
    <View style={{ gap: 18 }}>
      <Section title="Support" subtitle="FlavorBot answers most questions in seconds. Escalate to a human anytime.">
        <Card>
          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ gap: 6, paddingBottom: 4 }}
          >
            {state.supportChat.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  {
                    alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor:
                      m.from === 'user' ? palette.primary : palette.surfaceHover,
                    maxWidth: '92%',
                  },
                ]}
              >
                <Text style={{ color: m.from === 'user' ? '#fff' : palette.text, fontSize: 13 }}>
                  {m.text}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_QUERIES.map((q) => (
              <Pill key={q.id} label={q.label} onPress={() => send(q.label)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Tell us what happened…"
              placeholderTextColor={palette.textTertiary}
              onSubmitEditing={() => send(draft)}
              style={[
                styles.input,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.surface },
              ]}
            />
            <PrimaryButton label="Send" icon="↗︎" onPress={() => send(draft)} />
          </View>
        </Card>
      </Section>

      <Section title="Order insurance refund">
        {state.orders[0] ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 28 }}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.text, fontWeight: '900' }}>
                  Order {state.orders[0].id} · ₹{state.orders[0].totalINR}
                </Text>
                <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                  Insurance is {state.orders[0].insurance ? 'active' : 'not enabled'}.
                </Text>
              </View>
              <Tag
                label={state.orders[0].insurance ? 'Eligible' : 'Skipped'}
                color={state.orders[0].insurance ? palette.success : palette.warning}
              />
            </View>
            {state.orders[0].insurance ? (
              <PrimaryButton
                label="Trigger insurance refund"
                icon="⚡"
                onPress={refund}
              />
            ) : null}
          </Card>
        ) : (
          <Card>
            <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
              No recent orders to insure. Place one and add insurance at checkout.
            </Text>
          </Card>
        )}
      </Section>

      <Section title="Help center">
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {[
            'Allergen labelling',
            'Refund timelines',
            'Group order rules',
            'Cancellation policy',
            'Pro subscription FAQ',
          ].map((q) => (
            <Pill key={q} label={q} onPress={() => send(q)} />
          ))}
        </View>
      </Section>

      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
        <GhostButton label="Back home" icon="🏠" onPress={() => navigate({ name: 'home' })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
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
