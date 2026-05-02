import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackdrop } from '../../components/AuthBackdrop';
import { GoogleOAuthButton } from '../../components/GoogleOAuthButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import type { AuthStackParamList } from '../../navigation/types';
import { sendOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { cardShadow, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const [phone, setPhone] = useState('');
  const shellShadow = cardShadow(resolvedScheme);
  const setSession = useAuthStore((s) => s.setSession);

  const onSend = async () => {
    const normalized = phone.replace(/\D/g, '');
    if (normalized.length < 10) {
      Alert.alert('Phone number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    await Haptics.selectionAsync();
    const res = await sendOtp(normalized);
    if (!res.ok && res.message) {
      Alert.alert('OTP', res.message);
    }
    navigation.navigate('Otp', { phone: normalized });
  };

  const applePlaceholder = () => {
    Alert.alert('Coming soon', 'Apple login needs the Sign in with Apple capability.');
  };

  return (
    <AuthBackdrop>
      <SafeAreaView style={[styles.safe, { flex: 1 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.hero}>
            <Text style={[typography.overline, { color: colors.primary }]}>
              FlavorFlow
            </Text>
            <Text style={[typography.display, { color: colors.text }]}>
              Taste that finds you.
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Sign in once. OTP keeps your account nimble—the same polish you'll ship
              to diners.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              shellShadow,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Mobile number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 · · · · · · · · · ·"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: resolvedScheme === 'dark' ? colors.surface : '#F8FAFD',
                },
              ]}
              maxLength={14}
              accessibilityLabel="Phone number"
            />
          </View>

          <PrimaryButton title="Send OTP" onPress={onSend} />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              or continue with
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            <GoogleOAuthButton
              colors={{
                border: colors.border,
                surface: colors.surfaceElevated,
                text: colors.text,
              }}
              cardShadow={shellShadow}
              nativeAlert={Alert}
              label="Google"
              onAuthenticated={(sess) =>
                setSession({
                  token: sess.token,
                  phone: sess.phone,
                  name: sess.name,
                  email: sess.email,
                  provider: sess.provider ?? 'google',
                })
              }
              onFailure={(msg) => Alert.alert('Google sign-in', msg)}
              onConfigMissing={() =>
                Alert.alert(
                  'Google sign-in',
                  'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID plus iOS/Android OAuth client IDs in .env for native builds.'
                )
              }
            />
            <Pressable
              onPress={applePlaceholder}
              style={({ pressed }) => [
                styles.social,
                shellShadow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceElevated,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
            >
              <Text style={[typography.subtitle, { color: colors.text }]}>
                Apple
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.screenGutter,
    paddingTop: spacing.lg,
  },
  flex: { flex: 1, gap: spacing.md },
  hero: { gap: spacing.sm, marginBottom: spacing.lg },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  socialRow: { flexDirection: 'row', gap: spacing.sm },
  social: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
});
