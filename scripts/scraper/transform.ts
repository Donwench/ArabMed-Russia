/**
 * Data Transformer
 * 
 * Transforms scraped doctor data from ProDoctorov into Supabase-compatible SQL.
 * Maps specialties, cities, and generates INSERT statements.
 * 
 * Usage:
 *   npx ts-node scripts/scraper/transform.ts
 * 
 * Input:  scripts/scraper/output/prodoctorov-doctors.json
 * Output: scripts/scraper/output/seed-real-doctors.sql
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Specialty Mapping (Russian text → our specialty names)
// ============================================

const SPECIALTY_MAP: Record<string, string> = {
  // General Practice
  'терапевт': 'General Practice',
  'врач общей практики': 'General Practice',
  'семейный врач': 'General Practice',
  
  // Dentistry
  'стоматолог': 'Dentistry',
  'стоматолог-хирург': 'Dentistry',
  'стоматолог-ортопед': 'Dentistry',
  'стоматолог-терапевт': 'Dentistry',
  'стоматолог-имплантолог': 'Dentistry',
  'ортодонт': 'Dentistry',
  'пародонтолог': 'Dentistry',
  
  // Cardiology
  'кардиолог': 'Cardiology',
  'аритмолог': 'Cardiology',
  
  // Dermatology
  'дерматолог': 'Dermatology',
  'дерматовенеролог': 'Dermatology',
  'косметолог': 'Dermatology',
  'трихолог': 'Dermatology',
  
  // Pediatrics
  'педиатр': 'Pediatrics',
  'неонатолог': 'Pediatrics',
  'детский врач': 'Pediatrics',
  
  // Gynecology
  'гинеколог': 'Gynecology',
  'акушер-гинеколог': 'Gynecology',
  'репродуктолог': 'Gynecology',
  
  // Orthopedics
  'ортопед': 'Orthopedics',
  'травматолог': 'Orthopedics',
  'травматолог-ортопед': 'Orthopedics',
  
  // Ophthalmology
  'офтальмолог': 'Ophthalmology',
  'окулист': 'Ophthalmology',
  
  // ENT
  'лор': 'ENT',
  'отоларинголог': 'ENT',
  'сурдолог': 'ENT',
  
  // Neurology
  'невролог': 'Neurology',
  'нейрохирург': 'Neurology',
  'эпилептолог': 'Neurology',
  
  // Psychiatry
  'психиатр': 'Psychiatry',
  'психотерапевт': 'Psychiatry',
  'нарколог': 'Psychiatry',
  
  // Urology
  'уролог': 'Urology',
  'андролог': 'Urology',
  'нефролог': 'Urology',
};

// ============================================
// City Mapping
// ============================================

const CITY_MAP: Record<string, string> = {
  moscow: 'Moscow',
  spb: 'Saint Petersburg',
  kazan: 'Kazan',
  ekaterinburg: 'Yekaterinburg',
  novosibirsk: 'Novosibirsk',
  krasnodar: 'Krasnodar',
  rostov: 'Rostov-on-Don',
  sochi: 'Sochi',
  nn: 'Nizhny Novgorod',
  samara: 'Samara',
  ufa: 'Ufa',
  volgograd: 'Volgograd',
  perm: 'Perm',
  voronezh: 'Voronezh',
  chelyabinsk: 'Chelyabinsk',
};

// ============================================
// Types
// ============================================

interface ScrapedDoctor {
  source: string;
  source_id: string;
  source_url: string;
  full_name: string;
  full_name_ru: string;
  specialty_text: string;
  clinic_name: string;
  clinic_address: string;
  city_name: string;
  city_key: string;
  phone: string;
  languages_spoken: string[];
  external_rating: number | null;
  external_review_count: number;
  experience_years: number | null;
  photo_url: string | null;
  about_ru: string;
  is_arabic_speaking: boolean;
}

// ============================================
// Transform Functions
// ============================================

function mapSpecialty(specialtyText: string): string {
  const lower = specialtyText.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(SPECIALTY_MAP)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  
  return 'General Practice'; // Default
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''").trim();
}

function formatLanguagesArray(langs: string[]): string {
  return `ARRAY[${langs.map(l => `'${escapeSQL(l)}'`).join(',')}]::TEXT[]`;
}

function generateSQL(doctors: ScrapedDoctor[]): string {
  const lines: string[] = [
    '-- ============================================',
    '-- Auto-generated: Real Arabic-speaking doctors from ProDoctorov',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total doctors: ${doctors.length}`,
    '-- ============================================',
    '',
    '-- Insert doctors (skips duplicates based on source + source_id)',
    '',
  ];
  
  for (const doc of doctors) {
    const specialty = mapSpecialty(doc.specialty_text);
    
    lines.push(`-- ${doc.full_name} (${doc.city_name}) - ${doc.specialty_text}`);
    lines.push(`INSERT INTO doctors (`);
    lines.push(`  profile_id, full_name, full_name_ru, specialty_text, city_name,`);
    lines.push(`  clinic_name, clinic_address, phone, languages_spoken,`);
    lines.push(`  external_rating, external_review_count, experience_years,`);
    lines.push(`  photo_url, about_ru, source, source_id, source_url,`);
    lines.push(`  is_verified,`);
    lines.push(`  specialty_id`);
    lines.push(`) VALUES (`);
    lines.push(`  NULL,`); // profile_id is NULL for scraped doctors
    lines.push(`  '${escapeSQL(doc.full_name)}',`);
    lines.push(`  '${escapeSQL(doc.full_name_ru)}',`);
    lines.push(`  '${escapeSQL(doc.specialty_text)}',`);
    lines.push(`  '${escapeSQL(doc.city_name)}',`);
    lines.push(`  '${escapeSQL(doc.clinic_name)}',`);
    lines.push(`  '${escapeSQL(doc.clinic_address)}',`);
    lines.push(`  '${escapeSQL(doc.phone)}',`);
    lines.push(`  ${formatLanguagesArray(doc.languages_spoken)},`);
    lines.push(`  ${doc.external_rating !== null ? doc.external_rating : 'NULL'},`);
    lines.push(`  ${doc.external_review_count},`);
    lines.push(`  ${doc.experience_years !== null ? doc.experience_years : 'NULL'},`);
    lines.push(`  ${doc.photo_url ? `'${escapeSQL(doc.photo_url)}'` : 'NULL'},`);
    lines.push(`  '${escapeSQL(doc.about_ru)}',`);
    lines.push(`  '${escapeSQL(doc.source)}',`);
    lines.push(`  '${escapeSQL(doc.source_id)}',`);
    lines.push(`  '${escapeSQL(doc.source_url)}',`);
    lines.push(`  TRUE,`); // Scraped doctors are pre-verified
    lines.push(`  (SELECT id FROM specialties WHERE name_en = '${escapeSQL(specialty)}' LIMIT 1)`);
    lines.push(`) ON CONFLICT DO NOTHING;`);
    lines.push('');
  }
  
  return lines.join('\n');
}

function generateJSON(doctors: ScrapedDoctor[]): object[] {
  return doctors.map(doc => ({
    profile_id: null,
    full_name: doc.full_name,
    full_name_ru: doc.full_name_ru,
    specialty_text: doc.specialty_text,
    specialty_en: mapSpecialty(doc.specialty_text),
    city_name: doc.city_name,
    clinic_name: doc.clinic_name,
    clinic_address: doc.clinic_address,
    phone: doc.phone,
    languages_spoken: doc.languages_spoken,
    external_rating: doc.external_rating,
    external_review_count: doc.external_review_count,
    experience_years: doc.experience_years,
    photo_url: doc.photo_url,
    about_ru: doc.about_ru,
    source: doc.source,
    source_id: doc.source_id,
    source_url: doc.source_url,
    is_verified: true,
  }));
}

// ============================================
// Main
// ============================================

function main() {
  const inputPath = path.join(__dirname, 'output', 'prodoctorov-doctors.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error('Run the scraper first: npx ts-node scripts/scraper/prodoctorov.ts');
    process.exit(1);
  }
  
  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as ScrapedDoctor[];
  console.log(`Loaded ${rawData.length} scraped doctors`);
  
  // Filter to only Arabic speakers
  const arabicDoctors = rawData.filter(d => d.is_arabic_speaking);
  console.log(`Arabic-speaking doctors: ${arabicDoctors.length}`);
  
  // Generate SQL
  const sql = generateSQL(arabicDoctors);
  const sqlPath = path.join(__dirname, 'output', 'seed-real-doctors.sql');
  fs.writeFileSync(sqlPath, sql, 'utf-8');
  console.log(`SQL saved to: ${sqlPath}`);
  
  // Generate transformed JSON (for Supabase API import)
  const transformed = generateJSON(arabicDoctors);
  const jsonPath = path.join(__dirname, 'output', 'doctors-transformed.json');
  fs.writeFileSync(jsonPath, JSON.stringify(transformed, null, 2), 'utf-8');
  console.log(`Transformed JSON saved to: ${jsonPath}`);
  
  // Print specialty distribution
  const specialtyDist: Record<string, number> = {};
  for (const doc of arabicDoctors) {
    const spec = mapSpecialty(doc.specialty_text);
    specialtyDist[spec] = (specialtyDist[spec] || 0) + 1;
  }
  console.log('\nSpecialty distribution:');
  for (const [spec, count] of Object.entries(specialtyDist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${spec}: ${count}`);
  }
  
  // Print city distribution
  const cityDist: Record<string, number> = {};
  for (const doc of arabicDoctors) {
    cityDist[doc.city_name] = (cityDist[doc.city_name] || 0) + 1;
  }
  console.log('\nCity distribution:');
  for (const [city, count] of Object.entries(cityDist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${city}: ${count}`);
  }
}

main();
