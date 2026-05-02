import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GoogleOAuthButton } from '../../components/GoogleOAuthButton';
import { Card, GhostButton, PrimaryButton } from '../primitives';
import { useFlavorWeb } from '../state';
import { VOICE_QUERY_HINTS } from '../data';

export function LoginScreen() {
  const { palette, navigate, toast, dispatch } = useFlavorWeb();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const normalized = phone.replace(/\D/g, '');
    if (normalized.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    toast({ title: 'OTP sent ✉️', body: `Code dispatched to +91 ${normalized}.` });
    navigate({ name: 'otp', phone: normalized });
  };

  return (
    <View style={{ alignSelf: 'center', maxWidth: 480, width: '100%', gap: 14 }}>
      <LinearGradient
        colors={[palette.primarySoft, palette.bgGradient[1]]}
        style={styles.hero}
      >
        <Text style={[styles.overline, { color: palette.primary }]}>FlavorFlow</Text>
        <Text style={[styles.display, { color: palette.text }]}>Taste that finds you.</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Sign in once. OTP-only login keeps it nimble — same polish you'll ship to
          diners across iOS, Android, and Expo Go.
        </Text>
        <View style={styles.heroChips}>
          {['AI recs', 'Live tracking', 'Streak rewards', 'Group orders'].map((c) => (
            <View key={c} style={[styles.heroChip, { backgroundColor: palette.surfaceElevated }]}>
              <Text style={{ color: palette.text, fontSize: 11, fontWeight: '700' }}>{c}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <Card>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>Mobile number</Text>
        <TextInput
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            if (error) setError(null);
          }}
          placeholder="98xxxxxxxx"
          keyboardType="phone-pad"
          placeholderTextColor={palette.textTertiary}
          style={[
            styles.input,
            {
              color: palette.text,
              borderColor: error ? palette.danger : palette.border,
              backgroundColor: palette.surface,
            },
          ]}
          maxLength={14}
        />
        {error ? (
          <Text style={{ color: palette.danger, fontSize: 12 }}>{error}</Text>
        ) : (
          <Text style={{ color: palette.textTertiary, fontSize: 11 }}>
            We never SMS you marketing junk. Promise.
          </Text>
        )}
        <PrimaryButton label="Send OTP" onPress={submit} full icon="✉️" />
      </Card>

      <Card>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>Or continue with</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <GoogleOAuthButton
            colors={{ border: palette.border, surface: palette.surface, text: palette.text }}
            label="🔵 Google"
            onAuthenticated={(sess) => {
              dispatch({
                type: 'AUTH',
                phone: sess.phone,
                name: sess.name ?? 'You',
                authProvider: 'google',
                contactEmail:
                  sess.email ?? (sess.phone.includes('@') ? sess.phone : undefined),
              });
              toast({
                title: 'Signed in with Google',
                body: `Welcome ${sess.name?.split(/\s+/)[0] ?? 'back'}.`,
                tone: 'success',
              });
            }}
            onConfigMissing={() =>
              toast({
                title: 'Google sign-in',
                body:
                  'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (from Google Cloud OAuth credentials) and restart Expo.',
                tone: 'warning',
              })
            }
            onFailure={(msg) =>
              toast({ title: 'Google sign-in', body: msg, tone: 'warning' })
            }
          />
          <Pressable
            onPress={() =>
              toast({
                title: 'Coming soon',
                body: 'Apple login plug requires the Apple developer profile.',
                tone: 'info',
              })
            }
            style={({ pressed }) => [
              styles.socialBtn,
              { borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.caption, { color: palette.text, fontWeight: '700' }]}>
              🍎 Apple
            </Text>
          </Pressable>
        </View>
      </Card>

      <View style={[styles.tip, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>Try voice search after login:</Text>
        <Text style={{ color: palette.text, fontSize: 13, lineHeight: 20 }}>
          "{VOICE_QUERY_HINTS[0]}"
        </Text>
      </View>
    </View>
  );
}

export function OtpScreen({ phone }: { phone: string }) {
  const { palette, dispatch, navigate, back, toast } = useFlavorWeb();
  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(20);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const verify = () => {
    if (code.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }
    if (code !== '123456') {
      setError('Invalid OTP. Use 123456 in this demo.');
      return;
    }
    setError(null);
    dispatch({ type: 'AUTH', phone, authProvider: 'phone' });
    toast({ title: 'Welcome back 👋', body: 'We saved your favourite chip filters.', tone: 'success' });
    navigate({ name: 'home' });
  };

  return (
    <View style={{ alignSelf: 'center', maxWidth: 460, width: '100%', gap: 14 }}>
      <Card>
        <Text style={[styles.overline, { color: palette.primary }]}>Verify</Text>
        <Text style={[styles.title, { color: palette.text }]}>One last tap</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          OTP sent to <Text style={{ color: palette.text, fontWeight: '800' }}>+91 {phone}</Text>. Use{' '}
          <Text style={{ color: palette.primary, fontWeight: '800' }}>123456</Text> for the demo.
        </Text>
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\D/g, '').slice(0, 6));
            if (error) setError(null);
          }}
          keyboardType="number-pad"
          placeholder="••••••"
          placeholderTextColor={palette.textTertiary}
          style={[
            styles.input,
            {
              color: palette.text,
              borderColor: error ? palette.danger : palette.border,
              backgroundColor: palette.surface,
              fontSize: 22,
              letterSpacing: 8,
              textAlign: 'center',
            },
          ]}
        />
        {error ? <Text style={{ color: palette.danger, fontSize: 12 }}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <GhostButton label="Back" onPress={back} icon="←" />
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Verify" onPress={verify} full icon="🔓" />
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (resendIn > 0) return;
            setResendIn(20);
            toast({ title: 'New OTP sent 📩' });
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: 'center' })}
        >
          <Text style={{ color: resendIn > 0 ? palette.textTertiary : palette.primary, fontWeight: '700' }}>
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
          </Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 22, borderRadius: 22, gap: 8 },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  display: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  body: { fontSize: 14, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '600' },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  heroChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  socialBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
});
