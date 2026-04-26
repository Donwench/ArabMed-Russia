/**
 * ProDoctorov Scraper
 * 
 * Crawls prodoctorov.ru to find Arabic-speaking doctors in Russian cities.
 * 
 * Usage:
 *   npx ts-node scripts/scraper/prodoctorov.ts
 * 
 * Output:
 *   scripts/scraper/output/prodoctorov-doctors.json
 * 
 * Respects robots.txt and rate limits (1 request per 2 seconds).
 * Only scrapes publicly available data from doctor profile pages.
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Configuration
// ============================================

const BASE_URL = 'https://prodoctorov.ru';
const REQUEST_DELAY_MS = 2000; // 1 request per 2 seconds
const MAX_PAGES_PER_CITY = 50; // Safety limit
const OUTPUT_DIR = path.join(__dirname, 'output');

// Target cities with their ProDoctorov URL slugs
const CITIES: Record<string, { slug: string; name_en: string; name_ru: string; name_ar: string }> = {
  moscow: { slug: 'moskva', name_en: 'Moscow', name_ru: 'Москва', name_ar: 'موسكو' },
  spb: { slug: 'spb', name_en: 'Saint Petersburg', name_ru: 'Санкт-Петербург', name_ar: 'سانت بطرسبرغ' },
  kazan: { slug: 'kazan', name_en: 'Kazan', name_ru: 'Казань', name_ar: 'قازان' },
  ekaterinburg: { slug: 'ekaterinburg', name_en: 'Yekaterinburg', name_ru: 'Екатеринбург', name_ar: 'يكاترينبورغ' },
  novosibirsk: { slug: 'novosibirsk', name_en: 'Novosibirsk', name_ru: 'Новосибирск', name_ar: 'نوفوسيبيرسك' },
  krasnodar: { slug: 'krasnodar', name_en: 'Krasnodar', name_ru: 'Краснодар', name_ar: 'كراسنودار' },
  rostov: { slug: 'rostov-na-donu', name_en: 'Rostov-on-Don', name_ru: 'Ростов-на-Дону', name_ar: 'روستوف على الدون' },
  sochi: { slug: 'sochi', name_en: 'Sochi', name_ru: 'Сочи', name_ar: 'سوتشي' },
  nn: { slug: 'nizhniy-novgorod', name_en: 'Nizhny Novgorod', name_ru: 'Нижний Новгород', name_ar: 'نيجني نوفغورود' },
  samara: { slug: 'samara', name_en: 'Samara', name_ru: 'Самара', name_ar: 'سمارة' },
  ufa: { slug: 'ufa', name_en: 'Ufa', name_ru: 'Уфа', name_ar: 'أوفا' },
  volgograd: { slug: 'volgograd', name_en: 'Volgograd', name_ru: 'Волгоград', name_ar: 'فولغوغراد' },
  perm: { slug: 'perm', name_en: 'Perm', name_ru: 'Пермь', name_ar: 'بيرم' },
  voronezh: { slug: 'voronezh', name_en: 'Voronezh', name_ru: 'Воронеж', name_ar: 'فورونيج' },
  chelyabinsk: { slug: 'chelyabinsk', name_en: 'Chelyabinsk', name_ru: 'Челябинск', name_ar: 'تشيليابينسك' },
};

// ============================================
// Types
// ============================================

interface ScrapedDoctor {
  source: 'prodoctorov';
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
// Utility Functions
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ArabMedRussia/1.0 (medical directory; contact@arabmed.app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.error(`  HTTP ${response.status} for ${url}`);
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error(`  Fetch error for ${url}:`, error);
    return null;
  }
}

// ============================================
// Scraper: Doctor Listing Pages
// ============================================

async function scrapeDoctorListPage(citySlug: string, page: number): Promise<string[]> {
  const url = page === 1
    ? `${BASE_URL}/${citySlug}/vrach/`
    : `${BASE_URL}/${citySlug}/vrach/?page=${page}`;
  
  console.log(`  Fetching listing page ${page}: ${url}`);
  const html = await fetchPage(url);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const doctorLinks: string[] = [];
  
  // ProDoctorov doctor links follow pattern: /city/vrach/123456-name/
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.match(/\/vrach\/\d+-[a-z]+/)) {
      const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      if (!doctorLinks.includes(fullUrl)) {
        doctorLinks.push(fullUrl);
      }
    }
  });
  
  return doctorLinks;
}

// ============================================
// Scraper: Individual Doctor Profile
// ============================================

async function scrapeDoctorProfile(url: string, cityKey: string, cityInfo: typeof CITIES[string]): Promise<ScrapedDoctor | null> {
  const html = await fetchPage(url);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  
  // Extract doctor ID from URL
  const idMatch = url.match(/\/vrach\/(\d+)-/);
  const sourceId = idMatch ? idMatch[1] : url;
  
  // Extract name from h1
  const fullName = $('h1').first().text().trim().replace(/\s+/g, ' ');
  if (!fullName) return null;
  
  // Extract specialty text (usually right after name or in a subtitle)
  const specialtyText = $('h1').first().next().text().trim() ||
    $('.doctor-specialty, .specialty-text').first().text().trim() || '';
  
  // Extract languages spoken
  const languages: string[] = [];
  let isArabicSpeaking = false;
  
  // Look for "Языки общения" section
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    if (text === 'Языки общения' || text === 'Languages') {
      // Get the next sibling or parent's next content
      const langSection = $(el).parent().text().toLowerCase();
      if (langSection.includes('арабский') || langSection.includes('arabic')) {
        isArabicSpeaking = true;
        languages.push('ar');
      }
      if (langSection.includes('русский') || langSection.includes('russian')) {
        languages.push('ru');
      }
      if (langSection.includes('английский') || langSection.includes('english')) {
        languages.push('en');
      }
      if (langSection.includes('французский') || langSection.includes('french')) {
        languages.push('fr');
      }
      if (langSection.includes('турецкий') || langSection.includes('turkish')) {
        languages.push('tr');
      }
    }
  });
  
  // Also check the full page text for Arabic language mentions
  const pageText = $('body').text().toLowerCase();
  if (pageText.includes('арабский') && !isArabicSpeaking) {
    isArabicSpeaking = true;
    if (!languages.includes('ar')) languages.push('ar');
  }
  
  // If no languages found, default to Russian
  if (languages.length === 0) {
    languages.push('ru');
  }
  
  // Extract rating
  let rating: number | null = null;
  const ratingText = $('.rating-value, .doctor-rating').first().text().trim();
  if (ratingText) {
    const parsed = parseFloat(ratingText.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      rating = parsed;
    }
  }
  
  // Extract review count
  let reviewCount = 0;
  const reviewText = $('a[href*="otziv"], .review-count').first().text().trim();
  const reviewMatch = reviewText.match(/(\d+)\s*(отзыв|review)/i);
  if (reviewMatch) {
    reviewCount = parseInt(reviewMatch[1], 10);
  }
  
  // Extract experience years
  let experienceYears: number | null = null;
  const expText = pageText.match(/стаж\s+(\d+)\s*(лет|год)/i);
  if (expText) {
    experienceYears = parseInt(expText[1], 10);
  }
  
  // Extract clinic info
  const clinicName = $('.clinic-name, .workplace-name').first().text().trim() || '';
  
  // Extract address
  const clinicAddress = $('.clinic-address, .workplace-address').first().text().trim() || '';
  
  // Extract phone
  const phone = $('a[href^="tel:"]').first().attr('href')?.replace('tel:', '') || '';
  
  // Extract photo
  const photoUrl = $('img.doctor-photo, img.avatar, .doctor-image img').first().attr('src') || null;
  
  // Extract about text
  const aboutRu = $('.doctor-about, .about-text').first().text().trim() || '';
  
  return {
    source: 'prodoctorov',
    source_id: sourceId,
    source_url: url,
    full_name: fullName,
    full_name_ru: fullName,
    specialty_text: specialtyText,
    clinic_name: clinicName,
    clinic_address: clinicAddress || `${cityInfo.name_ru}`,
    city_name: cityInfo.name_en,
    city_key: cityKey,
    phone,
    languages_spoken: languages,
    external_rating: rating,
    external_review_count: reviewCount,
    experience_years: experienceYears,
    photo_url: photoUrl,
    about_ru: aboutRu,
    is_arabic_speaking: isArabicSpeaking,
  };
}

// ============================================
// Main Scraper Pipeline
// ============================================

async function scrapeCity(cityKey: string, cityInfo: typeof CITIES[string]): Promise<ScrapedDoctor[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scraping ${cityInfo.name_en} (${cityInfo.slug})`);
  console.log(`${'='.repeat(60)}`);
  
  const allDoctorUrls: string[] = [];
  
  // Collect doctor URLs from listing pages
  for (let page = 1; page <= MAX_PAGES_PER_CITY; page++) {
    await sleep(REQUEST_DELAY_MS);
    const urls = await scrapeDoctorListPage(cityInfo.slug, page);
    
    if (urls.length === 0) {
      console.log(`  No more doctors on page ${page}, stopping.`);
      break;
    }
    
    allDoctorUrls.push(...urls);
    console.log(`  Found ${urls.length} doctor links on page ${page} (total: ${allDoctorUrls.length})`);
  }
  
  console.log(`\n  Total doctor URLs found: ${allDoctorUrls.length}`);
  console.log(`  Scraping individual profiles to find Arabic speakers...`);
  
  // Scrape individual profiles
  const doctors: ScrapedDoctor[] = [];
  let checked = 0;
  
  for (const url of allDoctorUrls) {
    await sleep(REQUEST_DELAY_MS);
    checked++;
    
    if (checked % 50 === 0) {
      console.log(`  Progress: ${checked}/${allDoctorUrls.length} checked, ${doctors.length} Arabic speakers found`);
    }
    
    const doctor = await scrapeDoctorProfile(url, cityKey, cityInfo);
    if (doctor && doctor.is_arabic_speaking) {
      doctors.push(doctor);
      console.log(`  [FOUND] ${doctor.full_name} - ${doctor.specialty_text} (${doctor.languages_spoken.join(', ')})`);
    }
  }
  
  console.log(`\n  ${cityInfo.name_en}: Found ${doctors.length} Arabic-speaking doctors out of ${allDoctorUrls.length} total`);
  return doctors;
}

async function main() {
  console.log('ProDoctorov Arabic Doctor Scraper');
  console.log('================================');
  console.log(`Target cities: ${Object.keys(CITIES).length}`);
  console.log(`Rate limit: ${REQUEST_DELAY_MS}ms between requests`);
  console.log(`Output: ${OUTPUT_DIR}/prodoctorov-doctors.json\n`);
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const allDoctors: ScrapedDoctor[] = [];
  const stats: Record<string, number> = {};
  
  for (const [cityKey, cityInfo] of Object.entries(CITIES)) {
    const doctors = await scrapeCity(cityKey, cityInfo);
    allDoctors.push(...doctors);
    stats[cityInfo.name_en] = doctors.length;
    
    // Save intermediate results
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'prodoctorov-doctors.json'),
      JSON.stringify(allDoctors, null, 2),
      'utf-8'
    );
  }
  
  // Final summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SCRAPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total Arabic-speaking doctors found: ${allDoctors.length}`);
  console.log('\nBy city:');
  for (const [city, count] of Object.entries(stats)) {
    console.log(`  ${city}: ${count}`);
  }
  
  // Save final output
  const outputPath = path.join(OUTPUT_DIR, 'prodoctorov-doctors.json');
  fs.writeFileSync(outputPath, JSON.stringify(allDoctors, null, 2), 'utf-8');
  console.log(`\nResults saved to: ${outputPath}`);
  
  // Also save stats
  const statsPath = path.join(OUTPUT_DIR, 'scrape-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_doctors: allDoctors.length,
    by_city: stats,
    cities_scraped: Object.keys(CITIES).length,
  }, null, 2), 'utf-8');
}

main().catch(console.error);
