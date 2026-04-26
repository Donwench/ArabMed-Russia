import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Doctor, Specialty, RootStackParamList } from '../types';
import { colors, spacing, fontSize, fontWeight } from '../lib/theme';
import DoctorCard from '../components/DoctorCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FavoritesScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const isRTL = i18n.language === 'ar';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getSpecialtyName = (specialty: Specialty) => {
    const key = `name_${i18n.language}` as keyof Specialty;
    return (specialty[key] as string) || specialty.name_en;
  };

  const fetchFavorites = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select('doctor_id')
        .eq('patient_id', userData.user.id);

      if (favsError) throw favsError;
      if (!favs || favs.length === 0) {
        setDoctors([]);
        return;
      }

      const doctorIds = favs.map((f: any) => f.doctor_id);
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(*),
          specialty:specialties(*)
        `)
        .in('id', doctorIds);

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchFavorites();
    }, [fetchFavorites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
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
          {t('favorites.title')}
        </Text>
      </View>

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
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyText, isRTL && styles.rtlText]}>
              {t('favorites.empty')}
            </Text>
            <Text style={[styles.emptySubtext, isRTL && styles.rtlText]}>
              {t('favorites.emptySubtitle')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  listContent: {
    paddingVertical: spacing.sm,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
