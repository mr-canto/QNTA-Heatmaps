import * as XLSX from "xlsx";
import Papa from "papaparse";
import { logger } from "./logger";

export interface ParsedRow {
  address: string;
  addressKey: string;
  postcode: string | null;
  rawRow: Record<string, string>;
  workOrderRefRaw: string | null;
  descriptionRaw: string | null;
  estimatedCostRaw: string | null;
  rawDateValue: string | null;
  importRowOrder: number;
}

export interface DeduplicatedProperty {
  address: string;
  addressKey: string;
  postcode: string | null;
  visitCount: number;
}

export interface ValidatedProperty {
  address: string;
  addressKey: string;
  postcode: string;
  outcode: string;
  visitCount: number;
}

export interface GeocodedProperty {
  address: string;
  addressKey: string;
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

export type ImportWarningField =
  | "workOrderRef"
  | "description"
  | "estimatedCost"
  | "date";

export interface ImportWarning {
  address: string;
  importRowOrder: number;
  field: ImportWarningField;
  message: string;
  rawValue?: string | null;
}

export interface ImportableWorkOrder {
  address: string;
  addressKey: string;
  postcode: string;
  outcode: string;
  workOrderRef: string | null;
  description: string | null;
  estimatedCost: number | null;
  rawDateValue: string | null;
  normalizedDate: string | null;
  importRowOrder: number;
}

export interface PreparedWorkOrdersResult {
  workOrders: ImportableWorkOrder[];
  warnings: ImportWarning[];
}

export interface ParseResult {
  properties: DeduplicatedProperty[];
  parsedRows: ParsedRow[];
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

const ADDRESS_HEADER_SCORES: Record<string, number> = {
  address: 100,
  "property address": 92,
  "full address": 92,
  "address line 1": 88,
  "address line1": 88,
  address1: 86,
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

const WORK_ORDER_HEADER_SCORES: Record<string, number> = {
  "wo ref": 100,
  "work order number": 100,
  "work order ref": 98,
  "wo number": 96,
  "wo reference": 96,
  "work order": 92,
};

const DESCRIPTION_HEADER_SCORES: Record<string, number> = {
  description: 100,
  "job description": 96,
  details: 90,
  job: 70,
};

const ESTIMATED_COST_HEADER_SCORES: Record<string, number> = {
  "est cost": 100,
  "estimated cost": 100,
  "est. cost": 98,
  cost: 70,
};

const DATE_HEADER_SCORES: Record<string, number> = {
  date: 100,
  "job date": 96,
  "work order date": 96,
  "raised date": 92,
  "visit date": 92,
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

interface SheetColumns {
  address: string;
  postcode: string | null;
  workOrderRef: string | null;
  description: string | null;
  estimatedCost: string | null;
  date: string | null;
}

function normalizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, " ");
}

function normalizeAddressKey(address: string): string {
  return normalizeAddress(address).toLowerCase();
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || null;
}

function extractPostcode(text: string): string | null {
  const match = text.match(UK_POSTCODE_REGEX);
  if (!match) return null;
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

function extractOutcode(postcode: string): string {
  return postcode.trim().split(/\s+/)[0].toUpperCase();
}

function isValidPostcode(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode);
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

function pickBestHeaderMatch(
  columns: string[],
  scores: Record<string, number>
): ColumnCandidate | null {
  let best: ColumnCandidate | null = null;
  for (const column of columns) {
    const score = scores[normalizeHeader(column)];
    if (!score) continue;
    if (!best || score > best.score) {
      best = { name: column, score };
    }
  }
  return best;
}

function scoreAddressContent(rows: Record<string, string>[], column: string): number {
  const sample = rows.slice(0, MAX_SCAN_ROWS);
  if (sample.length === 0) return 0;

  let nonEmpty = 0;
  let postcodeHits = 0;
  let bodyHits = 0;
  let signalHits = 0;

  for (const row of sample) {
    const text = row[column]?.toString().trim();
    if (!text) continue;
    nonEmpty += 1;
    if (UK_POSTCODE_REGEX.test(text)) postcodeHits += 1;
    if (hasAddressBody(text)) bodyHits += 1;
    if (hasAddressSignal(text)) signalHits += 1;
  }

  if (nonEmpty === 0) return 0;

  const nonEmptyRatio = nonEmpty / sample.length;
  const postcodeRatio = postcodeHits / nonEmpty;
  const bodyRatio = bodyHits / nonEmpty;
  const signalRatio = signalHits / nonEmpty;

  return nonEmptyRatio * 10 + bodyRatio * 40 + signalRatio * 30 + postcodeRatio * 20;
}

function findPostcodeColumn(
  columns: string[],
  rows: Record<string, string>[]
): ColumnCandidate | null {
  const headerMatch = pickBestHeaderMatch(columns, POSTCODE_HEADER_SCORES);
  if (headerMatch) return headerMatch;

  let best: ColumnCandidate | null = null;
  const sample = rows.slice(0, MAX_SCAN_ROWS);

  for (const column of columns) {
    let nonEmpty = 0;
    let postcodeHits = 0;

    for (const row of sample) {
      const text = row[column]?.toString().trim();
      if (!text) continue;
      nonEmpty += 1;
      if (UK_POSTCODE_REGEX.test(text)) postcodeHits += 1;
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

  if (!best || best.score < MIN_ADDRESS_SCORE) return null;
  return best;
}

function findOptionalColumn(
  columns: string[],
  scores: Record<string, number>
): string | null {
  return pickBestHeaderMatch(columns, scores)?.name ?? null;
}

function buildSheetColumns(columns: string[], rows: Record<string, string>[]): SheetColumns | null {
  const postcodeColumn = findPostcodeColumn(columns, rows);
  const addressColumn = findAddressColumn(columns, rows, postcodeColumn?.name ?? null);

  if (!addressColumn) return null;

  return {
    address: addressColumn.name,
    postcode: postcodeColumn?.name ?? null,
    workOrderRef: findOptionalColumn(columns, WORK_ORDER_HEADER_SCORES),
    description: findOptionalColumn(columns, DESCRIPTION_HEADER_SCORES),
    estimatedCost: findOptionalColumn(columns, ESTIMATED_COST_HEADER_SCORES),
    date: findOptionalColumn(columns, DATE_HEADER_SCORES),
  };
}

function parseRows(rows: Record<string, string>[], columns: SheetColumns): ParsedRow[] {
  return rows.map((row, index) => {
    const address = normalizeAddress(row[columns.address] || "");

    return {
      address,
      addressKey: normalizeAddressKey(address),
      postcode: columns.postcode ? normalizeOptionalText(row[columns.postcode]) : null,
      rawRow: row,
      workOrderRefRaw: columns.workOrderRef
        ? normalizeOptionalText(row[columns.workOrderRef])
        : null,
      descriptionRaw: columns.description
        ? normalizeOptionalText(row[columns.description])
        : null,
      estimatedCostRaw: columns.estimatedCost
        ? normalizeOptionalText(row[columns.estimatedCost])
        : null,
      rawDateValue: columns.date ? normalizeOptionalText(row[columns.date]) : null,
      importRowOrder: index,
    };
  });
}

function deduplicateProperties(rows: ParsedRow[]): DeduplicatedProperty[] {
  const propertyMap = new Map<string, DeduplicatedProperty>();

  for (const row of rows) {
    if (!row.address) continue;

    const existing = propertyMap.get(row.addressKey);
    if (existing) {
      existing.visitCount += 1;
      if (!existing.postcode && row.postcode) {
        existing.postcode = row.postcode;
      }
      continue;
    }

    propertyMap.set(row.addressKey, {
      address: row.address,
      addressKey: row.addressKey,
      postcode: row.postcode,
      visitCount: 1,
    });
  }

  return Array.from(propertyMap.values());
}

function parseExcelWorkbook(data: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(data, { type: "array" });
  let bestSheetRows: Record<string, string>[] | null = null;
  let bestSheetColumns: SheetColumns | null = null;
  let bestAddressScore = -1;
  let hasAnyRows = false;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
      defval: "",
      raw: false,
    });

    if (rawRows.length === 0) continue;
    hasAnyRows = true;

    const columns = Object.keys(rawRows[0]);
    if (columns.length === 0) continue;

    const sheetColumns = buildSheetColumns(columns, rawRows);
    if (!sheetColumns) continue;

    const addressScore = pickBestHeaderMatch([sheetColumns.address], ADDRESS_HEADER_SCORES)?.score
      ?? scoreAddressContent(rawRows, sheetColumns.address);

    if (addressScore > bestAddressScore) {
      bestSheetRows = rawRows;
      bestSheetColumns = sheetColumns;
      bestAddressScore = addressScore;
    }
  }

  if (!bestSheetRows || !bestSheetColumns) {
    if (!hasAnyRows) {
      throw { type: "parse", message: "File appears to be empty" } satisfies ParseError;
    }

    throw {
      type: "noAddress",
      message:
        "We couldn't find a column with full addresses. Please include house/building name or number, street, and a UK postcode.",
    } satisfies ParseError;
  }

  const parsedRows = parseRows(bestSheetRows, bestSheetColumns);
  const properties = deduplicateProperties(parsedRows);

  return {
    properties,
    parsedRows,
    totalRows: bestSheetRows.length,
    uniqueAddresses: properties.length,
    previewRows: bestSheetRows.slice(0, PREVIEW_ROWS),
  };
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!(data instanceof ArrayBuffer)) {
          reject({ type: "parse", message: "Failed to read file" } satisfies ParseError);
          return;
        }

