/**
 * Geocoder
 * 
 * Converts clinic addresses to lat/lng coordinates using free geocoding services.
 * Uses Nominatim (OpenStreetMap) which is free and requires no API key.
 * 
 * Usage:
 *   npx ts-node scripts/scraper/geocode.ts
 * 
 * Input:  scripts/scraper/output/doctors-transformed.json
 * Output: scripts/scraper/output/doctors-geocoded.json
 * 
 * Rate limit: 1 request per second (Nominatim policy)
 */

import * as fs from 'fs';
import * as path from 'path';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_DELAY_MS = 1100; // Nominatim requires max 1 req/sec

// City center coordinates as fallbacks
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  'Moscow': { lat: 55.7558, lng: 37.6173 },
  'Saint Petersburg': { lat: 59.9343, lng: 30.3351 },
  'Kazan': { lat: 55.8304, lng: 49.0661 },
  'Yekaterinburg': { lat: 56.8389, lng: 60.6057 },
  'Novosibirsk': { lat: 55.0084, lng: 82.9357 },
  'Krasnodar': { lat: 45.0355, lng: 38.9753 },
  'Rostov-on-Don': { lat: 47.2357, lng: 39.7015 },
  'Sochi': { lat: 43.6028, lng: 39.7342 },
  'Nizhny Novgorod': { lat: 56.2965, lng: 43.9361 },
  'Samara': { lat: 53.1959, lng: 50.1002 },
  'Ufa': { lat: 54.7388, lng: 55.9721 },
  'Volgograd': { lat: 48.7080, lng: 44.5133 },
  'Perm': { lat: 58.0105, lng: 56.2502 },
  'Voronezh': { lat: 51.6720, lng: 39.1843 },
  'Chelyabinsk': { lat: 55.1644, lng: 61.4368 },
};

interface TransformedDoctor {
  full_name: string;
  city_name: string;
  clinic_name: string;
  clinic_address: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = `${address}, ${city}, Russia`;
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'ru',
  });
  
  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'ArabMedRussia/1.0 (medical directory app)',
      },
    });
    
    if (!response.ok) {
      console.error(`  HTTP ${response.status} for: ${query}`);
      return null;
    }
    
    const results = await response.json() as Array<{ lat: string; lon: string }>;
    
    if (results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`  Geocode error for: ${query}`, error);
    return null;
  }
}

async function main() {
  const inputPath = path.join(__dirname, 'output', 'doctors-transformed.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error('Run the transformer first: npx ts-node scripts/scraper/transform.ts');
    process.exit(1);
  }
  
  const doctors: TransformedDoctor[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`Loaded ${doctors.length} doctors for geocoding`);
  console.log(`Rate limit: ${REQUEST_DELAY_MS}ms between requests\n`);
  
  let geocoded = 0;
  let fallbacks = 0;
  let failed = 0;
  
  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    console.log(`[${i + 1}/${doctors.length}] ${doc.full_name} (${doc.city_name})`);
    
    // Skip if already has coordinates
    if (doc.latitude && doc.longitude) {
      console.log(`  Already geocoded: ${doc.latitude}, ${doc.longitude}`);
      geocoded++;
      continue;
    }
    
    await sleep(REQUEST_DELAY_MS);
    
    // Try geocoding the full address
    let coords = null;
    if (doc.clinic_address) {
      coords = await geocodeAddress(doc.clinic_address, doc.city_name);
    }
    
    // Try with just clinic name + city
    if (!coords && doc.clinic_name) {
      await sleep(REQUEST_DELAY_MS);
      coords = await geocodeAddress(doc.clinic_name, doc.city_name);
    }
    
    if (coords) {
      doc.latitude = coords.lat;
      doc.longitude = coords.lng;
      geocoded++;
      console.log(`  Geocoded: ${coords.lat}, ${coords.lng}`);
    } else {
      // Fall back to city center
      const center = CITY_CENTERS[doc.city_name];
      if (center) {
        // Add small random offset so markers don't stack
        doc.latitude = center.lat + (Math.random() - 0.5) * 0.02;
        doc.longitude = center.lng + (Math.random() - 0.5) * 0.02;
        fallbacks++;
        console.log(`  Fallback to city center: ${doc.latitude?.toFixed(4)}, ${doc.longitude?.toFixed(4)}`);
      } else {
        failed++;
        console.log(`  FAILED - no coordinates`);
      }
    }
  }
  
  // Save geocoded results
  const outputPath = path.join(__dirname, 'output', 'doctors-geocoded.json');
  fs.writeFileSync(outputPath, JSON.stringify(doctors, null, 2), 'utf-8');
  
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Geocoding complete:`);
  console.log(`  Geocoded: ${geocoded}`);
  console.log(`  Fallback to city center: ${fallbacks}`);
  console.log(`  Failed: ${failed}`);
  console.log(`Saved to: ${outputPath}`);
}

main().catch(console.error);
