import Papa from 'papaparse';
import type { EnergyData, ZoneSummary } from '../types/energy';

const CSV_FILE_PATH = '/data/clinergy_timeseries_energy_dataset.csv';
const CACHE_KEY = "clinergy_offline_data";

// State to cache data so we don't fetch/parse multiple times unnecessarily
let cachedData: EnergyData[] | null = null;
let dataPromise: Promise<EnergyData[]> | null = null;

/**
 * Normalizes boolean values exactly based on PapaParse string output
 * since PapaParse `dynamicTyping` might not catch 'True' / 'False' booleans perfectly based on casing.
 */
const normalizeBooleans = (row: any): any => {
  const normalized = { ...row };
  if (typeof normalized.Requires_Continuous_Power === 'string') {
    normalized.Requires_Continuous_Power = normalized.Requires_Continuous_Power.toLowerCase() === 'true';
  }
  return normalized;
};

/**
 * Fetches and parses the CSV data.
 * Includes caching to avoid redundant network requests.
 */
export async function fetchAllData(): Promise<EnergyData[]> {
  if (cachedData) return cachedData;
  if (dataPromise) return dataPromise;

  dataPromise = new Promise((resolve, reject) => {
    // Check if offline before attempting network request
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        cachedData = JSON.parse(stored) as EnergyData[];
        resolve(cachedData);
        return;
      }
    }

    Papa.parse(CSV_FILE_PATH, {
      download: true,
      header: true,
      dynamicTyping: true, // Auto-convert numbers and booleans
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("PapaParse completed with errors:", results.errors);
        }

        const meta = results.meta;
        if (!meta.fields || !meta.fields.includes('Zone') || !meta.fields.includes('Electricity_kWh')) {
          reject(new Error("Invalid CSV format: Missing required columns."));
          return;
        }

        try {
          cachedData = results.data.map(normalizeBooleans) as EnergyData[];
          // Store in localStorage for offline access
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
          } catch (storageError) {
            console.warn("Could not cache data to localStorage", storageError);
          }
          resolve(cachedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        console.warn("Failed to fetch CSV via network. Attempting offline cache.", error);
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          cachedData = JSON.parse(stored) as EnergyData[];
          resolve(cachedData);
        } else {
          reject(error);
        }
      }
    });
  });

  return dataPromise;
}

/**
 * Filters the dataset by the current hour.
 */
export async function getCurrentHourData(): Promise<EnergyData[]> {
  const data = await fetchAllData();
  const currentHour = new Date().getHours();
  return data.filter(d => d.Hour === currentHour);
}

/**
 * Filters the dataset by a specific hospital zone.
 * @param zoneName The name of the zone (e.g. "ICU", "OPD")
 */
export async function getZoneData(zoneName: string): Promise<EnergyData[]> {
  const data = await fetchAllData();
  return data.filter(d => d.Zone === zoneName);
}

/**
 * Retrieves the data for the last 24 hours (assuming the dataset is chronologically sorted or we just take the last 24 * number_of_zones rows).
 * Alternatively, filters down to a simple Day/Hour slice. By standard logic, we take the last Day and last 24 hours.
 */
export async function getLatest24Hours(): Promise<EnergyData[]> {
  const data = await fetchAllData();
  if (data.length === 0) return [];

  // Assuming the dataset has data up to a specific max Day and 24 hours per day.
  // const maxDay = Math.max(...data.map(d => d.Day));

  // Get all data for maxDay, if it has < 24 hours we might need maxDay - 1,
  // but for simplicity we will get Day == maxDay and Day == maxDay - 1, then slice the last 24 * unique_zones records
  const uniqueZonesCount = new Set(data.map(d => d.Zone)).size;
  const recordsNeeded = 24 * uniqueZonesCount;

  return data.slice(-recordsNeeded);
}

/**
 * Retrieves all data for Day 1 (for chart display).
 */
export async function getDay1Data(): Promise<EnergyData[]> {
  const data = await fetchAllData();
  return data.filter(d => d.Day === 1);
}

/**
 * Returns sparkline data (last 6 hours of Day 1) grouped by zone.
 * Each zone maps to an array of { hour, energy } points.
 */
export async function getSparklineDataForZones(): Promise<Record<string, { hour: number; energy: number }[]>> {
  const day1 = await getDay1Data();
  const result: Record<string, { hour: number; energy: number }[]> = {};

  for (const row of day1) {
    if (!result[row.Zone]) {
      result[row.Zone] = [];
    }
    result[row.Zone].push({
      hour: row.Hour,
      energy: calculateTotalEnergy(row),
    });
  }

  // Sort by hour and take last 6 for each zone
  for (const zone of Object.keys(result)) {
    result[zone] = result[zone]
      .sort((a, b) => a.hour - b.hour)
      .slice(-6);
  }

  return result;
}

/**
 * Calculates the total energy for a single given data row.
 */
export function calculateTotalEnergy(data: EnergyData): number {
  return (
    (data.Electricity_kWh || 0) +
    (data.HVAC_kWh || 0) +
    (data.Natural_Gas_kWh || 0) +
    (data.Heating_Gas_kWh || 0) +
    (data.Boiler_Gas_kWh || 0)
  );
}

/**
 * Calculates the total cost for a single given data row based on total energy.
 * Note: If gas and electricity have different costs, the user prompt asked simply for total energy * cost_per_kWh.
 */
export function calculateTotalCost(data: EnergyData): number {
  const totalEng = calculateTotalEnergy(data);
  return totalEng * (data.Cost_per_kWh || 0);
}

/**
 * Aggregates the data to return a summary for each zone.
 */
export async function getTotalsByZone(): Promise<ZoneSummary[]> {
  const data = await fetchAllData();

  const summaries: Record<string, ZoneSummary> = {};

  for (const row of data) {
    if (!summaries[row.Zone]) {
      summaries[row.Zone] = {
        zone: row.Zone,
        totalElectricity: 0,
        totalHVAC: 0,
        totalGas: 0,
        totalEnergy: 0,
        totalCost: 0,
        totalCarbon: 0,
      };
    }

    // Aggregate values
    const s = summaries[row.Zone];
    const gasSum = (row.Natural_Gas_kWh || 0) + (row.Heating_Gas_kWh || 0) + (row.Boiler_Gas_kWh || 0);
    const rowEnergy = calculateTotalEnergy(row);
    const rowCost = calculateTotalCost(row);

    s.totalElectricity += (row.Electricity_kWh || 0);
    s.totalHVAC += (row.HVAC_kWh || 0);
    s.totalGas += gasSum;
    s.totalEnergy += rowEnergy;
    s.totalCost += rowCost;
    s.totalCarbon += (row.Total_Carbon_kg || (row.Electricity_Carbon_kg + row.Gas_Carbon_kg) || 0);
  }

  return Object.values(summaries);
}
