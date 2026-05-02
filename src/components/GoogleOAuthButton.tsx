import * as Google from 'expo-auth-session/providers/google';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type AlertStatic,
  type GestureResponderEvent,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

import type { GoogleOAuthRuntimeConfig } from '../config/googleAuth';
import { resolveGoogleOAuthConfig } from '../config/googleAuth';
import { exchangeGoogleIdToken } from '../services/api';
import type { Session } from '../store/authStore';

export type ThemeColors = { border: string; surface?: string; text: string };

export type GoogleOAuthButtonProps = {
  colors: ThemeColors;
  cardShadow?: StyleProp<ViewStyle>;
  label?: string;
  disabled?: boolean;
  nativeAlert?: AlertStatic;
  onAuthenticated: (session: Session) => void;
  onConfigMissing?: () => void;
  onFailure?: (message: string) => void;
};

type LoadedProps = GoogleOAuthButtonProps & { oauthConfig: GoogleOAuthRuntimeConfig };

function GoogleOAuthButtonLoaded(props: LoadedProps) {
  const {
    oauthConfig,
    colors,
    cardShadow,
    label = 'Google',
    disabled,
    nativeAlert,
    onAuthenticated,
    onFailure,
  } = props;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: oauthConfig.webClientId,
    iosClientId: oauthConfig.iosClientId,
    androidClientId: oauthConfig.androidClientId,
  });

  const [signingIn, setSigningIn] = useState(false);
  const processedToken = useRef<string | null>(null);

  const finish = useCallback(
    async (idToken: string) => {
      if (processedToken.current === idToken) return;
      processedToken.current = idToken;
      setSigningIn(true);
      try {
        const res = await exchangeGoogleIdToken(idToken, {
          allowedAudiences: oauthConfig.allowedAudiences,
        });
        if (!res.ok) {
          processedToken.current = null;
          onFailure?.(res.message ?? 'Google sign-in failed.');
          return;
        }
        onAuthenticated({
          token: res.token,
          phone: res.phone,
          name: res.name,
          email: res.email,
          provider: 'google',
        });
      } catch (e) {
        processedToken.current = null;
        onFailure?.(e instanceof Error ? e.message : 'Google sign-in failed.');
      } finally {
        setSigningIn(false);
      }
    },
    [oauthConfig.allowedAudiences, onAuthenticated, onFailure]
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) {
      onFailure?.('No ID token from Google.');
      setSigningIn(false);
      return;
    }
    void finish(idToken);
  }, [response, finish, onFailure]);

  const onPress = async (_e: GestureResponderEvent) => {
    if (disabled || signingIn || !request) return;
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setSigningIn(true);
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setSigningIn(false);
        return;
      }
      if (result.type === 'error') {
        setSigningIn(false);
        const msg =
          typeof result.error === 'object' && result.error && 'message' in result.error
            ? String((result.error as { message?: string }).message)
            : 'Google sign-in failed.';
        onFailure?.(msg);
        return;
      }
      /** success paths: stays “signingIn” until `finish()` in useEffect clears it */
    } catch (e) {
      setSigningIn(false);
      onFailure?.(e instanceof Error ? e.message : 'Google sign-in failed.');
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      disabled={disabled || signingIn || !request}
      onPress={onPress}
      style={({ pressed }) => [
        styles.social,
        cardShadow,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface ?? 'transparent',
          opacity: pressed || disabled ? 0.88 : 1,
        },
      ]}
    >
      {signingIn ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function GoogleOAuthButton(props: GoogleOAuthButtonProps) {
  const oauthConfig = useMemo(() => resolveGoogleOAuthConfig(), []);

  const { colors, nativeAlert, label } = props;

  if (!oauthConfig) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Google sign-in unavailable"
        onPress={() =>
          props.onConfigMissing?.() ??
          nativeAlert?.alert(
            'Google sign-in',
            'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and iOS/Android client IDs for standalone builds) in a .env file, then rebuild the dev server.'
          )
        }
        style={({ pressed }) => [
          styles.social,
          props.cardShadow,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface ?? 'transparent',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.label, { color: colors.text, opacity: 0.72 }]}>
          {label ?? 'Google'}
        </Text>
      </Pressable>
    );
  }

  return <GoogleOAuthButtonLoaded {...props} oauthConfig={oauthConfig} />;
}

const styles = StyleSheet.create({
  social: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  label: { fontWeight: '700', fontSize: Platform.OS === 'web' ? 12 : 16 },
});