        resolve(parseExcelWorkbook(data));
      } catch (error) {
        reject(
          (error as ParseError) ?? {
            type: "parse",
            message: "Failed to parse file. Please check the file format.",
          }
        );
      }
    };

    reader.onerror = () => {
      reject({ type: "parse", message: "Failed to read file" } satisfies ParseError);
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data;
        if (rawRows.length === 0) {
          reject({ type: "parse", message: "File appears to be empty" } satisfies ParseError);
          return;
        }

        const columns = results.meta.fields || [];
        const sheetColumns = buildSheetColumns(columns, rawRows);

        if (!sheetColumns) {
          reject({
            type: "noAddress",
            message:
              "We couldn't find a column with full addresses. Please include house/building name or number, street, and a UK postcode.",
          } satisfies ParseError);
          return;
        }

        const parsedRows = parseRows(rawRows, sheetColumns);
        const properties = deduplicateProperties(parsedRows);

        resolve({
          properties,
          parsedRows,
          totalRows: rawRows.length,
          uniqueAddresses: properties.length,
          previewRows: rawRows.slice(0, PREVIEW_ROWS),
        });
      },
      error: () => {
        reject({ type: "parse", message: "Failed to parse CSV file" } satisfies ParseError);
      },
    });
  });
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "csv" ? parseCsvFile(file) : parseExcelFile(file);
}

