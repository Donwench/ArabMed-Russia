import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import { RootStackParamList, MainTabParamList } from '../types';
import { colors } from '../lib/theme';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DoctorProfileScreen from '../screens/DoctorProfileScreen';
import WriteReviewScreen from '../screens/WriteReviewScreen';
import DoctorRegistrationScreen from '../screens/DoctorRegistrationScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import AppointmentRequestScreen from '../screens/AppointmentRequestScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SuggestDoctorScreen from '../screens/SuggestDoctorScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import PaywallScreen from '../screens/PaywallScreen';
import LoyaltyScreen from '../screens/LoyaltyScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home.title').split(' ')[0],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: t('common.search'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: t('appointment.myAppointments').split(' ')[0],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: t('favorites.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="DoctorProfile"
              component={DoctorProfileScreen}
              options={{ headerShown: true, headerTitle: '', headerTintColor: colors.white, headerTransparent: true }}
            />
            <Stack.Screen
              name="WriteReview"
              component={WriteReviewScreen}
              options={{ headerShown: true, headerTitle: '', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="DoctorRegistration"
              component={DoctorRegistrationScreen}
              options={{ headerShown: true, headerTitle: '', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Feedback"
              component={FeedbackScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AppointmentRequest"
              component={AppointmentRequestScreen}
              options={{ headerShown: true, headerTitle: '', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SuggestDoctor"
              component={SuggestDoctorScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminPanel"
              component={AdminPanelScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="Loyalty"
              component={LoyaltyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TermsOfService"
              component={TermsOfServiceScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
