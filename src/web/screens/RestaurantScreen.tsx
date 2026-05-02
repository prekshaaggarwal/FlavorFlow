import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RESTAURANTS_WEB, type WebMenuItem } from '../data';
import { Card, FoodImage, GhostButton, Pill, PrimaryButton, Section, Tag } from '../primitives';
import { useFlavorWeb } from '../state';

export function RestaurantScreen({ restaurantId }: { restaurantId: string }) {
  const { palette, dispatch, navigate, toast, state } = useFlavorWeb();
  const restaurant = useMemo(
    () => RESTAURANTS_WEB.find((r) => r.id === restaurantId),
    [restaurantId]
  );
  const [search, setSearch] = useState('');

  if (!restaurant) {
    return (
      <Card>
        <Text style={{ color: palette.text, fontWeight: '700' }}>Restaurant not found</Text>
        <PrimaryButton label="Back" icon="←" onPress={() => navigate({ name: 'home' })} />
      </Card>
    );
  }

  const { wishlists } = state;

  return (
    <View style={{ gap: 18 }}>
      <Pressable onPress={() => navigate({ name: 'home' })} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <Text style={{ color: palette.primary, fontWeight: '800' }}>← Back</Text>
      </Pressable>

      <View style={[styles.hero, { borderColor: palette.border }]}>
        <FoodImage
          url={restaurant.coverUrl}
          letter={restaurant.name.charAt(0)}
          tint={restaurant.imageTint}
          rounded={0}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.heroOverlay}
          pointerEvents="none"
        />
        <View style={styles.heroContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {restaurant.cuisines.map((c) => (
              <Tag key={c} label={c} color="#fff" />
            ))}
            <Tag label={`Hygiene ${restaurant.hygieneRating}`} color={palette.success} />
          </View>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 }}>
            {restaurant.name}
          </Text>
          <Text style={{ color: '#f8fafc', fontSize: 13 }}>
            ★ {restaurant.rating} · {restaurant.etaMins} · ₹{restaurant.deliveryFeeINR} delivery · {restaurant.distanceKm} km
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            <Tag label={`🔥 ${restaurant.liveOrders} live`} color="#fff" />
            {restaurant.tags.map((t) => (
              <Tag key={t} label={t} color="#fff" />
            ))}
          </View>
        </View>
      </View>

      <Section
        title="Menu"
        subtitle="Allergen-aware. Customize each plate before adding."
        action={
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {['mild', 'medium', 'fire'].map((s) => (
              <Pill
                key={s}
                label={s}
                onPress={() => setSearch((q) => (q === s ? '' : s))}
                active={search === s}
              />
            ))}
          </View>
        }
      >
        <View style={{ gap: 10 }}>
          {restaurant.menu.map((item) => (
            <MenuItem key={item.id} item={item} restaurantId={restaurant.id} />
          ))}
        </View>
      </Section>

      <Section title="Why diners trust this kitchen">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Card style={{ flex: 1, minWidth: 200, gap: 4 }}>
            <Text style={{ color: palette.success, fontWeight: '900', fontSize: 22 }}>
              Hygiene {restaurant.hygieneRating}
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              Sealed-pack verification photos with every drop-off.
            </Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 200, gap: 4 }}>
            <Text style={{ color: palette.primary, fontWeight: '900', fontSize: 22 }}>
              Order insurance
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              Instant refund if quality dips. One-tap support escalation.
            </Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 200, gap: 4 }}>
            <Text style={{ color: palette.accent, fontWeight: '900', fontSize: 22 }}>
              Allergen labels
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              Bold tags on every dish. Filter your account-wide allergens too.
            </Text>
          </Card>
        </View>
      </Section>

      <Section title="What diners are saying">
        <View style={{ gap: 8 }}>
          {restaurant.reviews.map((rv) => (
            <Card key={rv.id}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: rv.avatarColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900' }}>{rv.user.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontWeight: '800' }}>{rv.user}</Text>
                  <Text style={{ color: palette.textSecondary, fontSize: 11 }}>
                    {rv.daysAgo}d ago · ★ {rv.rating}
                  </Text>
                </View>
              </View>
              <Text style={{ color: palette.text, fontSize: 13, lineHeight: 19 }}>
                {rv.text}
              </Text>
            </Card>
          ))}
        </View>
      </Section>

      <Section title="Add to a wishlist">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {wishlists.map((w) => {
            const inList = w.restaurantIds.includes(restaurant.id);
            return (
              <Pill
                key={w.id}
                label={`${inList ? '✓ ' : '+ '}${w.name}`}
                active={inList}
                onPress={() => {
                  dispatch({
                    type: 'WISHLIST_TOGGLE',
                    restaurantId: restaurant.id,
                    wishlistId: w.id,
                  });
                  toast({
                    title: inList ? 'Removed from wishlist' : 'Saved to wishlist',
                    body: w.name,
                    tone: 'info',
                  });
                }}
              />
            );
          })}
        </View>
      </Section>

      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
        <GhostButton label="Open cart" onPress={() => navigate({ name: 'cart' })} icon="🛒" />
        <PrimaryButton label="Continue" onPress={() => navigate({ name: 'cart' })} icon="→" />
      </View>
    </View>
  );
}