export function validateProperties(properties: DeduplicatedProperty[]): ValidationResult {
  const validProperties: ValidatedProperty[] = [];
  const excludedProperties: ExcludedProperty[] = [];

  for (const prop of properties) {
    let postcode = extractPostcode(prop.address);

    if (!postcode && prop.postcode) {
      const validatedColumnPostcode = extractPostcode(prop.postcode);
      if (validatedColumnPostcode) {
        postcode = validatedColumnPostcode;
      }
    }

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

    if (!isValidPostcode(postcode)) {
      excludedProperties.push({
        address: prop.address,
        reason: `Invalid postcode format: ${postcode}`,
      });
      continue;
    }

    validProperties.push({
      address: prop.address,
      addressKey: prop.addressKey,
      postcode,
      outcode: extractOutcode(postcode),
      visitCount: prop.visitCount,
    });
  }

  return { validProperties, excludedProperties };
}

function formatIsoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseExcelDateSerial(value: string): string | null {
  if (!/^\d+(\.\d+)?$/.test(value)) return null;

  const serial = Number(value);
  if (!Number.isFinite(serial) || serial <= 0) return null;

  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed?.y || !parsed.m || !parsed.d) return null;

  return formatIsoDate(parsed.y, parsed.m, parsed.d);
}

function parseUkDateParts(dayText: string, monthText: string, yearText: string): string | null {
  const day = Number(dayText);
  const month = Number(monthText);
  let year = Number(yearText);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  if (yearText.length === 2) {
    year += year >= 70 ? 1900 : 2000;
  }

  return formatIsoDate(year, month, day);
}

