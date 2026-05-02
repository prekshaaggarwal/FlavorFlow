import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RESTAURANTS_WEB } from '../data';
import { Card, GhostButton, Pill, PrimaryButton, Section, Tag } from '../primitives';
import { SavedAddressesSection } from './SavedAddressesSection';
import { formatAddress, resolveSelectedAddress, useFlavorWeb } from '../state';

const PAYMENT_OPTIONS = [
  { id: 'wallet', label: 'FlavorFlow Wallet', icon: '👛' },
  { id: 'upi', label: 'UPI', icon: '🪙' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'bnpl', label: 'Pay later (BNPL)', icon: '⏳' },
];

const TIP_OPTIONS = [0, 20, 30, 50];

const SPLIT_OPTIONS: { id: 'none' | 'equal' | 'item'; label: string }[] = [
  { id: 'none', label: 'No split' },
  { id: 'equal', label: 'Split equally' },
  { id: 'item', label: 'Split per item' },
];

export function CheckoutScreen() {
  const { state, dispatch, navigate, palette, toast } = useFlavorWeb();
  const [payment, setPayment] = useState<string>('wallet');
  const [tip, setTip] = useState(20);
  const [split, setSplit] = useState<'none' | 'equal' | 'item'>('none');
  const [splitFriends, setSplitFriends] = useState(2);
  const [contactless, setContactless] = useState(true);
  const [insurance, setInsurance] = useState(true);
  const [success, setSuccess] = useState(false);

  const subtotal = state.cart.reduce(
    (n, l) => n + l.item.priceINR * l.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = state.subscription === 'pro_monthly' || subtotal >= 399 ? 0 : 39;
  const insuranceFee = insurance ? Math.max(9, Math.round(subtotal * 0.01)) : 0;
  const total = subtotal + tax + deliveryFee + tip + insuranceFee;

  const splitPerHead = split === 'none' ? total : Math.ceil(total / Math.max(1, splitFriends + 1));

  const restaurantId = state.cart[0]?.restaurantId;
  const restaurant = restaurantId
    ? RESTAURANTS_WEB.find((r) => r.id === restaurantId)
    : null;

  const place = () => {
    if (!restaurant) return;
    const delivery = resolveSelectedAddress(state.addresses, state.selectedAddressId);
    if (!delivery) {
      toast({
        title: 'Add a delivery address',
        body: 'Open Profile → Saved addresses and add where we should deliver.',
        tone: 'warning',
      });
      return;
    }
    if (payment === 'wallet' && state.walletINR < total) {
      toast({
        title: 'Wallet too low',
        body: `Need ₹${total - state.walletINR} more. Top up or pick UPI.`,
        tone: 'warning',
      });
      return;
    }
    setSuccess(true);
    if (payment === 'wallet') {
      dispatch({ type: 'WALLET_ADJUST', amount: -total, label: `Order · ${restaurant.name}` });
    }
    dispatch({ type: 'XP', delta: Math.round(total / 10) });
    const order = {
      id: `FFL-${Date.now().toString().slice(-5)}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      totalINR: total,
      itemSummary: state.cart
        .map((l) => `${l.quantity}× ${l.item.name}`)
        .join(', '),
      phase: 'placed' as const,
      etaMinutes: parseInt(restaurant.etaMins, 10) || 28,
      riderName: 'Vikram R.',
      riderRating: 4.9,
      riderProgress: 0.05,
      address: formatAddress(delivery),
      instructions: 'Leave at door, call when nearby',
      contactless,
      groupOrder: split !== 'none',
      insurance,
      paymentLabel: PAYMENT_OPTIONS.find((p) => p.id === payment)?.label ?? 'UPI',
      photoProofEmoji: '📦',
    };
    dispatch({ type: 'PLACE_ORDER', order });
    dispatch({ type: 'CART_CLEAR' });
    toast({
      title: 'Order placed 🎉',
      body: `${restaurant.name} acknowledged. Tracking now.`,
      emoji: '🎉',
      tone: 'success',
    });
    setTimeout(() => navigate({ name: 'tracking' }), 1500);
  };

  if (state.cart.length === 0 && !success) {
    return (
      <Card>
        <Text style={{ color: palette.text, fontWeight: '800' }}>
          Cart is empty — head back to add items.
        </Text>
        <PrimaryButton
          label="Browse home"
          onPress={() => navigate({ name: 'home' })}
          icon="🏠"
        />
      </Card>
    );
  }

  if (success) {
    return <Confetti title={`Order placed for ₹${total}`} subtitle="Heading to live tracking…" />;
  }

  return (
    <View style={{ gap: 18 }}>
      <SavedAddressesSection variant="pick" />

      <Section title="Payment method">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PAYMENT_OPTIONS.map((p) => (
            <Pill
              key={p.id}
              label={p.label}
              emoji={p.icon}
              active={payment === p.id}
              onPress={() => setPayment(p.id)}
            />
          ))}
        </View>
        {payment === 'wallet' ? (
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
            Wallet balance ₹{state.walletINR}{' '}
            {state.walletINR < total ? `(need ₹${total - state.walletINR} more)` : ''}
          </Text>
        ) : null}
        {payment === 'bnpl' ? (
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
            Auto-debited on payday with 0% interest. Eligibility based on order history.
          </Text>
        ) : null}
      </Section>

      <Section title="Tip your courier">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {TIP_OPTIONS.map((t) => (
            <Pill
              key={t}
              label={t === 0 ? 'No tip' : `₹${t}`}
              active={tip === t}
              onPress={() => setTip(t)}
            />
          ))}
        </View>
      </Section>

      <Section title="Split bill">
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {SPLIT_OPTIONS.map((opt) => (
            <Pill
              key={opt.id}
              label={opt.label}
              active={split === opt.id}
              onPress={() => setSplit(opt.id)}
            />
          ))}
        </View>
        {split !== 'none' ? (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6 }}>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>Friends</Text>
            <Pressable
              onPress={() => setSplitFriends((f) => Math.max(1, f - 1))}
              style={[styles.qtyBtn, { borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontWeight: '900' }}>–</Text>
            </Pressable>
            <Text style={{ color: palette.text, fontWeight: '800' }}>{splitFriends}</Text>
            <Pressable
              onPress={() => setSplitFriends((f) => f + 1)}
              style={[styles.qtyBtn, { borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontWeight: '900' }}>+</Text>
            </Pressable>
            <Tag label={`Each pays ₹${splitPerHead}`} color={palette.success} />
          </View>
        ) : null}
      </Section>

      <Section title="Trust & delivery">
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Toggle
              value={contactless}
              onValueChange={setContactless}
              palette={palette}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '800' }}>Contactless drop-off</Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                Courier leaves package and snaps a photo. No buzzer.
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Toggle
              value={insurance}
              onValueChange={setInsurance}
              palette={palette}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '800' }}>Order insurance · ₹{insuranceFee}</Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                Instant refund if quality dips, packaging fails, or ETA misses by 20+ min.
              </Text>
            </View>
          </View>
        </Card>
      </Section>

      <Card>
        <View style={{ gap: 4 }}>
          <Row label="Subtotal" value={`₹${subtotal}`} palette={palette} />
          <Row label="Taxes" value={`₹${tax}`} palette={palette} />
          <Row label="Delivery" value={deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`} palette={palette} />
          {tip ? <Row label="Tip" value={`₹${tip}`} palette={palette} /> : null}
          {insurance ? <Row label="Insurance" value={`₹${insuranceFee}`} palette={palette} /> : null}
          <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 6 }} />
          <Row label="Total" value={`₹${total}`} big palette={palette} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GhostButton label="Back to cart" onPress={() => navigate({ name: 'cart' })} icon="←" />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={`Place order ₹${total}`} onPress={place} full icon="✓" />
          </View>
        </View>
      </Card>
    </View>
  );
}

