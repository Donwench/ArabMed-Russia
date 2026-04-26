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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { DoctorSuggestion } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';
import { useToast } from '../components/Toast';

type TabType = 'suggestions' | 'doctors' | 'stats';

export default function AdminPanelScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>('suggestions');
  const [suggestions, setSuggestions] = useState<DoctorSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    verifiedDoctors: 0,
    scrapedDoctors: 0,
    manualDoctors: 0,
    pendingSuggestions: 0,
    totalCities: 0,
  });

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [doctorsRes, verifiedRes, scrapedRes, manualRes, suggestionsRes] = await Promise.all([
        supabase.from('doctors').select('id', { count: 'exact', head: true }),
        supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('doctors').select('id', { count: 'exact', head: true }).neq('source', 'manual'),
        supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('source', 'manual'),
        supabase.from('doctor_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        totalDoctors: doctorsRes.count || 0,
        verifiedDoctors: verifiedRes.count || 0,
        scrapedDoctors: scrapedRes.count || 0,
        manualDoctors: manualRes.count || 0,
        pendingSuggestions: suggestionsRes.count || 0,
        totalCities: 15,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSuggestions(), fetchStats()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchSuggestions, fetchStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSuggestionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('doctor_suggestions')
        .update({
          status,
          reviewed_by: userData.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      showToast(
        t('admin.updated'),
        status === 'approved' ? t('admin.suggestionApproved') : t('admin.suggestionRejected'),
        'success'
      );
      fetchSuggestions();
      fetchStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast(t('common.error'), message, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      case 'duplicate': return colors.textLight;
      default: return colors.textSecondary;
    }
  };

  const renderSuggestionCard = ({ item }: { item: DoctorSuggestion }) => (
    <View style={[styles.card, shadows.sm]}>
      <View style={[styles.cardHeader, isRTL && styles.rowRTL]}>
        <Text style={[styles.cardTitle, isRTL && styles.rtlText]} numberOfLines={1}>
          {item.doctor_name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {t(`admin.status.${item.status}`)}
          </Text>
        </View>
      </View>

      {item.specialty ? (
        <Text style={[styles.cardDetail, isRTL && styles.rtlText]}>
          {item.specialty}
        </Text>
      ) : null}

      {item.city ? (
        <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{item.city}</Text>
        </View>
      ) : null}

      {item.clinic_name ? (
        <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
          <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{item.clinic_name}</Text>
        </View>
      ) : null}

      {item.languages ? (
        <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
          <Ionicons name="chatbubbles-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{item.languages}</Text>
        </View>
      ) : null}

      {item.notes ? (
        <Text style={[styles.notesText, isRTL && styles.rtlText]} numberOfLines={3}>
          {item.notes}
        </Text>
      ) : null}

      <Text style={styles.dateText}>
        {new Date(item.created_at).toLocaleDateString(i18n.language)}
      </Text>

      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => updateSuggestionStatus(item.id, 'approved')}
          >
            <Ionicons name="checkmark" size={18} color={colors.white} />
            <Text style={styles.actionBtnText}>{t('admin.approve')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => updateSuggestionStatus(item.id, 'rejected')}
          >
            <Ionicons name="close" size={18} color={colors.white} />
            <Text style={styles.actionBtnText}>{t('admin.reject')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStatsCard = (icon: keyof typeof Ionicons.glyphMap, label: string, value: number, color: string) => (
    <View style={[styles.statCard, shadows.sm]}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, isRTL && styles.rtlText]}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
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
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
          {t('admin.title')}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['suggestions', 'stats'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {t(`admin.tabs.${tab}`)}
              {tab === 'suggestions' && stats.pendingSuggestions > 0 && (
                ` (${stats.pendingSuggestions})`
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'suggestions' ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderSuggestionCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>{t('admin.noSuggestions')}</Text>
            </View>
          }
        />
      ) : (
        <ScrollableStats stats={stats} isRTL={isRTL} renderStatsCard={renderStatsCard} t={t} />
      )}
    </View>
  );
}

function ScrollableStats({
  stats,
  isRTL,
  renderStatsCard,
  t,
}: {
  stats: {
    totalDoctors: number;
    verifiedDoctors: number;
    scrapedDoctors: number;
    manualDoctors: number;
    pendingSuggestions: number;
    totalCities: number;
  };
  isRTL: boolean;
  renderStatsCard: (icon: keyof typeof Ionicons.glyphMap, label: string, value: number, color: string) => React.ReactNode;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.statsGrid}>
      {renderStatsCard('people', t('admin.stats.totalDoctors'), stats.totalDoctors, colors.primary)}
      {renderStatsCard('checkmark-circle', t('admin.stats.verified'), stats.verifiedDoctors, colors.success)}
      {renderStatsCard('cloud-download', t('admin.stats.scraped'), stats.scrapedDoctors, '#8B5CF6')}
      {renderStatsCard('person-add', t('admin.stats.manual'), stats.manualDoctors, '#F59E0B')}
      {renderStatsCard('document-text', t('admin.stats.pending'), stats.pendingSuggestions, colors.error)}
      {renderStatsCard('location', t('admin.stats.cities'), stats.totalCities, '#06B6D4')}
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
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'capitalize',
  },
  cardDetail: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  approveBtn: {
    backgroundColor: colors.success,
  },
  rejectBtn: {
    backgroundColor: colors.error,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: '47%',
  },
  statValue: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
