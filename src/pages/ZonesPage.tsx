import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronRight, 
  Zap, 
  Thermometer, 
  AlertCircle, 
  TrendingUp, 
  Grid2X2, 
  List, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Edit3, 
  ShieldAlert, 
  CheckCircle2, 
  Clock,
  ChevronDown,
  Info,
  Users,
  Droplets,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import { useMobile } from '@/hooks/useMobile';
import toast from 'react-hot-toast';

// ── DESIGN SYSTEM CONSTANTS ──────────────────────────────────────────────────
const COLORS = {
  teal: '#2a9d8f',
  tealLight: '#e0f5f2',
  red: '#ff4d4d',
  redLight: '#fff5f5',
  amber: '#f4a261',
  amberLight: '#fffaf0',
  green: '#57cc99',
  greenLight: '#e6f9f0',
  bgMain: 'var(--page-bg)',
  cardBg: 'var(--card-bg)',
  textPrimary: '#2d3a33',
  textMuted: '#6b8f80',
  indigo: '#6366f1',
  greyLight: '#fafafa',
  border: 'var(--page-border)'
};

// ── INTERFACES ──────────────────────────────────────────────────────────────
interface Alert {
  id: number;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface Zone {
  zone_name: string;
  criticality: 'Critical' | 'Essential' | 'Standard' | 'Non-Essential';
  type: string;
  power_kw: number;
  voltage: number;
  current: number;
  temp: number;
  humidity: number;
  occupancy: number;
  kwh: number;
  threshold: number;
  peak_kw: number;
  min_kw: number;
  last_updated: string;
  floor: string;
  alerts: Alert[];
}

// ── REUSABLE BADGES ─────────────────────────────────────────────────────────
const CriticalityBadge = ({ criticality }: { criticality: string }) => {
  let bg = COLORS.tealLight;
  let color = COLORS.teal;
  let border = `1px solid #c2f0eb`;

  if (criticality === 'Critical') {
    bg = COLORS.redLight;
    color = COLORS.red;
    border = `1px solid #ffa39e`;
  } else if (criticality === 'Essential') {
    bg = COLORS.amberLight;
    color = COLORS.amber;
    border = `1px solid #ffe58f`;
  } else if (criticality === 'Non-Essential') {
    bg = '#f1f5f9';
    color = '#475569';
    border = `1px solid #cbd5e1`;
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      fontSize: '11px',
      fontWeight: 600,
      borderRadius: '8px',
      backgroundColor: bg,
      color: color,
      border: border,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {criticality}
    </span>
  );
};

const getAbbreviation = (name: string) => {
  if (name.includes('ICU')) return 'ICU';
  if (name.includes('Operation') || name.includes('OT')) return 'OT';
  if (name.includes('Emergency')) return 'ER';
  if (name.includes('Ward A')) return 'WA';
  if (name.includes('Ward B')) return 'WB';
  if (name.includes('Pharmacy')) return 'PH';
  return name.slice(0, 3).toUpperCase();
};

const getAIInsight = (zoneName: string) => {
  const name = zoneName.toLowerCase();
  if (name.includes('icu')) {
    return "ICU loads are highly continuous. Maintaining a stable ambient 21.6°C airflow requires 15% peak load during patient handovers. Optimizing auxiliary ventilation would save ₹520 daily.";
  }
  if (name.includes('operation') || name.includes('ot')) {
    return "Surgical block draws massive load during operations. Consider scheduling pre-cooling of OT theatres at 08:30 instead of 09:00 to shave off ₹890 in peak tariffs.";
  }
  if (name.includes('emergency') || name.includes('er')) {
    return "ER peaks unpredictably. Pre-cooling general trauma bays before midday high heat indexes can save ₹450 daily in thermal loading penalties.";
  }
  if (name.includes('ward')) {
    return "General patient wards experience visitor peaks between 16:00-19:00. Dimming corridor lighting by 20% can offset ₹210 daily.";
  }
  if (name.includes('pharmacy')) {
    return "Pharmacy chillers require clean 18°C cold chains. Thermal storage buffering could shift peak load from 13:00 to 07:00, saving ₹340 daily.";
  }
  return "AI Insight: This zone's usage peaks between 10:00–14:00. Consider pre-cooling 30 mins early to save on peak municipal utility tariffs.";
};

// ── INITIAL ZONES DATA ───────────────────────────────────────────────────────
const INITIAL_ZONES: Zone[] = [
  {
    zone_name: 'ICU',
    criticality: 'Critical',
    type: 'Life-Critical Care Unit',
    power_kw: 144.1,
    voltage: 415.2,
    current: 347.1,
    temp: 21.6,
    humidity: 52,
    occupancy: 12,
    kwh: 11.7,
    threshold: 200,
    peak_kw: 165.0,
    min_kw: 115.0,
    last_updated: 'just now',
    floor: 'Floor 3, Wing A',
    alerts: [
      { id: 1, severity: 'Warning', message: 'ICU humidity reached 52% (upper threshold boundary)', timestamp: '10:14:22', acknowledged: false },
      { id: 2, severity: 'Critical', message: 'Power spike 165 kW detected', timestamp: '08:45:10', acknowledged: true }
    ]
  },
  {
    zone_name: 'Operation Theatre',
    criticality: 'Critical',
    type: 'Surgical Operations',
    power_kw: 219.3,
    voltage: 414.8,
    current: 528.6,
    temp: 20.5,
    humidity: 48,
    occupancy: 8,
    kwh: 18.3,
    threshold: 250,
    peak_kw: 238.0,
    min_kw: 185.0,
    last_updated: 'just now',
    floor: 'Floor 2, Surgical Wing',
    alerts: [
      { id: 1, severity: 'Critical', message: 'OT Block — Usage reached 88% of limit threshold', timestamp: '12:30:15', acknowledged: false }
    ]
  },
  {
    zone_name: 'Emergency',
    criticality: 'Critical',
    type: 'Emergency & Trauma',
    power_kw: 90.5,
    voltage: 415.9,
    current: 217.6,
    temp: 23.1,
    humidity: 55,
    occupancy: 24,
    kwh: 7.5,
    threshold: 150,
    peak_kw: 115.0,
    min_kw: 70.0,
    last_updated: 'just now',
    floor: 'Floor 1, ER Entrance',
    alerts: []
  },
  {
    zone_name: 'Ward A',
    criticality: 'Standard',
    type: 'General Patient Ward',
    power_kw: 55.2,
    voltage: 416.1,
    current: 132.7,
    temp: 22.0,
    humidity: 60,
    occupancy: 38,
    kwh: 9.2,
    threshold: 100,
    peak_kw: 70.0,
    min_kw: 42.0,
    last_updated: 'just now',
    floor: 'Floor 4, East Wing',
    alerts: []
  },
  {
    zone_name: 'Ward B',
    criticality: 'Standard',
    type: 'General Patient Ward',
    power_kw: 45.6,
    voltage: 415.5,
    current: 109.6,
    temp: 22.2,
    humidity: 58,
    occupancy: 31,
    kwh: 7.9,
    threshold: 100,
    peak_kw: 58.0,
    min_kw: 32.0,
    last_updated: 'just now',
    floor: 'Floor 4, West Wing',
    alerts: [
      { id: 1, severity: 'Warning', message: 'Ward B — Temperature spike 22.2°C', timestamp: '11:22:04', acknowledged: false }
    ]
  },
  {
    zone_name: 'Pharmacy',
    criticality: 'Essential',
    type: 'Medication Storage & Dispensary',
    power_kw: 29.6,
    voltage: 416.3,
    current: 71.1,
    temp: 18.1,
    humidity: 62,
    occupancy: 6,
    kwh: 4.8,
    threshold: 80,
    peak_kw: 36.0,
    min_kw: 20.0,
    last_updated: 'just now',
    floor: 'Floor 1, Wing B',
    alerts: []
  }
];

export default function ZonesPage() {
  const isMobile = useMobile();
  const { t } = useLanguage();
  const translate = (key: string) => {
    try {
      return t(key) || key;
    } catch {
      return key;
    }
  };

  // State Declarations
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL'); // ALL, Critical, Essential, Standard, Non-Essential
  const [sortBy, setSortBy] = useState('Name'); // Name, Power, Usage %, Temperature
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [detailTab, setDetailTab] = useState<'Overview' | 'History' | 'Alerts' | 'Settings'>('Overview');
  const [compareMetric, setCompareMetric] = useState<'Power' | 'Energy' | 'Temperature' | 'Usage %'>('Power');

  // Inline threshold edit states
  const [editingThresholdZone, setEditingThresholdZone] = useState<string | null>(null);
  const [inlineThresholdInput, setInlineThresholdInput] = useState('');

  // Add Zone Modal state
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [newZoneData, setNewZoneData] = useState({
    zone_name: '',
    type: '',
    criticality: 'Standard' as any,
    threshold: '',
    floor: '',
    notifications: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Settings Tab in Details Modal state
  const [settingsName, setSettingsName] = useState('');
  const [settingsCriticality, setSettingsCriticality] = useState<'Critical' | 'Essential' | 'Standard' | 'Non-Essential'>('Standard');
  const [settingsThreshold, setSettingsThreshold] = useState('');
  const [settingsEmail, setSettingsEmail] = useState(true);
  const [settingsSMS, setSettingsSMS] = useState(false);
  const [settingsDashboard, setSettingsDashboard] = useState(true);

  // Sync details settings form when active zone changes
  useEffect(() => {
    if (selectedZone) {
      setSettingsName(selectedZone.zone_name);
      setSettingsCriticality(selectedZone.criticality);
      setSettingsThreshold(selectedZone.threshold.toString());
    }
  }, [selectedZone]);

  // Main 5-second Telemetry Simulator
  useEffect(() => {
    const simInterval = setInterval(() => {
      setZones(prevZones => 
        prevZones.map(zone => {
          // Power Draw ±2%
          const powChange = (Math.random() * 0.04 - 0.02);
          const nextPower = Math.max(5, +(zone.power_kw * (1 + powChange)).toFixed(1));

          // Voltage ±0.5V
          const nextVoltage = Math.max(400, Math.min(430, +(zone.voltage + (Math.random() * 1.6 - 0.8)).toFixed(1)));

          // Current ±2%
          const currChange = (Math.random() * 0.04 - 0.02);
          const nextCurrent = Math.max(2, +(zone.current * (1 + currChange)).toFixed(1));

          // Temp ±0.1C
          const nextTemp = Math.max(15, Math.min(28, +(zone.temp + (Math.random() * 0.2 - 0.1)).toFixed(1)));

          // Humidity ±1% (between 45-65%)
          const nextHumidity = Math.max(45, Math.min(65, Math.round(zone.humidity + (Math.random() * 2 - 1))));

          // Occupancy ±1 person (min 1, max 80)
          const occupancyChange = Math.random() > 0.75 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const nextOccupancy = Math.max(1, Math.min(80, zone.occupancy + occupancyChange));

          // Cumulative Energy Today
          const nextKwh = +(zone.kwh + (nextPower * (5 / 3600))).toFixed(3);

          const nextPeak = Math.max(zone.peak_kw, nextPower);
          const nextMin = Math.min(zone.min_kw, nextPower);

          return {
            ...zone,
            power_kw: nextPower,
            voltage: nextVoltage,
            current: nextCurrent,
            temp: nextTemp,
            humidity: nextHumidity,
            occupancy: nextOccupancy,
            kwh: nextKwh,
            peak_kw: nextPeak,
            min_kw: nextMin,
            last_updated: 'just now'
          };
        })
      );
    }, 5000);

    return () => clearInterval(simInterval);
  }, []);

  // Summary Counts (calculated dynamically)
  const criticalCount = useMemo(() => zones.filter(z => z.criticality === 'Critical').length, [zones]);
  const essentialCount = useMemo(() => zones.filter(z => z.criticality === 'Essential').length, [zones]);
  const standardCount = useMemo(() => zones.filter(z => z.criticality === 'Standard').length, [zones]);
  const nonEssentialCount = useMemo(() => zones.filter(z => z.criticality === 'Non-Essential').length, [zones]);

  // Filtering & Sorting Zones
  const filteredAndSortedZones = useMemo(() => {
    return [...zones]
      .filter(z => {
        const matchesSearch = z.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             z.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCrit = criticalityFilter === 'ALL' || z.criticality.toUpperCase() === criticalityFilter.toUpperCase();
        return matchesSearch && matchesCrit;
      })
      .sort((a, b) => {
        if (sortBy === 'Name') {
          return a.zone_name.localeCompare(b.zone_name);
        }
        if (sortBy === 'Power') {
          return b.power_kw - a.power_kw;
        }
        if (sortBy === 'Usage %') {
          const usageA = (a.power_kw / a.threshold) * 100;
          const usageB = (b.power_kw / b.threshold) * 100;
          return usageB - usageA;
        }
        if (sortBy === 'Temperature') {
          return b.temp - a.temp;
        }
        return 0;
      });
  }, [zones, searchQuery, criticalityFilter, sortBy]);

  // Inline Threshold Save Handler
  const handleInlineThresholdSave = (zoneName: string) => {
    const nextVal = parseFloat(inlineThresholdInput);
    if (!isNaN(nextVal) && nextVal > 0) {
      setZones(prev => prev.map(z => {
        if (z.zone_name === zoneName) {
          return { ...z, threshold: nextVal };
        }
        return z;
      }));
      setEditingThresholdZone(null);
      toast.success(`Alert threshold updated to ${nextVal} kW for ${zoneName}`);
    } else {
      toast.error('Please enter a valid positive number');
    }
  };

  // Add Zone Form Submitter
  const handleCreateZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!newZoneData.zone_name.trim()) errors.zone_name = 'Zone Name is required';
    if (!newZoneData.type) errors.type = 'Zone Type is required';
    
    const threshVal = parseFloat(newZoneData.threshold);
    if (!newZoneData.threshold) errors.threshold = 'Threshold is required';
    else if (isNaN(threshVal) || threshVal <= 0) errors.threshold = 'Threshold must be a positive limit';
    
    if (!newZoneData.floor.trim()) errors.floor = 'Floor / Location is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Add Zone object creation
    const newZoneObj: Zone = {
      zone_name: newZoneData.zone_name,
      criticality: newZoneData.criticality,
      type: newZoneData.type === 'Custom' ? 'Custom Department' : `${newZoneData.type} Wing`,
      power_kw: Math.round(threshVal * 0.58),
      voltage: 415.2,
      current: Math.round((threshVal * 0.58 * 1000) / (415 * Math.sqrt(3))),
      temp: 21.8,
      humidity: 54,
      occupancy: 6,
      kwh: 2.1,
      threshold: threshVal,
      peak_kw: Math.round(threshVal * 0.58),
      min_kw: Math.round(threshVal * 0.58),
      last_updated: 'just now',
      floor: newZoneData.floor,
      alerts: []
    };

    setZones(prev => [...prev, newZoneObj]);
    setAddZoneOpen(false);
    setNewZoneData({
      zone_name: '',
      type: '',
      criticality: 'Standard',
      threshold: '',
      floor: '',
      notifications: true
    });
    setFormErrors({});
    toast.success(`Zone "${newZoneObj.zone_name}" added successfully!`);
  };

  // Details Modal Settings Save Handler
  const handleSaveModalSettings = () => {
    const nextLimit = parseFloat(settingsThreshold);
    if (!settingsName.trim()) {
      toast.error('Zone Name cannot be empty');
      return;
    }
    if (isNaN(nextLimit) || nextLimit <= 0) {
      toast.error('Threshold must be a positive number');
      return;
    }

    setZones(prev => prev.map(z => {
      if (z.zone_name === selectedZone?.zone_name) {
        const updatedZone = {
          ...z,
          zone_name: settingsName,
          criticality: settingsCriticality,
          threshold: nextLimit
        };
        setSelectedZone(updatedZone);
        return updatedZone;
      }
      return z;
    }));

    toast.success(`Zone configurations saved successfully!`);
  };

  // Clear Alerts Handler
  const handleClearAlerts = (zoneName: string) => {
    setZones(prev => prev.map(z => {
      if (z.zone_name === zoneName) {
        const clearedZone = { ...z, alerts: [] };
        setSelectedZone(clearedZone);
        return clearedZone;
      }
      return z;
    }));
    toast.success('Alert logs cleared successfully');
  };

  // Dynamic values for Comparison grouped BarChart
  const zoneComparisonData = useMemo(() => {
    return zones.map(z => {
      const usagePct = Math.round((z.power_kw / z.threshold) * 100);
      return {
        name: getAbbreviation(z.zone_name),
        fullName: z.zone_name,
        // Power Draw vs Peak Power
        powerDraw: z.power_kw,
        peakPower: z.peak_kw,
        // Energy Today vs Yesterday's Energy
        energyToday: z.kwh,
        yesterdayEnergy: +(z.kwh * 0.93).toFixed(1),
        // Temperature vs safe limit
        temperature: z.temp,
        maxTemp: 25.0,
        // Usage % vs threshold limit
        usage: usagePct,
        thresholdLimit: 100
      };
    });
  }, [zones]);

  // Tab Details deterministic hourly simulation
  const overviewHourlyData = useMemo(() => {
    if (!selectedZone) return [];
    const base = selectedZone.power_kw;
    return Array.from({ length: 24 }, (_, i) => {
      const time = `${i.toString().padStart(2, '0')}:00`;
      const multiplier = 0.82 + Math.sin((i - 6) * Math.PI / 12) * 0.18 + Math.random() * 0.04;
      return {
        time,
        power: +(base * multiplier).toFixed(1)
      };
    });
  }, [selectedZone]);

  // Tab Details 7-day trend simulation
  const historyWeeklyData = useMemo(() => {
    if (!selectedZone) return [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => {
      const kwhVal = +(selectedZone.kwh * (0.85 + Math.sin(idx * 0.6) * 0.15)).toFixed(1);
      return {
        day,
        kwh: kwhVal,
        peak: +(selectedZone.power_kw * (0.95 + Math.random() * 0.08)).toFixed(1),
        cost: Math.round(kwhVal * 8.5),
        co2: +(kwhVal * 0.85).toFixed(1)
      };
    });
  }, [selectedZone]);

  return (
    <div 
      className="p-3 md:p-6 gap-4 md:gap-6"
      style={{
        backgroundColor: COLORS.bgMain,
        color: COLORS.textPrimary,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      
      {/* PAGE HEADER */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: COLORS.cardBg,
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '24px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
            Zones
          </h1>
          <div 
            className="flex overflow-x-auto flex-nowrap" 
            style={{ gap: '10px', maxWidth: '100%', paddingBottom: '4px' }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: COLORS.redLight,
              color: COLORS.red,
              border: `1px solid #ffa39e`,
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.red, flexShrink: 0 }} />
              {criticalCount} Critical Zones
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: COLORS.amberLight,
              color: COLORS.amber,
              border: `1px solid #ffe58f`,
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.amber, flexShrink: 0 }} />
              {essentialCount} Essential Zone
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: COLORS.tealLight,
              color: COLORS.teal,
              border: `1px solid #c2f0eb`,
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.teal, flexShrink: 0 }} />
              {standardCount} Standard Zones
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: `1px solid #cbd5e1`,
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8', flexShrink: 0 }} />
              {nonEssentialCount} Non-Essential Zones
            </span>
          </div>
        </div>

