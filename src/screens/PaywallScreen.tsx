import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../lib/theme';
import { useToast } from '../components/Toast';
import { SubscriptionTier, SUBSCRIPTION_PRICES, DOCTOR_FEE } from '../lib/subscription';
import { PAYMENT_CONFIG, PaymentMethod, DOCTOR_FEES, USER_TIERS, getPayPalLink, getUSDTPaymentInfo, createDoctorPayment } from '../lib/payments';
import { supabase } from '../lib/supabase';

type BillingPeriod = 'monthly' | 'yearly';

interface PlanFeature {
  key: string;
  free: boolean | string;
  premium: boolean | string;
  doctorPro: boolean | string;
}

export default function PaywallScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('premium');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  const features: PlanFeature[] = [
    { key: 'subscription.features.browseDoctors', free: t('subscription.features.limitedPerDay', { count: 10 }), premium: t('subscription.features.unlimited'), doctorPro: t('subscription.features.unlimited') },
    { key: 'subscription.features.favorites', free: '5', premium: t('subscription.features.unlimited'), doctorPro: t('subscription.features.unlimited') },
    { key: 'subscription.features.writeReviews', free: false, premium: true, doctorPro: true },
    { key: 'subscription.features.advancedFilters', free: false, premium: true, doctorPro: true },
    { key: 'subscription.features.adFree', free: false, premium: true, doctorPro: true },
    { key: 'subscription.features.prioritySupport', free: false, premium: true, doctorPro: true },
    { key: 'subscription.features.featuredListing', free: false, premium: false, doctorPro: true },
    { key: 'subscription.features.analytics', free: false, premium: false, doctorPro: true },
  ];

  const getPrice = (tier: 'premium' | 'doctor_pro') => {
    const prices = SUBSCRIPTION_PRICES[tier];
    return billingPeriod === 'monthly' ? prices.monthly : prices.yearly;
  };

  const getSavings = (tier: 'premium' | 'doctor_pro') => {
    const prices = SUBSCRIPTION_PRICES[tier];
    const monthlyTotal = prices.monthly * 12;
    const savings = Math.round(((monthlyTotal - prices.yearly) / monthlyTotal) * 100);
    return savings;
  };

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('yookassa');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleSubscribe = async () => {
    setPaymentLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        showToast(t('common.error'), undefined, 'error');
        return;
      }

      if (selectedPayment === 'yookassa') {
        const tierKey = selectedTier === 'free' ? 'premium' : selectedTier;
        const rubAmount = tierKey === 'premium'
          ? (billingPeriod === 'monthly' ? USER_TIERS.premium.price : USER_TIERS.premium.price * 10)
          : (billingPeriod === 'monthly' ? USER_TIERS.doctor_pro.price : USER_TIERS.doctor_pro.price * 10);
        const result = await createDoctorPayment(userData.user.id, 'user_subscription', rubAmount);
        if (result) {
          showToast(t('subscription.paymentCreated'), t('subscription.redirecting'), 'success');
          await Linking.openURL(result.checkoutUrl);
        } else {
          showToast(t('common.error'), undefined, 'error');
        }
      } else if (selectedPayment === 'paypal') {
        const link = getPayPalLink(getPrice(selectedTier === 'free' ? 'premium' : selectedTier as 'premium' | 'doctor_pro'));
        if (link) {
          await Linking.openURL(link);
        } else {
          showToast(t('subscription.paypalNotConfigured'), undefined, 'error');
        }
      } else if (selectedPayment === 'usdt') {
        const info = getUSDTPaymentInfo();
        if (info.address) {
          if (Platform.OS === 'web') {
            await navigator.clipboard.writeText(info.address);
          }
          showToast(t('subscription.usdtAddress'), info.address, 'info');
        } else {
          showToast(t('subscription.cryptoNotConfigured'), undefined, 'error');
        }
      }
    } catch {
      showToast(t('common.error'), undefined, 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRestore = () => {
    showToast(t('subscription.restoreInfo'), undefined, 'info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="diamond" size={48} color={colors.secondary} />
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t('subscription.title')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('subscription.subtitle')}</Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingOption, billingPeriod === 'monthly' && styles.billingActive]}
            onPress={() => setBillingPeriod('monthly')}
          >
            <Text style={[styles.billingText, billingPeriod === 'monthly' && styles.billingTextActive]}>
              {t('subscription.monthly')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billingPeriod === 'yearly' && styles.billingActive]}
            onPress={() => setBillingPeriod('yearly')}
          >
            <Text style={[styles.billingText, billingPeriod === 'yearly' && styles.billingTextActive]}>
              {t('subscription.yearly')}
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>{t('subscription.savePercent', { percent: getSavings('premium') })}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        <View style={styles.plansRow}>
          {/* Premium Card */}
          <TouchableOpacity
            style={[styles.planCard, selectedTier === 'premium' && styles.planCardSelected]}
            onPress={() => setSelectedTier('premium')}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{t('subscription.popular')}</Text>
            </View>
            <Ionicons name="star" size={28} color={colors.primary} />
            <Text style={styles.planName}>{t('subscription.plans.premium')}</Text>
            <Text style={styles.planPrice}>
              ${getPrice('premium')}
              <Text style={styles.planPeriod}>/{billingPeriod === 'monthly' ? t('subscription.mo') : t('subscription.yr')}</Text>
            </Text>
          </TouchableOpacity>

          {/* Doctor Pro Card */}
          <TouchableOpacity
            style={[styles.planCard, selectedTier === 'doctor_pro' && styles.planCardSelected]}
            onPress={() => setSelectedTier('doctor_pro')}
          >
            <View style={[styles.planBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.planBadgeText}>{t('subscription.forDoctors')}</Text>
            </View>
            <Ionicons name="medical" size={28} color={colors.secondary} />
            <Text style={styles.planName}>{t('subscription.plans.doctorPro')}</Text>
            <Text style={styles.planPrice}>
              ${getPrice('doctor_pro')}
              <Text style={styles.planPeriod}>/{billingPeriod === 'monthly' ? t('subscription.mo') : t('subscription.yr')}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Comparison */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, isRTL && styles.rtlText]}>{t('subscription.whatsIncluded')}</Text>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureRow, isRTL && styles.rowRTL]}>
              <Text style={[styles.featureLabel, isRTL && styles.rtlText, { flex: 1 }]}>{t(feature.key)}</Text>
              <View style={styles.featureValue}>
                {typeof (selectedTier === 'premium' ? feature.premium : selectedTier === 'doctor_pro' ? feature.doctorPro : feature.free) === 'boolean' ? (
                  (selectedTier === 'premium' ? feature.premium : selectedTier === 'doctor_pro' ? feature.doctorPro : feature.free) ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : (
                    <Ionicons name="close-circle" size={20} color={colors.textLight} />
                  )
                ) : (
                  <Text style={styles.featureValueText}>
                    {selectedTier === 'premium' ? feature.premium : selectedTier === 'doctor_pro' ? feature.doctorPro : feature.free}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Free Trial */}
        <View style={styles.trialBanner}>
          <Ionicons name="gift-outline" size={24} color={colors.primary} />
          <Text style={[styles.trialText, isRTL && styles.rtlText]}>{t('subscription.freeTrial')}</Text>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeButtonText}>
            {t('subscription.subscribe', { plan: selectedTier === 'premium' ? t('subscription.plans.premium') : t('subscription.plans.doctorPro') })}
          </Text>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>{t('subscription.restore')}</Text>
        </TouchableOpacity>

        <Text style={[styles.legalText, isRTL && styles.rtlText]}>{t('subscription.legalNote')}</Text>

        {/* Doctor Registration Fee Section */}
        <View style={styles.doctorFeeSection}>
          <View style={[styles.doctorFeeHeader, isRTL && styles.rowRTL]}>
            <Ionicons name="medical" size={24} color={colors.secondary} />
            <Text style={[styles.doctorFeeTitle, isRTL && styles.rtlText]}>
              {t('subscription.doctorFee.title')}
            </Text>
          </View>
          <Text style={[styles.doctorFeeDesc, isRTL && styles.rtlText]}>
            {t('subscription.doctorFee.description')}
          </Text>
          <View style={styles.doctorFeeItems}>
            <View style={[styles.doctorFeeRow, isRTL && styles.rowRTL]}>
              <View style={styles.doctorFeeBullet}>
                <Ionicons name="card-outline" size={16} color={colors.white} />
              </View>
              <Text style={[styles.doctorFeeText, isRTL && styles.rtlText, { flex: 1 }]}>
                {t('subscription.doctorFee.registration')}
              </Text>
              <Text style={styles.doctorFeeAmount}>{DOCTOR_FEE.registrationFee} ₽</Text>
            </View>
            <View style={[styles.doctorFeeRow, isRTL && styles.rowRTL]}>
              <View style={styles.doctorFeeBullet}>
                <Ionicons name="calendar-outline" size={16} color={colors.white} />
              </View>
              <Text style={[styles.doctorFeeText, isRTL && styles.rtlText, { flex: 1 }]}>
                {t('subscription.doctorFee.monthly')}
              </Text>
              <Text style={styles.doctorFeeAmount}>{DOCTOR_FEE.monthlySubscription} ₽/{t('subscription.mo')}</Text>
            </View>
          </View>
          <View style={styles.doctorTrialBanner}>
            <Ionicons name="gift-outline" size={18} color={colors.primary} />
            <Text style={[styles.doctorTrialText, isRTL && styles.rtlText]}>
              {t('subscription.doctorFee.trial', { days: DOCTOR_FEE.trialDays })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  billingOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  billingActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  billingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  billingTextActive: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  saveBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  plansRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDFA',
  },
  planBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  planPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  planPeriod: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
  },
  featuresSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  featuresTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  featureLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  featureValue: {
    width: 60,
    alignItems: 'center',
  },
  featureValueText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDFA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  trialText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primaryDark,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subscribeButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  restoreButton: {
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  restoreText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  legalText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  doctorFeeSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  doctorFeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  doctorFeeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  doctorFeeDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  doctorFeeItems: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  doctorFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  doctorFeeBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorFeeText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  doctorFeeAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.secondary,
  },
  doctorTrialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  doctorTrialText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
