import { supabase } from './supabase';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export interface LoyaltyInfo {
  totalPoints: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  referralCode: string;
  referralCount: number;
}

export const LOYALTY_TIERS: Record<LoyaltyTier, { minPoints: number; label: string; color: string }> = {
  bronze: { minPoints: 0, label: 'Bronze', color: '#CD7F32' },
  silver: { minPoints: 500, label: 'Silver', color: '#C0C0C0' },
  gold: { minPoints: 2000, label: 'Gold', color: '#FFD700' },
};

export const POINT_ACTIONS = {
  daily_login: 5,
  write_review: 50,
  refer_friend: 100,
  book_appointment: 25,
  complete_profile: 30,
  suggest_doctor_approved: 75,
} as const;

export function getTierFromPoints(points: number): LoyaltyTier {
  if (points >= LOYALTY_TIERS.gold.minPoints) return 'gold';
  if (points >= LOYALTY_TIERS.silver.minPoints) return 'silver';
  return 'bronze';
}

export function getNextTier(tier: LoyaltyTier): LoyaltyTier | null {
  if (tier === 'bronze') return 'silver';
  if (tier === 'silver') return 'gold';
  return null;
}

export function getPointsToNextTier(points: number): number {
  const tier = getTierFromPoints(points);
  const next = getNextTier(tier);
  if (!next) return 0;
  return LOYALTY_TIERS[next].minPoints - points;
}

export async function getUserLoyaltyInfo(userId: string): Promise<LoyaltyInfo> {
  const { data: pointsData } = await supabase
    .from('loyalty_points')
    .select('points')
    .eq('user_id', userId);

  const totalPoints = (pointsData || []).reduce((sum, row) => sum + row.points, 0);
  const tier = getTierFromPoints(totalPoints);

  const { data: referralData } = await supabase
    .from('referral_codes')
    .select('code, used_count')
    .eq('user_id', userId)
    .single();

  return {
    totalPoints,
    tier,
    nextTier: getNextTier(tier),
    pointsToNextTier: getPointsToNextTier(totalPoints),
    referralCode: referralData?.code || '',
    referralCount: referralData?.used_count || 0,
  };
}

export async function awardPoints(userId: string, action: keyof typeof POINT_ACTIONS, description: string): Promise<void> {
  const points = POINT_ACTIONS[action];
  await supabase.from('loyalty_points').insert({
    user_id: userId,
    action,
    points,
    description,
  });
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'ARAB';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