        <button 
          onClick={() => setAddZoneOpen(true)}
          className="fixed bottom-4 right-4 md:static z-50 rounded-full md:rounded-lg"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: COLORS.teal,
            color: '#ffffff',
            border: 'none',
            width: isMobile ? '56px' : 'auto',
            height: isMobile ? '56px' : 'auto',
            padding: isMobile ? '0' : '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(42, 157, 143, 0.4)',
            transition: 'background-color 0.2s'
          }}
        >
          <Plus size={isMobile ? 24 : 16} />
          {!isMobile && <span>Add Zone</span>}
        </button>
      </div>

      {/* SECTION 1 — VIEW TOGGLE + FILTERS */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '12px',
        padding: '12px 20px',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* View Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px', border: '1px solid #cbd5e1' }}>
          <button 
            onClick={() => setViewMode('grid')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
              color: viewMode === 'grid' ? COLORS.teal : COLORS.textMuted,
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Grid2X2 size={15} />
            Card View
          </button>
          <button 
            onClick={() => setViewMode('table')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
              color: viewMode === 'table' ? COLORS.teal : COLORS.textMuted,
              boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <List size={15} />
            Table View
          </button>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: COLORS.textMuted }} />
          <input 
            type="text" 
            placeholder="Search zones..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: COLORS.textPrimary,
              backgroundColor: '#ffffff',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter and Sort options */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Criticality Filter */}
          <div style={{ position: 'relative' }}>
            <select 
              value={criticalityFilter}
              onChange={e => setCriticalityFilter(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: COLORS.textPrimary,
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              <option value="ALL">All Criticality</option>
              <option value="Critical">Critical Only</option>
              <option value="Essential">Essential Only</option>
              <option value="Standard">Standard Only</option>
              <option value="Non-Essential">Non-Essential Only</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: COLORS.textMuted, pointerEvents: 'none' }} />
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: COLORS.textPrimary,
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              <option value="Name">Sort: Name</option>
              <option value="Power">Sort: Power</option>
              <option value="Usage %">Sort: Usage %</option>
              <option value="Temperature">Sort: Temp</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: COLORS.textMuted, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* SECTION 2A — CARD VIEW */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{
              gap: '20px'
            }}
          >
            {filteredAndSortedZones.map((zone, idx) => {
              const usagePct = Math.round((zone.power_kw / zone.threshold) * 100);
              
              // Dynamic Usage Bar Color
              let usageBarColor = COLORS.teal;
              if (usagePct >= 80) usageBarColor = COLORS.red;
              else if (usagePct >= 50) usageBarColor = COLORS.amber;

              const isEditingInline = editingThresholdZone === zone.zone_name;

              return (
                <motion.div 
                  key={zone.zone_name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  style={{
                    backgroundColor: COLORS.cardBg,
                    borderRadius: '16px',
                    border: `1px solid ${COLORS.border}`,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                    minHeight: '340px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Card top status highlight for overloads */}
                  {usagePct >= 80 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: COLORS.red }} />
                  )}

                  {/* Card Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                        {translate(zone.zone_name)}
                      </h3>
                      <CriticalityBadge criticality={zone.criticality} />
                    </div>
                    <span style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '500', display: 'block', marginTop: '2px' }}>
                      {zone.type}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    borderTop: `1px solid ${COLORS.border}`,
                    borderBottom: `1px solid ${COLORS.border}`,
                    padding: '12px 0'
                  }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Power Draw
                      </span>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: COLORS.textPrimary, display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
                        {zone.power_kw.toFixed(1)}
                        <span style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textMuted }}>kW</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Energy Today
                      </span>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: COLORS.teal, display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
                        {zone.kwh.toFixed(1)}
                        <span style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textMuted }}>kWh</span>
                      </div>
                    </div>
                  </div>

                  {/* Environmental Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary }}>
                      <Thermometer size={14} style={{ color: COLORS.red }} />
                      {zone.temp.toFixed(1)}°C
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary }}>
                      <Droplets size={14} style={{ color: COLORS.indigo }} />
                      {zone.humidity}% RH
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary }}>
                      <Users size={14} style={{ color: COLORS.teal }} />
                      {zone.occupancy} Active
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: '700' }}>Usage</span>
                      <span style={{ fontSize: '12px', color: usageBarColor, fontWeight: '800' }}>{usagePct}%</span>
                    </div>
                    <div style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, usagePct)}%`,
                        height: '100%',
                        backgroundColor: usageBarColor,
                        borderRadius: '99px',
                        transition: 'width 0.5s ease-out'
                      }} />
                    </div>
                  </div>

                  {/* Threshold Row (Edit Inline) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isEditingInline ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="number"
                          value={inlineThresholdInput}
                          onChange={e => setInlineThresholdInput(e.target.value)}
                          style={{
                            width: '70px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            color: COLORS.textPrimary,
                            outline: 'none'
                          }}
                          autoFocus
                        />
                        <button 
                          onClick={() => handleInlineThresholdSave(zone.zone_name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.teal }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingThresholdZone(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.red }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '500' }}>
                          Threshold: <strong style={{ color: COLORS.textPrimary }}>{zone.threshold} kW</strong>
                        </span>
                        <button 
                          onClick={() => {
                            setEditingThresholdZone(zone.zone_name);
                            setInlineThresholdInput(zone.threshold.toString());
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                          title="Edit Limit"
                        >
                          <Edit3 size={11} style={{ color: COLORS.teal }} />
                        </button>
                      </div>
                    )}
                    <span style={{ fontSize: '11px', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      {zone.last_updated}
                    </span>
                  </div>

                  {/* Card Footer Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                    <button 
                      onClick={() => {
                        setSelectedZone(zone);
                        setDetailTab('Overview');
                      }}
                      style={{
                        padding: '8px 12px',
                        border: `1.5px solid ${COLORS.teal}`,
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: COLORS.teal,
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}

                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedZone(zone);
                        setDetailTab('Settings');
                      }}
                      style={{
                        padding: '8px 12px',
                        border: `1.5px solid ${COLORS.textMuted}`,
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}

                    >
                      Set Alert
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {filteredAndSortedZones.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                padding: '64px 0',
                textAlign: 'center',
                color: COLORS.textMuted,
                border: `2px dashed ${COLORS.border}`,
                borderRadius: '16px',
                backgroundColor: COLORS.cardBg
              }}>
                No zones match the search or filter settings.
              </div>
            )}
          </motion.div>
        ) : (
          /* SECTION 2B — TABLE VIEW */
          <motion.div 
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: '16px',
              border: `1px solid ${COLORS.border}`,
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: `2px solid ${COLORS.border}`,
                  }}>
                    <th className="sticky-first-col" style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f8fafc' }}>Zone Name</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criticality</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>kW</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>kWh</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Temp (°C)</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Humidity</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Occupancy</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '110px' }}>Usage %</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Threshold</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedZones.map((zone, idx) => {
                    const usagePct = Math.round((zone.power_kw / zone.threshold) * 100);
                    let rowBg = idx % 2 === 0 ? COLORS.cardBg : '#fafafa';
                    let progressColor = COLORS.green;
                    let statusLabel = 'Normal';
                    let statusBg = '#e6f9f0';
                    let statusColor = COLORS.green;

                    if (usagePct >= 80) {
                      progressColor = COLORS.red;
                      statusLabel = 'Critical';
                      statusBg = COLORS.redLight;
                      statusColor = COLORS.red;
                      rowBg = 'rgba(255, 77, 77, 0.03)';
                    } else if (usagePct >= 50) {
                      progressColor = COLORS.amber;
                      statusLabel = 'Warning';
                      statusBg = COLORS.amberLight;
                      statusColor = COLORS.amber;
                      rowBg = 'rgba(244, 162, 97, 0.03)';
                    }

                    return (
                      <tr 
                        key={zone.zone_name} 
                        style={{ 
                          backgroundColor: rowBg, 
                          borderBottom: `1px solid ${COLORS.border}`,
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td className="sticky-first-col" style={{ padding: '14px 20px', fontWeight: '700', color: COLORS.textPrimary, backgroundColor: rowBg }}>
                          {translate(zone.zone_name)}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '12px', color: COLORS.textMuted, fontWeight: '500' }}>
                          {zone.type}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <CriticalityBadge criticality={zone.criticality} />
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: statusColor }}>
                          {zone.power_kw.toFixed(1)}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600', color: COLORS.textPrimary }}>
                          {zone.kwh.toFixed(1)}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600', color: zone.temp > 25 ? COLORS.red : COLORS.textPrimary }}>
                          {zone.temp.toFixed(1)}°C
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: COLORS.textMuted }}>
                          {zone.humidity}%
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: COLORS.textMuted }}>
                          {zone.occupancy}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              flex: 1,
                              backgroundColor: '#e2e8f0',
                              height: '5px',
                              borderRadius: '99px',
                              overflow: 'hidden',
                              maxWidth: '60px'
                            }}>
                              <div style={{
                                width: `${Math.min(100, usagePct)}%`,
                                backgroundColor: progressColor,
                                height: '100%'
                              }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                              {usagePct}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '500', color: COLORS.textMuted }}>
                          {zone.threshold} kW
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: statusBg,
                            color: statusColor
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusColor }} />
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button 
                              onClick={() => {
                                setSelectedZone(zone);
                                setDetailTab('Overview');
                              }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: COLORS.teal }}
                              title="Details"
                            >
                              Details
                            </button>
                            <span style={{ color: COLORS.border }}>|</span>
                            <button 
                              onClick={() => {
                                setSelectedZone(zone);
                                setDetailTab('Settings');
                              }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted }}
                              title="Edit Settings"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedZones.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted }}>
                        No zones found matching the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 4 — ZONE COMPARISON PANEL */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '16px',
        border: `1px solid ${COLORS.border}`,
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Zone Comparison
          </h2>

          {/* Metric Selector Toggles */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid #cbd5e1',
            gap: '2px'
          }}>
            {(['Power', 'Energy', 'Temperature', 'Usage %'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setCompareMetric(metric)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: compareMetric === metric ? COLORS.teal : 'transparent',
                  color: compareMetric === metric ? '#ffffff' : COLORS.textMuted,
                  transition: 'all 0.15s ease'
                }}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped Bar Chart */}
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.textMuted, fontWeight: '600' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}
                labelFormatter={(value, items) => {
                  const item = items[0]?.payload;
                  return item ? item.fullName : value;
                }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              {compareMetric === 'Power' && (
                <>
                  <Bar dataKey="powerDraw" name="Current Draw (kW)" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="peakPower" name="Peak Load (kW)" fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
                </>
              )}
              {compareMetric === 'Energy' && (
                <>
                  <Bar dataKey="energyToday" name="Energy Today (kWh)" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="yesterdayEnergy" name="Yesterday (kWh)" fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
                </>
              )}
              {compareMetric === 'Temperature' && (
                <>
                  <Bar dataKey="temperature" name="Ambient Temp (°C)" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="maxTemp" name="Max Temp Threshold (°C)" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                </>
              )}
              {compareMetric === 'Usage %' && (
                <>
                  <Bar dataKey="usage" name="Current Usage %" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="thresholdLimit" name="Maximum Threshold (100%)" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3 — ZONE DETAIL MODAL (Overlay) */}
      <AnimatePresence>
        {selectedZone && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(26, 26, 46, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: isMobile ? '0' : '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: isMobile ? '0' : '16px',
                width: '100%',
                maxWidth: isMobile ? '100vw' : '750px',
                height: isMobile ? '100vh' : 'auto',
                maxHeight: isMobile ? '100vh' : '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                    {translate(selectedZone.zone_name)} Details
                  </h2>
                  <CriticalityBadge criticality={selectedZone.criticality} />
                </div>
                <button 
                  onClick={() => setSelectedZone(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: COLORS.textMuted,
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}


                >
                  <X size={18} />
                </button>
              </div>

              {/* Tab Bar */}
              <div style={{
                display: 'flex',
                borderBottom: `1px solid ${COLORS.border}`,
                backgroundColor: '#ffffff',
                padding: '0 24px'
              }}>
                {(['Overview', 'History', 'Alerts', 'Settings'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    style={{
                      padding: '14px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: detailTab === tab ? COLORS.teal : COLORS.textMuted,
                      border: 'none',
                      borderBottom: `3px solid ${detailTab === tab ? COLORS.teal : 'transparent'}`,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Content Scroll Area */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ── OVERVIEW TAB ── */}
                {detailTab === 'Overview' && (
                  <>
                    {/* Stats Grid */}
                    <div 
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                      style={{
                        gap: '12px'
                      }}>
                      {[
                        { label: 'Current kW', value: selectedZone.power_kw.toFixed(1), unit: 'kW', color: COLORS.textPrimary },
                        { label: 'Voltage', value: selectedZone.voltage.toFixed(1), unit: 'V', color: COLORS.textMuted },
                        { label: 'Current (A)', value: selectedZone.current.toFixed(1), unit: 'A', color: COLORS.textMuted },
                        { label: 'Temperature', value: `${selectedZone.temp.toFixed(1)}°C`, unit: '', color: selectedZone.temp > 25 ? COLORS.red : COLORS.textPrimary },
                        { label: 'Humidity', value: `${selectedZone.humidity}%`, unit: 'RH', color: COLORS.textPrimary },
                        { label: 'Occupancy', value: selectedZone.occupancy, unit: 'people', color: COLORS.textPrimary },
                        { label: 'Energy Today', value: selectedZone.kwh.toFixed(1), unit: 'kWh', color: COLORS.teal },
                        { label: 'Cost Today', value: `₹${Math.round(selectedZone.kwh * 8.5)}`, unit: '', color: COLORS.teal }
                      ].map((item, idx) => (
                        <div key={idx} style={{
                          backgroundColor: '#f8fafc',
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '12px',
                          padding: '12px 14px'
                        }}>
                          <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {item.label}
                          </span>
                          <p style={{ fontSize: '18px', fontWeight: '800', color: item.color, margin: '4px 0 0 0', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                            {item.value}
                            {item.unit && <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: '500' }}>{item.unit}</span>}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Hourly Area Chart */}
                    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '16px', backgroundColor: '#ffffff' }}>
                      <h4 style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        📈 Power Consumption Cycle (Last 24 Hours)
                      </h4>
                      <div style={{ height: isMobile ? '160px' : '180px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overviewHourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="modalArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" interval={isMobile ? 1 : 0} tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                            <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="power" name="Power (kW)" stroke={COLORS.teal} strokeWidth={2} fillOpacity={1} fill="url(#modalArea)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* AI Insights Card */}
                    <div style={{
                      backgroundColor: COLORS.tealLight,
                      border: `1.5px dashed ${COLORS.teal}`,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <Info size={20} style={{ color: COLORS.teal, flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: COLORS.teal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ClinErgy AI Insight
                        </span>
                        <p style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: '500', lineHeight: '1.4', margin: '4px 0 0 0' }}>
                          {getAIInsight(selectedZone.zone_name)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* ── HISTORY TAB ── */}
                {detailTab === 'History' && (
                  <>
                    {/* Recharts LineChart */}
                    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '16px', backgroundColor: '#ffffff' }}>
                      <h4 style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        📅 7-Day Power Consumption Trend
                      </h4>
                      <div style={{ height: isMobile ? '160px' : '180px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historyWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" interval={isMobile ? 1 : 0} tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                            <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="kwh" name="Energy (kWh)" stroke={COLORS.indigo} strokeWidth={2.5} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Table of Daily Summaries */}
                    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflowX: 'auto', overflowY: 'auto', maxHeight: '160px', position: 'relative' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? '500px' : '100%' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, zIndex: 5 }}>
                            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Day</th>
                            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>Avg kW</th>
                            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>Peak kW</th>
                            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>kWh</th>
                            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>Cost</th>
                            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>CO₂ kg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyWeeklyData.map((d, idx) => (
                            <tr key={idx} style={{ borderBottom: idx === 6 ? 'none' : `1px solid ${COLORS.border}`, backgroundColor: '#ffffff' }}>
                              <td style={{ padding: '10px 16px', fontWeight: '700', fontSize: '13px' }}>{d.day}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px' }}>{(d.kwh / 7).toFixed(1)}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>{d.peak}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: COLORS.teal, fontWeight: '700' }}>{d.kwh}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>₹{d.cost}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: COLORS.indigo }}>{d.co2}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── ALERTS TAB ── */}
                {detailTab === 'Alerts' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>
                        Past Warning & Alarm Logs
                      </h4>
                      {selectedZone.alerts.length > 0 && (
                        <button 
                          onClick={() => handleClearAlerts(selectedZone.zone_name)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: COLORS.red
                          }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                      {selectedZone.alerts.length === 0 ? (
                        <div style={{
                          padding: '32px 0',
                          textAlign: 'center',
                          border: `2px dashed ${COLORS.border}`,
                          borderRadius: '12px',
                          color: COLORS.textMuted,
                          fontSize: '13px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <CheckCircle2 size={32} style={{ color: COLORS.green }} />
                          No active or past alerts for this zone.
                        </div>
                      ) : (
                        selectedZone.alerts.map(alert => {
                          const isC = alert.severity === 'Critical';
                          const alertColor = isC ? COLORS.red : COLORS.amber;
                          const alertBg = isC ? COLORS.redLight : COLORS.amberLight;

                          return (
                            <div 
                              key={alert.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: `1px solid ${COLORS.border}`,
                                borderLeft: `4px solid ${alertColor}`,
                                backgroundColor: alertBg
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: alertColor, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                                  {alert.severity} • {alert.timestamp}
                                </span>
                                <p style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: '600', margin: 0 }}>
                                  {alert.message}
                                </p>
                              </div>

                              {alert.acknowledged ? (
                                <span style={{ fontSize: '11px', color: COLORS.green, fontWeight: '700' }}>✓ Acked</span>
                              ) : (
                                <span style={{ fontSize: '11px', color: COLORS.red, fontWeight: '700' }}>⚠ Unresolved</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {detailTab === 'Settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                          Zone Name
                        </label>
                        <input 
                          type="text" 
                          value={settingsName}
                          onChange={e => setSettingsName(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            color: COLORS.textPrimary,
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                          Criticality Tier
                        </label>
                        <select 
                          value={settingsCriticality}
                          onChange={e => setSettingsCriticality(e.target.value as any)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            color: COLORS.textPrimary,
                            outline: 'none',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <option value="Critical">Critical</option>
                          <option value="Essential">Essential</option>
                          <option value="Standard">Standard</option>
                          <option value="Non-Essential">Non-Essential</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                          kW Threshold Limit
                        </label>
                        <input 
                          type="number" 
                          value={settingsThreshold}
                          onChange={e => setSettingsThreshold(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            color: COLORS.textPrimary,
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Floor readout (read only) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textMuted }}>
                          Floor Location
                        </label>
                        <input 
                          type="text" 
                          value={selectedZone.floor}
                          disabled
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            color: COLORS.textMuted,
                            backgroundColor: '#f1f5f9',
                            outline: 'none',
                            cursor: 'not-allowed'
                          }}
                        />
                      </div>
                    </div>

                    {/* Alert notification toggles */}
                    <div style={{
                      borderTop: `1px solid ${COLORS.border}`,
                      paddingTop: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                        Alert Notifications Dispatcher
                      </span>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={settingsEmail}
                            onChange={e => setSettingsEmail(e.target.checked)}
                          />
                          Email Alerts
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={settingsSMS}
                            onChange={e => setSettingsSMS(e.target.checked)}
                          />
                          SMS Dispatch
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={settingsDashboard}
                            onChange={e => setSettingsDashboard(e.target.checked)}
                          />
                          Dashboard Siren
                        </label>
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveModalSettings}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '10px 20px',
                        backgroundColor: COLORS.teal,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 5 — ADD ZONE MODAL (Overlay) */}
      <AnimatePresence>
        {addZoneOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(26, 26, 46, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: isMobile ? '0' : '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: isMobile ? '0' : '16px',
                width: '100%',
                maxWidth: isMobile ? '100vw' : '520px',
                height: isMobile ? '100vh' : 'auto',
                maxHeight: isMobile ? '100vh' : '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fafafa'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  ＋ Add New Zone
                </h2>
                <button 
                  onClick={() => setAddZoneOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: COLORS.textMuted,
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateZoneSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Zone Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                    Zone Name *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ward C, Chiller House"
                    value={newZoneData.zone_name}
                    onChange={e => setNewZoneData(prev => ({ ...prev, zone_name: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${formErrors.zone_name ? COLORS.red : '#cbd5e1'}`,
                      fontSize: '13px',
                      color: COLORS.textPrimary,
                      outline: 'none'
                    }}
                  />
                  {formErrors.zone_name && (
                    <span style={{ fontSize: '11px', color: COLORS.red, fontWeight: '600' }}>
                      {formErrors.zone_name}
                    </span>
                  )}
                </div>

                {/* Zone Type & Criticality Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                      Zone Type *
                    </label>
                    <select 
                      value={newZoneData.type}
                      onChange={e => setNewZoneData(prev => ({ ...prev, type: e.target.value }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${formErrors.type ? COLORS.red : '#cbd5e1'}`,
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select Type</option>
                      <option value="ICU">ICU</option>
                      <option value="OT">OT Block</option>
                      <option value="Ward">Ward</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Admin">Admin</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {formErrors.type && (
                      <span style={{ fontSize: '11px', color: COLORS.red, fontWeight: '600' }}>
                        {formErrors.type}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                      Criticality Tier
                    </label>
                    <select 
                      value={newZoneData.criticality}
                      onChange={e => setNewZoneData(prev => ({ ...prev, criticality: e.target.value as any }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="Critical">Critical</option>
                      <option value="Essential">Essential</option>
                      <option value="Standard">Standard</option>
                      <option value="Non-Essential">Non-Essential</option>
                    </select>
                  </div>
                </div>

                {/* kW Threshold & Floor location */}
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                      kW Threshold *
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 150"
                      value={newZoneData.threshold}
                      onChange={e => setNewZoneData(prev => ({ ...prev, threshold: e.target.value }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${formErrors.threshold ? COLORS.red : '#cbd5e1'}`,
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        outline: 'none'
                      }}
                    />
                    {formErrors.threshold && (
                      <span style={{ fontSize: '11px', color: COLORS.red, fontWeight: '600' }}>
                        {formErrors.threshold}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                      Floor / Location *
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Floor 2, Wing C"
                      value={newZoneData.floor}
                      onChange={e => setNewZoneData(prev => ({ ...prev, floor: e.target.value }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${formErrors.floor ? COLORS.red : '#cbd5e1'}`,
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        outline: 'none'
                      }}
                    />
                    {formErrors.floor && (
                      <span style={{ fontSize: '11px', color: COLORS.red, fontWeight: '600' }}>
                        {formErrors.floor}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notifications toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: `1px solid ${COLORS.border}`,
                  paddingTop: '12px',
                  marginTop: '4px'
                }}>
                  <input 
                    type="checkbox" 
                    id="newZoneAlert"
                    checked={newZoneData.notifications}
                    onChange={e => setNewZoneData(prev => ({ ...prev, notifications: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="newZoneAlert" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                    Enable real-time threshold alert notifications immediately
                  </label>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => setAddZoneOpen(false)}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#f1f5f9',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: COLORS.textMuted,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      padding: '10px 18px',
                      backgroundColor: COLORS.teal,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Create Zone
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
