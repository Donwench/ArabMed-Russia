-- Migration for Phases 5-8: Subscriptions, Loyalty, Legal Compliance, Polish
-- Run this in Supabase SQL Editor

-- Phase 5: Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'doctor_pro')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  store_product_id TEXT,
  store_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, is_active) WHERE is_active = true;

-- Phase 6: Loyalty Points table
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty points" ON loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can award loyalty points" ON loyalty_points
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Server-side function to award points with validation
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_user_id UUID,
  p_action TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_points INTEGER;
BEGIN
  v_points := CASE p_action
    WHEN 'daily_login' THEN 5
    WHEN 'write_review' THEN 50
    WHEN 'refer_friend' THEN 100
    WHEN 'book_appointment' THEN 25
    WHEN 'complete_profile' THEN 30
    WHEN 'suggest_doctor_approved' THEN 75
    ELSE NULL
  END;
  IF v_points IS NULL THEN
    RAISE EXCEPTION 'Invalid loyalty action: %', p_action;
  END IF;
  INSERT INTO loyalty_points (user_id, action, points, description)
  VALUES (p_user_id, p_action, v_points, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);

-- Phase 6: Referral Codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update referral codes" ON referral_codes
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- Phase 7: User Consents table (152-FZ compliance)
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  age_confirmed BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON user_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consent" ON user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);

-- Phase 7: Data deletion requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" ON data_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deletion requests" ON data_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Doctor Registration Fees table
CREATE TABLE IF NOT EXISTS doctor_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registration_paid BOOLEAN NOT NULL DEFAULT false,
  registration_amount INTEGER NOT NULL DEFAULT 1000,
  monthly_amount INTEGER NOT NULL DEFAULT 500,
  currency TEXT NOT NULL DEFAULT 'RUB',
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doctor_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own doctor subscriptions" ON doctor_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage doctor subscriptions" ON doctor_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_doctor_subscriptions_user_id ON doctor_subscriptions(user_id);

-- Grant doctors a 7-day free trial on registration
CREATE OR REPLACE FUNCTION create_doctor_trial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO doctor_subscriptions (user_id, registration_paid, trial_ends_at, expires_at, is_active)
  VALUES (NEW.profile_id, false, NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_doctor_trial ON doctors;
CREATE TRIGGER on_new_doctor_trial
  AFTER INSERT ON doctors
  FOR EACH ROW
  WHEN (NEW.profile_id IS NOT NULL)
  EXECUTE FUNCTION create_doctor_trial();

-- Grant new users a 7-day free trial on first subscription check
CREATE OR REPLACE FUNCTION create_free_trial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier, is_active, trial_ends_at, expires_at, platform)
  VALUES (NEW.id, 'premium', true, NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days', 'web');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only apply trial for new users (drop if exists first)
DROP TRIGGER IF EXISTS on_new_user_free_trial ON profiles;
CREATE TRIGGER on_new_user_free_trial
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_free_trial();
