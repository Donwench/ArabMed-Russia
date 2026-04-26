import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../lib/theme';
import { useToast } from '../components/Toast';

export default function SuggestDoctorScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!doctorName.trim()) {
      showToast(t('common.error'), t('suggest.nameRequired'), 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('doctor_suggestions').insert({
        submitted_by: userData.user?.id || null,
        doctor_name: doctorName.trim(),
        specialty: specialty.trim(),
        clinic_name: clinicName.trim(),
        clinic_address: clinicAddress.trim(),
        city: city.trim(),
        phone: phone.trim(),
        languages: languages.trim(),
        notes: notes.trim(),
        source_url: sourceUrl.trim() || null,
      });

      if (error) throw error;

      showToast(t('suggest.successTitle'), t('suggest.successMessage'), 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast(t('common.error'), message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.title, isRTL && styles.rtlText]}>
          {t('suggest.title')}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <Text style={[styles.infoText, isRTL && styles.rtlText]}>
          {t('suggest.description')}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Doctor Name */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('suggest.doctorName')} *
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('suggest.doctorNamePlaceholder')}
          placeholderTextColor={colors.textLight}
          value={doctorName}
          onChangeText={setDoctorName}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Specialty */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctor.specialty')}
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('suggest.specialtyPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={specialty}
          onChangeText={setSpecialty}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Clinic Name */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctor.clinic')}
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('suggest.clinicPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={clinicName}
          onChangeText={setClinicName}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* City */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('suggest.city')}
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('suggest.cityPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={city}
          onChangeText={setCity}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Address */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctor.address')}
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('suggest.addressPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={clinicAddress}
          onChangeText={setClinicAddress}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Phone */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctor.phone')}
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder="+7 XXX XXX XX XX"
          placeholderTextColor={colors.textLight}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Languages */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('doctor.languages')}
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('suggest.languagesPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={languages}
          onChangeText={setLanguages}
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Source URL */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('suggest.sourceUrl')}
        </Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder="https://prodoctorov.ru/..."
          placeholderTextColor={colors.textLight}
          value={sourceUrl}
          onChangeText={setSourceUrl}
          keyboardType="url"
          autoCapitalize="none"
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Notes */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('suggest.notes')}
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, isRTL && styles.rtlInput]}
          placeholder={t('suggest.notesPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>
                {t('suggest.submit')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#E8F4FD',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#B3D7F2',
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  form: {
    padding: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  rtlInput: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
