import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { SavedAddress } from '../state';

import { Card, GhostButton, Pill, PrimaryButton, Section, Tag } from '../primitives';
import { formatAddress, useFlavorWeb } from '../state';

const ADDRESS_LABEL_PRESETS = ['Home', 'Work', 'Other'] as const;

function inputStyle(palette: ReturnType<typeof useFlavorWeb>['palette']) {
  return {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: palette.text,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  } as const;
}

type Props = {
  variant: 'manage' | 'pick';
};

export function SavedAddressesSection({ variant }: Props) {
  const { state, dispatch, palette, toast, navigate } = useFlavorWeb();
  const [showForm, setShowForm] = useState(false);
  const [labelPreset, setLabelPreset] =
    useState<(typeof ADDRESS_LABEL_PRESETS)[number]>('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [pincode, setPincode] = useState('');
  const [phoneContact, setPhoneContact] = useState('');
  const [asDefault, setAsDefault] = useState(false);

  const compact = variant === 'pick';

  const resetForm = () => {
    setLine1('');
    setLine2('');
    setLandmark('');
    setPincode('');
    setPhoneContact('');
    setCustomLabel('');
    setAsDefault(false);
    setLabelPreset('Home');
  };

  const saveNew = () => {
    const name =
      labelPreset === 'Other' ? customLabel.trim() || 'Saved' : labelPreset;
    const main = line1.trim();
    if (!main) {
      toast({
        title: 'Add street / building line',
        body: 'Line 1 is required so riders can find you.',
        tone: 'warning',
      });
      return;
    }
    dispatch({
      type: 'ADDRESS_ADD',
      address: {
        label: name,
        line1: main,
        line2: line2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        phoneContact: phoneContact.trim() || undefined,
        isDefault: asDefault || state.addresses.length === 0,
      },
    });
    toast({ title: 'Address saved', body: name, tone: 'success' });
    resetForm();
    setShowForm(false);
  };

  const emptyNotice =
    state.addresses.length === 0 ? (
      <Card>
        <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
          No saved addresses yet. Add one{compact ? ' in Profile' : ''} below to continue.
        </Text>
      </Card>
    ) : null;

  return (
    <Section
      title={compact ? 'Deliver to' : 'Saved addresses'}
      subtitle={
        compact
          ? 'Tap to choose delivery. Profile → Saved addresses to add more.'
          : 'These appear at checkout. Use Deliver here for your next order.'
      }
    >
      {emptyNotice}
      {state.addresses.map((adr) => (
        <AddressRow key={adr.id} adr={adr} variant={variant} palette={palette} />
      ))}
      {!compact && (
        <>
          {!showForm ? (
            <PrimaryButton
              label="Add new address"
              icon="+"
              onPress={() => {
                resetForm();
                setShowForm(true);
              }}
            />
          ) : (
            <AddAddressFormCard
              palette={palette}
              labelPreset={labelPreset}
              setLabelPreset={setLabelPreset}
              customLabel={customLabel}
              setCustomLabel={setCustomLabel}
              line1={line1}
              setLine1={setLine1}
              line2={line2}
              setLine2={setLine2}
              landmark={landmark}
              setLandmark={setLandmark}
              city={city}
              setCity={setCity}
              pincode={pincode}
              setPincode={setPincode}
              phoneContact={phoneContact}
              setPhoneContact={setPhoneContact}
              asDefault={asDefault}
              setAsDefault={setAsDefault}
              onCancel={() => {
                setShowForm(false);
                resetForm();
              }}
              onSave={saveNew}
            />
          )}
        </>
      )}
      {compact && state.addresses.length > 0 ? (
        <GhostButton
          label="Add / edit addresses in Profile"
          onPress={() => navigate({ name: 'profile' })}
        />
      ) : null}
    </Section>
  );
}

function AddressRow({
  adr,
  variant,
  palette,
}: {
  adr: SavedAddress;
  variant: Props['variant'];
  palette: ReturnType<typeof useFlavorWeb>['palette'];
}) {
  const { dispatch, state, toast } = useFlavorWeb();
  const selected = state.selectedAddressId === adr.id;

  const body = (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text style={{ color: palette.text, fontWeight: '900', fontSize: 15 }}>{adr.label}</Text>
        {adr.isDefault ? <Tag label="Default" color={palette.primary} /> : null}
        {variant === 'pick' && selected ? <Tag label="Selected" color={palette.success} /> : null}
      </View>
      <Text style={{ color: palette.textSecondary, fontSize: 13, lineHeight: 19 }}>
        {formatAddress(adr)}
      </Text>
      {adr.phoneContact ? (
        <Text style={{ color: palette.textTertiary, fontSize: 12 }}>📞 {adr.phoneContact}</Text>
      ) : null}
      {variant === 'manage' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <GhostButton
            label={selected ? '✓ For next order' : 'Deliver here'}
            onPress={() => {
              dispatch({ type: 'ADDRESS_SELECT', id: adr.id });
              toast({ title: 'Delivery address selected', body: adr.label });
            }}
            icon={selected ? '✓' : '📍'}
          />
          {!adr.isDefault ? (
            <GhostButton
              label="Set default"
              onPress={() => {
                dispatch({ type: 'ADDRESS_SET_DEFAULT', id: adr.id });
                toast({ title: 'Default updated', body: adr.label });
              }}
            />
          ) : null}
          <GhostButton
            label="Remove"
            onPress={() => {
              dispatch({ type: 'ADDRESS_DELETE', id: adr.id });
              toast({
                title: 'Address removed',
                body: adr.label,
                tone: 'warning',
              });
            }}
          />
        </View>
      ) : null}
    </View>
  );

  if (variant === 'pick') {
    return (
      <Pressable
        onPress={() => dispatch({ type: 'ADDRESS_SELECT', id: adr.id })}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }: { pressed: boolean }) => [
          styles.pickOuter,
          {
            borderColor: selected ? palette.primary : palette.border,
            backgroundColor: pressed ? palette.surfaceHover : palette.surfaceElevated,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        {body}
      </Pressable>
    );
  }

  return <Card>{body}</Card>;
}

