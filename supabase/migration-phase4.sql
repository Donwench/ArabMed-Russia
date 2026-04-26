-- ============================================
-- Phase 4 Migration: Support for scraped doctor data
-- Run this in the Supabase SQL Editor after schema.sql
-- ============================================

-- 1. Make profile_id nullable (scraped doctors don't have user accounts)
ALTER TABLE doctors ALTER COLUMN profile_id DROP NOT NULL;

-- 2. Drop the unique constraint on profile_id (allow NULL values)
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_profile_id_key;

-- 3. Add new fields for scraped doctor data
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS full_name_ar TEXT NOT NULL DEFAULT '';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS full_name_ru TEXT NOT NULL DEFAULT '';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS external_rating NUMERIC(3,2);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS external_review_count INTEGER DEFAULT 0;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'prodoctorov', 'napopravku', 'google', 'community'));
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty_text TEXT NOT NULL DEFAULT '';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS city_name TEXT NOT NULL DEFAULT '';

-- 4. Create doctor_suggestions table (community track)
CREATE TABLE IF NOT EXISTS doctor_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  clinic_name TEXT NOT NULL DEFAULT '',
  clinic_address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  languages TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for new fields
CREATE INDEX IF NOT EXISTS idx_doctors_source ON doctors(source);
CREATE INDEX IF NOT EXISTS idx_doctors_source_id ON doctors(source_id);
CREATE INDEX IF NOT EXISTS idx_doctors_city_name ON doctors(city_name);
CREATE INDEX IF NOT EXISTS idx_doctors_external_rating ON doctors(external_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON doctor_suggestions(status);

-- 6. RLS for doctor_suggestions
ALTER TABLE doctor_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit suggestions" ON doctor_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own suggestions" ON doctor_suggestions FOR SELECT USING (auth.uid() = submitted_by);
CREATE POLICY "Admins can view all suggestions" ON doctor_suggestions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update suggestions" ON doctor_suggestions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Update doctors RLS to allow admin inserts (for importing scraped data)
CREATE POLICY "Admins can insert doctors" ON doctors FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update any doctor" ON doctors FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete doctors" ON doctors FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. Unique constraint on source + source_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_source_unique ON doctors(source, source_id) WHERE source_id IS NOT NULL;
