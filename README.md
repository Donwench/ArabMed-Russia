# ArabMed Russia

Arabic Doctors Directory in Russia - Find Arabic-speaking doctors near you.

## Features

### Core
- **Doctor Directory** - Search and browse Arabic-speaking doctors across 15 Russian cities
- **Multi-language** - Arabic (full RTL), Russian, and English
- **Search & Filters** - Filter by city, specialty, and languages spoken
- **Reviews & Ratings** - Rate and review doctors
- **Favorites** - Save doctors for quick access
- **Appointments** - Request callbacks from doctors
- **Doctor Registration** - Doctors can register and manage their profiles
- **Community Suggestions** - Users can suggest doctors to be added
- **Admin Panel** - Manage doctor suggestions, view statistics

### Subscriptions (Phase 5)
- **3 Subscription Tiers** - Free, Premium ($3.99/mo), Doctor Pro ($9.99/mo)
- **Paywall Screen** - Tier comparison with feature matrix
- **7-Day Free Trial** - Premium trial for new users
- **Feature Gating** - Free: 10 searches/day, 5 favorites; Premium: unlimited; Doctor Pro: analytics + featured listing
- **Restore Purchases** - Cross-device purchase restoration

### Loyalty Program (Phase 6)
- **Points System** - Earn points for daily login (5), reviews (50), referrals (100), appointments (25)
- **3 Tiers** - Bronze (0-499), Silver (500-1999), Gold (2000+)
- **Referral Codes** - Share unique codes, earn 100 points per referral
- **Rewards Dashboard** - Track points, tier progress, and history

### Legal Compliance (Phase 7)
- **152-FZ Compliant** - Russian Federal Law on Personal Data
- **Privacy Policy** - Trilingual (AR/RU/EN), covers data collection, storage, user rights
- **Terms of Service** - Trilingual, covers subscriptions, user content, liability
- **Medical Disclaimer** - "Informational directory only, not medical advice"
- **Consent Screen** - First-launch consent flow with privacy + terms + age verification
- **Data Deletion** - Account deletion request flow in Settings
- **Marketing Opt-In** - Optional, GDPR-style consent for promotional emails

### Infrastructure
- **Map Integration** - OpenStreetMap for doctor clinic locations
- **Push Notifications** - Expo Push for appointment updates
- **Web Scraper** - ProDoctorov.ru crawler for Arabic-speaking doctors
- **EAS Build** - Development, preview, and production build profiles
- **App Store Ready** - Configured for iOS and Android publishing

## Tech Stack

- **Frontend:** React Native (Expo) with TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **i18n:** i18next + react-i18next
- **Icons:** Expo Vector Icons (Ionicons)
- **Maps:** OpenStreetMap (free, no API key)
- **Payments:** RevenueCat (sandbox mode, wraps App Store + Google Play)
- **Storage:** AsyncStorage (consent, preferences)

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
   - Run `supabase/migration-phase4.sql` for Phase 4 columns
   - Run `supabase/migration-phases5-8.sql` for subscriptions, loyalty, and legal tables
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

## Database

15 tables with Row Level Security:

| Table | Purpose |
|-------|---------|
| profiles | User profiles (patient/doctor/admin) |
| doctors | Doctor listings with 30+ fields |
| specialties | 12 medical specialties (trilingual) |
| cities | 15 Russian cities (with Arabic names) |
| reviews | Patient reviews with ratings |
| favorites | Saved doctors |
| feedback | User feedback submissions |
| appointment_requests | Doctor callback requests |
| notifications | In-app notifications |
| push_tokens | Device push notification tokens |
| doctor_suggestions | Community-submitted doctor suggestions |
| subscriptions | User subscription records |
| loyalty_points | Points earned per action |
| referral_codes | User referral codes |
| user_consents | 152-FZ consent records |

## Supported Languages

| Language | Code | Direction |
|----------|------|-----------|
| Arabic   | ar   | RTL       |
| Russian  | ru   | LTR       |
| English  | en   | LTR       |

## App Store Publishing

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for development
eas build --profile development --platform all

# Build for preview (internal testing)
eas build --profile preview --platform all

# Build for production
eas build --profile production --platform all
```

- **iOS:** Bundle ID `com.arabmed.russia` — requires Apple Developer ($99/yr)
- **Android:** Package `com.arabmed.russia` — requires Google Play Developer ($25 one-time)

## Legal

This app is an **informational directory only**. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.

Compliant with Russian Federal Law No. 152-FZ "On Personal Data".

## License

MIT
