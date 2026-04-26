import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  doctor?: {
    clinic_name: string;
    profile?: {
      full_name: string;
    };
  };
}

const STATUS_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  pending: { icon: 'time-outline', color: '#F59E0B', bg: '#FFFBEB' },
  confirmed: { icon: 'checkmark-circle', color: colors.success, bg: '#F0FDF4' },
  cancelled: { icon: 'close-circle', color: colors.error, bg: '#FEF2F2' },
  completed: { icon: 'checkmark-done', color: colors.primary, bg: '#F0F9FF' },
};

export default function AppointmentsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const isRTL = i18n.language === 'ar';

  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('appointment_requests')
        .select(`
          *,
          doctor:doctors(
            clinic_name,
            profile:profiles(full_name)
          )
        `)
        .eq('patient_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
      { weekday: 'long', month: 'long', day: 'numeric' }
    );
  };

  const renderAppointment = ({ item }: { item: AppointmentRequest }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const doctorName = item.doctor?.profile?.full_name || t('common.unknown');
    const clinicName = item.doctor?.clinic_name || '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.doctor_id })}
        activeOpacity={0.7}
      >
        <View style={[styles.cardHeader, isRTL && styles.rowRTL]}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {t(`appointment.status.${item.status}`)}
            </Text>
          </View>
          <Text style={styles.timeText}>{item.preferred_time}</Text>
        </View>

        <View style={[styles.cardBody, isRTL && styles.rowRTL]}>
          <View style={styles.calendarIcon}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
          </View>
          <View style={[styles.cardInfo, isRTL && styles.cardInfoRTL]}>
            <Text style={[styles.doctorName, isRTL && styles.rtlText]}>{doctorName}</Text>
            <Text style={[styles.clinicText, isRTL && styles.rtlText]}>{clinicName}</Text>
            <Text style={[styles.dateText, isRTL && styles.rtlText]}>
              {formatDate(item.preferred_date)}
            </Text>
          </View>
        </View>

        {item.reason ? (
          <Text style={[styles.reasonText, isRTL && styles.rtlText]} numberOfLines={2}>
            {item.reason}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>
          {t('appointment.myAppointments')}
        </Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={appointments.length === 0 ? styles.emptyContainer : { padding: spacing.md }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>
              {t('appointment.noAppointments')}
            </Text>
            <Text style={[styles.emptySubtitle, isRTL && styles.rtlText]}>
              {t('appointment.noAppointmentsSubtitle')}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAppointments(); }}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  timeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  cardInfoRTL: {
    marginLeft: 0,
    marginRight: spacing.sm,
  },
  doctorName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  clinicText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  reasonText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
