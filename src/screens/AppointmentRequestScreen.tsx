import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../lib/theme';
import { useToast } from '../components/Toast';

type RouteParams = RouteProp<RootStackParamList, 'AppointmentRequest'>;

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00',
];

export default function AppointmentRequestScreen() {
  const { t, i18n } = useTranslation();
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';
  const { doctorId, doctorName } = route.params;

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const getNextDays = () => {
    const days: { label: string; value: string }[] = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      const month = date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' });
      days.push({
        label: `${dayName}\n${dayNum} ${month}`,
        value: date.toISOString().split('T')[0],
      });
    }
    return days;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      showToast(t('common.error'), t('appointment.selectDateTime'), 'error');
      return;
    }
    if (!phone) {
      showToast(t('common.error'), t('appointment.phoneRequired'), 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('appointment_requests').insert({
        patient_id: userData.user.id,
        doctor_id: doctorId,
        preferred_date: selectedDate,
        preferred_time: selectedTime,
        reason,
        phone,
        language: i18n.language,
      });

      if (error) throw error;

      showToast(t('appointment.successTitle'), t('appointment.successMessage'), 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast(t('common.error'), message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const days = getNextDays();

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>
          {t('appointment.title')}
        </Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
          {t('appointment.subtitle', { doctor: doctorName })}
        </Text>

        {/* Date Selection */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('appointment.selectDate')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
          {days.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[styles.dateChip, selectedDate === day.value && styles.dateChipActive]}
              onPress={() => setSelectedDate(day.value)}
            >
              <Text style={[
                styles.dateChipText,
                selectedDate === day.value && styles.dateChipTextActive,
              ]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time Selection */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('appointment.selectTime')}
        </Text>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((time) => (
            <TouchableOpacity
              key={time}
              style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeChipText,
                selectedTime === time && styles.timeChipTextActive,
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('appointment.phone')} *
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

        {/* Reason */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>
          {t('appointment.reason')}
        </Text>
        <TextInput
          style={[styles.textArea, isRTL && styles.rtlInput]}
          value={reason}
          onChangeText={setReason}
          placeholder={t('appointment.reasonPlaceholder')}
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
            <View style={styles.submitRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.white} />
              <Text style={styles.submitText}>{t('appointment.submit')}</Text>
            </View>
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
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
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
  dateRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dateChip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 72,
  },
  dateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: fontSize.xs,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  dateChipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeChip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 72,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  timeChipTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
