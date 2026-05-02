import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type Allergen,
  type DietaryTag,
  RESTAURANTS_WEB,
} from '../data';
import { palettes, type ThemeName, themeLabels } from '../theme';
import { Avatar, Card, GhostButton, Pill, Section, Tag } from '../primitives';
import { SavedAddressesSection } from './SavedAddressesSection';
import { formatAddress, formatAuthContactSubtitle, resolveSelectedAddress, useFlavorWeb } from '../state';

const DIETARY: { id: DietaryTag; label: string }[] = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'keto', label: 'Keto' },
  { id: 'low-carb', label: 'Low-carb' },
  { id: 'high-protein', label: 'High protein' },
  { id: 'gluten-free', label: 'Gluten-free' },
];

const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'nuts', label: 'Nuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'shellfish', label: 'Shellfish' },
];

const CALORIE_CAPS = [null, 400, 600, 800];

export function ProfileScreen() {
  const { state, dispatch, palette, navigate, toast } = useFlavorWeb();

  const cuisinesOrdered = ['Italian', 'Hyderabadi', 'Japanese', 'Brunch'];
  const weeklyOrders = 5;
  const weeklySpend = 1280;
  const defaultAddrSummary = resolveSelectedAddress(state.addresses, null);

  return (
    <View style={{ gap: 18 }}>
      <Section title="Profile">
        <LinearGradient
          colors={[palette.primarySoft, palette.surfaceElevated]}
          style={[styles.profileCard, { borderColor: palette.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar letter={state.name.charAt(0)} color={palette.accent} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontSize: 20, fontWeight: '900' }}>
                {state.name}
              </Text>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                {formatAuthContactSubtitle(state)} · {state.tier} tier · {state.xp} XP
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <Tag label={`${state.streakDays}-day streak 🔥`} color={palette.primary} />
                <Tag label={`${state.followingFoodies.length} foodies`} color={palette.accent} />
                <Tag
                  label={state.subscription === 'pro_monthly' ? 'Pro member' : 'Free tier'}
                  color={state.subscription === 'pro_monthly' ? palette.success : palette.textTertiary}
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </Section>

      <Section title="Weekly taste report" subtitle="Auto-generated every Sunday.">
        <Card>
          <Text style={{ color: palette.text, fontSize: 14 }}>
            You ordered <Text style={{ fontWeight: '900' }}>{weeklyOrders} times</Text> this week, mostly{' '}
            <Text style={{ fontWeight: '900', color: palette.primary }}>
              {cuisinesOrdered[0]}
            </Text>
            . Wallet spend ₹{weeklySpend.toLocaleString()}.
          </Text>
          <View style={{ gap: 6, marginTop: 6 }}>
            {cuisinesOrdered.map((c, i) => (
              <View key={c}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: palette.textSecondary, fontSize: 12 }}>{c}</Text>
                  <Text style={{ color: palette.textTertiary, fontSize: 11 }}>
                    {[40, 25, 20, 15][i] ?? 10}%
                  </Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.border }}>
                  <View
                    style={{
                      width: `${[40, 25, 20, 15][i] ?? 10}%`,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: palette.primary,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
          <Text style={{ color: palette.textSecondary, fontSize: 11 }}>
            Tip: try Vietnamese this week to widen your palate and unlock the "Tried 10 cuisines" badge.
          </Text>
        </Card>
      </Section>

      <Section title="Theme" subtitle="OLED-true blacks for dark mode. Festive themes auto-rotate during festivals.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(palettes) as ThemeName[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => dispatch({ type: 'THEME', theme: t })}
              style={({ pressed }) => [
                styles.themeChip,
                {
                  borderColor: state.themeName === t ? palette.primary : palette.border,
                  backgroundColor: pressed ? palette.surfaceHover : palette.surfaceElevated,
                },
              ]}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: palettes[t].primary,
                  borderWidth: 2,
                  borderColor: palettes[t].background,
                }}
              />
              <Text style={{ color: palette.text, fontWeight: '700', fontSize: 12 }}>
                {themeLabels[t]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Dietary preferences" subtitle="Filters apply across discovery and menus.">
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

      <Section title="Allergen alerts" subtitle="We'll bold-warn on every dish that touches these.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {ALLERGENS.map((a) => {
            const active = state.allergens.includes(a.id);
            return (
              <Pill
                key={a.id}
                label={`⚠ ${a.label}`}
                active={active}
                tone={active ? 'warning' : 'default'}
                onPress={() =>
                  dispatch({
                    type: 'ALLERGENS',
                    tags: active
                      ? state.allergens.filter((t) => t !== a.id)
                      : [...state.allergens, a.id],
                  })
                }
              />
            );
          })}
        </View>
      </Section>

      <Section title="Calorie cap">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {CALORIE_CAPS.map((c) => (
            <Pill
              key={c ?? 'none'}
              label={c ? `≤ ${c} kcal` : 'No cap'}
              active={state.caloriesCap === c}
              onPress={() => dispatch({ type: 'CAL_CAP', value: c })}
            />
          ))}
        </View>
      </Section>

      <SavedAddressesSection variant="manage" />

      <Section title="Order history">
        <View style={{ gap: 8 }}>
          {state.orders.length === 0 ? (
            <Card>
              <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
                No orders yet — place one to see it here. Reorder is one tap.
              </Text>
            </Card>
          ) : (
            state.orders.map((o) => (
              <Card key={o.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor:
                        RESTAURANTS_WEB.find((r) => r.id === o.restaurantId)?.imageTint ??
                        palette.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '900' }}>
                      {o.restaurantName.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontWeight: '800' }}>
                      {o.restaurantName}
                    </Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12 }} numberOfLines={1}>
                      {o.itemSummary}
                    </Text>
                    <Text style={{ color: palette.textTertiary, fontSize: 11 }}>
                      {o.id} · ₹{o.totalINR} · {o.phase}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Pressable
                      onPress={() => {
                        navigate({ name: 'restaurant', restaurantId: o.restaurantId });
                        toast({ title: 'Reorder', body: 'Same kitchen pulled up.' });
                      }}
                    >
                      <Text style={{ color: palette.primary, fontWeight: '800', fontSize: 12 }}>
                        Reorder ↻
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </Section>

      <Section title="Account">
        <Card>
          <View style={{ gap: 6 }}>
            {[
              { label: 'Notifications', value: 'Push + email · digest mode' },
              {
                label: state.authProvider === 'google' ? 'Google' : 'Phone',
                value:
                  state.authProvider === 'google'
                    ? formatAuthContactSubtitle(state)
                    : `+91 ${state.phone.replace(/\D/g, '').slice(-10) || 'demo'}`,
              },
              {
                label: 'Default delivery',
                value: defaultAddrSummary
                  ? `${defaultAddrSummary.label} · ${formatAddress(defaultAddrSummary)}`
                  : 'None — add a saved address',
              },
              { label: 'Language', value: 'English (India)' },
              { label: 'Accessibility', value: 'Screen-reader friendly · scalable fonts' },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: palette.textSecondary, fontSize: 13 }}>{row.label}</Text>
                <Text style={{ color: palette.text, fontSize: 13, fontWeight: '700' }}>{row.value}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            <GhostButton
              label="Sign out"
              icon="↩"
              onPress={() => {
                dispatch({ type: 'LOGOUT' });
                toast({ title: 'Signed out', body: 'See you soon — we kept your theme.' });
              }}
            />
          </View>
        </Card>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    padding: 18,
    borderRadius: 22,
    gap: 8,
    borderWidth: 1,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
