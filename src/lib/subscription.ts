import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export type SubscriptionTier = 'free' | 'premium' | 'doctor_pro';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiresAt: string | null;
  isActive: boolean;
  trialEndsAt: string | null;
  isTrial: boolean;
}

export interface SubscriptionLimits {
  maxFavorites: number;
  maxDailySearches: number;
  canWriteReviews: boolean;
  canReplyToReviews: boolean;
  advancedFilters: boolean;
  adFree: boolean;
  prioritySupport: boolean;
  featuredListing: boolean;
  analyticsDashboard: boolean;
  verifiedBadgeFastTrack: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxFavorites: 5,
    maxDailySearches: 10,
    canWriteReviews: false,
    canReplyToReviews: false,
    advancedFilters: false,
    adFree: false,
    prioritySupport: false,
    featuredListing: false,
    analyticsDashboard: false,
    verifiedBadgeFastTrack: false,
  },
  premium: {
    maxFavorites: Infinity,
    maxDailySearches: Infinity,
    canWriteReviews: true,
    canReplyToReviews: false,
    advancedFilters: true,
    adFree: true,
    prioritySupport: true,
    featuredListing: false,
    analyticsDashboard: false,
    verifiedBadgeFastTrack: false,
  },
  doctor_pro: {
    maxFavorites: Infinity,
    maxDailySearches: Infinity,
    canWriteReviews: true,
    canReplyToReviews: true,
    advancedFilters: true,
    adFree: true,
    prioritySupport: true,
    featuredListing: true,
    analyticsDashboard: true,
    verifiedBadgeFastTrack: true,
  },
};

export function getLimits(tier: SubscriptionTier): SubscriptionLimits {
  return TIER_LIMITS[tier];
}

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return {
      tier: 'free',
      expiresAt: null,
      isActive: true,
      trialEndsAt: null,
      isTrial: false,
    };
  }

  const now = new Date();
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const isActive = !expiresAt || expiresAt > now;
  const trialEndsAt = data.trial_ends_at ? data.trial_ends_at : null;
  const isTrial = trialEndsAt ? new Date(trialEndsAt) > now : false;

  return {
    tier: isActive ? data.tier : 'free',
    expiresAt: data.expires_at,
    isActive,
    trialEndsAt,
    isTrial,
  };
}

export const SUBSCRIPTION_PRICES = {
  premium: { monthly: 3.99, yearly: 39.99 },
  doctor_pro: { monthly: 9.99, yearly: 99.99 },
};

export const DOCTOR_FEE = {
  registrationFee: 1000,
  monthlySubscription: 500,
  currency: 'RUB',
  trialDays: 7,
};

export interface DoctorSubscriptionInfo {
  isRegistered: boolean;
  registrationPaid: boolean;
  monthlyActive: boolean;
  trialEndsAt: string | null;
  isTrial: boolean;
  expiresAt: string | null;
}

export async function getDoctorSubscription(userId: string): Promise<DoctorSubscriptionInfo> {
  const { data } = await supabase
    .from('doctor_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return {
      isRegistered: false,
      registrationPaid: false,
      monthlyActive: false,
      trialEndsAt: null,
      isTrial: false,
      expiresAt: null,
    };
  }

  const now = new Date();
  const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const isTrial = trialEndsAt ? trialEndsAt > now : false;
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const monthlyActive = isTrial || (expiresAt ? expiresAt > now : false);

  return {
    isRegistered: true,
    registrationPaid: data.registration_paid,
    monthlyActive,
    trialEndsAt: data.trial_ends_at,
    isTrial,
    expiresAt: data.expires_at,
  };
}
