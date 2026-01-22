import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedRow {
  address: string;
  postcode: string | null;
  rawRow: Record<string, string>;
}

export interface DeduplicatedProperty {
  address: string;
  postcode: string | null;
  visitCount: number;
}

export interface ValidatedProperty {
  address: string;
  postcode: string;
  outcode: string;
  visitCount: number;
}

export interface GeocodedProperty {
  address: string;
  postcode: string;
  outcode: string;
  lat: number;
  lon: number;
  visitCount: number;
}

export interface GeocodingResult {
  geocodedProperties: GeocodedProperty[];
  excludedProperties: ExcludedProperty[];
}

export interface ExcludedProperty {
  address: string;
  reason: string;
}

export interface ValidationResult {
  validProperties: ValidatedProperty[];
  excludedProperties: ExcludedProperty[];
}

export interface ParseResult {
  properties: DeduplicatedProperty[];
  totalRows: number;
  uniqueAddresses: number;
  previewRows: Record<string, string>[];
}

export interface ParseError {
  type: "noAddress" | "parse" | "noValidAddresses";
  message: string;
}

const PREVIEW_ROWS = 100;

/**
 * UK postcode regex pattern.
 * Matches full UK postcodes with optional space between outward and inward codes.
 * Examples: SE15 2JZ, SE152JZ, W1A 1AA, EC1A 1BB
 */
const UK_POSTCODE_REGEX = /([A-Z]{1,2}[0-9][0-9A-Z]?)\s*([0-9][A-Z]{2})/i;

/**
 * Normalize address for deduplication comparison.
 * Trims whitespace and collapses multiple spaces.
 */
function normalizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, " ");
}

/**
 * Extract UK postcode from text using regex.
 * Returns null if no valid postcode found.
 */
function extractPostcode(text: string): string | null {
  const match = text.match(UK_POSTCODE_REGEX);
  if (!match) return null;

  // Format as "OUTCODE INCODE" with proper spacing
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

/**
 * Extract outcode from a full postcode.
 * The outcode is the first part (e.g., "SE15" from "SE15 2JZ").
 */
function extractOutcode(postcode: string): string {
  const parts = postcode.trim().split(/\s+/);
  return parts[0].toUpperCase();
}

/**
 * Validate a postcode by checking it matches the UK format.
 */
function isValidPostcode(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode);
}

const ADDRESS_HEADER_SCORES: Record<string, number> = {
  address: 100,
  "property address": 92,
  "full address": 92,
  "address line 1": 88,
  "address line1": 88,
  "address1": 86,
  location: 82,
  addr: 80,
};

const POSTCODE_HEADER_SCORES: Record<string, number> = {
  postcode: 100,
  "post code": 98,
  "postal code": 90,
  zip: 70,
  "zip code": 70,
};

const ADDRESS_KEYWORDS = [
  "street",
  "st",
  "road",
  "rd",
  "avenue",
  "ave",
  "lane",
  "ln",
  "close",
  "cl",
  "court",
  "ct",
  "house",
  "flat",
  "apartment",
  "apt",
  "estate",
  "square",
  "sq",
  "crescent",
  "cres",
  "terrace",
  "place",
  "drive",
  "dr",
  "gardens",
  "gdn",
  "way",
  "walk",
  "row",
  "mews",
  "hill",
  "park",
  "rise",
  "view",
  "village",
];

const ADDRESS_KEYWORD_REGEX = new RegExp(`\\b(${ADDRESS_KEYWORDS.join("|")})\\b`, "i");
const MAX_SCAN_ROWS = 200;
const MIN_ADDRESS_SCORE = 50;
const MIN_POSTCODE_MATCH_RATIO = 0.6;

