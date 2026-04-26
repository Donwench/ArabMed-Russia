# ArabMed Russia

Arabic Doctors Directory in Russia - Find Arabic-speaking doctors near you.

## Features

- **Doctor Directory** - Search and browse Arabic-speaking doctors across Russia
- **Multi-language** - Arabic (RTL), Russian, and English
- **Search & Filters** - Filter by city, specialty, and languages spoken
- **Reviews & Ratings** - Rate and review doctors
- **Favorites** - Save doctors for quick access
- **Doctor Registration** - Doctors can register and manage their profiles
- **In-app Toast Notifications** - Error/success feedback works on both web and native
- **Feedback System** - Users can submit bug reports, feature requests, and general feedback
- **Map Integration** - OpenStreetMap embedded maps for doctor clinic locations (web)
- **Verification Badges** - Visual indicator for verified doctors
- **App Store Ready** - Configured for iOS (App Store) and Android (Google Play) publishing

## Tech Stack

- **Frontend:** React Native (Expo) with TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **i18n:** i18next + react-i18next
- **Icons:** Expo Vector Icons (Ionicons)
- **Maps:** OpenStreetMap (free, no API key)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project (free tier at [supabase.com](https://supabase.com))

### Setup

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd arabdoc-russia
   npm install
   ```

2. **Set up Supabase:**
   - Create a free project at [supabase.com](https://supabase.com)
   - Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor
   - (Optional) Run `supabase/seed-doctors.sql` to populate sample doctors
   - Copy your project URL and anon key

3. **Configure environment:**
   Create a `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the app:**
   ```bash
   npx expo start
   ```
   For web: `npx expo start --web`

## Project Structure

```
arabdoc-russia/
├── App.tsx                    # App entry point (with ToastProvider)
├── src/
│   ├── components/            # Reusable components
│   │   ├── DoctorCard.tsx     # Doctor list card with verification badge
│   │   └── Toast.tsx          # Cross-platform toast notifications
│   ├── i18n/                  # Translations
│   │   ├── ar.ts              # Arabic
│   │   ├── ru.ts              # Russian
│   │   ├── en.ts              # English
│   │   └── index.ts           # i18n config
│   ├── lib/                   # Shared utilities
│   │   ├── supabase.ts        # Supabase client (platform-aware storage)
│   │   └── theme.ts           # Colors, spacing, typography
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation setup (Stack + Tabs)
│   ├── screens/
│   │   ├── AuthScreen.tsx          # Login/Signup with toast feedback
│   │   ├── HomeScreen.tsx          # Doctor listing + specialty filters
│   │   ├── SearchScreen.tsx        # Advanced search (city/specialty/lang)
│   │   ├── FavoritesScreen.tsx     # Saved doctors
│   │   ├── SettingsScreen.tsx      # Language, feedback link, logout
│   │   ├── DoctorProfileScreen.tsx # Details, map, reviews, favorites
│   │   ├── WriteReviewScreen.tsx   # Star rating + comment
│   │   ├── DoctorRegistrationScreen.tsx # Doctor self-registration
│   │   └── FeedbackScreen.tsx      # In-app feedback form
│   └── types/
│       └── index.ts           # TypeScript types
└── supabase/
    ├── schema.sql             # Database schema + seed data
    └── seed-doctors.sql       # Sample doctor data (10 doctors)
```

## Supported Languages

| Language | Code | Direction |
|----------|------|-----------|
| Arabic   | ar   | RTL       |
| Russian  | ru   | LTR       |
| English  | en   | LTR       |

## Database

The database schema is defined in `supabase/schema.sql`. It includes:
- **profiles** - User profiles (patients, doctors, admins)
- **doctors** - Doctor listings with specialty, clinic, languages, coordinates
- **specialties** - Medical specialties (12 seeded)
- **cities** - Russian cities with Arabic names (8 seeded)
- **reviews** - Patient reviews with ratings
- **favorites** - Saved doctors
- **feedback** - User feedback submissions

Row Level Security (RLS) is enabled on all tables.

## App Store Publishing

The app is configured for publishing via EAS Build:
- **iOS:** Bundle ID `com.arabmed.russia` - requires Apple Developer Account ($99/year)
- **Android:** Package `com.arabmed.russia` - requires Google Play Developer ($25 one-time)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## License

MIT
