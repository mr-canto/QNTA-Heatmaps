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

/**
 * Find the address column name (case-insensitive).
 */
function findAddressColumn(columns: string[]): string | null {
  return columns.find((col) => col.toLowerCase() === "address") ?? null;
}

/**
 * Find the postcode column name (case-insensitive).
 */
function findPostcodeColumn(columns: string[]): string | null {
  return columns.find((col) => col.toLowerCase() === "postcode") ?? null;
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
          defval: "",
          raw: false,
        });

        if (rawRows.length === 0) {
          reject({ type: "parse", message: "File appears to be empty" });
          return;
        }

        const columns = Object.keys(rawRows[0]);
        const addressColumn = findAddressColumn(columns);

        if (!addressColumn) {
          reject({ type: "noAddress", message: "No Address column found in file" });
          return;
        }

        const postcodeColumn = findPostcodeColumn(columns);
        const parsedRows = parseRows(rawRows, addressColumn, postcodeColumn);
        const properties = deduplicateProperties(parsedRows);

        resolve({
          properties,
          totalRows: rawRows.length,
          uniqueAddresses: properties.length,
          previewRows: rawRows.slice(0, PREVIEW_ROWS),
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
        const addressColumn = findAddressColumn(columns);

        if (!addressColumn) {
          reject({ type: "noAddress", message: "No Address column found in file" });
          return;
        }

        const postcodeColumn = findPostcodeColumn(columns);
        const parsedRows = parseRows(rawRows, addressColumn, postcodeColumn);
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
        reason: "No valid UK postcode found",
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
