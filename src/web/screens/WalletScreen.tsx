import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, GhostButton, Pill, PrimaryButton, Section, Tag } from '../primitives';
import { useFlavorWeb } from '../state';

const TOPUPS = [200, 500, 1000];

export function WalletScreen() {
  const { state, dispatch, palette, toast } = useFlavorWeb();
  const [autoReload, setAutoReload] = useState(true);

  return (
    <View style={{ gap: 18 }}>
      <Section title="Wallet" subtitle="Top up once, breeze through checkout. Auto-reload optional.">
        <LinearGradient
          colors={[palette.primary, palette.primaryMuted]}
          style={[styles.walletCard, { borderColor: palette.border }]}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            FlavorFlow Wallet
          </Text>
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900' }}>
            ₹{state.walletINR}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Tag label="Instant refunds" color="#fff" />
            <Tag label="UPI / Card / Net banking" color="#fff" />
            <Tag label="0% fees" color="#fff" />
          </View>
        </LinearGradient>

        <Card>
          <Text style={{ color: palette.text, fontWeight: '800' }}>Quick top-up</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {TOPUPS.map((amt) => (
              <PrimaryButton
                key={amt}
                label={`Add ₹${amt}`}
                icon="+"
                onPress={() => {
                  dispatch({ type: 'WALLET_ADJUST', amount: amt, label: `Top-up · ${amt}` });
                  toast({
                    title: `Wallet topped up · ₹${amt}`,
                    body: 'Demo flow — production runs Razorpay sandbox.',
                    tone: 'success',
                  });
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Pressable
              onPress={() => setAutoReload((v) => !v)}
              style={[
                styles.toggleTrack,
                { backgroundColor: autoReload ? palette.primary : palette.border },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: autoReload ? 18 : 0 }] },
                ]}
              />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '800' }}>Auto-reload</Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                When balance drops below ₹100, top up ₹500 from your default UPI ID.
              </Text>
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Pro subscription">
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={[styles.proBadge, { backgroundColor: palette.accent }]}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>★</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '900', fontSize: 16 }}>
                FlavorFlow Pro
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                ₹99 / month · unlimited free delivery, priority lane, exclusive drops
              </Text>
            </View>
            {state.subscription === 'pro_monthly' ? (
              <Tag label="Active" color={palette.success} />
            ) : null}
          </View>
          <View style={{ gap: 4, marginTop: 6 }}>
            {[
              'Unlimited free delivery on every order',
              'Priority dispatcher (faster ETA)',
              'Exclusive drops with chefs you follow',
              'Higher refund cap for order insurance',
            ].map((perk) => (
              <Text key={perk} style={{ color: palette.text, fontSize: 13 }}>
                ✓ {perk}
              </Text>
            ))}
          </View>
          {state.subscription === 'pro_monthly' ? (
            <GhostButton
              label="Cancel anytime"
              onPress={() => {
                dispatch({ type: 'SUBSCRIBE', plan: 'none' });
                toast({ title: 'Pro paused', body: 'You keep perks until next billing date.' });
              }}
            />
          ) : (
            <PrimaryButton
              label="Start ₹99/mo"
              icon="🚀"
              onPress={() => {
                dispatch({ type: 'SUBSCRIBE', plan: 'pro_monthly' });
                toast({
                  title: 'Welcome to Pro',
                  body: 'All deliveries free for the next 30 days.',
                  tone: 'success',
                });
              }}
            />
          )}
        </Card>
      </Section>

      <Section title="Recent transactions">
        <View style={{ gap: 8 }}>
          {state.walletTxns.slice(0, 8).map((t) => (
            <Card key={t.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor:
                      t.type === 'credit' ? palette.success + '33' : palette.danger + '33',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: t.type === 'credit' ? palette.success : palette.danger,
                      fontWeight: '900',
                    }}
                  >
                    {t.type === 'credit' ? '↓' : '↑'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontWeight: '700' }}>{t.label}</Text>
                  <Text style={{ color: palette.textTertiary, fontSize: 11 }}>
                    {new Date(t.ts).toLocaleString()}
                  </Text>
                </View>
                <Text
                  style={{
                    color: t.type === 'credit' ? palette.success : palette.danger,
                    fontWeight: '900',
                  }}
                >
                  {t.amountINR > 0 ? '+' : ''}₹{t.amountINR}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      </Section>

      <Section title="Payment methods">
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {[
            'UPI · you@axis',
            'HDFC Credit · ••42',
            'PayLater (BNPL)',
            'Net banking',
          ].map((m) => (
            <Pill key={m} label={m} />
          ))}
          <Pill
            label="+ Add new"
            onPress={() =>
              toast({
                title: 'Demo only',
                body: 'Hook Stripe / Razorpay tokenization here in production.',
              })
            }
          />
        </View>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    padding: 22,
    borderRadius: 22,
    gap: 8,
    borderWidth: 1,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  proBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
