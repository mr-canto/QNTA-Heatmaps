/**
 * Seed Initial Data Migration
 *
 * Migrates property data from the XLSX file to Supabase database.
 * This script:
 * 1. Reads the Excel file
 * 2. Deduplicates addresses and counts visits
 * 3. Extracts and validates postcodes
 * 4. Geocodes postcodes using Postcodes.io API
 * 5. Creates an import record
 * 6. Inserts properties
 * 7. Calculates and stores outcode statistics
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54361';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA4Mzk5NTgxN30.VJtDhoccEtbiIkXwljz09m-ZCvpP2vAJHBzWOIeVE10bfKE_Ns4-fSo1aGiNsJCgTDa9usbAnpZNHz7YQ7atDA';
const XLSX_FILE = './docs/D&M raw data Pre AL.xlsx';
const BATCH_SIZE = 100; // Postcodes.io allows up to 100 postcodes per request

// Outcode to area name mapping (from CLAUDE.md)
const OUTCODE_AREA_MAP = {
  SE15: 'Peckham',
  SE1: 'Borough',
  SE17: 'Walworth',
  SE16: 'Rotherhithe',
  SE5: 'Camberwell',
  SE22: 'East Dulwich',
  SE21: 'Dulwich',
  SE24: 'Herne Hill',
  SE11: 'Kennington',
  SE23: 'Forest Hill',
  SE14: 'New Cross',
  SE8: 'Deptford',
};

// UK postcode regex - handles multiple spaces in postcodes
const POSTCODE_REGEX = /([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})/i;

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Extract postcode from address
 */
function extractPostcode(address) {
  const match = address.match(POSTCODE_REGEX);
  if (match) {
    // Normalize: uppercase, single space between outcode and incode
    const postcode = match[1].toUpperCase().replace(/\s+/g, ' ').trim();
    // Ensure proper format with space
    if (!postcode.includes(' ')) {
      // Insert space before last 3 characters
      return postcode.slice(0, -3) + ' ' + postcode.slice(-3);
    }
    return postcode;
  }
  return null;
}

/**
 * Extract outcode from postcode (e.g., "SE15" from "SE15 2JZ")
 */
function extractOutcode(postcode) {
  return postcode.split(' ')[0];
}

/**
 * Geocode postcodes using Postcodes.io API
 * @param {string[]} postcodes - Array of postcodes to geocode
 * @returns {Promise<Map<string, {lat: number, lon: number}>>}
 */
async function geocodePostcodes(postcodes) {
  const results = new Map();

  // Process in batches
  for (let i = 0; i < postcodes.length; i += BATCH_SIZE) {
    const batch = postcodes.slice(i, i + BATCH_SIZE);
    console.log(
      `  Geocoding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(postcodes.length / BATCH_SIZE)}...`
    );

    try {
      const response = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: batch }),
      });

      if (!response.ok) {
        throw new Error(`Postcodes.io API error: ${response.status}`);
      }

      const data = await response.json();

      for (const item of data.result) {
        if (item.result) {
          results.set(item.query, {
            lat: item.result.latitude,
            lon: item.result.longitude,
          });
        }
      }
    } catch (error) {
      console.error(`  Error geocoding batch: ${error.message}`);
      throw error;
    }

    // Small delay between batches to be respectful to the API
    if (i + BATCH_SIZE < postcodes.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Get or create a system user for the import
 */
async function getSystemUser() {
  // Check if we have any existing user
  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();

  if (fetchError) {
    throw new Error(`Failed to list users: ${fetchError.message}`);
  }

  if (users.users.length > 0) {
    return users.users[0].id;
  }

  // Create a system user for seed data
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'system@qnta-heatmap.local',
    password: 'SystemUser123!',
    email_confirm: true,
    user_metadata: { name: 'System Import' },
  });

  if (createError) {
    throw new Error(`Failed to create system user: ${createError.message}`);
  }

  return newUser.user.id;
}

/**
 * Main seed function
 */
