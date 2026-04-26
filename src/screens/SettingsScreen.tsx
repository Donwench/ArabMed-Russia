import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { RootStackParamList, Profile } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../lib/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LANGUAGES = [
  { code: 'ar', label: 'العربية', icon: '🇸🇦' },
  { code: 'ru', label: 'Русский', icon: '🇷🇺' },
  { code: 'en', label: 'English', icon: '🇬🇧' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const isRTL = i18n.language === 'ar';

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    setProfile(data);
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>
          {t('settings.title')}
        </Text>
      </View>

      {/* Profile Section */}
      {profile && (
        <View style={styles.section}>
          <View style={[styles.profileRow, isRTL && styles.rowRTL]}>
            <View style={styles.avatarSmall}>
              <Ionicons name="person" size={24} color={colors.white} />
            </View>
            <View style={[styles.profileInfo, isRTL && styles.profileInfoRTL]}>
              <Text style={[styles.profileName, isRTL && styles.rtlText]}>
                {profile.full_name || t('auth.fullName')}
              </Text>
              <Text style={[styles.profileRole, isRTL && styles.rtlText]}>
                {profile.role}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {t('settings.language')}
        </Text>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.optionRow, isRTL && styles.rowRTL]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <Text style={styles.optionIcon}>{lang.icon}</Text>
            <Text style={[styles.optionText, isRTL && styles.rtlText, { flex: 1 }]}>
              {lang.label}
            </Text>
            {i18n.language === lang.code && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Register as Doctor */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.optionRow, isRTL && styles.rowRTL]}
          onPress={() => navigation.navigate('DoctorRegistration')}
        >
          <Ionicons name="medical-outline" size={22} color={colors.primary} />
          <Text style={[styles.optionText, isRTL && styles.rtlText, { flex: 1, marginHorizontal: spacing.md }]}>
            {t('settings.registerAsDoctor')}
          </Text>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <View style={[styles.optionRow, isRTL && styles.rowRTL]}>
          <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
          <Text style={[styles.optionText, isRTL && styles.rtlText, { flex: 1, marginHorizontal: spacing.md }]}>
            {t('settings.version')}
          </Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  profileInfoRTL: {
    marginLeft: 0,
    marginRight: spacing.md,
  },
  profileName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  profileRole: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    margin: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
});
