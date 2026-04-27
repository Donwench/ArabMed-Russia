import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface ConsentScreenProps {
  onAccept: () => void;
}

const CONSENT_KEY = '@arabmed_consent_accepted';

export async function hasAcceptedConsent(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(CONSENT_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export default function ConsentScreen({ onAccept }: ConsentScreenProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const canProceed = privacyAccepted && termsAccepted && ageConfirmed;

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'true');
      await AsyncStorage.setItem('@arabmed_marketing_consent', marketingOptIn ? 'true' : 'false');
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('user_consents').insert({
          user_id: userData.user.id,
          privacy_accepted: privacyAccepted,
          terms_accepted: termsAccepted,
          marketing_consent: marketingOptIn,
          age_confirmed: ageConfirmed,
        });
      }
      onAccept();
    } catch {
      onAccept();
    }
  };

  const CheckboxRow = ({
    checked,
    onToggle,
    label,
    required,
  }: {
    checked: boolean;
    onToggle: () => void;
    label: string;
    required?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.checkboxRow, isRTL && styles.rowRTL]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color={colors.white} />}
      </View>
      <Text style={[styles.checkboxLabel, isRTL && styles.rtlText, { flex: 1 }]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={56} color={colors.primary} />
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t('consent.title')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('consent.subtitle')}</Text>
        </View>

        {/* Medical Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="medical" size={24} color={colors.warning} />
          <Text style={[styles.disclaimerText, isRTL && styles.rtlText]}>{t('legal.medicalDisclaimer')}</Text>
        </View>

        {/* Consent Checkboxes */}
        <View style={styles.consentSection}>
          <CheckboxRow
            checked={privacyAccepted}
            onToggle={() => setPrivacyAccepted(!privacyAccepted)}
            label={t('consent.acceptPrivacy')}
            required
          />
          <CheckboxRow
            checked={termsAccepted}
            onToggle={() => setTermsAccepted(!termsAccepted)}
            label={t('consent.acceptTerms')}
            required
          />
          <CheckboxRow
            checked={ageConfirmed}
            onToggle={() => setAgeConfirmed(!ageConfirmed)}
            label={t('consent.ageConfirm')}
            required
          />
          <View style={styles.divider} />
          <CheckboxRow
            checked={marketingOptIn}
            onToggle={() => setMarketingOptIn(!marketingOptIn)}
            label={t('consent.marketingOptIn')}
          />
        </View>

        {/* Data Processing Info */}
        <View style={styles.infoBox}>
          <Text style={[styles.infoTitle, isRTL && styles.rtlText]}>{t('consent.dataProcessing')}</Text>
          <Text style={[styles.infoBody, isRTL && styles.rtlText]}>{t('consent.dataProcessingBody')}</Text>
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          style={[styles.acceptButton, !canProceed && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={!canProceed}
        >
          <Text style={styles.acceptButtonText}>{t('consent.accept')}</Text>
        </TouchableOpacity>

        <Text style={[styles.requiredNote, isRTL && styles.rtlText]}>{t('consent.requiredNote')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: '#92400E',
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  consentSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  required: {
    color: colors.error,
    fontWeight: fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  infoBox: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoBody: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  acceptButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  acceptButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  requiredNote: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
});
