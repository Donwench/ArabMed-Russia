import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Specialty } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';
import { useToast } from '../components/Toast';
import { DOCTOR_FEE } from '../lib/subscription';

const LANGUAGE_OPTIONS = [
  { code: 'ar', labelKey: 'languages.ar' },
  { code: 'ru', labelKey: 'languages.ru' },
  { code: 'en', labelKey: 'languages.en' },
  { code: 'fr', labelKey: 'languages.fr' },
  { code: 'tr', labelKey: 'languages.tr' },
];

export default function DoctorRegistrationScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['ar']);
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    const { data } = await supabase.from('specialties').select('*').order('name_en');
    setSpecialties(data || []);
  };

  const getSpecialtyName = (spec: Specialty) => {
    const key = `name_${i18n.language}` as keyof Specialty;
    return (spec[key] as string) || spec.name_en;
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code)
        ? prev.filter((l) => l !== code)
        : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (!selectedSpecialty || !clinicName || !clinicAddress || !phone) {
      showToast(t('common.error'), t('common.fillRequired'), 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Update profile role
      await supabase
        .from('profiles')
        .update({ role: 'doctor', phone })
        .eq('id', userData.user.id);

      // Create doctor entry
      const aboutField = i18n.language === 'ar' ? 'about_ar' : i18n.language === 'ru' ? 'about_ru' : 'about_en';
      const { error } = await supabase.from('doctors').insert({
        profile_id: userData.user.id,
        specialty_id: selectedSpecialty,
        clinic_name: clinicName,
        clinic_address: clinicAddress,
        phone,
        languages_spoken: selectedLanguages,
        [aboutField]: about,
        is_verified: false,
      });

      if (error) throw error;

      showToast(t('doctorRegistration.success'), undefined, 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      showToast(t('common.error'), error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>
          {t('doctorRegistration.title')}
        </Text>

        {/* Doctor Fee Pricing Card */}
        <View style={styles.pricingCard}>
          <View style={[styles.pricingHeader, isRTL && styles.rowRTL]}>
            <Ionicons name="medical" size={24} color={colors.primary} />
            <Text style={[styles.pricingTitle, isRTL && styles.rtlText]}>
              {t('doctorRegistration.pricingTitle')}
            </Text>
          </View>
          <View style={styles.pricingItems}>
            <View style={[styles.pricingRow, isRTL && styles.rowRTL]}>
              <Ionicons name="card-outline" size={18} color={colors.secondary} />
              <Text style={[styles.pricingText, isRTL && styles.rtlText, { flex: 1 }]}>
                {t('doctorRegistration.registrationFee')}
              </Text>
              <Text style={styles.pricingAmount}>
                {DOCTOR_FEE.registrationFee} ₽
              </Text>
            </View>
            <View style={[styles.pricingRow, isRTL && styles.rowRTL]}>
              <Ionicons name="calendar-outline" size={18} color={colors.secondary} />
              <Text style={[styles.pricingText, isRTL && styles.rtlText, { flex: 1 }]}>
                {t('doctorRegistration.monthlyFee')}
              </Text>
              <Text style={styles.pricingAmount}>
                {DOCTOR_FEE.monthlySubscription} ₽/{t('subscription.mo')}
              </Text>
            </View>
          </View>
          <View style={styles.trialBanner}>
            <Ionicons name="gift-outline" size={20} color={colors.primary} />
            <Text style={[styles.trialText, isRTL && styles.rtlText]}>
              {t('doctorRegistration.freeTrial', { days: DOCTOR_FEE.trialDays })}
            </Text>
          </View>
          <Text style={[styles.pricingNote, isRTL && styles.rtlText]}>
            {t('doctorRegistration.pricingNote')}
          </Text>
        </View>

        {/* Clinic Name */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctorRegistration.clinicName')} *
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          value={clinicName}
          onChangeText={setClinicName}
          placeholder={t('doctorRegistration.clinicName')}
          placeholderTextColor={colors.textLight}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Clinic Address */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctorRegistration.clinicAddress')} *
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          value={clinicAddress}
          onChangeText={setClinicAddress}
          placeholder={t('doctorRegistration.clinicAddress')}
          placeholderTextColor={colors.textLight}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Phone */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctor.phone')} *
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          value={phone}
          onChangeText={setPhone}
          placeholder="+7 XXX XXX XX XX"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Specialty */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctorRegistration.selectSpecialty')} *
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {specialties.map((spec) => (
            <TouchableOpacity
              key={spec.id}
              style={[styles.chip, selectedSpecialty === spec.id && styles.chipActive]}
              onPress={() => setSelectedSpecialty(spec.id)}
            >
              <Text style={[styles.chipText, selectedSpecialty === spec.id && styles.chipTextActive]}>
                {getSpecialtyName(spec)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Languages */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctorRegistration.selectLanguages')} *
        </Text>
        <View style={styles.langGrid}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.chip, selectedLanguages.includes(lang.code) && styles.chipActive]}
              onPress={() => toggleLanguage(lang.code)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedLanguages.includes(lang.code) && styles.chipTextActive,
                ]}
              >
                {t(lang.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctorRegistration.aboutYou')}
        </Text>
        <TextInput
          style={[styles.textArea, isRTL && styles.rtlInput]}
          value={about}
          onChangeText={setAbout}
          placeholder={t('doctorRegistration.aboutYou')}
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>{t('doctorRegistration.submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rtlInput: {
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
  },
  chipScroll: {
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  pricingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pricingTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  pricingItems: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pricingText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  pricingAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  trialText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  pricingNote: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
  },
});
