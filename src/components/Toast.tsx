import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../lib/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICON_MAP: Record<ToastType, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { name: 'checkmark-circle', color: colors.success, bg: '#F0FDF4' },
  error: { name: 'alert-circle', color: colors.error, bg: '#FEF2F2' },
  info: { name: 'information-circle', color: colors.primary, bg: '#F0F9FF' },
  warning: { name: 'warning', color: colors.warning, bg: '#FFFBEB' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const { name, color, bg } = ICON_MAP[toast.type];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss(toast.id));
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity, transform: [{ translateY }] }]}>
      <Ionicons name={name} size={22} color={color} />
      <View style={styles.toastContent}>
        <Text style={[styles.toastTitle, { color }]}>{toast.title}</Text>
        {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => onDismiss(toast.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color={colors.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, title, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  toastContent: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  toastTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  toastMessage: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