function Row({
  label,
  value,
  big,
  palette,
}: {
  label: string;
  value: string;
  big?: boolean;
  palette: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: big ? palette.text : palette.textSecondary, fontWeight: big ? '800' : '600', fontSize: big ? 16 : 13 }}>
        {label}
      </Text>
      <Text style={{ color: big ? palette.primary : palette.text, fontWeight: '800', fontSize: big ? 22 : 14 }}>
        {value}
      </Text>
    </View>
  );
}

function Toggle({
  value,
  onValueChange,
  palette,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  palette: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[
        styles.toggleTrack,
        { backgroundColor: value ? palette.primary : palette.border },
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          {
            transform: [{ translateX: value ? 18 : 0 }],
            backgroundColor: '#fff',
          },
        ]}
      />
    </Pressable>
  );
}

function Confetti({ title, subtitle }: { title: string; subtitle: string }) {
  const { palette } = useFlavorWeb();
  const dots = useMemo(
    () => Array.from({ length: 28 }).map((_, i) => ({ id: i, x: Math.random(), c: ['#FF8A3D', '#A855F7', '#22C55E', '#0EA5E9', '#F472B6'][i % 5], rotate: (Math.random() - 0.5) * 720 })),
    []
  );
  const refs = useRef<Animated.Value[]>(dots.map(() => new Animated.Value(0)));

  useEffect(() => {
    refs.current.forEach((v, i) => {
      Animated.timing(v, {
        toValue: 1,
        duration: 1400 + i * 30,
        delay: i * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
      <View style={styles.confettiZone} pointerEvents="none">
        {dots.map((d, i) => {
          const v = refs.current[i];
          const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-80, 240] });
          const opacity = v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
          const rotate = v.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${d.rotate}deg`],
          });
          return (
            <Animated.View
              key={d.id}
              style={[
                styles.confettiDot,
                {
                  left: `${d.x * 100}%`,
                  backgroundColor: d.c,
                  transform: [{ translateY }, { rotate }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      <LinearGradient
        colors={[palette.primarySoft, palette.surfaceElevated]}
        style={[styles.successCard, { borderColor: palette.border }]}
      >
        <Text style={{ fontSize: 56 }}>🎉</Text>
        <Text style={{ color: palette.text, fontSize: 22, fontWeight: '900' }}>{title}</Text>
        <Text style={{ color: palette.textSecondary, fontSize: 13 }}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  successCard: {
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    width: '100%',
    maxWidth: 360,
  },
  confettiZone: {
    height: 240,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    position: 'relative',
  },
  confettiDot: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 14,
    borderRadius: 2,
  },
});