function MenuItem({ item, restaurantId }: { item: WebMenuItem; restaurantId: string }) {
  const { palette, dispatch, toast } = useFlavorWeb();
  const [qty, setQty] = useState(1);
  const [openCustom, setOpenCustom] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [spice, setSpice] = useState<'mild' | 'medium' | 'fire'>('medium');

  const adjustedPrice = useMemo(() => {
    let p = item.priceINR;
    item.customizations?.forEach((c) => {
      const choice = selected[c.name];
      if (choice) {
        const opt = c.options.find((o) => o.label === choice);
        if (opt) p += opt.deltaINR;
      }
    });
    return p;
  }, [item, selected]);

  const allergens = item.allergens ?? [];

  const add = () => {
    dispatch({
      type: 'CART_ADD',
      line: {
        uid: `${item.id}-${Date.now()}`,
        restaurantId,
        item: { ...item, priceINR: adjustedPrice },
        quantity: qty,
        customizations: selected,
        spice,
      },
    });
    toast({
      title: `Added ${item.name} ×${qty}`,
      body: 'Cart updates with smart suggestions.',
      emoji: '🛒',
      tone: 'success',
    });
  };

  const restaurant = RESTAURANTS_WEB.find((r) => r.id === restaurantId);
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <FoodImage
          url={item.imageUrl}
          emoji={item.emoji}
          tint={restaurant?.imageTint ?? palette.primary}
          style={{ width: 110, height: 110 }}
        />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderWidth: 2,
                borderColor: item.veg ? palette.veg : palette.nonVeg,
                borderRadius: 2,
              }}
            />
            <Text style={{ color: palette.text, fontWeight: '800', fontSize: 15, flexShrink: 1 }}>
              {item.name}
            </Text>
            {item.popular ? <Tag label="POPULAR" color={palette.primary} /> : null}
            {(item.spiceLevel ?? 0) >= 2 ? <Tag label={`SPICE ${item.spiceLevel}/3`} color={palette.danger} /> : null}
          </View>
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>{item.description}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {(item.dietary ?? []).map((d) => (
              <Tag key={d} label={d.replace('-', ' ')} color={palette.success} />
            ))}
            {allergens.map((a) => (
              <Tag key={a} label={`⚠ ${a}`} color={palette.warning} />
            ))}
            {item.calories ? <Tag label={`${item.calories} kcal`} color={palette.accent} /> : null}
          </View>
          <Text style={{ color: palette.text, fontWeight: '900', fontSize: 16, marginTop: 4 }}>
            ₹{adjustedPrice}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              style={[styles.qtyBtn, { borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontWeight: '900' }}>–</Text>
            </Pressable>
            <Text style={{ color: palette.text, fontWeight: '800', minWidth: 18, textAlign: 'center' }}>
              {qty}
            </Text>
            <Pressable
              onPress={() => setQty((q) => q + 1)}
              style={[styles.qtyBtn, { borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontWeight: '900' }}>+</Text>
            </Pressable>
          </View>
          {item.customizations?.length ? (
            <GhostButton
              label={openCustom ? 'Hide options' : 'Customize'}
              onPress={() => setOpenCustom((o) => !o)}
              icon="⚙️"
            />
          ) : null}
          <PrimaryButton label="Add" onPress={add} icon="+" />
        </View>
      </View>

      {openCustom && item.customizations?.length ? (
        <View style={{ gap: 10, marginTop: 10 }}>
          {item.customizations.map((c) => (
            <View key={c.name} style={{ gap: 6 }}>
              <Text style={{ color: palette.textSecondary, fontSize: 12 }}>{c.name}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {c.options.map((o) => (
                  <Pill
                    key={o.label}
                    label={`${o.label}${o.deltaINR > 0 ? ` +₹${o.deltaINR}` : o.deltaINR < 0 ? ` -₹${Math.abs(o.deltaINR)}` : ''}`}
                    active={selected[c.name] === o.label}
                    onPress={() =>
                      setSelected((prev) => ({ ...prev, [c.name]: o.label }))
                    }
                  />
                ))}
              </View>
            </View>
          ))}
          <View style={{ gap: 6 }}>
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>Spice level</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['mild', 'medium', 'fire'] as const).map((s) => (
                <Pill key={s} label={s} active={spice === s} onPress={() => setSpice(s)} />
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    gap: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
