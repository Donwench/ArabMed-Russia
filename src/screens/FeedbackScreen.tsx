import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../lib/theme';

const FEEDBACK_TYPES = ['bug', 'feature', 'general'] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number];

export default function FeedbackScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const typeIcons: Record<FeedbackType, keyof typeof Ionicons.glyphMap> = {
    bug: 'bug-outline',
    feature: 'bulb-outline',
    general: 'chatbubble-outline',
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      showToast(t('common.error'), t('feedback.emptyMessage'), 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('feedback').insert({
        user_id: userData.user?.id || null,
        type,
        message: message.trim(),
        email: email.trim() || null,
        language: i18n.language,
      });

      if (error) throw error;

      showToast(t('feedback.successTitle'), t('feedback.successMessage'), 'success');
      setMessage('');
      setEmail('');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      showToast(t('common.error'), error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t('feedback.title')}</Text>
        </View>

        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('feedback.subtitle')}</Text>

        {/* Feedback Type Selector */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t('feedback.typeLabel')}</Text>
        <View style={styles.typeRow}>
          {FEEDBACK_TYPES.map((ft) => (
            <TouchableOpacity
              key={ft}
              style={[styles.typeChip, type === ft && styles.typeChipSelected]}
              onPress={() => setType(ft)}
            >
              <Ionicons
                name={typeIcons[ft]}
                size={18}
                color={type === ft ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.typeChipText, type === ft && styles.typeChipTextSelected]}>
                {t(`feedback.types.${ft}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t('feedback.messageLabel')}</Text>
        <TextInput
          style={[styles.textArea, isRTL && styles.rtlInput]}
          placeholder={t('feedback.messagePlaceholder')}
          placeholderTextColor={colors.textLight}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Email (optional) */}
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t('feedback.emailLabel')}</Text>
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          placeholder={t('feedback.emailPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign={isRTL ? 'right' : 'left'}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={18} color={colors.white} />
              <Text style={styles.submitText}>{t('feedback.submit')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  rtlText: {
    textAlign: 'right',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeChipTextSelected: {
    color: colors.white,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 120,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  rtlInput: {
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
