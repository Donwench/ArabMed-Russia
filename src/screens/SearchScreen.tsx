import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Doctor, Specialty, City, RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';
import DoctorCard from '../components/DoctorCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const isRTL = i18n.language === 'ar';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const getSpecialtyName = (specialty: Specialty) => {
    const key = `name_${i18n.language}` as keyof Specialty;
    return (specialty[key] as string) || specialty.name_en;
  };

  const getCityName = (city: City) => {
    const key = `name_${i18n.language}` as keyof City;
    return (city[key] as string) || city.name_en;
  };

  useEffect(() => {
    const fetchFilters = async () => {
      const [specRes, cityRes] = await Promise.all([
        supabase.from('specialties').select('*').order('name_en'),
        supabase.from('cities').select('*').order('name_en'),
      ]);
      setSpecialties(specRes.data || []);
      setCities(cityRes.data || []);
    };
    fetchFilters();
  }, []);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      let query = supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*),
          specialty:specialties(*)
        `)
        .eq('is_verified', true);

      if (selectedSpecialty) {
        query = query.eq('specialty_id', selectedSpecialty);
      }

      if (selectedLanguage) {
        query = query.contains('languages_spoken', [selectedLanguage]);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];

      // Client-side filtering for city and search query
      if (selectedCity) {
        const city = cities.find((c) => c.id === selectedCity);
        if (city) {
          const cityNames = [
            city.name_en.toLowerCase(),
            city.name_ru.toLowerCase(),
            city.name_ar.toLowerCase(),
          ];
          results = results.filter((d: any) => {
            const addr = d.clinic_address?.toLowerCase() || '';
            const cityName = d.city_name?.toLowerCase() || '';
            return cityNames.some((name) => addr.includes(name) || cityName.includes(name));
          });
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        results = results.filter(
          (d: any) =>
            d.full_name?.toLowerCase().includes(q) ||
            d.full_name_ru?.toLowerCase().includes(q) ||
            d.profile?.full_name?.toLowerCase().includes(q) ||
            d.clinic_name?.toLowerCase().includes(q) ||
            d.clinic_address?.toLowerCase().includes(q) ||
            d.specialty_text?.toLowerCase().includes(q) ||
            d.city_name?.toLowerCase().includes(q)
        );
      }

      setDoctors(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSpecialty, selectedCity, selectedLanguage, cities]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery || selectedSpecialty || selectedCity || selectedLanguage) {
        performSearch();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedSpecialty, selectedCity, selectedLanguage, performSearch]);

  const languages = [
    { code: 'ar', label: t('languages.ar') },
    { code: 'ru', label: t('languages.ru') },
    { code: 'en', label: t('languages.en') },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Text style={[styles.screenTitle, isRTL && styles.rtlText]}>
          {t('search.title')}
        </Text>
        <View style={[styles.searchContainer, isRTL && styles.rowRTL]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, isRTL && styles.rtlInput]}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        {/* City Filter */}
        <Text style={[styles.filterLabel, isRTL && styles.rtlText]}>
          {t('search.filterByCity')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !selectedCity && styles.chipActive]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={[styles.chipText, !selectedCity && styles.chipTextActive]}>
              {t('search.allCities')}
            </Text>
          </TouchableOpacity>
          {cities.map((city) => (
            <TouchableOpacity
              key={city.id}
              style={[styles.chip, selectedCity === city.id && styles.chipActive]}
              onPress={() => setSelectedCity(selectedCity === city.id ? null : city.id)}
            >
              <Text style={[styles.chipText, selectedCity === city.id && styles.chipTextActive]}>
                {getCityName(city)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Language Filter */}
        <Text style={[styles.filterLabel, isRTL && styles.rtlText]}>
          {t('search.filterByLanguage')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.chip, selectedLanguage === lang.code && styles.chipActive]}
              onPress={() =>
                setSelectedLanguage(selectedLanguage === lang.code ? null : lang.code)
              }
            >
              <Text
                style={[
                  styles.chipText,
                  selectedLanguage === lang.code && styles.chipTextActive,
                ]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.id })}
              specialtyName={item.specialty ? getSpecialtyName(item.specialty) : undefined}
            />
          )}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyText}>{t('common.noResults')}</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
  searchSection: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
  },
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  rowRTL: {
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
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  filtersSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipScroll: {
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
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
  listContent: {
    paddingVertical: spacing.sm,
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