function AddAddressFormCard(props: {
  palette: ReturnType<typeof useFlavorWeb>['palette'];
  labelPreset: (typeof ADDRESS_LABEL_PRESETS)[number];
  setLabelPreset: (v: (typeof ADDRESS_LABEL_PRESETS)[number]) => void;
  customLabel: string;
  setCustomLabel: (v: string) => void;
  line1: string;
  setLine1: (v: string) => void;
  line2: string;
  setLine2: (v: string) => void;
  landmark: string;
  setLandmark: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  pincode: string;
  setPincode: (v: string) => void;
  phoneContact: string;
  setPhoneContact: (v: string) => void;
  asDefault: boolean;
  setAsDefault: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel: () => void;
  onSave: () => void;
}) {
  const {
    palette,
    labelPreset,
    setLabelPreset,
    customLabel,
    setCustomLabel,
    line1,
    setLine1,
    line2,
    setLine2,
    landmark,
    setLandmark,
    city,
    setCity,
    pincode,
    setPincode,
    phoneContact,
    setPhoneContact,
    asDefault,
    setAsDefault,
    onCancel,
    onSave,
  } = props;

  return (
    <Card>
      <Text style={{ color: palette.text, fontWeight: '800', marginBottom: 10 }}>New address</Text>
      <Text style={[styles.smallLabel, { color: palette.textSecondary }]}>Label</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {ADDRESS_LABEL_PRESETS.map((l) => (
          <Pill key={l} label={l} active={labelPreset === l} onPress={() => setLabelPreset(l)} />
        ))}
      </View>
      {labelPreset === 'Other' ? (
        <>
          <Text style={[styles.smallLabel, { color: palette.textSecondary }]}>Custom name</Text>
          <TextInput
            placeholder="Custom label (Mom, Gym…)"
            placeholderTextColor={palette.textTertiary}
            value={customLabel}
            onChangeText={setCustomLabel}
            style={[inputStyle(palette), { marginBottom: 8 }]}
          />
        </>
      ) : null}
      <Text style={[styles.smallLabel, { color: palette.textSecondary }]}>Line 1 (required)</Text>
      <TextInput
        placeholder="Flat / street / building name"
        placeholderTextColor={palette.textTertiary}
        value={line1}
        onChangeText={setLine1}
        style={[inputStyle(palette), { marginBottom: 8 }]}
      />
      <Text style={[styles.smallLabel, { color: palette.textSecondary }]}>Line 2</Text>
      <TextInput
        placeholder="Area / locality"
        placeholderTextColor={palette.textTertiary}
        value={line2}
        onChangeText={setLine2}
        style={[inputStyle(palette), { marginBottom: 8 }]}
      />
      <Text style={[styles.smallLabel, { color: palette.textSecondary }]}>Landmark</Text>
      <TextInput
        placeholder="Near MG Road metro"
        placeholderTextColor={palette.textTertiary}
        value={landmark}
        onChangeText={setLandmark}
        style={[inputStyle(palette), { marginBottom: 8 }]}
      />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Text style={[styles.smallLabel, { color: palette.textSecondary }]}>City</Text>
          <TextInput
            placeholder="Bangalore"
            placeholderTextColor={palette.textTertiary}
            value={city}
            onChangeText={setCity}
            style={inputStyle(palette)}
          />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Text style={[styles.smallLabel, { color: palette.textSecondary }]}>PIN</Text>
          <TextInput
            placeholder="560008"
            placeholderTextColor={palette.textTertiary}
            keyboardType="number-pad"
            value={pincode}
            onChangeText={setPincode}
            style={inputStyle(palette)}
          />
        </View>
      </View>
      <Text style={[styles.smallLabel, { color: palette.textSecondary, marginTop: 8 }]}>
        Door phone (optional)
      </Text>
      <TextInput
        placeholder="+91 …"
        placeholderTextColor={palette.textTertiary}
        keyboardType="phone-pad"
        value={phoneContact}
        onChangeText={setPhoneContact}
        style={[inputStyle(palette), { marginBottom: 8 }]}
      />
      <Pressable
        onPress={() => setAsDefault((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: asDefault ? palette.primary : 'transparent',
          }}
        >
          {asDefault ? (
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>
          ) : null}
        </View>
        <Text style={{ color: palette.text, fontSize: 13 }}>Set as default address</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <PrimaryButton label="Save address" icon="✓" onPress={onSave} />
        <GhostButton label="Cancel" onPress={onCancel} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  smallLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickOuter: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
});
