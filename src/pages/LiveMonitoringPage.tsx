import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Bell, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown,
  AlertTriangle,
  Info,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  BarChart, 
  Bar, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useMobile } from '@/hooks/useMobile';
import toast from 'react-hot-toast';

// ── DESIGN SYSTEM CONSTANTS ──────────────────────────────────────────────────
const COLORS = {
  bgMain: 'var(--page-bg)',
  cardBg: 'var(--card-bg)',
  teal: '#2a9d8f',
  red: '#ff4d4d',
  amber: '#f4a261',
  green: '#57cc99',
  textPrimary: '#1a1a2e',
  textMuted: '#6b7280',
  tealLight: '#e0f5f2',
  redLight: '#fff5f5',
  amberLight: '#fffaf0',
  indigo: '#6366f1',
};

// ── UTILS ───────────────────────────────────────────────────────────────────
const getAbbreviation = (name: string) => {
  if (name.includes('ICU')) return 'ICU';
  if (name.includes('Operation') || name.includes('OT')) return 'OT';
  if (name.includes('Emergency')) return 'ER';
  if (name.includes('Ward A')) return 'WA';
  if (name.includes('Ward B')) return 'WB';
  if (name.includes('Pharmacy')) return 'PH';
  return name.slice(0, 3).toUpperCase();
};

const getStatusPriority = (status: string) => {
  if (status === 'Critical') return 3;
  if (status === 'Warning') return 2;
  return 1;
};

