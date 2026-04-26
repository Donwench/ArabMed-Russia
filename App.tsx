import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import './src/i18n';
import AppNavigator from './src/navigation/AppNavigator';

// Enable RTL support globally
I18nManager.allowRTL(true);

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
