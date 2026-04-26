import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Doctor, Specialty, RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';
import DoctorCard from '../components/DoctorCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const isRTL = i18n.language === 'ar';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getSpecialtyName = (specialty: Specialty) => {
    const key = `name_${i18n.language}` as keyof Specialty;
    return (specialty[key] as string) || specialty.name_en;
  };

  const fetchDoctors = useCallback(async () => {
    try {
      let query = supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*),
          specialty:specialties(*)
        `)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (selectedSpecialty) {
        query = query.eq('specialty_id', selectedSpecialty);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch ratings
      const doctorIds = (data || []).map((d: any) => d.id);
      if (doctorIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('doctor_id, rating')
          .in('doctor_id', doctorIds);

        const ratingMap: Record<string, { sum: number; count: number }> = {};
        (reviews || []).forEach((r: any) => {
          if (!ratingMap[r.doctor_id]) {
            ratingMap[r.doctor_id] = { sum: 0, count: 0 };
          }
          ratingMap[r.doctor_id].sum += r.rating;
          ratingMap[r.doctor_id].count += 1;
        });

        const enriched = (data || []).map((d: any) => ({
          ...d,
          avg_rating: ratingMap[d.id] ? ratingMap[d.id].sum / ratingMap[d.id].count : 0,
          review_count: ratingMap[d.id]?.count || 0,
        }));

        setDoctors(enriched);
      } else {
        setDoctors(data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSpecialty]);

  const fetchSpecialties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name_en');
      if (error) throw error;
      setSpecialties(data || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  useEffect(() => {
    setLoading(true);
    fetchDoctors();
  }, [fetchDoctors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doctor.profile?.full_name?.toLowerCase().includes(q) ||
      doctor.clinic_name?.toLowerCase().includes(q) ||
      doctor.clinic_address?.toLowerCase().includes(q)
    );
  });

  const renderHeader = () => (
    <View>
      {/* App Title */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>
          {t('home.title')}
        </Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
          {t('home.subtitle')}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isRTL && styles.searchContainerRTL]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, isRTL && styles.rtlInput]}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign={isRTL ? 'right' : 'left'}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Specialty Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
        style={styles.chipScroll}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedSpecialty && styles.chipActive]}
          onPress={() => setSelectedSpecialty(null)}
        >
          <Text style={[styles.chipText, !selectedSpecialty && styles.chipTextActive]}>
            {t('home.allSpecialties')}
          </Text>
        </TouchableOpacity>
        {specialties.map((spec) => (
          <TouchableOpacity
            key={spec.id}
            style={[styles.chip, selectedSpecialty === spec.id && styles.chipActive]}
            onPress={() => setSelectedSpecialty(
              selectedSpecialty === spec.id ? null : spec.id
            )}
          >
            <Text
              style={[
                styles.chipText,
                selectedSpecialty === spec.id && styles.chipTextActive,
              ]}
            >
              {getSpecialtyName(spec)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsText, isRTL && styles.rtlText]}>
          {t('home.featuredDoctors')} ({filteredDoctors.length})
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <DoctorCard
            doctor={item}
            onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.id })}
            specialtyName={item.specialty ? getSpecialtyName(item.specialty) : undefined}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>{t('common.noResults')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
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
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  titleSection: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.primary,
    paddingTop: spacing.xxl + spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.primaryLight,
    marginBottom: spacing.md,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: -20,
    height: 48,
    ...shadows.md,
  },
  searchContainerRTL: {
    flexDirection: 'row-reverse',
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginHorizontal: spacing.sm,
    height: '100%',
  },
  rtlInput: {
    textAlign: 'right',
  },
  chipScroll: {
    marginTop: spacing.md,
  },
  chipContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  resultsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  resultsText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