function normalizeDateValue(rawValue: string | null): string | null {
  const value = normalizeOptionalText(rawValue);
  if (!value) return null;

  const excelSerial = parseExcelDateSerial(value);
  if (excelSerial) return excelSerial;

  const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return formatIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const ukNumericMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (ukNumericMatch) {
    return parseUkDateParts(ukNumericMatch[1], ukNumericMatch[2], ukNumericMatch[3]);
  }

  const monthNames: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  const textualMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2}|\d{4})$/);
  if (textualMatch) {
    const month = monthNames[textualMatch[2].toLowerCase()];
    if (!month) return null;
    return parseUkDateParts(textualMatch[1], String(month), textualMatch[3]);
  }

  return null;
}

function normalizeEstimatedCost(rawValue: string | null): number | null {
  const value = normalizeOptionalText(rawValue);
  if (!value) return null;

  const cleaned = value.replace(/[^0-9.-]+/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
    return null;
  }

  const numericValue = Number(cleaned);
  if (!Number.isFinite(numericValue)) return null;

  return Math.round(numericValue * 100) / 100;
}

export function prepareWorkOrders(
  parsedRows: ParsedRow[],
  geocodedProperties: GeocodedProperty[]
): PreparedWorkOrdersResult {
  const propertyMap = new Map(
    geocodedProperties.map((property) => [property.addressKey, property] as const)
  );

  const workOrders: ImportableWorkOrder[] = [];
  const warnings: ImportWarning[] = [];

  for (const row of parsedRows) {
    const property = propertyMap.get(row.addressKey);
    if (!property) continue;

    const workOrderRef = normalizeOptionalText(row.workOrderRefRaw);
    const description = normalizeOptionalText(row.descriptionRaw);
    const estimatedCost = normalizeEstimatedCost(row.estimatedCostRaw);
    const normalizedDate = normalizeDateValue(row.rawDateValue);

    if (!workOrderRef) {
      warnings.push({
        address: row.address,
        importRowOrder: row.importRowOrder,
        field: "workOrderRef",
        message: "Work order reference is missing.",
      });
    }

    if (!description) {
      warnings.push({
        address: row.address,
        importRowOrder: row.importRowOrder,
        field: "description",
        message: "Description is blank.",
      });
    }

    if (row.estimatedCostRaw && estimatedCost === null) {
      warnings.push({
        address: row.address,
        importRowOrder: row.importRowOrder,
        field: "estimatedCost",
        message: "Estimated cost could not be parsed.",
        rawValue: row.estimatedCostRaw,
      });
    }

    if (row.rawDateValue && normalizedDate === null) {
      warnings.push({
        address: row.address,
        importRowOrder: row.importRowOrder,
        field: "date",
        message: "Date could not be parsed.",
        rawValue: row.rawDateValue,
      });
    }

    workOrders.push({
      address: property.address,
      addressKey: property.addressKey,
      postcode: property.postcode,
      outcode: property.outcode,
      workOrderRef,
      description,
      estimatedCost,
      rawDateValue: row.rawDateValue,
      normalizedDate,
      importRowOrder: row.importRowOrder,
    });
  }

  return { workOrders, warnings };
}

