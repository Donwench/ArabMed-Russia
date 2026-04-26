# Testing ArabMed Russia

## Overview
ArabMed Russia is a React Native (Expo) app for finding Arabic-speaking doctors in Russia. It supports 3 languages (Arabic RTL, Russian, English) and uses Supabase for backend.

## Devin Secrets Needed
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (stored in `.env`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (stored in `.env`)

## Running the App
```bash
cd /home/ubuntu/arabdoc-russia
npm install
npx expo start --web --port 8081
```
The app runs at `http://localhost:8081` via Expo Web.

## Key Testing Flows

### Auth Screen
- Default screen when not logged in
- Login/Signup toggle with Full Name field appearing on signup
- `expo-secure-store` doesn't work on web — app uses `NativeStorageAdapter` with localStorage fallback

### Navigation Structure
- **5 bottom tabs**: Home (doctors list), Search (city/specialty/language filters), Appointments (calendar icon), Favorites, Settings
- **Stack screens over tabs**: DoctorProfile, AppointmentRequest, Notifications, WriteReview, DoctorRegistration, Feedback

### Language Switching
- Settings → tap language row (العربية / Русский / English)
- Arabic switches to RTL layout — verify chevrons flip, text right-aligns, tab labels change
- Key Arabic strings: "مواعيدي" (Appointments), "الإشعارات" (Notifications), "الإعدادات" (Settings)

### Appointment Request
- Navigate: Doctor profile → "Request Appointment" button → AppointmentRequestScreen
- Form: 7 date chips (next 7 days), 8 time slots (09:00-17:00), phone number (required), reason (optional)
- Validation: empty date/time → "Please select a date and time", empty phone → "Please enter your phone number"
- Submission requires authenticated Supabase session

### Notifications
- Navigate: Settings → Notifications row → NotificationsScreen
- Empty state: bell-off icon + "No notifications" + subtitle about appointment updates

## Common Blockers

### Supabase Email Rate Limit
The free Supabase tier has strict email sending limits. If signup fails with "email rate limit exceeded":
- **Workaround**: Temporarily bypass auth by changing `{session ? (` to `{true || session ? (` in `AppNavigator.tsx` line 134. Revert after testing.
- **Better fix**: Use Supabase dashboard to disable email confirmation or create users via admin API with service_role key.

### No Seed Doctors
The `supabase/seed-doctors.sql` script has a foreign key issue — it references `profiles` records that don't exist (and `profiles.id` references `auth.users`). This means:
- Home screen shows "No results found" / "Featured Doctors (0)"
- Cannot navigate to doctor profiles to test "Request Appointment" button in natural flow
- **Workaround**: Add a temporary navigation button on HomeScreen to reach AppointmentRequestScreen directly with test params.

### Schema Migrations Not Auto-Applied
New tables/cities added in `supabase/schema.sql` must be manually run in the Supabase SQL Editor. The app fetches cities/specialties from the live database, so new schema additions won't appear until the SQL is executed.

## RTL Testing Checklist
- [ ] Settings chevrons point left (←) in Arabic, right (→) in English
- [ ] Text is right-aligned in Arabic mode
- [ ] Bottom tab labels switch to Arabic
- [ ] Date/time pickers show localized day names
- [ ] **Known issue**: `notifUnread` style uses `borderLeftWidth` instead of `borderStartWidth` — unread notification accent border doesn't flip for RTL

## Toast Component
The app uses a custom Toast component (not `Alert.alert()`) for user feedback. Toast types: success (green), error (red), info (blue). Toasts auto-dismiss after 3 seconds.

## Version
Current version shown in Settings → Version row. Check `app.json` for the canonical version number.
