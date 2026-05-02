import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../../components/PrimaryButton';
import type { ThemePreference } from '../../hooks/useFlavorTheme';
import { useFlavorTheme } from '../../hooks/useFlavorTheme';
import { ensureNotificationPermissions } from '../../services/notify';
import { useAuthStore } from '../../store/authStore';
import { cardShadow, radius, spacing, typography } from '../../theme';

const THEME_META: Record<
  ThemePreference,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  dark: { label: 'Midnight OLED', icon: 'moon-outline' },
  light: { label: 'Kitchen daylight', icon: 'sunny-outline' },
  system: { label: 'Match OS', icon: 'phone-portrait-outline' },
};

function ProfileBody() {
  const { colors, preference, resolvedScheme, setPreference } =
    useFlavorTheme();
  const elevate = cardShadow(resolvedScheme);
  const logout = () => useAuthStore.getState().setSession(null);

  const toggleNotifs = async () => {
    await ensureNotificationPermissions();
  };

  const prefOptions: ThemePreference[] = ['dark', 'light', 'system'];

  return (
    <LinearGradient
      colors={
        resolvedScheme === 'dark'
          ? ['#070707', colors.background]
          : ['#FFFFFF', '#FFF6EF', colors.background]
      }
      style={{ flex: 1 }}
    >
      <SafeAreaView style={[styles.safe, { flex: 1 }]}>
        <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
          <Text style={[typography.overline, { color: colors.primary }]}>
            Profile studio
          </Text>
          <Text style={[typography.title, { color: colors.text, fontWeight: '800' }]}>
            Dial in vibes
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Theme and alerts live here—the same typography stack your diners see on menus.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            elevate,
            { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
          ]}
        >
          <View style={styles.cardTitleRow}>
            <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
            <Text style={[typography.subtitle, { color: colors.text }]}>
              Appearance & motion
            </Text>
          </View>
          {prefOptions.map((pref) => {
            const selected = preference === pref;
            const meta = THEME_META[pref];
            return (
              <Pressable
                key={pref}
                onPress={() => setPreference(pref)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    opacity: pressed ? 0.9 : 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.overlay : 'transparent',
                  },
                ]}
              >
                <View style={[styles.miniIconWrap, { borderColor: colors.border }]}>
                  <Ionicons name={meta.icon} size={20} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subtitle, { color: colors.text, fontWeight: selected ? '800' : '600' }]}>
                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {meta.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {selected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => toggleNotifs()}
          style={({ pressed }) => [
            styles.card,
            elevate,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Enable delivery alerts"
        >
          <View style={styles.rowBetween}>
            <View style={[styles.miniIconWrap, { borderColor: colors.border }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[typography.subtitle, { color: colors.text }]}>
                Delivery alerts & taste drops
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Warm-up for contextual pushes + geo-fenced promos coming next sprint.
              </Text>
            </View>
          </View>
        </Pressable>

        <PrimaryButton title="Log out" variant="ghost" onPress={logout} />
      </SafeAreaView>
    </LinearGradient>
  );
}

export function ProfileScreen() {
  return <ProfileBody />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.screenGutter - 2 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg + 6,
    padding: spacing.md,
    gap: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md + 4,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm + 4,
  },
  miniIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
});
