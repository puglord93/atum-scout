import * as XLSX from 'xlsx';
import { Researcher, TechOffer } from '@prisma/client';
import fs from 'fs';

// Column name mappings for Funnel 2 (different sheets have different names)
const COLUMN_MAPPINGS = {
  technology: ['Technology', 'Tech Name'],
  sector: ['Sector', 'Category', 'Domain'],
  description: ['Brief Description', 'Description (Cleaned)', 'Description', 'Tech Description'],
  venturePotential: ['Venture Potential', 'Venture\n Potential'],
  atumPursue: ['ATUM Pursue?', 'ATUM Pursue', 'ATUM Shortlist'],
  qualityTier: ['Quality Tier*', 'Quality Tier'],
};

// Skip sheets that are likely metadata, empty, or internal shortlists
const SKIP_SHEETS = ['Sheet21', 'Methodology', 'Dashboard', 'Shortlist'];

/**
 * Get first matching column from list of options
 */
function safeGetColumn(row: any, columnOptions: string[]): string | null {
  for (const col of columnOptions) {
    if (row[col] !== undefined && row[col] !== null) {
      return String(row[col]).trim();
    }
  }
  return null;
}

/**
 * Safely convert value to string, return empty string if null/undefined
 */
function safeStr(value: any): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value).trim();
}

/**
 * Safely convert value to int, return null if not possible
 */
function safeInt(value: any): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = parseInt(String(value), 10);
  return isNaN(num) ? null : num;
}

/**
 * Safely convert value to float, return null if not possible
 */
function safeFloat(value: any): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
}

/**
 * Normalize name for matching (remove titles, extra spaces)
 */
function normalizeName(name: string | null): string {
  if (!name) return '';
  return name
    .replace(/^(Dr\.?|Prof\.?|Professor|Associate Professor|Assoc\.? Prof\.?)\s+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Load tech offers from Funnel 2 Excel file
 */
export async function loadTechOffersFromExcel(filePath: string): Promise<Omit<TechOffer, 'id' | 'createdAt' | 'updatedAt'>[]> {
  let workbook;
  try {
    const buffer = fs.readFileSync(filePath);
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (error) {
    throw new Error(`Cannot access file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const techOffers: Omit<TechOffer, 'id' | 'createdAt' | 'updatedAt'>[]= [];

  for (const sheetName of workbook.SheetNames) {
    // Skip metadata sheets
    if (SKIP_SHEETS.includes(sheetName)) {
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    // Skip if sheet is empty
    if (!data || data.length === 0) {
      console.warn(`Skipping sheet '${sheetName}': empty sheet`);
      continue;
    }

    // Check if technology column exists
    const firstRow = data[0];
    const techCol = safeGetColumn(firstRow, COLUMN_MAPPINGS.technology);
    if (techCol === null) {
      console.warn(`Skipping sheet '${sheetName}': no Technology column`);
      continue;
    }

    for (let idx = 0; idx < data.length; idx++) {
      const row = data[idx];

      // Get technology name
      const techName = safeGetColumn(row, COLUMN_MAPPINGS.technology);
      if (!techName) {
        continue; // Skip rows with null Technology
      }

      const techId = `${sheetName}_${idx}`;

      // Get sector/category
      const sector = safeGetColumn(row, COLUMN_MAPPINGS.sector);

      // Get description
      const description = safeGetColumn(row, COLUMN_MAPPINGS.description);

      // Get venture potential
      const venturePotential = safeGetColumn(row, COLUMN_MAPPINGS.venturePotential);

      // Get ATUM Pursue
      const atumPursue = safeGetColumn(row, COLUMN_MAPPINGS.atumPursue);

      // Get quality tier
      const qualityTier = safeGetColumn(row, COLUMN_MAPPINGS.qualityTier);

      // Normalize PI name (i2R uses 'Inventor' instead of 'Likely PI')
      const likelyPi = safeStr(row['Likely PI (Verified)'] || row['Inventor'] || '');

      techOffers.push({
        techId,
        technology: techName,
        institution: sheetName,
        trl: safeStr(row['TRL'] || ''),
        sector: sector || null,
        venturePotential: venturePotential || null,
        description: description || null,
        useCase: safeStr(row['Use Case'] || ''),
        vsExisting: safeStr(row['vs. Existing'] || ''),
        commercializationPath: safeStr(row['Commercialization Path'] || ''),
        atumPursue: atumPursue || null,
        likelyPi: likelyPi || null,
        qualityTier: qualityTier || null,
        notes: safeStr(row['Notes'] || ''),
      });
    }
  }

  console.log(`Loaded ${techOffers.length} tech offers from ${workbook.SheetNames.length} sheets`);
  return techOffers;
}

/**
 * Load researchers from Funnel 3 Excel file
 */
export async function loadResearchersFromExcel(filePath: string): Promise<Omit<Researcher, 'id' | 'createdAt' | 'updatedAt'>[]> {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Use 'Power List - Top Targets' sheet which has the main researcher data
  const sheetName = 'Power List - Top Targets';
  if (!workbook.SheetNames.includes(sheetName)) {
    console.warn(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
    return [];
  }

  const worksheet = workbook.Sheets[sheetName];

  // Parse with header starting from row 2 (row 1 is title)
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { range: 1 });

  const researchers: Omit<Researcher, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const row of data) {
    const fullName = safeStr(row['Full Name'] || '');
    if (!fullName) {
      continue; // Skip rows without name
    }

    researchers.push({
      fullName,
      email: safeStr(row['Email'] || ''),
      affiliation: safeStr(row['Affiliation'] || ''),
      tier: safeStr(row['Tier'] || 'D'),
      hIndex: safeInt(row['h-index']) || 0,
      citations: safeInt(row['Citations']) || 0,
      cScore: safeFloat(row['c-score']) || 0,
      globalRank: safeInt(row['Global Rank']),
      domainTags: safeStr(row['Domain Tags'] || ''),
      subfield: safeStr(row['Subfield (Elsevier)'] || ''),
      category: safeStr(row['Category'] || ''),
      noteOnResearch: safeStr(row['Note on Research'] || ''),
      origin: safeStr(row['Origin'] || 'Funnel 3'),
      contacted: false,
      contactDate: null,
      contactedBy: null,
    });
  }

  console.log(`Loaded ${researchers.length} researchers from ${sheetName}`);
  return researchers;
}