/**
 * Geocoding batch size for Postcodes.io API.
 */
const GEOCODING_BATCH_SIZE = 100;

/**
 * Maximum number of retry attempts for failed API requests.
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay in milliseconds for exponential backoff.
 */
const BASE_RETRY_DELAY_MS = 1000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.25 * exponentialDelay;
  return exponentialDelay + jitter;
}

async function fetchPostcodesWithRetry(
  batch: string[]
): Promise<PostcodesIoResponse | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch("https://api.postcodes.io/postcodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postcodes: batch }),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        logger.warn("Postcodes.io rate limit hit, backing off", {
          attempt: attempt + 1,
          maxAttempts: MAX_RETRY_ATTEMPTS,
        });

        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await sleep(calculateBackoffDelay(attempt) * 2);
          continue;
        }
      }

      if (response.status >= 500 && attempt < MAX_RETRY_ATTEMPTS - 1) {
        logger.warn("Postcodes.io server error, retrying", {
          status: response.status,
          attempt: attempt + 1,
          maxAttempts: MAX_RETRY_ATTEMPTS,
        });
        await sleep(calculateBackoffDelay(attempt));
        continue;
      }

      logger.error("Postcodes.io API error", {
        status: response.status,
        batchSize: batch.length,
      });
      return null;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        logger.warn("Geocoding request failed, retrying", {
          error: lastError.message,
          attempt: attempt + 1,
          maxAttempts: MAX_RETRY_ATTEMPTS,
        });
        await sleep(calculateBackoffDelay(attempt));
        continue;
      }
    }
  }

  logger.error("Geocoding batch failed after all retries", {
    error: lastError?.message || "Unknown error",
    batchSize: batch.length,
  });

  return null;
}

async function geocodePostcodes(
  postcodes: string[]
): Promise<Map<string, { lat: number; lon: number }>> {
  const results = new Map<string, { lat: number; lon: number }>();

  for (let i = 0; i < postcodes.length; i += GEOCODING_BATCH_SIZE) {
    const batch = postcodes.slice(i, i + GEOCODING_BATCH_SIZE);
    const data = await fetchPostcodesWithRetry(batch);

    if (data) {
      for (const item of data.result) {
        if (!item.result) continue;

        results.set(item.query.toUpperCase().replace(/\s+/g, " "), {
          lat: item.result.latitude,
          lon: item.result.longitude,
        });
      }
    }
  }

  return results;
}

export async function geocodeProperties(
  properties: ValidatedProperty[],
  onProgress?: (progress: number) => void
): Promise<GeocodingResult> {
  const geocodedProperties: GeocodedProperty[] = [];
  const excludedProperties: ExcludedProperty[] = [];
  const uniquePostcodes = [...new Set(properties.map((property) => property.postcode))];

  if (uniquePostcodes.length === 0) {
    return { geocodedProperties: [], excludedProperties: [] };
  }

  onProgress?.(0);
  const geocodeMap = await geocodePostcodes(uniquePostcodes);

  if (geocodeMap.size === 0 && uniquePostcodes.length > 0) {
    throw new Error("Geocoding service unavailable. Please try again later.");
  }

  onProgress?.(80);

  for (const property of properties) {
    const normalizedPostcode = property.postcode.toUpperCase().replace(/\s+/g, " ");
    const coords = geocodeMap.get(normalizedPostcode);

    if (!coords) {
      excludedProperties.push({
        address: property.address,
        reason: `Geocoding failed for postcode: ${property.postcode}`,
      });
      continue;
    }

    geocodedProperties.push({
      address: property.address,
      addressKey: property.addressKey,
      postcode: property.postcode,
      outcode: property.outcode,
      lat: coords.lat,
      lon: coords.lon,
      visitCount: property.visitCount,
    });
  }

  onProgress?.(100);

  return { geocodedProperties, excludedProperties };
}
