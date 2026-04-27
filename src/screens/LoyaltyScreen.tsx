import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import {
  LoyaltyInfo,
  LoyaltyTier,
  LOYALTY_TIERS,
  POINT_ACTIONS,
  getUserLoyaltyInfo,
  generateReferralCode,
} from '../lib/loyalty';

const TIER_ICONS: Record<LoyaltyTier, string> = {
  bronze: 'shield-outline',
  silver: 'shield-half-outline',
  gold: 'shield',
};

export default function LoyaltyScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [loyalty, setLoyalty] = useState<LoyaltyInfo | null>(null);
  const [history, setHistory] = useState<Array<{ action: string; points: number; description: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const info = await getUserLoyaltyInfo(userData.user.id);

    if (!info.referralCode) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = generateReferralCode();
        const { error } = await supabase.from('referral_codes').insert({
          user_id: userData.user.id,
          code,
          used_count: 0,
        });
        if (!error) {
          info.referralCode = code;
          break;
        }
      }
    }

    setLoyalty(info);

    const { data: historyData } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setHistory(historyData || []);
    setLoading(false);
  };

  const handleShareReferral = async () => {
    if (!loyalty?.referralCode) return;
    try {
      await Share.share({
        message: t('loyalty.shareMessage', { code: loyalty.referralCode }),
      });
    } catch {
      showToast(t('common.error'), undefined, 'error');
    }
  };

  const tierColor = loyalty ? LOYALTY_TIERS[loyalty.tier].color : colors.textLight;
  const progress = loyalty && loyalty.nextTier
    ? ((loyalty.totalPoints - LOYALTY_TIERS[loyalty.tier].minPoints) /
       (LOYALTY_TIERS[loyalty.nextTier].minPoints - LOYALTY_TIERS[loyalty.tier].minPoints)) * 100
    : 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t('loyalty.title')}</Text>
        </View>

        {/* Tier Card */}
        <View style={[styles.tierCard, { borderColor: tierColor }]}>
          <View style={styles.tierCardHeader}>
            <Ionicons name={(TIER_ICONS[loyalty?.tier || 'bronze']) as any} size={40} color={tierColor} />
            <View style={{ marginLeft: spacing.md }}>
              <Text style={styles.tierLabel}>{t('loyalty.currentTier')}</Text>
              <Text style={[styles.tierName, { color: tierColor }]}>
                {t(`loyalty.tiers.${loyalty?.tier || 'bronze'}`)}
              </Text>
            </View>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>{loyalty?.totalPoints || 0}</Text>
            <Text style={styles.pointsLabel}>{t('loyalty.points')}</Text>
          </View>

          {/* Progress Bar */}
          {loyalty?.nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: tierColor }]} />
              </View>
              <Text style={styles.progressText}>
                {t('loyalty.pointsToNext', { points: loyalty.pointsToNextTier, tier: t(`loyalty.tiers.${loyalty.nextTier}`) })}
              </Text>
            </View>
          )}
          {!loyalty?.nextTier && loyalty && (
            <Text style={[styles.maxTierText, { color: tierColor }]}>{t('loyalty.maxTier')}</Text>
          )}
        </View>

        {/* Referral Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('loyalty.referFriend')}</Text>
          <Text style={[styles.sectionSubtitle, isRTL && styles.rtlText]}>{t('loyalty.referDescription')}</Text>
          <View style={[styles.referralCodeRow, isRTL && styles.rowRTL]}>
            <View style={styles.referralCodeBox}>
              <Text style={styles.referralCode}>{loyalty?.referralCode || '...'}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareReferral}>
              <Ionicons name="share-outline" size={20} color={colors.white} />
              <Text style={styles.shareButtonText}>{t('loyalty.share')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.referralCount, isRTL && styles.rtlText]}>
            {t('loyalty.referralCount', { count: loyalty?.referralCount || 0 })}
          </Text>
        </View>

        {/* How to Earn */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('loyalty.howToEarn')}</Text>
          {Object.entries(POINT_ACTIONS).map(([action, points]) => (
            <View key={action} style={[styles.earnRow, isRTL && styles.rowRTL]}>
              <View style={styles.earnIconBox}>
                <Ionicons
                  name={
                    action === 'daily_login' ? 'today-outline' :
                    action === 'write_review' ? 'star-outline' :
                    action === 'refer_friend' ? 'people-outline' :
                    action === 'book_appointment' ? 'calendar-outline' :
                    action === 'complete_profile' ? 'person-outline' :
                    'bulb-outline'
                  }
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.earnAction, isRTL && styles.rtlText, { flex: 1 }]}>
                {t(`loyalty.actions.${action}`)}
              </Text>
              <Text style={styles.earnPoints}>+{points}</Text>
            </View>
          ))}
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('loyalty.history')}</Text>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="time-outline" size={32} color={colors.textLight} />
              <Text style={styles.emptyText}>{t('loyalty.noHistory')}</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={index} style={[styles.historyRow, isRTL && styles.rowRTL]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyAction, isRTL && styles.rtlText]}>{item.description}</Text>
                  <Text style={[styles.historyDate, isRTL && styles.rtlText]}>
                    {new Date(item.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
                  </Text>
                </View>
                <Text style={[styles.historyPoints, { color: item.points > 0 ? colors.success : colors.error }]}>
                  {item.points > 0 ? '+' : ''}{item.points}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Tier Benefits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('loyalty.tierBenefits')}</Text>
          {(['bronze', 'silver', 'gold'] as LoyaltyTier[]).map((tier) => (
            <View key={tier} style={[styles.tierBenefitRow, loyalty?.tier === tier && styles.tierBenefitActive]}>
              <Ionicons name={(TIER_ICONS[tier]) as any} size={24} color={LOYALTY_TIERS[tier].color} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.tierBenefitName, { color: LOYALTY_TIERS[tier].color }]}>
                  {t(`loyalty.tiers.${tier}`)} ({LOYALTY_TIERS[tier].minPoints}+ {t('loyalty.pts')})
                </Text>
                <Text style={styles.tierBenefitDesc}>{t(`loyalty.benefits.${tier}`)}</Text>
              </View>
              {loyalty?.tier === tier && (
                <View style={[styles.currentBadge, { backgroundColor: LOYALTY_TIERS[tier].color }]}>
                  <Text style={styles.currentBadgeText}>{t('loyalty.current')}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  tierCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    ...shadows.md,
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tierLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tierName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pointsValue: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  pointsLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  maxTierText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  referralCodeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  referralCode: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: 2,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  referralCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  earnIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  earnAction: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  earnPoints: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  historyAction: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  historyDate: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  historyPoints: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  tierBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  tierBenefitActive: {
    backgroundColor: colors.surfaceVariant,
  },
  tierBenefitName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  tierBenefitDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
