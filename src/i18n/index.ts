import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ar from './ar';
import ru from './ru';
import en from './en';

const resources = {
  ar: { translation: ar },
  ru: { translation: ru },
  en: { translation: en },
};

const getDefaultLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const lang = locales[0].languageCode;
    if (lang && ['ar', 'ru', 'en'].includes(lang)) {
      return lang;
    }
  }
  return 'ar';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDefaultLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
