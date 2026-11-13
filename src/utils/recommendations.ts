export interface Recommendation {
  id: string;
  category: 'energy' | 'maintenance' | 'system' | 'ai';
  titleKey: string; // Keep titleKey to avoid breaking other components assuming a titleKey exists
  priority: 'low' | 'medium' | 'high';
  tags?: string[]; 
  
  // New Chic Structural Format
  whatHappened: string;
  whatToDo: string;
  whomToInform: string;
  benefit: string;
}

export const HOME_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'h1',
    category: 'energy',
    titleKey: 'Peak Shaving Required',
    priority: 'high',
    tags: ['power', 'energy'],
    whatHappened: 'Overall grid consumption has reached 92% of the maximum daily allowance due to simultaneous heavy load in HVAC and ICU cooling.',
    whatToDo: 'Initiate automated peak shaving protocol. Throttle non-critical ambient cooling systems by 2°C across general wards.',
    whomToInform: 'Facility Manager & Electrical Grid Team',
    benefit: 'Reduces grid load by 15% within 10 minutes, avoiding peak demand surcharge penalties.'
  },
  {
    id: 'h2',
    category: 'system',
    titleKey: 'HVAC Tuning Opportunity',
    priority: 'medium',
    tags: ['power', 'energy'],
    whatHappened: 'The operation theatre HVAC system is running at 100% capacity while occupancy remains below 50%.',
    whatToDo: 'Enable Smart Sync to dynamically link HVAC output to real-time occupancy sensor telemetry.',
    whomToInform: 'Maintenance Operations',
    benefit: 'Improves mechanical longevity and saves approximately 45 kWh per day.'
  },
  {
    id: 'h3',
    category: 'energy',
    titleKey: 'Cost Optimization Mode',
    priority: 'high',
    tags: ['cost'],
    whatHappened: 'Time-of-use (TOU) electricity pricing is currently at peak rates for the next 4 hours.',
    whatToDo: 'Switch primary non-critical power loads to the onsite battery storage reserve.',
    whomToInform: 'Automated System (No manual call needed)',
    benefit: 'Will generate $1,200 in cost savings for this billing cycle.'
  }
];

export const LIVE_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'l1',
    category: 'system',
    titleKey: 'Surge Protection Active',
    priority: 'high',
    tags: ['live'],
    whatHappened: 'A minor power grid fluctuation was detected entering the primary circuit breaker 3 minutes ago.',
    whatToDo: 'Conduct a rapid diagnostic sweep of all sensitive ICU and Radiology equipment endpoints.',
    whomToInform: 'Biomedical Engineering Dept & Electrical Team',
    benefit: 'Ensures zero equipment damage and maintains 100% patient safety compliance.'
  },
  {
    id: 'l2',
    category: 'energy',
    titleKey: 'Unbalanced Load Warning',
    priority: 'medium',
    tags: ['live'],
    whatHappened: 'Phase B on the main transformer is drawing 15% more current than Phase A and Phase C.',
    whatToDo: 'Redistribute high-draw medical imaging equipment from Phase B to Phase C to balance the transformer.',
    whomToInform: 'Chief Electrical Engineer',
    benefit: 'Prevents transformer overheating and mitigates risk of a localized blackout.'
  }
];

export const ZONE_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'z1',
    category: 'system',
    titleKey: 'Occupancy Sensor Drift',
    priority: 'medium',
    tags: ['zone'],
    whatHappened: 'Sensors in Ward A are continuously reporting occupancy, but entry logs show the zone has been empty for 2 hours.',
    whatToDo: 'Recalibrate the PIR sensors in Ward A and perform a firmware reset.',
    whomToInform: 'IT & Facilities Helpdesk',
    benefit: 'Reduces ghost-load energy waste and corrects the automated lighting system.'
  }
];

export const AI_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'a1',
    category: 'ai',
    titleKey: 'AI Load Forecasting',
    priority: 'high',
    whatHappened: 'Predictive models indicate a 95% probability of a severe heatwave tomorrow, which will spike HVAC demands.',
    whatToDo: 'Pre-cool the facility tonight during off-peak hours and utilize thermal mass storage to offset tomorrow\'s load.',
    whomToInform: 'Operations Director',
    benefit: 'Mitigates the expected 30% surge in energy costs and ensures ambient temperatures remain stable.'
  },
  {
    id: 'a2',
    category: 'energy',
    titleKey: 'Solar Sync Optimization',
    priority: 'medium',
    whatHappened: 'Onsite solar panels are generating excess power that the current load profile cannot entirely consume.',
    whatToDo: 'Route excess solar yield to charge the EV fleet and thermal energy storage tanks.',
    whomToInform: 'Fleet Manager',
    benefit: 'Maximizes renewable utilization and achieves a 100% green energy footprint for the afternoon.'
  }
];

export const MAINTENANCE_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'm1',
    category: 'maintenance',
    titleKey: 'Ventilator Service Due',
    priority: 'high',
    whatHappened: '3 ventilators in the ICU are within 48 hours of their mandatory 500-hour service interval.',
    whatToDo: 'Swap the affected units with standby inventory and initiate the standard sterilization and calibration protocol.',
    whomToInform: 'Biomedical Department',
    benefit: 'Maintains Joint Commission compliance and zero-risk patient care.'
  },
  {
    id: 'm2',
    category: 'maintenance',
    titleKey: 'Calibration Check Required',
    priority: 'medium',
    whatHappened: 'The ambient temperature sensors in the Pharmacy are showing a 0.5°C drift compared to the redundant backup sensor.',
    whatToDo: 'Perform a dual-point temperature calibration using a certified reference thermometer.',
    whomToInform: 'Calibration Lab Technician',
    benefit: 'Ensures strict temperature compliance for sensitive medication storage.'
  }
];

export const REPORTS_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    category: 'energy',
    titleKey: 'Efficiency Reporting Trend',
    priority: 'medium',
    whatHappened: 'The monthly efficiency report indicates a consistent 5% increase in baseline consumption over weekends.',
    whatToDo: 'Audit weekend shutdown procedures for non-essential administrative zones.',
    whomToInform: 'Department Heads',
    benefit: 'Eliminates weekend energy waste and resets baseline efficiency metrics.'
  }
];
