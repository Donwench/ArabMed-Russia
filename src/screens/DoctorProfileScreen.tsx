import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Doctor, Review, RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';

type RouteParams = RouteProp<RootStackParamList, 'DoctorProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DoctorProfileScreen() {
  const { t, i18n } = useTranslation();
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const isRTL = i18n.language === 'ar';
  const { doctorId } = route.params;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchDoctor();
    fetchReviews();
  }, [doctorId]);

  useEffect(() => {
    if (userId && doctorId) {
      checkFavorite();
    }
  }, [userId, doctorId]);

  const fetchDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*),
          specialty:specialties(*)
        `)
        .eq('id', doctorId)
        .single();
      if (error) throw error;
      setDoctor(data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          patient:profiles(*)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkFavorite = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('patient_id', userId!)
      .eq('doctor_id', doctorId)
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!userId) return;
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('patient_id', userId)
          .eq('doctor_id', doctorId);
      } else {
        await supabase
          .from('favorites')
          .insert({ patient_id: userId, doctor_id: doctorId });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCall = () => {
    if (doctor?.phone) {
      Linking.openURL(`tel:${doctor.phone}`);
    }
  };

  const handleDirections = () => {
    if (doctor?.latitude && doctor?.longitude) {
      const url = `https://maps.google.com/?q=${doctor.latitude},${doctor.longitude}`;
      Linking.openURL(url);
    } else if (doctor?.clinic_address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(doctor.clinic_address)}`;
      Linking.openURL(url);
    }
  };

  const getLocalizedAbout = () => {
    if (!doctor) return '';
    const key = `about_${i18n.language}` as keyof Doctor;
    return (doctor[key] as string) || doctor.about_en || doctor.about_ar || '';
  };

  const getSpecialtyName = () => {
    if (!doctor?.specialty) return '';
    const key = `name_${i18n.language}` as keyof typeof doctor.specialty;
    return (doctor.specialty[key] as string) || doctor.specialty.name_en;
  };

  const languageLabels: Record<string, string> = {
    ar: t('languages.ar'),
    ru: t('languages.ru'),
    en: t('languages.en'),
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          {doctor.profile?.avatar_url ? (
            <Image source={{ uri: doctor.profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={48} color={colors.white} />
          )}
        </View>
        <Text style={[styles.name, isRTL && styles.rtlText]}>
          {doctor.profile?.full_name}
        </Text>
        <Text style={[styles.specialtyText, isRTL && styles.rtlText]}>
          {getSpecialtyName()}
        </Text>
        {doctor.is_verified && (
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.verifiedText}>{t('doctor.verified')}</Text>
          </View>
        )}

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color={colors.star} />
          <Text style={styles.ratingValue}>{avgRating}</Text>
          <Text style={styles.ratingCount}>
            ({t('doctor.reviewCount', { count: reviews.length })})
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <Ionicons name="call" size={22} color={colors.primary} />
          <Text style={styles.actionText}>{t('doctor.call')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={22} color={colors.primary} />
          <Text style={styles.actionText}>{t('doctor.directions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? colors.error : colors.primary}
          />
          <Text style={styles.actionText}>
            {isFavorite ? t('doctor.removeFavorite') : t('doctor.addFavorite')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Request Appointment */}
      <TouchableOpacity
        style={styles.appointmentButton}
        onPress={() => navigation.navigate('AppointmentRequest', {
          doctorId,
          doctorName: doctor.profile?.full_name || '',
        })}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.white} />
        <Text style={styles.appointmentButtonText}>
          {t('appointment.requestAppointment')}
        </Text>
      </TouchableOpacity>

      {/* Details */}
      <View style={styles.section}>
        <InfoRow
          icon="business-outline"
          label={t('doctor.clinic')}
          value={doctor.clinic_name}
          isRTL={isRTL}
        />
        <InfoRow
          icon="location-outline"
          label={t('doctor.address')}
          value={doctor.clinic_address}
          isRTL={isRTL}
        />
        <InfoRow
          icon="call-outline"
          label={t('doctor.phone')}
          value={doctor.phone}
          isRTL={isRTL}
        />
        <InfoRow
          icon="chatbubbles-outline"
          label={t('doctor.languages')}
          value={doctor.languages_spoken.map((l) => languageLabels[l] || l).join(', ')}
          isRTL={isRTL}
        />
      </View>

      {/* About */}
      {getLocalizedAbout() ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {t('doctor.about')}
          </Text>
          <Text style={[styles.aboutText, isRTL && styles.rtlText]}>
            {getLocalizedAbout()}
          </Text>
        </View>
      ) : null}

      {/* Map */}
      {doctor.latitude && doctor.longitude && Platform.OS === 'web' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {t('doctor.directions')}
          </Text>
          <View style={styles.mapContainer}>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${doctor.longitude - 0.01},${doctor.latitude - 0.005},${doctor.longitude + 0.01},${doctor.latitude + 0.005}&layer=mapnik&marker=${doctor.latitude},${doctor.longitude}`}
              style={{ border: 0, width: '100%', height: '100%', borderRadius: 12 } as any}
            />
          </View>
        </View>
      )}

      {/* Reviews */}
      <View style={styles.section}>
        <View style={[styles.reviewHeader, isRTL && styles.rowRTL]}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {t('doctor.reviews')} ({reviews.length})
          </Text>
          <TouchableOpacity
            style={styles.writeReviewBtn}
            onPress={() => navigation.navigate('WriteReview', { doctorId })}
          >
            <Text style={styles.writeReviewText}>{t('doctor.writeReview')}</Text>
          </TouchableOpacity>
        </View>

        {reviews.length === 0 ? (
          <Text style={[styles.noReviews, isRTL && styles.rtlText]}>
            {t('doctor.noReviews')}
          </Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={[styles.reviewTopRow, isRTL && styles.rowRTL]}>
                <Text style={[styles.reviewerName, isRTL && styles.rtlText]}>
                  {review.patient?.full_name || 'Anonymous'}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating ? 'star' : 'star-outline'}
                      size={14}
                      color={colors.star}
                    />
                  ))}
                </View>
              </View>
              <Text style={[styles.reviewComment, isRTL && styles.rtlText]}>
                {review.comment}
              </Text>
              <Text style={styles.reviewDate}>
                {new Date(review.created_at).toLocaleDateString(i18n.language)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isRTL,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isRTL: boolean;
}) {
  if (!value) return null;
  return (
    <View style={[infoStyles.row, isRTL && infoStyles.rowRTL]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={[infoStyles.textContainer, isRTL && infoStyles.textContainerRTL]}>
        <Text style={[infoStyles.label, isRTL && infoStyles.rtlText]}>{label}</Text>
        <Text style={[infoStyles.value, isRTL && infoStyles.rtlText]}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  textContainerRTL: {
    marginLeft: 0,
    marginRight: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

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
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    backgroundColor: colors.primary,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  specialtyText: {
    fontSize: fontSize.md,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  verifiedText: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  ratingCount: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  appointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  appointmentButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  aboutText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  mapContainer: {
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  writeReviewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  writeReviewText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  noReviews: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewerName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  reviewDate: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
});