async function seedData() {
  console.log('Starting initial data migration...\n');

  // Step 1: Read XLSX file
  console.log('Step 1: Reading XLSX file...');
  const workbook = XLSX.readFile(XLSX_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  console.log(`  Found ${rawData.length} rows\n`);

  // Step 2: Deduplicate addresses and count visits
  console.log('Step 2: Deduplicating addresses...');
  const addressMap = new Map();
  const excludedAddresses = [];

  for (const row of rawData) {
    const address = row['Address'];
    if (!address) continue;

    const postcode = extractPostcode(address);
    if (!postcode) {
      excludedAddresses.push({ address, reason: 'No valid postcode found' });
      continue;
    }

    // Normalize address for deduplication
    const normalized = address.trim().replace(/\s+/g, ' ');

    if (addressMap.has(normalized)) {
      addressMap.get(normalized).visitCount++;
    } else {
      addressMap.set(normalized, {
        address: normalized,
        postcode,
        outcode: extractOutcode(postcode),
        visitCount: 1,
      });
    }
  }

  console.log(`  Unique valid addresses: ${addressMap.size}`);
  console.log(`  Excluded addresses: ${excludedAddresses.length}`);
  if (excludedAddresses.length > 0) {
    console.log('  Excluded:');
    excludedAddresses.forEach((e) => console.log(`    - "${e.address}": ${e.reason}`));
  }
  console.log();

  // Step 3: Geocode postcodes
  console.log('Step 3: Geocoding postcodes...');
  const uniquePostcodes = [...new Set([...addressMap.values()].map((p) => p.postcode))];
  console.log(`  ${uniquePostcodes.length} unique postcodes to geocode`);

  const geocodeResults = await geocodePostcodes(uniquePostcodes);
  console.log(`  Successfully geocoded: ${geocodeResults.size} postcodes`);

  // Filter out properties with failed geocoding
  const properties = [];
  const geocodeFailures = [];

  for (const [normalized, data] of addressMap.entries()) {
    const coords = geocodeResults.get(data.postcode);
    if (coords) {
      properties.push({
        address: data.address,
        postcode: data.postcode,
        outcode: data.outcode,
        lat: coords.lat,
        lon: coords.lon,
        visit_count: data.visitCount,
      });
    } else {
      geocodeFailures.push({ address: data.address, postcode: data.postcode });
    }
  }

  if (geocodeFailures.length > 0) {
    console.log(`  Geocoding failures: ${geocodeFailures.length}`);
    geocodeFailures.forEach((f) =>
      console.log(`    - "${f.address}" (${f.postcode})`)
    );
  }
  console.log();

  if (properties.length === 0) {
    throw new Error('No valid properties to import after geocoding');
  }

  // Step 4: Get or create system user
  console.log('Step 4: Getting system user...');
  const userId = await getSystemUser();
  console.log(`  User ID: ${userId}\n`);

  // Step 5: Create import record
  console.log('Step 5: Creating import record...');
  const { data: importRecord, error: importError } = await supabase
    .from('imports')
    .insert({
      uploaded_by: userId,
      filename: 'D&M raw data Pre AL.xlsx',
      record_count: properties.length,
      is_current: true,
    })
    .select()
    .single();

  if (importError) {
    throw new Error(`Failed to create import record: ${importError.message}`);
  }
  console.log(`  Import ID: ${importRecord.id}\n`);

  // Step 6: Insert properties in batches
  console.log('Step 6: Inserting properties...');
  const propertyBatchSize = 500;
  let insertedCount = 0;

  for (let i = 0; i < properties.length; i += propertyBatchSize) {
    const batch = properties.slice(i, i + propertyBatchSize).map((p) => ({
      ...p,
      import_id: importRecord.id,
    }));

    const { error: insertError } = await supabase.from('properties').insert(batch);

    if (insertError) {
      throw new Error(`Failed to insert properties batch: ${insertError.message}`);
    }

    insertedCount += batch.length;
    console.log(`  Inserted ${insertedCount}/${properties.length} properties`);
  }
  console.log();

  // Step 7: Calculate and store outcode statistics
  console.log('Step 7: Calculating outcode statistics...');
  const outcodeStats = new Map();

  for (const prop of properties) {
    if (!outcodeStats.has(prop.outcode)) {
      outcodeStats.set(prop.outcode, {
        outcode: prop.outcode,
        area_name: OUTCODE_AREA_MAP[prop.outcode] || prop.outcode,
        total_visits: 0,
        property_count: 0,
        multi_visit_count: 0,
        lat: prop.lat,
        lon: prop.lon,
      });
    }

    const stats = outcodeStats.get(prop.outcode);
    stats.total_visits += prop.visit_count;
    stats.property_count++;
    if (prop.visit_count > 1) {
      stats.multi_visit_count++;
    }
    // Update lat/lon to average (simple approximation)
    stats.lat = (stats.lat + prop.lat) / 2;
    stats.lon = (stats.lon + prop.lon) / 2;
  }

  // Calculate proper centroid for each outcode
  for (const [outcode, stats] of outcodeStats.entries()) {
    const outcodeProperties = properties.filter((p) => p.outcode === outcode);
    stats.lat = outcodeProperties.reduce((sum, p) => sum + p.lat, 0) / outcodeProperties.length;
    stats.lon = outcodeProperties.reduce((sum, p) => sum + p.lon, 0) / outcodeProperties.length;
  }

  const statsArray = [...outcodeStats.values()].map((s) => ({
    ...s,
    import_id: importRecord.id,
  }));

  const { error: statsError } = await supabase.from('outcode_stats').insert(statsArray);

  if (statsError) {
    throw new Error(`Failed to insert outcode stats: ${statsError.message}`);
  }
  console.log(`  Inserted ${statsArray.length} outcode statistics`);

  // Print summary
  console.log('\n========================================');
  console.log('Migration Complete!');
  console.log('========================================');
  console.log(`Total properties imported: ${properties.length}`);
  console.log(`Total excluded: ${excludedAddresses.length + geocodeFailures.length}`);
  console.log(`Outcode areas: ${statsArray.length}`);
  console.log(`Import ID: ${importRecord.id}`);
  console.log('========================================\n');

  return {
    importId: importRecord.id,
    propertiesImported: properties.length,
    excluded: excludedAddresses.length + geocodeFailures.length,
    outcodeAreas: statsArray.length,
  };
}

// Run the seed
seedData()
  .then((result) => {
    console.log('Seed completed successfully:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
