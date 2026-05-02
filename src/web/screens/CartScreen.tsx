import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { RESTAURANTS_WEB } from '../data';
import { Card, FoodImage, GhostButton, Pill, PrimaryButton, Section, Tag } from '../primitives';
import { useFlavorWeb } from '../state';

const SCHEDULE_PRESETS = ['ASAP', 'In 30 min', 'In 1 hour', 'Tonight 8pm', 'Tomorrow noon'];

export function CartScreen() {
  const { state, dispatch, navigate, palette, toast } = useFlavorWeb();
  const [schedule, setSchedule] = useState<string>('ASAP');
  const [notes, setNotes] = useState('');
  const [groupCode, setGroupCode] = useState<string | null>(null);

  const subtotal = state.cart.reduce(
    (n, l) => n + l.item.priceINR * l.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = state.subscription === 'pro_monthly' || subtotal >= 399 ? 0 : 39;
  const total = subtotal + tax + deliveryFee;

  const restaurantId = state.cart[0]?.restaurantId;
  const restaurant = restaurantId
    ? RESTAURANTS_WEB.find((r) => r.id === restaurantId)
    : null;

  const suggestions = useMemo(() => {
    if (!restaurant) return [];
    const cartIds = new Set(state.cart.map((l) => l.item.id));
    return restaurant.menu.filter((m) => !cartIds.has(m.id)).slice(0, 3);
  }, [restaurant, state.cart]);

  const startGroupOrder = () => {
    const code = `FLOW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setGroupCode(code);
    toast({
      title: 'Group order link ready',
      body: `Share code ${code} — friends join, add items, you settle the bill.`,
      emoji: '🔗',
      tone: 'info',
    });
  };

  const dietaryWarnings = useMemo(() => {
    const violations: string[] = [];
    for (const line of state.cart) {
      const allergens = line.item.allergens ?? [];
      const matches = allergens.filter((a) => state.allergens.includes(a));
      if (matches.length) {
        violations.push(
          `${line.item.name} contains ${matches.join(', ')} — flagged in your allergen list.`
        );
      }
    }
    return violations;
  }, [state.cart, state.allergens]);

  if (state.cart.length === 0) {
    return (
      <View style={{ gap: 14, alignSelf: 'center', maxWidth: 480, width: '100%' }}>
        <Card>
          <Text style={{ color: palette.text, fontWeight: '900', fontSize: 22 }}>
            Your cart is empty
          </Text>
          <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
            Pick a restaurant from Home or swipe to discover.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton
              label="Browse home"
              icon="🏠"
              onPress={() => navigate({ name: 'home' })}
            />
            <GhostButton
              label="Swipe deck"
              icon="🃏"
              onPress={() => navigate({ name: 'discover' })}
            />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ gap: 18 }}>
      <Section title={`From ${restaurant?.name ?? 'kitchen'}`}>
        <View style={{ gap: 10 }}>
          {state.cart.map((line) => (
            <Card key={line.uid}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <FoodImage
                  url={line.item.imageUrl}
                  emoji={line.item.emoji}
                  tint={
                    RESTAURANTS_WEB.find((r) => r.id === line.restaurantId)?.imageTint ??
                    palette.primary
                  }
                  style={{ width: 64, height: 64 }}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderWidth: 2,
                        borderColor: line.item.veg ? palette.veg : palette.nonVeg,
                        borderRadius: 2,
                      }}
                    />
                    <Text style={{ color: palette.text, fontWeight: '800' }}>
                      {line.item.name}
                    </Text>
                  </View>
                  <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                    ₹{line.item.priceINR} · {line.spice ?? 'medium'}
                  </Text>
                  {line.customizations &&
                  Object.keys(line.customizations).length > 0 ? (
                    <Text style={{ color: palette.textTertiary, fontSize: 11 }}>
                      {Object.entries(line.customizations)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={() =>
                        dispatch({ type: 'CART_QTY', uid: line.uid, delta: -1 })
                      }
                      style={[styles.qtyBtn, { borderColor: palette.border }]}
                    >
                      <Text style={{ color: palette.text, fontWeight: '900' }}>–</Text>
                    </Pressable>
                    <Text style={{ color: palette.text, fontWeight: '800', minWidth: 18, textAlign: 'center' }}>
                      {line.quantity}
                    </Text>
                    <Pressable
                      onPress={() =>
                        dispatch({ type: 'CART_QTY', uid: line.uid, delta: +1 })
                      }
                      style={[styles.qtyBtn, { borderColor: palette.border }]}
                    >
                      <Text style={{ color: palette.text, fontWeight: '900' }}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() =>
                      dispatch({ type: 'CART_REMOVE', uid: line.uid })
                    }
                  >
                    <Text style={{ color: palette.danger, fontSize: 11, fontWeight: '700' }}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </Section>

      {dietaryWarnings.length ? (
        <Card style={{ borderColor: palette.warning, backgroundColor: palette.warning + '14' }}>
          <Text style={{ color: palette.warning, fontWeight: '900' }}>
            Allergen heads-up
          </Text>
          {dietaryWarnings.map((w, i) => (
            <Text key={i} style={{ color: palette.text, fontSize: 12 }}>
              {w}
            </Text>
          ))}
        </Card>
      ) : null}

      {suggestions.length ? (
        <Section title="Smart suggestions" subtitle="78% of diners pair these with what's already in your cart.">
          <View style={{ gap: 10 }}>
            {suggestions.map((s) => (
              <Card key={s.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <FoodImage
                    url={s.imageUrl}
                    emoji={s.emoji}
                    tint={restaurant?.imageTint ?? palette.primary}
                    style={{ width: 56, height: 56 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontWeight: '800' }}>{s.name}</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12 }} numberOfLines={2}>
                      ₹{s.priceINR} · {s.description}
                    </Text>
                  </View>
                  <PrimaryButton
                    label="+ add"
                    onPress={() =>
                      dispatch({
                        type: 'CART_ADD',
                        line: {
                          uid: `${s.id}-${Date.now()}`,
                          restaurantId: restaurant!.id,
                          item: s,
                          quantity: 1,
                        },
                      })
                    }
                  />
                </View>
              </Card>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Schedule">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {SCHEDULE_PRESETS.map((s) => (
            <Pill
              key={s}
              label={s}
              active={schedule === s}
              onPress={() => setSchedule(s)}
            />
          ))}
        </View>
      </Section>

      <Section title="Group order">
        {groupCode ? (
          <Card>
            <Text style={{ color: palette.text, fontWeight: '900' }}>
              Code: {groupCode}
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              Friends join with this code. Their items show up live in your cart, and we
              auto-split the bill at checkout.
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Tag label="3 friends invited" color={palette.accent} />
              <Tag label="Auto-split: equal" color={palette.success} />
              <Tag label="Lock at ₹1,500" color={palette.warning} />
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={{ color: palette.text, fontWeight: '800' }}>
              Splitting with friends?
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              Generate a join link, set a budget cap, and we settle the bill at checkout.
            </Text>
            <PrimaryButton label="Start group order" icon="🔗" onPress={startGroupOrder} />
          </Card>
        )}
      </Section>

      <Section title="Delivery instructions">
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['Leave at door', 'Call when nearby', 'Avoid doorbell', 'Office reception'].map((tag) => (
              <Pill
                key={tag}
                label={tag}
                onPress={() => setNotes((n) => (n ? `${n}, ${tag}` : tag))}
              />
            ))}
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything specific the courier should know?"
            placeholderTextColor={palette.textTertiary}
            multiline
            style={{
              minHeight: 56,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.border,
              color: palette.text,
              backgroundColor: palette.surface,
            }}
          />
        </Card>
      </Section>

      <Card>
        <View style={{ gap: 4 }}>
          <Row label="Subtotal" value={`₹${subtotal}`} colors={palette} />
          <Row label="Taxes (5%)" value={`₹${tax}`} colors={palette} />
          <Row
            label="Delivery"
            value={deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
            sub={
              deliveryFee === 0 && state.subscription === 'pro_monthly'
                ? 'Pro subscription'
                : deliveryFee === 0
                ? 'Subtotal ≥ ₹399'
                : undefined
            }
            colors={palette}
          />
          <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 6 }} />
          <Row
            label="Total"
            value={`₹${total}`}
            big
            colors={palette}
          />
        </View>
        <PrimaryButton
          label={`Checkout ₹${total}`}
          onPress={() => navigate({ name: 'checkout' })}
          icon="→"
          full
        />
      </Card>
    </View>
  );
}

function Row({
  label,
  value,
  sub,
  big,
  colors,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
  colors: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View>
        <Text style={{ color: big ? colors.text : colors.textSecondary, fontWeight: big ? '800' : '600', fontSize: big ? 16 : 13 }}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ color: colors.textTertiary, fontSize: 11 }}>{sub}</Text>
        ) : null}
      </View>
      <Text style={{ color: big ? colors.primary : colors.text, fontWeight: '800', fontSize: big ? 22 : 14 }}>
        {value}
      </Text>
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
});
