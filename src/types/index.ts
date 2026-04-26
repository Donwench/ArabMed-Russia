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

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  DoctorProfile: { doctorId: string };
  WriteReview: { doctorId: string };
  DoctorRegistration: undefined;
  Feedback: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Settings: undefined;
};