interface ColumnCandidate {
  name: string;
  score: number;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function pickBestHeaderMatch(
  columns: string[],
  scores: Record<string, number>
): ColumnCandidate | null {
  let best: ColumnCandidate | null = null;
  for (const column of columns) {
    const normalized = normalizeHeader(column);
    const score = scores[normalized];
    if (!score) continue;
    if (!best || score > best.score) {
      best = { name: column, score };
    }
  }
  return best;
}

function removePostcode(text: string): string {
  return text.replace(UK_POSTCODE_REGEX, " ");
}

function hasAddressBody(text: string): boolean {
  const body = removePostcode(text).replace(/[^a-z0-9]+/gi, " ").trim();
  if (!body) return false;
  if (body.length < 4) return false;
  return /[a-z]/i.test(body);
}

function hasAddressSignal(text: string): boolean {
  if (ADDRESS_KEYWORD_REGEX.test(text)) return true;
  if (/[0-9]/.test(text)) return true;
  if (/[,-]/.test(text)) return true;
  return false;
}

function scoreAddressContent(rows: Record<string, string>[], column: string): number {
  const sample = rows.slice(0, MAX_SCAN_ROWS);
  if (sample.length === 0) return 0;

  let nonEmpty = 0;
  let postcodeHits = 0;
  let bodyHits = 0;
  let signalHits = 0;

  for (const row of sample) {
    const value = row[column];
    if (!value) continue;
    const text = value.toString().trim();
    if (!text) continue;
    nonEmpty += 1;
    if (UK_POSTCODE_REGEX.test(text)) {
      postcodeHits += 1;
    }
    if (hasAddressBody(text)) {
      bodyHits += 1;
    }
    if (hasAddressSignal(text)) {
      signalHits += 1;
    }
  }

  if (nonEmpty === 0) return 0;

  const nonEmptyRatio = nonEmpty / sample.length;
  const postcodeRatio = postcodeHits / nonEmpty;
  const bodyRatio = bodyHits / nonEmpty;
  const signalRatio = signalHits / nonEmpty;

  return nonEmptyRatio * 10 + bodyRatio * 40 + signalRatio * 30 + postcodeRatio * 20;
}

/**
 * Find the postcode column name (case-insensitive), with content fallback.
 */
function findPostcodeColumn(
  columns: string[],
  rows: Record<string, string>[]
): ColumnCandidate | null {
  const headerMatch = pickBestHeaderMatch(columns, POSTCODE_HEADER_SCORES);
  if (headerMatch) return headerMatch;

  let best: ColumnCandidate | null = null;
  for (const column of columns) {
    const sample = rows.slice(0, MAX_SCAN_ROWS);
    let nonEmpty = 0;
    let postcodeHits = 0;
    for (const row of sample) {
      const value = row[column];
      if (!value) continue;
      const text = value.toString().trim();
      if (!text) continue;
      nonEmpty += 1;
      if (UK_POSTCODE_REGEX.test(text)) {
        postcodeHits += 1;
      }
    }
    if (nonEmpty === 0) continue;
    const ratio = postcodeHits / nonEmpty;
    if (ratio < MIN_POSTCODE_MATCH_RATIO) continue;
    const score = ratio * 100;
    if (!best || score > best.score) {
      best = { name: column, score };
    }
  }

  return best;
}

/**
 * Find the address column name, with header and content detection.
 */
function findAddressColumn(
  columns: string[],
  rows: Record<string, string>[],
  postcodeColumn: string | null
): ColumnCandidate | null {
  const headerMatch = pickBestHeaderMatch(columns, ADDRESS_HEADER_SCORES);
  if (headerMatch) return headerMatch;

  let best: ColumnCandidate | null = null;
  for (const column of columns) {
    if (postcodeColumn && column === postcodeColumn) continue;
    const score = scoreAddressContent(rows, column);
    if (!best || score > best.score) {
      best = { name: column, score };
    }
  }

  if (!best || best.score < MIN_ADDRESS_SCORE) {
    return null;
  }

  return best;
}

/**
 * Parse raw rows into ParsedRow array with address and postcode fields.
 */
function parseRows(
  rows: Record<string, string>[],
  addressColumn: string,
  postcodeColumn: string | null
): ParsedRow[] {
  return rows.map((row) => ({
    address: normalizeAddress(row[addressColumn] || ""),
    postcode: postcodeColumn ? (row[postcodeColumn]?.trim() || null) : null,
    rawRow: row,
  }));
}

/**
 * Deduplicate properties by address, counting occurrences as visit count.
 * For postcode, use the first non-null value encountered for each address.
 */
function deduplicateProperties(rows: ParsedRow[]): DeduplicatedProperty[] {
  const propertyMap = new Map<
    string,
    { address: string; postcode: string | null; visitCount: number }
  >();

  for (const row of rows) {
    if (!row.address) continue;

    const key = row.address.toLowerCase();
    const existing = propertyMap.get(key);

    if (existing) {
      existing.visitCount++;
      // Use postcode from later row if earlier was null
      if (!existing.postcode && row.postcode) {
        existing.postcode = row.postcode;
      }
    } else {
      propertyMap.set(key, {
        address: row.address,
        postcode: row.postcode,
        visitCount: 1,
      });
    }
  }

  return Array.from(propertyMap.values());
}

/**
 * Parse an Excel file and return deduplicated properties.
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;
        let bestSheetRows: Record<string, string>[] | null = null;
        let bestAddressColumn: ColumnCandidate | null = null;
        let bestPostcodeColumn: ColumnCandidate | null = null;
        let hasAnyRows = false;

        for (const sheetName of sheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
            defval: "",
            raw: false,
          });
          if (rawRows.length === 0) {
            continue;
          }
          hasAnyRows = true;

          const columns = Object.keys(rawRows[0]);
          if (columns.length === 0) {
            continue;
          }

          const postcodeColumn = findPostcodeColumn(columns, rawRows);
          const addressColumn = findAddressColumn(
            columns,
            rawRows,
            postcodeColumn ? postcodeColumn.name : null
          );

          if (!addressColumn) {
            continue;
          }

          if (!bestAddressColumn || addressColumn.score > bestAddressColumn.score) {
            bestAddressColumn = addressColumn;
            bestPostcodeColumn = postcodeColumn;
            bestSheetRows = rawRows;
          }
        }

        if (!bestSheetRows || !bestAddressColumn) {
          if (!hasAnyRows) {
            reject({ type: "parse", message: "File appears to be empty" });
            return;
          }
          reject({
            type: "noAddress",
            message:
              "We couldn't find a column with full addresses. Please include house/building name or number, street, and a UK postcode.",
          });
          return;
        }

        const parsedRows = parseRows(
          bestSheetRows,
          bestAddressColumn.name,
          bestPostcodeColumn ? bestPostcodeColumn.name : null
        );
        const properties = deduplicateProperties(parsedRows);

        resolve({
          properties,
          totalRows: bestSheetRows.length,
          uniqueAddresses: properties.length,
          previewRows: bestSheetRows.slice(0, PREVIEW_ROWS),
        });
      } catch {
        reject({ type: "parse", message: "Failed to parse file. Please check the file format." });
      }
    };

    reader.onerror = () => {
      reject({ type: "parse", message: "Failed to read file" });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a CSV file and return deduplicated properties.
 */
export async function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data;

