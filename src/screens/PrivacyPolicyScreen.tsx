import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../lib/theme';

export default function PrivacyPolicyScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const isRTL = i18n.language === 'ar';

  const sections = [
    { title: t('legal.privacy.sections.dataCollected.title'), body: t('legal.privacy.sections.dataCollected.body') },
    { title: t('legal.privacy.sections.purpose.title'), body: t('legal.privacy.sections.purpose.body') },
    { title: t('legal.privacy.sections.storage.title'), body: t('legal.privacy.sections.storage.body') },
    { title: t('legal.privacy.sections.thirdParty.title'), body: t('legal.privacy.sections.thirdParty.body') },
    { title: t('legal.privacy.sections.userRights.title'), body: t('legal.privacy.sections.userRights.body') },
    { title: t('legal.privacy.sections.children.title'), body: t('legal.privacy.sections.children.body') },
    { title: t('legal.privacy.sections.changes.title'), body: t('legal.privacy.sections.changes.body') },
    { title: t('legal.privacy.sections.contact.title'), body: t('legal.privacy.sections.contact.body') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t('legal.privacy.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, isRTL && styles.rtlText]}>{t('legal.privacy.lastUpdated')}</Text>
        <Text style={[styles.intro, isRTL && styles.rtlText]}>{t('legal.privacy.intro')}</Text>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{`${index + 1}. ${section.title}`}</Text>
            <Text style={[styles.sectionBody, isRTL && styles.rtlText]}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.complianceBadge}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.complianceText}>{t('legal.privacy.compliance')}</Text>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  lastUpdated: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  intro: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDFA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  complianceText: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
});
