-- ArabDoc Russia - Database Schema
-- Run this in the Supabase SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  preferred_language TEXT NOT NULL DEFAULT 'ar',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specialties
CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'medical-bag'
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

-- Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id),
  clinic_name TEXT NOT NULL DEFAULT '',
  clinic_address TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  languages_spoken TEXT[] NOT NULL DEFAULT ARRAY['ar']::TEXT[],
  working_hours JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone TEXT NOT NULL DEFAULT '',
  about_ar TEXT NOT NULL DEFAULT '',
  about_ru TEXT NOT NULL DEFAULT '',
  about_en TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doctor_id, patient_id)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('bug', 'feature', 'general')),
  message TEXT NOT NULL,
  email TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointment Requests
CREATE TABLE IF NOT EXISTS appointment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL DEFAULT '',
  title_ru TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  body_ru TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('appointment', 'review', 'verification', 'general')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push Tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctors_verified ON doctors(is_verified);
CREATE INDEX IF NOT EXISTS idx_doctors_languages ON doctors USING GIN(languages_spoken);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor ON reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_favorites_patient ON favorites(patient_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointment_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointment_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctors: everyone can read, doctor can update own
CREATE POLICY "Doctors are viewable by everyone" ON doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update own listing" ON doctors FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can create doctor listing" ON doctors FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Reviews: everyone can read, patients can create/update/delete own
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Patients can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Patients can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = patient_id);

-- Favorites: users can manage own
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (auth.uid() = patient_id);

-- Specialties & Cities: public read
CREATE POLICY "Specialties are viewable by everyone" ON specialties FOR SELECT USING (true);
CREATE POLICY "Cities are viewable by everyone" ON cities FOR SELECT USING (true);

-- Feedback: anyone can create, only admin can read
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);

-- Appointment Requests: patients create/read own, doctors read theirs
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can create appointments" ON appointment_requests FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own appointments" ON appointment_requests FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view their appointments" ON appointment_requests FOR SELECT USING (
  doctor_id IN (SELECT id FROM doctors WHERE profile_id = auth.uid())
);
CREATE POLICY "Doctors can update appointment status" ON appointment_requests FOR UPDATE USING (
  doctor_id IN (SELECT id FROM doctors WHERE profile_id = auth.uid())
);

-- Notifications: users read/update own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can create notifications" ON notifications FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Push Tokens: users manage own
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own push tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SECURITY: Prevent role escalation
-- ============================================

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    IF auth.uid() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_role_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA: Specialties
-- ============================================

INSERT INTO specialties (name_ar, name_ru, name_en, icon) VALUES
  ('طب عام', 'Терапия', 'General Practice', 'stethoscope'),
  ('طب أسنان', 'Стоматология', 'Dentistry', 'tooth'),
  ('أمراض القلب', 'Кардиология', 'Cardiology', 'heart-pulse'),
  ('أمراض جلدية', 'Дерматология', 'Dermatology', 'hand-dots'),
  ('طب أطفال', 'Педиатрия', 'Pediatrics', 'baby'),
  ('أمراض نساء وتوليد', 'Гинекология', 'Gynecology', 'person-pregnant'),
  ('جراحة عظام', 'Ортопедия', 'Orthopedics', 'bone'),
  ('طب عيون', 'Офтальмология', 'Ophthalmology', 'eye'),
  ('أنف وأذن وحنجرة', 'ЛОР', 'ENT', 'ear-listen'),
  ('أمراض عصبية', 'Неврология', 'Neurology', 'brain'),
  ('طب نفسي', 'Психиатрия', 'Psychiatry', 'comments'),
  ('أمراض المسالك البولية', 'Урология', 'Urology', 'kidneys')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Cities
-- ============================================

INSERT INTO cities (name_ar, name_ru, name_en, latitude, longitude) VALUES
  ('موسكو', 'Москва', 'Moscow', 55.7558, 37.6173),
  ('سانت بطرسبرغ', 'Санкт-Петербург', 'Saint Petersburg', 59.9343, 30.3351),
  ('قازان', 'Казань', 'Kazan', 55.8304, 49.0661),
  ('يكاترينبورغ', 'Екатеринбург', 'Yekaterinburg', 56.8389, 60.6057),
  ('نوفوسيبيرسك', 'Новосибирск', 'Novosibirsk', 55.0084, 82.9357),
  ('كراسنودار', 'Краснодар', 'Krasnodar', 45.0355, 38.9753),
  ('روستوف على الدون', 'Ростов-на-Дону', 'Rostov-on-Don', 47.2357, 39.7015),
  ('سوتشي', 'Сочи', 'Sochi', 43.6028, 39.7342),
  ('نيجني نوفغورود', 'Нижний Новгород', 'Nizhny Novgorod', 56.2965, 43.9361),
  ('سمارة', 'Самара', 'Samara', 53.1959, 50.1002),
  ('أوفا', 'Уфа', 'Ufa', 54.7388, 55.9721),
  ('فولغوغراد', 'Волгоград', 'Volgograd', 48.7080, 44.5133),
  ('بيرم', 'Пермь', 'Perm', 58.0105, 56.2502),
  ('فورونيج', 'Воронеж', 'Voronezh', 51.6720, 39.1843),
  ('تشيليابينسك', 'Челябинск', 'Chelyabinsk', 55.1644, 61.4368)
ON CONFLICT DO NOTHING;
