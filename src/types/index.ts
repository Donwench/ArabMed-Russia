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
  profile_id: string;
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

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  DoctorProfile: { doctorId: string };
  WriteReview: { doctorId: string };
  DoctorRegistration: undefined;
  Feedback: undefined;
  AppointmentRequest: { doctorId: string; doctorName: string };
  Appointments: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Appointments: undefined;
  Favorites: undefined;
  Settings: undefined;
};