        if (rawRows.length === 0) {
          reject({ type: "parse", message: "File appears to be empty" });
          return;
        }

        const columns = results.meta.fields || [];
        const postcodeColumn = findPostcodeColumn(columns, rawRows);
        const addressColumn = findAddressColumn(
          columns,
          rawRows,
          postcodeColumn ? postcodeColumn.name : null
        );

        if (!addressColumn) {
          reject({
            type: "noAddress",
            message:
              "We couldn't find a column with full addresses. Please include house/building name or number, street, and a UK postcode.",
          });
          return;
        }

        const parsedRows = parseRows(
          rawRows,
          addressColumn.name,
          postcodeColumn ? postcodeColumn.name : null
        );
        const properties = deduplicateProperties(parsedRows);

        resolve({
          properties,
          totalRows: rawRows.length,
          uniqueAddresses: properties.length,
          previewRows: rawRows.slice(0, PREVIEW_ROWS),
        });
      },
      error: () => {
        reject({ type: "parse", message: "Failed to parse CSV file" });
      },
    });
  });
}

/**
 * Parse a file (Excel or CSV) based on extension.
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsvFile(file);
  } else {
    return parseExcelFile(file);
  }
}

/**
 * Validate and extract postcodes from deduplicated properties.
 * - First attempts to extract postcode from address field
 * - Falls back to postcode column if extraction fails
 * - Properties without valid postcodes are excluded
 */
