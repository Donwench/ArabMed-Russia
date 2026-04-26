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

export default function TermsOfServiceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const isRTL = i18n.language === 'ar';

  const sections = [
    { title: t('legal.terms.sections.acceptance.title'), body: t('legal.terms.sections.acceptance.body') },
    { title: t('legal.terms.sections.description.title'), body: t('legal.terms.sections.description.body') },
    { title: t('legal.terms.sections.disclaimer.title'), body: t('legal.terms.sections.disclaimer.body') },
    { title: t('legal.terms.sections.accounts.title'), body: t('legal.terms.sections.accounts.body') },
    { title: t('legal.terms.sections.content.title'), body: t('legal.terms.sections.content.body') },
    { title: t('legal.terms.sections.subscriptions.title'), body: t('legal.terms.sections.subscriptions.body') },
    { title: t('legal.terms.sections.liability.title'), body: t('legal.terms.sections.liability.body') },
    { title: t('legal.terms.sections.governing.title'), body: t('legal.terms.sections.governing.body') },
    { title: t('legal.terms.sections.contact.title'), body: t('legal.terms.sections.contact.body') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t('legal.terms.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, isRTL && styles.rtlText]}>{t('legal.terms.lastUpdated')}</Text>

        <View style={styles.medicalDisclaimer}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <Text style={[styles.disclaimerText, isRTL && styles.rtlText]}>{t('legal.medicalDisclaimer')}</Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{`${index + 1}. ${section.title}`}</Text>
            <Text style={[styles.sectionBody, isRTL && styles.rtlText]}>{section.body}</Text>
          </View>
        ))}
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
  medicalDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: '#92400E',
    lineHeight: 20,
    fontWeight: fontWeight.medium,
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
});
