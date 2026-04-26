# ArabDoc Russia

Arabic Doctors Directory in Russia - Find Arabic-speaking doctors near you.

## Features

- **Doctor Directory** — Search and browse Arabic-speaking doctors across Russia
- **Multi-language** — Arabic (RTL), Russian, and English
- **Search & Filters** — Filter by city, specialty, and languages spoken
- **Reviews & Ratings** — Rate and review doctors
- **Favorites** — Save doctors for quick access
- **Doctor Registration** — Doctors can register and manage their profiles

## Tech Stack

- **Frontend:** React Native (Expo) with TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Navigation:** React Navigation
- **i18n:** i18next + react-i18next
- **Icons:** Expo Vector Icons (Ionicons)

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
   - Copy your project URL and anon key

3. **Configure environment:**
   Create a `.env` file (or set in `app.json`):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the app:**
   ```bash
   npx expo start
   ```

## Project Structure

```
arabdoc-russia/
├── App.tsx                    # App entry point
├── src/
│   ├── components/            # Reusable components
│   │   └── DoctorCard.tsx
│   ├── i18n/                  # Translations
│   │   ├── ar.ts              # Arabic
│   │   ├── ru.ts              # Russian
│   │   ├── en.ts              # English
│   │   └── index.ts           # i18n config
│   ├── lib/                   # Shared utilities
│   │   ├── supabase.ts        # Supabase client
│   │   └── theme.ts           # Colors, spacing, typography
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation setup
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── DoctorProfileScreen.tsx
│   │   ├── WriteReviewScreen.tsx
│   │   └── DoctorRegistrationScreen.tsx
│   └── types/
│       └── index.ts           # TypeScript types
└── supabase/
    └── schema.sql             # Database schema + seed data
```

## Supported Languages

| Language | Code | Direction |
|----------|------|-----------|
| Arabic   | ar   | RTL       |
| Russian  | ru   | LTR       |
| English  | en   | LTR       |

## Database

The database schema is defined in `supabase/schema.sql`. It includes:
- **profiles** — User profiles (patients, doctors, admins)
- **doctors** — Doctor listings with specialty, clinic, languages, etc.
- **specialties** — Medical specialties (12 seeded)
- **cities** — Russian cities with Arabic names (8 seeded)
- **reviews** — Patient reviews with ratings
- **favorites** — Saved doctors

Row Level Security (RLS) is enabled on all tables.

## License

MIT
