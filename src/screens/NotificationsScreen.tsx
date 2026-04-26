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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';

interface AppNotification {
  id: string;
  user_id: string;
  title_ar: string;
  title_ru: string;
  title_en: string;
  body_ar: string;
  body_ru: string;
  body_en: string;
  type: 'appointment' | 'review' | 'verification' | 'general';
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  appointment: { name: 'calendar', color: colors.primary },
  review: { name: 'star', color: colors.star },
  verification: { name: 'checkmark-circle', color: colors.success },
  general: { name: 'notifications', color: colors.secondary },
};

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getTitle = (notif: AppNotification) => {
    const key = `title_${i18n.language}` as keyof AppNotification;
    return (notif[key] as string) || notif.title_en;
  };

  const getBody = (notif: AppNotification) => {
    const key = `body_${i18n.language}` as keyof AppNotification;
    return (notif[key] as string) || notif.body_en;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return t('notifications.justNow');
    if (diffMin < 60) return t('notifications.minutesAgo', { count: diffMin });
    if (diffHour < 24) return t('notifications.hoursAgo', { count: diffHour });
    if (diffDay < 7) return t('notifications.daysAgo', { count: diffDay });
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const iconConfig = TYPE_ICONS[item.type] || TYPE_ICONS.general;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.is_read && styles.notifUnread]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifRow, isRTL && styles.rowRTL]}>
          <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + '20' }]}>
            <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
          </View>
          <View style={[styles.notifContent, isRTL && styles.notifContentRTL]}>
            <Text style={[styles.notifTitle, isRTL && styles.rtlText]} numberOfLines={1}>
              {getTitle(item)}
            </Text>
            <Text style={[styles.notifBody, isRTL && styles.rtlText]} numberOfLines={2}>
              {getBody(item)}
            </Text>
            <Text style={[styles.notifTime, isRTL && styles.rtlText]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
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
          {t('notifications.title')}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllRead}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>
              {t('notifications.empty')}
            </Text>
            <Text style={[styles.emptySubtitle, isRTL && styles.rtlText]}>
              {t('notifications.emptySubtitle')}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  markAllRead: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
    fontWeight: fontWeight.medium,
  },
  notifCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  notifUnread: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  notifContentRTL: {
    marginLeft: 0,
    marginRight: spacing.sm,
  },
  notifTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 4,
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
