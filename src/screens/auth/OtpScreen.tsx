import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackdrop } from '../../components/AuthBackdrop';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import type { AuthStackParamList } from '../../navigation/types';
import { verifyOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { cardShadow, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export function OtpScreen({ navigation, route }: Props) {
  const { colors, resolvedScheme } = useFlavorTheme();
  const [code, setCode] = useState('');
  const setSession = useAuthStore((s) => s.setSession);
  const phone = route.params.phone;
  const shellShadow = cardShadow(resolvedScheme);

  const onVerify = async () => {
    if (code.length < 6) {
      Alert.alert('OTP', 'Enter the 6-digit code.');
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const res = await verifyOtp(phone, code);
    if (!res.ok || !res.token) {
      Alert.alert('Verification failed', res.message ?? 'Try again.');
      return;
    }
    setSession({ token: res.token, phone, provider: 'phone' });
  };

  return (
    <AuthBackdrop>
      <SafeAreaView style={[styles.safe, { flex: 1 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.overline, { color: colors.primary }]}>
              OTP
            </Text>
            <Text style={[typography.display, { color: colors.text, fontSize: 28 }]}>
              Nearly there.
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Code sent to +91 ······{phone.slice(-4)} · offline fallback{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>
                123456
              </Text>
              .
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
              6-digit verification
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: resolvedScheme === 'dark' ? colors.surface : '#F8FAFD',
                },
              ]}
              accessibilityLabel="One time password"
            />
          </View>

          <PrimaryButton title="Verify & continue" onPress={onVerify} />
          <PrimaryButton
            title="Edit number"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
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
    paddingVertical: spacing.sm + 6,
    fontSize: 24,
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
});
