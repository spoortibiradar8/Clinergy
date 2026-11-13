export type ZoneName = 
  | 'ICU' 
  | 'Operation' 
  | 'Emergency' 
  | 'Ward A' 
  | 'Ward B' 
  | 'OPD' 
  | 'Admin Block' 
  | 'Cafeteria';

export type CriticalityLevel = 'Critical' | 'Semi-Critical' | 'Non-Critical';
export type TariffType = 'Peak' | 'Standard' | 'Off-Peak';

export interface EnergyData {
  Day: number;
  Hour: number;
  Zone: ZoneName;
  Criticality: CriticalityLevel;
  Requires_Continuous_Power: boolean;
  Electricity_kWh: number;
  HVAC_kWh: number;
  Natural_Gas_kWh: number;
  Heating_Gas_kWh: number;
  Boiler_Gas_kWh: number;
  Outdoor_Temperature_C: number;
  Tariff_Type: TariffType;
  Cost_per_kWh: number;
  Electricity_Carbon_kg: number;
  Gas_Carbon_kg: number;
  Total_Carbon_kg: number;
}

export interface ZoneSummary {
  zone: string;
  totalElectricity: number;
  totalHVAC: number;
  totalGas: number; // Sum of Natural, Heating, Boiler
  totalEnergy: number; // Sum of everything
  totalCost: number;
  totalCarbon: number;
}
