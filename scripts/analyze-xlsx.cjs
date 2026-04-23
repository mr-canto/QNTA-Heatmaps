/**
 * Analyzes the XLSX file to understand the data structure
 */
const XLSX = require('xlsx');

const workbook = XLSX.readFile('./docs/D&M raw data Pre AL.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// UK postcode regex - handles multiple spaces in postcodes
const postcodeRegex = /([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})/i;

const uniqueAddresses = new Map();
const noPostcode = [];

data.forEach((row) => {
  const address = row['Address'];
  if (!address) return;

  const match = address.match(postcodeRegex);
  if (match) {
    // Normalize the address for deduplication: trim, uppercase, collapse multiple spaces
    const normalized = address.trim().toUpperCase().replace(/\s+/g, ' ');
    uniqueAddresses.set(normalized, (uniqueAddresses.get(normalized) || 0) + 1);
  } else {
    noPostcode.push(address);
  }
});

console.log('Total rows:', data.length);
console.log('Unique addresses:', uniqueAddresses.size);
console.log('Addresses without valid postcode:', noPostcode.length);
if (noPostcode.length > 0) {
  console.log('Invalid addresses:', noPostcode);
}

// Show visit distribution
const visitCounts = {};
uniqueAddresses.forEach((count) => {
  visitCounts[count] = (visitCounts[count] || 0) + 1;
});
console.log('\nVisit count distribution:');
Object.keys(visitCounts)
  .sort((a, b) => Number(a) - Number(b))
  .forEach((count) => {
    console.log(`  ${count} visits: ${visitCounts[count]} properties`);
  });
