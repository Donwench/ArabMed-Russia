import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Doctor } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  specialtyName?: string;
}

export default function DoctorCard({ doctor, onPress, specialtyName }: DoctorCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const getLocalizedName = () => {
    // Scraped doctors have full_name directly; manual doctors use profile
    if (doctor.full_name) return doctor.full_name;
    return doctor.profile?.full_name || '';
  };

  const getLocalizedAbout = () => {
    const key = `about_${i18n.language}` as keyof Doctor;
    return (doctor[key] as string) || doctor.about_en || doctor.about_ar || '';
  };

  const getPhotoUrl = () => {
    return doctor.photo_url || doctor.profile?.avatar_url || null;
  };

  const getDisplayRating = () => {
    if (doctor.avg_rating && doctor.avg_rating > 0) return doctor.avg_rating;
    if (doctor.external_rating && doctor.external_rating > 0) return doctor.external_rating;
    return 0;
  };

  const getDisplayReviewCount = () => {
    if (doctor.review_count && doctor.review_count > 0) return doctor.review_count;
    if (doctor.external_review_count && doctor.external_review_count > 0) return doctor.external_review_count;
    return 0;
  };

  const languageLabels: Record<string, string> = {
    ar: t('languages.ar'),
    ru: t('languages.ru'),
    en: t('languages.en'),
    fr: t('languages.fr'),
    tr: t('languages.tr'),
  };

  return (
    <TouchableOpacity style={[styles.card, shadows.md]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.row, isRTL && styles.rowRTL]}>
        <View style={styles.avatarContainer}>
          {getPhotoUrl() ? (
            <Image source={{ uri: getPhotoUrl()! }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={28} color={colors.white} />
            </View>
          )}
          {doctor.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            </View>
          )}
        </View>

        <View style={[styles.info, isRTL && styles.infoRTL]}>
          <Text style={[styles.name, isRTL && styles.rtlText]} numberOfLines={1}>
            {getLocalizedName()}
          </Text>

          {specialtyName && (
            <Text style={[styles.specialty, isRTL && styles.rtlText]} numberOfLines={1}>
              {specialtyName}
            </Text>
          )}

          <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, isRTL && styles.rtlText]} numberOfLines={1}>
              {doctor.clinic_name || doctor.clinic_address}
            </Text>
          </View>

          <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, isRTL && styles.rtlText]} numberOfLines={1}>
              {doctor.languages_spoken.map((l) => languageLabels[l] || l).join(', ')}
            </Text>
          </View>

          {getDisplayRating() > 0 && (
            <View style={[styles.ratingRow, isRTL && styles.rowRTL]}>
              <Ionicons name="star" size={14} color={colors.star} />
              <Text style={styles.ratingText}>{getDisplayRating().toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({getDisplayReviewCount()})
              </Text>
              {doctor.source && doctor.source !== 'manual' && (
                <Text style={styles.sourceTag}>{doctor.source}</Text>
              )}
            </View>
          )}
        </View>

        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={20}
          color={colors.textLight}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoRTL: {
    marginLeft: 0,
    marginRight: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  specialty: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  detailText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  reviewCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sourceTag: {
    fontSize: 10,
    color: colors.white,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
