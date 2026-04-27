export interface Profile {
  id: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'admin';
  preferred_language: string;
  city: string;
  phone: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  profile_id: string | null;
  specialty_id: string;
  clinic_name: string;
  clinic_address: string;
  latitude: number | null;
  longitude: number | null;
  languages_spoken: string[];
  working_hours: Record<string, { open: string; close: string }>;
  is_verified: boolean;
  phone: string;
  about_ar: string;
  about_ru: string;
  about_en: string;
  created_at: string;
  // Phase 4: Scraped doctor fields
  full_name: string;
  full_name_ar: string;
  full_name_ru: string;
  photo_url: string | null;
  external_rating: number | null;
  external_review_count: number;
  source: 'manual' | 'prodoctorov' | 'napopravku' | 'google' | 'community';
  source_url: string | null;
  source_id: string | null;
  experience_years: number | null;
  specialty_text: string;
  city_name: string;
  // Joined fields
  profile?: Profile;
  specialty?: Specialty;
  avg_rating?: number;
  review_count?: number;
}

export interface Specialty {
  id: string;
  name_ar: string;
  name_ru: string;
  name_en: string;
  icon: string;
}

export interface City {
  id: string;
  name_ar: string;
  name_ru: string;
  name_en: string;
  latitude: number;
  longitude: number;
}

export interface Review {
  id: string;
  doctor_id: string;
  patient_id: string;
  rating: number;
  comment: string;
  language: string;
  created_at: string;
  patient?: Profile;
}

export interface Favorite {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  type: 'bug' | 'feature' | 'general';
  message: string;
  email: string | null;
  language: string;
  created_at: string;
}

export interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  language: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title_ar: string;
  title_ru: string;
  title_en: string;
  body_ar: string;
  body_ru: string;
  body_en: string;
  type: 'appointment' | 'review' | 'verification' | 'general';
  is_read: boolean;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
}

export interface DoctorSuggestion {
  id: string;
  submitted_by: string | null;
  doctor_name: string;
  specialty: string;
  clinic_name: string;
  clinic_address: string;
  city: string;
  phone: string;
  languages: string;
  notes: string;
  source_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'duplicate';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'premium' | 'doctor_pro';
  is_active: boolean;
  expires_at: string | null;
  trial_ends_at: string | null;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
}

export interface DoctorSubscription {
  id: string;
  user_id: string;
  registration_paid: boolean;
  registration_amount: number;
  monthly_amount: number;
  currency: string;
  trial_ends_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  payment_method: string | null;
  created_at: string;
}

export interface LoyaltyPoints {
  id: string;
  user_id: string;
  action: string;
  points: number;
  description: string;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  used_count: number;
  created_at: string;
}

export interface UserConsent {
  id: string;
  user_id: string;
  privacy_accepted: boolean;
  terms_accepted: boolean;
  marketing_consent: boolean;
  age_confirmed: boolean;
  consent_date: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Consent: undefined;
  DoctorProfile: { doctorId: string };
  WriteReview: { doctorId: string };
  DoctorRegistration: undefined;
  Feedback: undefined;
  AppointmentRequest: { doctorId: string; doctorName: string };
  Appointments: undefined;
  Notifications: undefined;
  SuggestDoctor: undefined;
  AdminPanel: undefined;
  Paywall: undefined;
  Loyalty: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Appointments: undefined;
  Favorites: undefined;
  Settings: undefined;
};