// ── REUSABLE FLASH CELL COMPONENT ──────────────────────────────────────────
const FlashCell = ({ value, suffix = '', precision = 1 }: { value: number; suffix?: string; precision?: number }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (value > prevValue) {
      setFlashClass('flash-up');
      const timer = setTimeout(() => setFlashClass(''), 1000);
      return () => clearTimeout(timer);
    } else if (value < prevValue) {
      setFlashClass('flash-down');
      const timer = setTimeout(() => setFlashClass(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  useEffect(() => {
    setPrevValue(value);
  }, [value]);

  return (
    <span className={flashClass} style={{ 
      padding: '2px 6px', 
      borderRadius: '4px', 
      display: 'inline-block', 
      transition: 'all 0.3s ease',
      fontWeight: flashClass ? '700' : '500'
    }}>
      {value.toFixed(precision)}{suffix}
    </span>
  );
};

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

const StatusBadge = ({ status }: { status: string }) => {
  let bg = '#e6f9f0';
  let color = COLORS.green;
  let border = `1px solid #c2f0eb`;

  if (status === 'Critical') {
    bg = COLORS.redLight;
    color = COLORS.red;
    border = `1px solid #ffa39e`;
  } else if (status === 'Warning') {
    bg = COLORS.amberLight;
    color = COLORS.amber;
    border = `1px solid #ffe58f`;
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      fontSize: '11px',
      fontWeight: 700,
      borderRadius: '8px',
      backgroundColor: bg,
      color: color,
      border: border,
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block'
      }} />
      {status}
    </span>
  );
};

// ── INITIAL DATA ─────────────────────────────────────────────────────────────
interface Zone {
  zone_name: string;
  criticality: string;
  power_kw: number;
  voltage: number;
  current: number;
  temp: number;
  kwh: number;
  threshold: number;
  peak_kw: number;
  min_kw: number;
  history_kw: number[];
  status: string;
  usage: number;
}

const INITIAL_ZONES: Zone[] = [
  { zone_name: 'ICU', criticality: 'Critical', power_kw: 144.1, voltage: 415.2, current: 347.1, temp: 21.6, kwh: 11.7, threshold: 250, peak_kw: 155.0, min_kw: 120.0, history_kw: Array.from({ length: 20 }, () => 135 + Math.random() * 20), status: 'Normal', usage: 58 },
  { zone_name: 'Operation Theatre', criticality: 'Critical', power_kw: 219.3, voltage: 414.8, current: 528.6, temp: 20.5, kwh: 18.3, threshold: 250, peak_kw: 235.0, min_kw: 190.0, history_kw: Array.from({ length: 20 }, () => 205 + Math.random() * 25), status: 'Warning', usage: 88 },
  { zone_name: 'Emergency', criticality: 'Critical', power_kw: 90.5, voltage: 415.9, current: 217.6, temp: 23.1, kwh: 7.5, threshold: 250, peak_kw: 110.0, min_kw: 75.0, history_kw: Array.from({ length: 20 }, () => 80 + Math.random() * 15), status: 'Normal', usage: 36 },
  { zone_name: 'Ward A', criticality: 'Standard', power_kw: 55.2, voltage: 416.1, current: 132.7, temp: 22.0, kwh: 9.2, threshold: 250, peak_kw: 65.0, min_kw: 45.0, history_kw: Array.from({ length: 20 }, () => 48 + Math.random() * 10), status: 'Normal', usage: 22 },
  { zone_name: 'Ward B', criticality: 'Standard', power_kw: 45.6, voltage: 415.5, current: 109.6, temp: 22.2, kwh: 7.9, threshold: 250, peak_kw: 55.0, min_kw: 35.0, history_kw: Array.from({ length: 20 }, () => 40 + Math.random() * 10), status: 'Normal', usage: 18 },
  { zone_name: 'Pharmacy', criticality: 'Essential', power_kw: 29.6, voltage: 416.3, current: 71.1, temp: 18.1, kwh: 4.8, threshold: 250, peak_kw: 38.0, min_kw: 22.0, history_kw: Array.from({ length: 20 }, () => 24 + Math.random() * 8), status: 'Normal', usage: 12 }
];

export default function LiveMonitoringPage() {
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
  const [refreshRate, setRefreshRate] = useState<number>(3); // 1s, 3s, 5s
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Critical, Warning, Normal
  const [sortKey, setSortKey] = useState('name'); // name, power, usage
  const [dataPointsCount, setDataPointsCount] = useState(48320);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [thresholdInput, setThresholdInput] = useState('');
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

  // Rolling Trends History
  const [totalPowerHistory, setTotalPowerHistory] = useState<{ time: string; power: number }[]>(() => 
    Array.from({ length: 20 }, (_, i) => ({
      time: `-${(20 - i) * 3}s`,
      power: 575 + Math.random() * 20
    }))
  );

  const [voltageHistory, setVoltageHistory] = useState<{ time: string; voltage: number }[]>(() => 
    Array.from({ length: 20 }, (_, i) => ({
      time: `-${(20 - i) * 3}s`,
      voltage: 414 + Math.random() * 3
    }))
  );

  // Independent 5-second temperature overview state
  const [tempChartData, setTempChartData] = useState<{ name: string; temp: number }[]>([]);

  // Ref to maintain zones state for independent temperature updates
  const zonesRef = useRef(zones);
  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  // Page Title Update
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Live Monitor — Clinergy";
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // Real-time Clock (Updates every 1s)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Main Telemetry Simulator
  useEffect(() => {
    const runSimulation = () => {
      setZones(prevZones => 
        prevZones.map(zone => {
          // Fluctuate power by ±2%
          const powerChange = (Math.random() * 0.04 - 0.02);
          const nextPower = Math.max(10, +(zone.power_kw * (1 + powerChange)).toFixed(1));
          
          // Fluctuate voltage by ±0.5% (approx ±2V)
          const voltageChange = (Math.random() * 0.01 - 0.005);
          const nextVoltage = Math.max(400, Math.min(430, +(zone.voltage * (1 + voltageChange)).toFixed(1)));
          
          // Fluctuate current by ±2%
          const currentChange = (Math.random() * 0.04 - 0.02);
          const nextCurrent = Math.max(5, +(zone.current * (1 + currentChange)).toFixed(1));
          
          // Fluctuate temperature by ±0.2C
          const tempChange = (Math.random() * 0.4 - 0.2);
          const nextTemp = +(Math.max(15, Math.min(28, zone.temp + tempChange)).toFixed(1));
          
          // Energy today: increments by power_kw * (refreshRate / 3600)
          const nextKwh = +(zone.kwh + (nextPower * (refreshRate / 3600))).toFixed(3);
          
          // Usage %
          const nextUsage = Math.round((nextPower / zone.threshold) * 100);
          
          // Status: Normal if < 80%, Warning if 80%-89%, Critical if >= 90%
          let nextStatus = 'Normal';
          if (nextUsage >= 90) nextStatus = 'Critical';
          else if (nextUsage >= 80) nextStatus = 'Warning';

          // Update peak & min
          const nextPeak = Math.max(zone.peak_kw, nextPower);
          const nextMin = Math.min(zone.min_kw, nextPower);
          
          // Update rolling history (last 20)
          const nextHistory = [...zone.history_kw.slice(1), nextPower];

          return {
            ...zone,
            power_kw: nextPower,
            voltage: nextVoltage,
            current: nextCurrent,
            temp: nextTemp,
            kwh: nextKwh,
            usage: nextUsage,
            status: nextStatus,
            peak_kw: nextPeak,
            min_kw: nextMin,
            history_kw: nextHistory
          };
        })
      );

      // Increment Data Points
      setDataPointsCount(prev => prev + 6);
    };

    const simTimer = setInterval(runSimulation, refreshRate * 1000);
    return () => clearInterval(simTimer);
  }, [refreshRate]);

  // Rolling History Synced Trends (Total Power & Average Voltage)
  useEffect(() => {
    const totalPower = +zones.reduce((sum, z) => sum + z.power_kw, 0).toFixed(1);
    const avgVoltage = +(() => {
      const sum = zones.reduce((s, z) => s + z.voltage, 0);
      return sum / zones.length;
    })().toFixed(1);
    
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setTotalPowerHistory(prev => {
      const nextHistory = [...prev.slice(1), { time: nowStr, power: totalPower }];
      return nextHistory;
    });

    setVoltageHistory(prev => {
      const nextHistory = [...prev.slice(1), { time: nowStr, voltage: avgVoltage }];
      return nextHistory;
    });
  }, [zones]);

  // Independent 5-second Temperature updates
  useEffect(() => {
    const updateTempData = () => {
      setTempChartData(zonesRef.current.map(z => ({
        name: getAbbreviation(z.zone_name),
        temp: z.temp
      })));
    };

    updateTempData();
    const tempTimer = setInterval(updateTempData, 5000);
    return () => clearInterval(tempTimer);
  }, []);

  // Summary Metrics calculations
  const totalPowerLoad = useMemo(() => 
    +zones.reduce((sum, z) => sum + z.power_kw, 0).toFixed(1),
    [zones]
  );

  const peakZoneObj = useMemo(() => 
    zones.reduce((max, z) => z.power_kw > max.power_kw ? z : max, zones[0]),
    [zones]
  );

  const averageVoltage = useMemo(() => 
    +(zones.reduce((sum, z) => sum + z.voltage, 0) / zones.length).toFixed(1),
    [zones]
  );

  const totalCurrentSum = useMemo(() => 
    Math.round(zones.reduce((sum, z) => sum + z.current, 0)),
    [zones]
  );

  const activeWarningsCount = useMemo(() => 
    zones.filter(z => z.status === 'Warning').length,
    [zones]
  );

  const activeCriticalCount = useMemo(() => 
    zones.filter(z => z.status === 'Critical').length,
    [zones]
  );

  // Sorting and Filtering Main Telemetry Table
  const sortedAndFilteredZones = useMemo(() => {
    return [...zones]
      .filter(z => {
        const matchesSearch = z.zone_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = statusFilter === 'ALL' || z.status.toUpperCase() === statusFilter.toUpperCase();
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        // Critical / Warning status zones always on top (Primary)
        const prioA = getStatusPriority(a.status);
        const prioB = getStatusPriority(b.status);
        if (prioA !== prioB) {
          return prioB - prioA;
        }

        // Secondary sorting based on selected criteria
        if (sortKey === 'name') {
          return a.zone_name.localeCompare(b.zone_name);
        }
        if (sortKey === 'power') {
          return b.power_kw - a.power_kw;
        }
        if (sortKey === 'usage') {
          return b.usage - a.usage;
        }
        return 0;
      });
  }, [zones, searchQuery, statusFilter, sortKey]);

  // Accordion Expand Handler & Scroll-Into-View
  const handleRowClick = (zoneName: string) => {
    if (expandedZone === zoneName) {
      setExpandedZone(null);
    } else {
      setExpandedZone(zoneName);
      const zone = zones.find(z => z.zone_name === zoneName);
      if (zone) {
        setThresholdInput(zone.threshold.toString());
      }
    }
  };

  useEffect(() => {
    if (expandedZone) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`expanded-${expandedZone}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [expandedZone]);

  // Alert Threshold Save
  const handleSaveThreshold = (zoneName: string) => {
    const nextVal = parseFloat(thresholdInput);
    if (!isNaN(nextVal) && nextVal > 0) {
      setZones(prev => prev.map(z => {
        if (z.zone_name === zoneName) {
          const nextUsage = Math.round((z.power_kw / nextVal) * 100);
          let nextStatus = 'Normal';
          if (nextUsage >= 90) nextStatus = 'Critical';
          else if (nextUsage >= 80) nextStatus = 'Warning';
          
          return {
            ...z,
            threshold: nextVal,
            usage: nextUsage,
            status: nextStatus
          };
        }
        return z;
      }));
      toast.success(`Power threshold set to ${nextVal} kW for ${zoneName}`, {
        style: {
          border: `1px solid ${COLORS.teal}`,
          padding: '16px',
          color: COLORS.textPrimary,
          borderRadius: '12px'
        },
        iconTheme: {
          primary: COLORS.teal,
          secondary: '#fff',
        },
      });
    } else {
      toast.error('Please enter a valid threshold limit');
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['Zone Name', 'Criticality', 'Power (kW)', 'Voltage (V)', 'Current (A)', 'Temp (°C)', 'Energy Today (kWh)', 'Usage %', 'Status', 'Threshold Limit (kW)'];
    const rows = zones.map(z => [
      z.zone_name,
      z.criticality,
      z.power_kw,
      z.voltage,
      z.current,
      z.temp,
      z.kwh,
      z.usage,
      z.status,
      z.threshold
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clinergy_live_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV report exported successfully!');
  };

  // Live Alerts Ticker Text Generator
  const getLiveAlertsText = () => {
    const list: string[] = [];
    zones.forEach(z => {
      if (z.status === 'Critical') {
        list.push(`🚨 ${translate(z.zone_name)} Block — CRITICAL OVERLOAD at ${z.usage}% threshold`);
      } else if (z.status === 'Warning') {
        list.push(`⚠️ ${translate(z.zone_name)} Block — Usage at ${z.usage}% of threshold`);
      }
      if (z.temp > 24) {
        list.push(`🌡️ ${translate(z.zone_name)} Block — Temperature spike ${z.temp.toFixed(1)}°C`);
      }
    });

    if (list.length === 0) {
      return "✅ All zones operating normally  |  ⚡ Grid connectivity: Stable  |  🌿 Overall energy performance is nominal across all 6 clinical spaces.";
    }
    return list.join('   •   ');
  };

  // Voltage stability state check
  const isVoltageStable = useMemo(() => {
    return averageVoltage >= 410 && averageVoltage <= 420;
  }, [averageVoltage]);

  // Alert styles based on active alerts state (Pillar 11)
  const alertBg = useMemo(() => {
    if (activeCriticalCount > 0) return COLORS.redLight;
    if (activeWarningsCount > 0) return COLORS.amberLight;
    return COLORS.tealLight;
  }, [activeCriticalCount, activeWarningsCount]);

  const alertBorder = useMemo(() => {
    if (activeCriticalCount > 0) return '1px solid #ffa39e';
    if (activeWarningsCount > 0) return '1px solid #ffe58f';
    return '1px solid #bceae4';
  }, [activeCriticalCount, activeWarningsCount]);

  const alertLabelColor = useMemo(() => {
    if (activeCriticalCount > 0) return COLORS.red;
    if (activeWarningsCount > 0) return COLORS.amber;
    return COLORS.teal;
  }, [activeCriticalCount, activeWarningsCount]);

  const alertTextColor = useMemo(() => {
    if (activeCriticalCount > 0) return '#b5304f';
    if (activeWarningsCount > 0) return '#b35a10';
    return '#115e59';
  }, [activeCriticalCount, activeWarningsCount]);

  return (
    <div 
      className="p-3 md:p-6 pb-16 md:pb-16 gap-4 md:gap-6"
      style={{ 
        backgroundColor: COLORS.bgMain, 
        color: COLORS.textPrimary,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      <MarqueeStyles />

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
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box'
        }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
            Live Monitor
          </h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: '#e6f9f0',
              color: COLORS.green,
              border: `1px solid #c2f0eb`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.green, flexShrink: 0 }} />
              6 Zones Online
            </span>
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
              border: `1px solid #ffa39e`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.red, flexShrink: 0 }} />
              {activeCriticalCount} Critical
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
              border: `1px solid #ffe58f`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.amber, flexShrink: 0 }} />
              {activeWarningsCount} Warning
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '12px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}>
          <div className="pulsing-live-dot" />
          <span style={{ fontWeight: '800', fontSize: '13px', letterSpacing: '0.05em', color: COLORS.textPrimary }}>LIVE</span>
          <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>|</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.textMuted }}>
            Last updated: {systemTime}
          </span>
        </div>
      </div>

      {/* SECTION 1 — LIVE STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5" style={{
        gap: '20px'
      }}>
        {/* Total Load */}
        <div style={{
          backgroundColor: COLORS.tealLight,
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #bceae4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '105px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.teal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Load
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: COLORS.textPrimary }}>
              <FlashCell value={totalPowerLoad} precision={1} />
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textMuted }}>kW</span>
          </div>
        </div>

        {/* Peak Zone */}
        <div style={{
          backgroundColor: COLORS.tealLight,
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #bceae4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '105px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.teal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Peak Zone
          </span>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary }}>
              {translate(peakZoneObj.zone_name)}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Zap size={11} style={{ color: COLORS.amber }} />
              {peakZoneObj.power_kw.toFixed(1)} kW
            </div>
          </div>
        </div>

        {/* Avg Voltage */}
        <div style={{
          backgroundColor: COLORS.tealLight,
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #bceae4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '105px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.teal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Voltage
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: COLORS.textPrimary }}>
              <FlashCell value={averageVoltage} precision={1} />
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textMuted }}>V</span>
          </div>
        </div>

        {/* Total Current */}
        <div style={{
          backgroundColor: COLORS.tealLight,
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #bceae4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '105px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.teal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Current
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: COLORS.textPrimary }}>
              <FlashCell value={totalCurrentSum} precision={0} />
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textMuted }}>A</span>
          </div>
        </div>

        {/* Data Points Today */}
        <div style={{
          backgroundColor: COLORS.tealLight,
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #bceae4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '105px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.teal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Points Today
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: COLORS.textPrimary }}>
              {dataPointsCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — MAIN TELEMETRY TABLE */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Table Controls */}
        <div 
          className="flex overflow-x-auto flex-nowrap w-full"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#fafcfc'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
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
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            {/* Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
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
                <option value="ALL">All Statuses</option>
                <option value="Critical">Critical Only</option>
                <option value="Warning">Warning Only</option>
                <option value="Normal">Normal Only</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: COLORS.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '600' }}>Sort:</span>
              <div style={{ position: 'relative' }}>
                <select 
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value)}
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
                  <option value="name">By Zone Name</option>
                  <option value="power">By Power</option>
                  <option value="usage">By Usage %</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: COLORS.textMuted, pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Refresh Rate Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '600' }}>Refresh:</span>
              <div style={{ position: 'relative' }}>
                <select 
                  value={refreshRate}
                  onChange={e => setRefreshRate(Number(e.target.value))}
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
                  <option value={1}>1s</option>
                  <option value={3}>3s</option>
                  <option value={5}>5s</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: COLORS.textMuted, pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Export CSV */}
            <button 
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: COLORS.teal,
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 4px rgba(42, 157, 143, 0.2)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#238276'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = COLORS.teal}
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Telemetry Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{
                backgroundColor: '#f0f7f4',
                borderBottom: '2px solid #e8f3ee',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zone Name</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criticality</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Power (kW)</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Voltage (V)</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Current (A)</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Temp (°C)</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Energy (kWh)</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '130px' }}>Usage %</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredZones.map(zone => {
                const isExpanded = expandedZone === zone.zone_name;
                
                // Styling based on status
                const leftBorders: Record<string, string> = {
                  'ICU': '3px solid #f4a0b0',
                  'Operation Theatre': '3px solid #b8a9f5',
                  'Emergency': '3px solid #f5b98a',
                  'Ward A': '3px solid #93c8f5',
                  'Ward B': '3px solid #85dbb8',
                  'Pharmacy': '3px solid #f5d080'
                };
                const defaultRowBgs: Record<string, string> = {
                  'ICU': '#fff5f7',
                  'Operation Theatre': '#f7f5ff',
                  'Emergency': '#fff8f3',
                  'Ward A': '#f3f8ff',
                  'Ward B': '#f3fdf8',
                  'Pharmacy': '#fffbf0'
                };
                const defaultProgressColors: Record<string, string> = {
                  'ICU': '#f4a0b0',
                  'Operation Theatre': '#b8a9f5',
                  'Emergency': '#f5b98a',
                  'Ward A': '#93c8f5',
                  'Ward B': '#85dbb8',
                  'Pharmacy': '#f5d080'
                };
                const zoneTextColors: Record<string, string> = {
                  'ICU': '#b5304f',
                  'Operation Theatre': '#5b3fc2',
                  'Emergency': '#b35a10',
                  'Ward A': '#1a6fa8',
                  'Ward B': '#0d7a52',
                  'Pharmacy': '#926b00'
                };

                let borderLeft = leftBorders[zone.zone_name] || '3px solid transparent';
                let rowBg = defaultRowBgs[zone.zone_name] || '#ffffff';
                let progressColor = defaultProgressColors[zone.zone_name] || COLORS.green;
                let nameColor = zoneTextColors[zone.zone_name] || COLORS.textPrimary;

                if (zone.status === 'Critical') {
                  rowBg = COLORS.redLight;
                  progressColor = COLORS.red;
                } else if (zone.status === 'Warning') {
                  rowBg = COLORS.amberLight;
                  progressColor = COLORS.amber;
                }

                return (
                  <React.Fragment key={zone.zone_name}>
                    {/* Data Row */}
                    <tr 
                      onClick={() => handleRowClick(zone.zone_name)}
                      style={{
                        borderLeft,
                        backgroundColor: rowBg,
                        borderBottom: isExpanded ? 'none' : '1px solid #f0f7f4',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '16px 20px', fontWeight: '700', color: nameColor }}>
                        {translate(zone.zone_name)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <CriticalityBadge criticality={zone.criticality} />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600' }}>
                        <FlashCell value={zone.power_kw} precision={1} />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', color: COLORS.textMuted }}>
                        <FlashCell value={zone.voltage} precision={1} />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', color: COLORS.textMuted }}>
                        <FlashCell value={zone.current} precision={1} />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600', color: zone.temp > 25 ? COLORS.red : COLORS.textPrimary }}>
                        <FlashCell value={zone.temp} precision={1} suffix="°C" />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600', color: COLORS.teal }}>
                        {zone.kwh.toFixed(1)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1,
                            backgroundColor: '#e2e8f0',
                            height: '6px',
                            borderRadius: '99px',
                            overflow: 'hidden',
                            maxWidth: '70px'
                          }}>
                            <div style={{
                              width: `${Math.min(100, zone.usage)}%`,
                              backgroundColor: progressColor,
                              height: '100%',
                              borderRadius: '99px',
                              transition: 'width 0.5s ease-out'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary, minWidth: '28px' }}>
                            {zone.usage}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <StatusBadge status={zone.status} />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '11px', color: COLORS.textMuted }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>

                    {/* Accordion Expanded Panel Row */}
                    {isExpanded && (
                      <tr id={`expanded-${zone.zone_name}`}>
                        <td colSpan={10} style={{ 
                          padding: '0', 
                          borderLeft, 
                          backgroundColor: rowBg, 
                          borderBottom: '1px solid #e2e8f0' 
                        }}>
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ 
                              padding: '24px', 
                              backgroundColor: '#fafcfc', 
                              borderTop: '1px solid #f1f5f9',
                              borderBottom: '1px solid #f1f5f9',
                              position: 'relative'
                            }}
                          >
                            {/* Close Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedZone(null);
                              }}
                              style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: COLORS.textMuted,
                                padding: '4px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <X size={16} />
                            </button>

                            {/* Header details */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: COLORS.textPrimary }}>
                                {translate(zone.zone_name)} Analytics
                              </h3>
                              <CriticalityBadge criticality={zone.criticality} />
                              <StatusBadge status={zone.status} />
                            </div>

                            {/* Grid Layout: Chart & Options */}
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '7fr 3fr', 
                              gap: '24px',
                              alignItems: 'start'
                            }}>
                              {/* Rolling Area Chart */}
                              <div style={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px', 
                                padding: '16px' 
                              }}>
                                <h4 style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                  ⚡ Power Draw Trend (rolling)
                                </h4>
                                <div style={{ height: '200px', width: '100%' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={zone.history_kw.map((pow, idx) => ({
                                      time: `-${(20 - idx) * refreshRate}s`,
                                      power: pow
                                    }))}>
                                      <defs>
                                        <linearGradient id={`colorArea-${zone.zone_name}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '12px' }} />
                                      <Area type="monotone" dataKey="power" stroke={COLORS.teal} strokeWidth={2.5} fillOpacity={1} fill={`url(#colorArea-${zone.zone_name})`} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Stats & Set threshold control */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Stats Grid */}
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'repeat(2, 1fr)', 
                                  gap: '12px' 
                                }}>
                                  <div style={{ backgroundColor: '#ffffff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 600 }}>Current kW</span>
                                    <p style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: '2px 0 0 0' }}>
                                      {zone.power_kw.toFixed(1)}
                                    </p>
                                  </div>
                                  <div style={{ backgroundColor: '#ffffff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 600 }}>Peak kW</span>
                                    <p style={{ fontSize: '18px', fontWeight: '800', color: COLORS.red, margin: '2px 0 0 0' }}>
                                      {zone.peak_kw.toFixed(1)}
                                    </p>
                                  </div>
                                  <div style={{ backgroundColor: '#ffffff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 600 }}>Min kW</span>
                                    <p style={{ fontSize: '18px', fontWeight: '800', color: COLORS.green, margin: '2px 0 0 0' }}>
                                      {zone.min_kw.toFixed(1)}
                                    </p>
                                  </div>
                                  <div style={{ backgroundColor: '#ffffff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 600 }}>Avg kW</span>
                                    <p style={{ fontSize: '18px', fontWeight: '800', color: COLORS.teal, margin: '2px 0 0 0' }}>
                                      {(zone.history_kw.reduce((a,b)=>a+b, 0)/zone.history_kw.length).toFixed(1)}
                                    </p>
                                  </div>
                                </div>

                                {/* Set Threshold Form */}
                                <div style={{ 
                                  backgroundColor: '#ffffff', 
                                  border: '1px solid #e2e8f0', 
                                  borderRadius: '12px', 
                                  padding: '16px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}>
                                  <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
                                    Set Alert Threshold (kW)
                                  </label>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                      type="number" 
                                      value={thresholdInput}
                                      onChange={e => setThresholdInput(e.target.value)}
                                      style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13px',
                                        color: COLORS.textPrimary,
                                        outline: 'none'
                                      }}
                                    />
                                    <button 
                                      onClick={() => handleSaveThreshold(zone.zone_name)}
                                      style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        backgroundColor: COLORS.teal,
                                        color: '#ffffff',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>

                                {/* Full History Link */}
                                <a 
                                  href={`/zones/${zone.zone_name.toLowerCase().replace(/ /g, '-')}`}
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    color: COLORS.teal,
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '4px'
                                  }}
                                >
                                  View Full Zone History →
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {sortedAndFilteredZones.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted }}>
                    No zones matching the selected filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — LIVE SPARKLINE CHARTS ROW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        {/* Total Power Trend */}
        <div style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
              ⚡ Total Power (kW) — Last 60 seconds
            </h3>
            <span style={{ fontSize: '26px', fontWeight: '800', color: COLORS.teal }}>
              {totalPowerLoad.toFixed(1)} kW
            </span>
          </div>

          <div style={{ height: '140px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={totalPowerHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '11px' }} />
                <Line type="monotone" dataKey="power" stroke={COLORS.teal} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voltage Stability */}
        <div style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
                ⚡ Avg Voltage (V) — Last 60 seconds
              </h3>
              <span style={{ fontSize: '26px', fontWeight: '800', color: COLORS.indigo }}>
                {averageVoltage.toFixed(1)} V
              </span>
            </div>
            
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '6px',
              backgroundColor: isVoltageStable ? '#e6f9f0' : COLORS.redLight,
              color: isVoltageStable ? COLORS.green : COLORS.red,
              border: isVoltageStable ? `1px solid #c2f0eb` : `1px solid #ffa39e`
            }}>
              {isVoltageStable ? 'STABLE' : 'UNSTABLE'}
            </span>
          </div>

          <div style={{ height: '140px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={voltageHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[408, 422]} hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '11px' }} />
                <ReferenceLine y={410} stroke={COLORS.red} strokeDasharray="3 3" label={{ value: 'Low limit', fill: COLORS.red, fontSize: '8px', position: 'insideBottomRight' }} />
                <ReferenceLine y={420} stroke={COLORS.red} strokeDasharray="3 3" label={{ value: 'High limit', fill: COLORS.red, fontSize: '8px', position: 'insideTopRight' }} />
                <Line type="monotone" dataKey="voltage" stroke={COLORS.indigo} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Temperature Overview */}
        <div style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
              🌡 Zone Temperatures (°C)
            </h3>
            <span style={{ fontSize: '26px', fontWeight: '800', color: COLORS.textPrimary }}>
              Avg {(zones.reduce((s, z)=>s+z.temp, 0)/6).toFixed(1)}°C
            </span>
          </div>

          <div style={{ height: '140px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
                <YAxis domain={[12, 32]} hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '11px' }} />
                <ReferenceLine y={25} stroke={COLORS.red} strokeDasharray="3 3" label={{ value: 'Max Safe Temp', fill: COLORS.red, fontSize: '8px', position: 'top' }} />
                <Bar dataKey="temp" radius={[4, 4, 0, 0]} barSize={18}>
                  {tempChartData.map((entry, idx) => (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={entry.temp > 25 ? COLORS.red : COLORS.teal} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 5 — LIVE ALERTS TICKER */}
      <div style={{
        marginTop: 'auto',
        backgroundColor: alertBg,
        borderRadius: '12px',
        padding: '12px 20px',
        border: alertBorder,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          flexShrink: 0,
          color: alertLabelColor,
          fontWeight: '700',
          fontSize: '12px',
          letterSpacing: '0.05em'
        }}>
          <span style={{ 
            color: activeCriticalCount > 0 || activeWarningsCount > 0 ? COLORS.red : COLORS.green,
            fontSize: '14px',
            animation: activeCriticalCount > 0 || activeWarningsCount > 0 ? 'pulse-dot 1.5s infinite' : 'none'
          }}>
            🔴
          </span>
          LIVE ALERTS:
        </div>

        <div className="marquee-container" style={{ flex: 1 }}>
          <div className="marquee-content" style={{ 
            color: alertTextColor, 
            fontSize: '13px', 
            fontWeight: '600'
          }}>
            {getLiveAlertsText()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CUSTOM CSS RULES ─────────────────────────────────────────────────────────
const MarqueeStyles = () => (
  <style>{`
    @keyframes marquee {
      0% { transform: translate3d(100%, 0, 0); }
      100% { transform: translate3d(-100%, 0, 0); }
    }
    .marquee-container {
      overflow: hidden;
      white-space: nowrap;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .marquee-content {
      display: inline-block;
      animation: marquee 25s linear infinite;
      padding-left: 5px;
    }
    .marquee-content:hover {
      animation-play-state: paused;
    }
    .pulsing-live-dot {
      width: 8px;
      height: 8px;
      background-color: ${COLORS.green};
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(87, 204, 153, 0.7);
      animation: live-pulse 1.5s infinite;
    }
    @keyframes live-pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(87, 204, 153, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(87, 204, 153, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(87, 204, 153, 0);
      }
    }
    .flash-up {
      animation: flash-green 1s ease-out;
    }
    .flash-down {
      animation: flash-red 1s ease-out;
    }
    @keyframes flash-green {
      0% { background-color: rgba(87, 204, 153, 0.25); color: ${COLORS.green}; }
      100% { background-color: transparent; }
    }
    @keyframes flash-red {
      0% { background-color: rgba(255, 77, 77, 0.25); color: ${COLORS.red}; }
      100% { background-color: transparent; }
    }


  `}</style>
);