export function validateProperties(
  properties: DeduplicatedProperty[]
): ValidationResult {
  const validProperties: ValidatedProperty[] = [];
  const excludedProperties: ExcludedProperty[] = [];

  for (const prop of properties) {
    // Try to extract postcode from address first
    let postcode = extractPostcode(prop.address);

    // Fall back to postcode column if address extraction failed
    if (!postcode && prop.postcode) {
      const validatedColumnPostcode = extractPostcode(prop.postcode);
      if (validatedColumnPostcode) {
        postcode = validatedColumnPostcode;
      }
    }

    // If still no valid postcode, exclude the property
    if (!postcode) {
      excludedProperties.push({
        address: prop.address,
        reason:
          "Missing a valid UK postcode. Please include a UK postcode in the address or a Postcode column.",
      });
      continue;
    }

    if (!hasAddressBody(prop.address)) {
      excludedProperties.push({
        address: prop.address,
        reason:
          "Address contains only a postcode. Please include a house/building name or number and street.",
      });
      continue;
    }

    // Validate the extracted postcode
    if (!isValidPostcode(postcode)) {
      excludedProperties.push({
        address: prop.address,
        reason: `Invalid postcode format: ${postcode}`,
      });
      continue;
    }

    // Extract outcode and add to valid properties
    const outcode = extractOutcode(postcode);

    validProperties.push({
      address: prop.address,
      postcode,
      outcode,
      visitCount: prop.visitCount,
    });
  }

  return { validProperties, excludedProperties };
}

/**
 * Geocoding batch size for Postcodes.io API.
 */
const GEOCODING_BATCH_SIZE = 100;

/**
 * Postcodes.io bulk lookup response structure.
 */
interface PostcodesIoResult {
  query: string;
  result: {
    postcode: string;
    latitude: number;
    longitude: number;
    outcode: string;
  } | null;
}

interface PostcodesIoResponse {
  status: number;
  result: PostcodesIoResult[];
}

/**
 * Geocode an array of postcodes using Postcodes.io bulk lookup API.
 * Returns a map of postcode -> {lat, lon} for successful lookups.
 */
async function geocodePostcodes(
  postcodes: string[]
): Promise<Map<string, { lat: number; lon: number }>> {
  const results = new Map<string, { lat: number; lon: number }>();

  // Process in batches of 100 (Postcodes.io limit)
  for (let i = 0; i < postcodes.length; i += GEOCODING_BATCH_SIZE) {
    const batch = postcodes.slice(i, i + GEOCODING_BATCH_SIZE);

    try {
      const response = await fetch("https://api.postcodes.io/postcodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postcodes: batch }),
      });

      if (!response.ok) {
        // API error - skip this batch but continue
        console.error(`Postcodes.io API error: ${response.status}`);
        continue;
      }

      const data: PostcodesIoResponse = await response.json();

      for (const item of data.result) {
        if (item.result) {
          results.set(item.query.toUpperCase().replace(/\s+/g, " "), {
            lat: item.result.latitude,
            lon: item.result.longitude,
          });
        }
      }
    } catch (error) {
      // Network error - skip this batch but continue
      console.error("Geocoding batch failed:", error);
      continue;
    }
  }

  return results;
}

/**
 * Geocode validated properties using Postcodes.io API.
 * Properties that fail geocoding are excluded.
 *
 * @param properties - Validated properties with postcodes
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Geocoded properties and excluded properties
 */
export async function geocodeProperties(
  properties: ValidatedProperty[],
  onProgress?: (progress: number) => void
): Promise<GeocodingResult> {
  const geocodedProperties: GeocodedProperty[] = [];
  const excludedProperties: ExcludedProperty[] = [];

  // Get unique postcodes to minimize API calls
  const uniquePostcodes = [...new Set(properties.map((p) => p.postcode))];

  if (uniquePostcodes.length === 0) {
    return { geocodedProperties: [], excludedProperties: [] };
  }

  // Report initial progress
  onProgress?.(0);

  // Geocode all unique postcodes
  const geocodeMap = await geocodePostcodes(uniquePostcodes);

  // Check if geocoding service was completely unavailable
  if (geocodeMap.size === 0 && uniquePostcodes.length > 0) {
    throw new Error("Geocoding service unavailable. Please try again later.");
  }

  // Report progress after geocoding
  onProgress?.(80);

  // Match geocoded results to properties
  for (const prop of properties) {
    const normalizedPostcode = prop.postcode.toUpperCase().replace(/\s+/g, " ");
    const coords = geocodeMap.get(normalizedPostcode);

    if (coords) {
      geocodedProperties.push({
        address: prop.address,
        postcode: prop.postcode,
        outcode: prop.outcode,
        lat: coords.lat,
        lon: coords.lon,
        visitCount: prop.visitCount,
      });
    } else {
      excludedProperties.push({
        address: prop.address,
        reason: `Geocoding failed for postcode: ${prop.postcode}`,
      });
    }
  }

  // Report completion
  onProgress?.(100);

  return { geocodedProperties, excludedProperties };
}
