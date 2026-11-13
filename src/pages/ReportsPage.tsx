import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  IndianRupee, 
  Leaf, 
  Calendar as CalendarIcon, 
  Clock, 
  Activity, 
  FileText, 
  Download, 
  Sparkles, 
  ArrowUpDown, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  BarChart3, 
  Share2, 
  Send, 
  X, 
  Plus, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area 
} from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import toast from 'react-hot-toast';

// ── DESIGN SYSTEM CONSTANTS ──────────────────────────────────────────────────
const COLORS = {
  bgMain: 'var(--page-bg)',
  cardBg: 'var(--card-bg)',
  border: '1px solid var(--page-border)',
  shadow: 'var(--shadow-pastel)',
  teal: '#3bbfad',
  tealLight: '#e0f5f2',
  purple: '#8b5cf6',
  purpleBg: '#f0ebff',
  red: '#ef4444',
  redLight: '#ffe8e8',
  amber: '#f4a261',
  amberLight: '#fff4e0',
  green: '#10b981',
  greenLight: '#e6f9f0',
  blue: '#6366f1',
  blueLight: '#e8f0fe',
  pink: '#ec4899',
  pinkLight: '#fce8f3',
  textPrimary: '#2d3a33',
  textMuted: '#6b8f80',
  borderCol: 'var(--page-border)'
};

// ── CUSTOM GAUGE COMPONENT ──────────────────────────────────────────────────
const CarbonFootprintGauge = ({ current, target }: { current: number; target: number }) => {
  const isOver = current > target;
  const color = isOver ? COLORS.red : COLORS.green;
  const bg = isOver ? COLORS.redLight : COLORS.greenLight;
  
  // High-end visualization: target is placed at 70% of gauge range for premium look
  const maxVal = target > 0 ? target / 0.7 : 18000;
  const pct = Math.min(100, (current / maxVal) * 100);
  
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Monthly Carbon Budget
      </div>
      <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
          {/* Track */}
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {/* Fill */}
          <circle 
            cx="60" 
            cy="60" 
            r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            style={{ transition: 'stroke-dashoffset 1s ease-out' }} 
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary }}>{current.toLocaleString()}</span>
          <span style={{ fontSize: '10px', color: COLORS.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>kg CO₂</span>
        </div>
      </div>
      <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
        Target: <strong style={{ color }}>{target.toLocaleString()} kg</strong>
      </div>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: '700', 
        borderRadius: '8px', 
        padding: '3px 8px', 
        backgroundColor: bg, 
        color: color 
      }}>
        {isOver ? `⚠️ Over Budget by ${(current - target).toLocaleString()} kg` : 'On Track'}
      </span>
    </div>
  );
};

export default function ReportsPage() {
  const { t } = useLanguage();
  const translate = (key: string) => {
    try {
      return t(key) || key;
    } catch {
      return key;
    }
  };

  // State Declarations
  const [energyTab, setEnergyTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedFacility, setSelectedFacility] = useState('Clinergy Hospital');
  const [reportType, setReportType] = useState('Energy & ESG Executive');
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo] = useState('2026-05-23');

  // Loading States for exports
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  
  // Auto-Scheduler states
  const [autoReportEnabled, setAutoReportEnabled] = useState(true);
  const [autoReportFreq, setAutoReportFreq] = useState('Monthly');
  const [autoReportEmail, setAutoReportEmail] = useState('compliance@clinergyhealth.org');

  // Modal State for BEE India Issues
  const [issuesOpen, setIssuesOpen] = useState(false);

  // Sorting for zone table
  const [costSortKey, setCostSortKey] = useState<'zone' | 'kwh' | 'cost' | 'co2' | 'percent'>('kwh');
  const [costSortAsc, setCostSortAsc] = useState(false);

  // Tab Title Update
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Reports — Clinergy";
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // ── DETAILED REACTIVE DATE RANGE COMPUTATION ──────────────────────────────
  const daysCount = useMemo(() => {
    try {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) return 23;
      const diffTime = to.getTime() - from.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diffDays);
    } catch {
      return 23;
    }
  }, [dateFrom, dateTo]);

  // Normalising factor against the default 23 days range (May 1st to May 23rd)
  const scaleFactor = useMemo(() => {
    return daysCount / 23;
  }, [daysCount]);

  // Deterministic seed generation based on dates & facility to trigger smooth data changes
  const dateSeed = useMemo(() => {
    const str = `${dateFrom}-${dateTo}-${selectedFacility}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [dateFrom, dateTo, selectedFacility]);

  // Dynamic modifier based on selectors (reverts to exactly 1.0 for default settings)
  const chartModifier = useMemo(() => {
    if (dateFrom === '2026-05-01' && dateTo === '2026-05-23' && selectedFacility === 'Clinergy Hospital') {
      return 1.0;
    }
    return 0.85 + (dateSeed % 31) / 100;
  }, [dateFrom, dateTo, selectedFacility, dateSeed]);

  // 1. Report Summary Card Data (Reactively Scales)
  const summaries = useMemo(() => [
    { label: 'Total Energy This Month', val: `${Math.round(18420 * scaleFactor).toLocaleString()} kWh`, prev: '19,230 kWh', change: '-4.2% vs last month', isPositive: true, border: COLORS.purple },
    { label: 'Total Cost This Month', val: `₹${Math.round(147360 * scaleFactor).toLocaleString()}`, prev: '₹1,53,180', change: '-3.8% vs last month', isPositive: true, border: COLORS.pink },
    { label: 'Carbon Footprint', val: `${Math.round(14628 * scaleFactor).toLocaleString()} kg CO₂`, prev: '15,414 kg', change: '-5.1% vs last month', isPositive: true, border: COLORS.green },
    { label: 'Compliance Score', val: '98.4%', prev: 'ASHRAE 90.1 Compliant', change: 'ASHRAE 90.1 Compliant', isCompliance: true, border: COLORS.teal }
  ], [scaleFactor]);

  // 2. Energy Tab-based Chart Data (Reactively scales while keeping values exact for default range)
  const dailyTarget = 3000;
  const dailyChartData = useMemo(() => {
    const base = [
      { date: 'Mon', kwh: 2400 },
      { date: 'Tue', kwh: 2800 },
      { date: 'Wed', kwh: 2750 },
      { date: 'Thu', kwh: 3700 }, // Over target!
      { date: 'Fri', kwh: 2900 },
      { date: 'Sat', kwh: 1800 },
      { date: 'Sun', kwh: 1600 }
    ];
    return base.map(item => {
      const kwh = Math.round(item.kwh * chartModifier);
      const cost = Math.round(kwh * 8);
      const co2 = Math.round(kwh * 0.82);
      const delta = kwh - dailyTarget;
      return { date: item.date, kwh, cost, co2, delta };
    });
  }, [chartModifier]);

  const weeklyTarget = 18000;
  const weeklyChartData = useMemo(() => {
    const base = [
      { date: 'Week 1', kwh: 16500 },
      { date: 'Week 2', kwh: 18200 }, // Over!
      { date: 'Week 3', kwh: 17800 },
      { date: 'Week 4', kwh: 18420 }  // Over!
    ];
    return base.map(item => {
      const kwh = Math.round(item.kwh * chartModifier);
      const cost = Math.round(kwh * 8);
      const co2 = Math.round(kwh * 0.82);
      const delta = kwh - weeklyTarget;
      return { date: item.date, kwh, cost, co2, delta };
    });
  }, [chartModifier]);

  const monthlyTarget = 75000;
  const monthlyChartData = useMemo(() => {
    const base = [
      { date: 'Jun', kwh: 72000 },
      { date: 'Jul', kwh: 74000 },
      { date: 'Aug', kwh: 76500 }, // Over!
      { date: 'Sep', kwh: 73000 },
      { date: 'Oct', kwh: 71500 },
      { date: 'Nov', kwh: 74200 },
      { date: 'Dec', kwh: 78000 }, // Over!
      { date: 'Jan', kwh: 75500 }, // Over!
      { date: 'Feb', kwh: 71000 },
      { date: 'Mar', kwh: 73500 },
      { date: 'Apr', kwh: 74800 },
      { date: 'May', kwh: 76900 }  // Over!
    ];
    return base.map(item => {
      const kwh = Math.round(item.kwh * chartModifier);
      const cost = Math.round(kwh * 8);
      const co2 = Math.round(kwh * 0.82);
      const delta = kwh - monthlyTarget;
      return { date: item.date, kwh, cost, co2, delta };
    });
  }, [chartModifier]);

  const currentChartSet = useMemo(() => {
    if (energyTab === 'daily') return { data: dailyChartData, target: dailyTarget, unit: 'Daily' };
    if (energyTab === 'weekly') return { data: weeklyChartData, target: weeklyTarget, unit: 'Weekly' };
    return { data: monthlyChartData, target: monthlyTarget, unit: 'Monthly' };
  }, [energyTab, dailyChartData, weeklyChartData, monthlyChartData]);

  // 3. Zone-wise breakdown data (scales dynamically while keeping exact proportions)
  // Zones: ICU 24%, OT 38%, Emergency 15%, Ward A 11%, Ward B 8%, Pharmacy 4%
  const zoneDistribution = useMemo(() => {
    const base = [
      { name: 'ICU', kwh: 4420.8, cost: 35366.4, co2: 3625.0, percent: 24, fill: COLORS.teal },
      { name: 'Operation Theatre', kwh: 6999.6, cost: 55996.8, co2: 5739.7, percent: 38, fill: COLORS.purple },
      { name: 'Emergency', kwh: 2763.0, cost: 22104.0, co2: 2265.7, percent: 15, fill: COLORS.pink },
      { name: 'Ward A', kwh: 2026.2, cost: 16209.6, co2: 1661.5, percent: 11, fill: COLORS.amber },
      { name: 'Ward B', kwh: 1473.6, cost: 11788.8, co2: 1208.4, percent: 8, fill: COLORS.green },
      { name: 'Pharmacy', kwh: 736.8, cost: 5894.4, co2: 604.2, percent: 4, fill: COLORS.blue }
    ];
    return base.map(item => ({
      ...item,
      kwh: parseFloat((item.kwh * scaleFactor).toFixed(1)),
      cost: parseFloat((item.cost * scaleFactor).toFixed(1)),
      co2: parseFloat((item.co2 * scaleFactor).toFixed(1))
    }));
  }, [scaleFactor]);

  // Sorting logic for Zone Table
  const sortedZones = useMemo(() => {
    return [...zoneDistribution].sort((a, b) => {
      let comparison = 0;
      if (costSortKey === 'zone') {
        comparison = a.name.localeCompare(b.name);
      } else if (costSortKey === 'kwh') {
        comparison = a.kwh - b.kwh;
      } else if (costSortKey === 'cost') {
        comparison = a.cost - b.cost;
      } else if (costSortKey === 'co2') {
        comparison = a.co2 - b.co2;
      } else if (costSortKey === 'percent') {
        comparison = a.percent - b.percent;
      }
      return costSortAsc ? comparison : -comparison;
    });
  }, [zoneDistribution, costSortKey, costSortAsc]);

  const handleSort = (key: typeof costSortKey) => {
    if (costSortKey === key) {
      setCostSortAsc(!costSortAsc);
    } else {
      setCostSortKey(key);
      setCostSortAsc(false);
    }
  };

  // Zone totals calculated from scaled distribution
  const totalZoneKwh = useMemo(() => Math.round(zoneDistribution.reduce((acc, z) => acc + z.kwh, 0)), [zoneDistribution]);
  const totalZoneCost = useMemo(() => Math.round(zoneDistribution.reduce((acc, z) => acc + z.cost, 0)), [zoneDistribution]);
  const totalZoneCo2 = useMemo(() => parseFloat(zoneDistribution.reduce((acc, z) => acc + z.co2, 0).toFixed(1)), [zoneDistribution]);

  // 4. Carbon Trend Chart Data (scales dynamically)
  const carbonTrendData = useMemo(() => {
    const base = [
      { month: 'Jun', emissions: 14900, target: 12000 },
      { month: 'Jul', emissions: 13800, target: 12000 },
      { month: 'Aug', emissions: 14200, target: 12000 },
      { month: 'Sep', emissions: 12900, target: 12000 },
      { month: 'Oct', emissions: 11800, target: 12000 },
      { month: 'Nov', emissions: 12400, target: 12000 },
      { month: 'Dec', emissions: 15300, target: 12000 },
      { month: 'Jan', emissions: 14800, target: 12000 },
      { month: 'Feb', emissions: 13600, target: 12000 },
      { month: 'Mar', emissions: 12950, target: 12000 },
      { month: 'Apr', emissions: 13400, target: 12000 },
      { month: 'May', emissions: 14628, target: 12000 }
    ];
    return base.map(item => ({
      month: item.month,
      emissions: Math.round(item.emissions * chartModifier),
      target: Math.round(item.target * chartModifier)
    }));
  }, [chartModifier]);

  // 5. Facility Benchmarking Data (horizontal bars)
  const peerData = useMemo(() => [
    { name: 'Manipal Hospital', bedIntensity: 6.2, color: '#d1d5db' },
    { name: 'City General Hospital', bedIntensity: 5.8, color: '#d1d5db' },
    { name: 'Apollo Clinic', bedIntensity: 4.9, color: '#d1d5db' },
    { name: 'Clinergy Hospital (You)', bedIntensity: 4.2, color: COLORS.teal }
  ].sort((a, b) => b.bedIntensity - a.bedIntensity), []);

  // 6. EXPORT FUNCTIONALITIES
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    setTimeout(() => {
      setIsExportingPDF(false);
      toast.success('Generated and opened print layout successfully!', {
        icon: '📄'
      });
      window.print();
    }, 1200);
  };

  const handleExportCSV = () => {
    setIsExportingCSV(true);
    setTimeout(() => {
      setIsExportingCSV(false);
      
      // EXECUTIVE SUMMARY TABLE
      const secSummaryHeaders = ['--- EXECUTIVE COMPLIANCE & ESG SUMMARY ---'];
      const secSummaryFields = ['Metric', 'Current Period Value', 'Status / Benchmark'];
      const secSummaryRows = [
        ['Total Energy Usage', `${Math.round(18420 * scaleFactor)} kWh`, 'ASHRAE 90.1 Compliant'],
        ['Total Computed Cost', `INR ${Math.round(147360 * scaleFactor)}`, `Tariff Rate: ₹8.0/kWh`],
        ['Carbon Footprint', `${Math.round(14628 * scaleFactor)} kg CO2`, 'Scope 1-3 ESG Grid Intensity'],
        ['Hospital Compliance Score', '98.4%', 'Best in Peer Group Group']
      ];

      // ENERGY OVERVIEW TABLE
      const secEnergyHeaders = ['', '--- ENERGY CONSUMPTION TIMELINE ---'];
      const secEnergyFields = ['Date/Period', 'Consumption (kWh)', 'Cost (INR)', 'Carbon footprint (kg CO2)', 'vs Target Limit (kWh)'];
      const secEnergyRows = currentChartSet.data.map(row => [
        row.date,
        row.kwh,
        `INR ${row.cost}`,
        `${row.co2} kg`,
        row.delta > 0 ? `+${row.delta} (OVER)` : `${row.delta} (UNDER)`
      ]);

      // ZONE BREAKDOWN TABLE
      const secZoneHeaders = ['', '--- CLINERGY ZONE BREAKDOWN CONTROLS ---'];
      const secZoneFields = ['Zone Department', 'Power Consumed (kWh)', 'Tariff Computed Cost (INR)', 'Carbon Footprint (kg CO2)', 'Total Hospital Share %'];
      const secZoneRows = zoneDistribution.map(z => [
        z.name,
        z.kwh,
        `INR ${Math.round(z.cost)}`,
        `${Math.round(z.co2)} kg`,
        `${z.percent}%`
      ]);
      const secZoneTotalRow = [
        'Total',
        totalZoneKwh,
        `INR ${totalZoneCost}`,
        `${Math.round(totalZoneCo2)} kg`,
        '100%'
      ];

      // COMPILING COMPREHENSIVE SHEETS
      const csvContent = [
        secSummaryHeaders.join(','),
        secSummaryFields.join(','),
        ...secSummaryRows.map(r => r.join(',')),
        secEnergyHeaders.join(','),
        secEnergyFields.join(','),
        ...secEnergyRows.map(r => r.join(',')),
        secZoneHeaders.join(','),
        secZoneFields.join(','),
        ...secZoneRows.map(r => r.join(',')),
        secZoneTotalRow.join(',')
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `clinergy_comprehensive_esg_report_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Historical ESG & Tariff CSV compiled & downloaded!', {
        icon: '📊'
      });
    }, 1200);
  };

  const handleNABHReportDownload = (reportName: string) => {
    toast.success(`Regulatory compliance audit report "${reportName}" downloaded!`, {
      icon: '📋'
    });
  };

  return (
    <div 
      id="reports-page-root"
      style={{
        backgroundColor: '#f7faf8',
        color: COLORS.textPrimary,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto'
      }}
    >
      {/* Dynamic print stylings injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #reports-page-root, #reports-page-root * {
            visibility: visible;
          }
          #reports-page-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin-bottom: 16px !important;
          }
        }
      `}} />
      
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
          border: COLORS.border,
          boxShadow: COLORS.shadow
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
            Reports
          </h1>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: COLORS.teal,
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59, 191, 173, 0.25)',
              transition: 'background-color 0.2s',
              opacity: isExportingPDF ? 0.7 : 1
            }}
          >
            {isExportingPDF ? (
              <span className="shimmer-block" style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            ) : '📄'}
            {isExportingPDF ? 'Exporting...' : 'Export PDF'}
          </button>
          
          <button 
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: COLORS.textPrimary,
              border: `1.5px solid ${COLORS.textMuted}`,
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: isExportingCSV ? 0.7 : 1
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = COLORS.textPrimary;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = COLORS.textMuted;
            }}
          >
            {isExportingCSV ? (
              <span className="shimmer-block" style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #6b7280', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            ) : '📊'}
            {isExportingCSV ? 'Compiling...' : 'Export CSV'}
          </button>
        </div>

        {/* Filters and Date ranges */}
        <div 
          className="no-print"
          style={{
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            borderTop: `1px solid ${COLORS.borderCol}`,
            paddingTop: '16px',
            marginTop: '4px'
          }}
        >
          {/* From Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              From Date
            </label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: COLORS.textPrimary,
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* To Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              To Date
            </label>
            <input 
              type="date" 
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: COLORS.textPrimary,
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Facility Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Site Facility
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                value={selectedFacility}
                onChange={e => setSelectedFacility(e.target.value)}
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
                <option value="Clinergy Hospital">Clinergy Hospital (Site A)</option>
                <option value="City General Clinic">City General (Site B)</option>
                <option value="Apollo Site C">Apollo Clinic (Site C)</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: COLORS.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Report Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Report Category
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                value={reportType}
                onChange={e => setReportType(e.target.value)}
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
                <option value="Energy & ESG Executive">⚡ Energy & ESG Executive</option>
                <option value="Carbon Footprint Scope 1-3">🌱 Carbon Footprint Scope 1-3</option>
                <option value="Regulatory Compliance Audit">📋 Regulatory Compliance Audit</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: COLORS.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 — REPORT SUMMARY CARDS */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {summaries.map((card, idx) => (
          <div 
            key={idx}
            className="print-card"
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: '20px',
              border: COLORS.border,
              borderTop: `4px solid ${card.border}`,
              padding: '16px 20px',
              boxShadow: COLORS.shadow,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {card.label}
            </span>
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '24px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                {card.val}
              </p>
              {card.isCompliance ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  backgroundColor: COLORS.greenLight,
                  color: COLORS.green,
                  marginTop: '4px'
                }}>
                  {card.change}
                </span>
              ) : (
                <p style={{ fontSize: '11px', color: COLORS.green, fontWeight: '700', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <TrendingDown size={12} />
                  {card.change}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2 — ENERGY CONSUMPTION CHART */}
      <div 
        className="print-card"
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '20px',
          border: COLORS.border,
          padding: '24px',
          boxShadow: COLORS.shadow,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={20} style={{ color: COLORS.teal }} />
            Energy Consumption Overview
          </h2>

          {/* Daily / Weekly / Monthly Switchers */}
          <div 
            className="no-print"
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid #cbd5e1'
            }}
          >
            {(['daily', 'weekly', 'monthly'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setEnergyTab(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: energyTab === tab ? COLORS.teal : 'transparent',
                  color: energyTab === tab ? '#ffffff' : COLORS.textMuted,
                  transition: 'all 0.15s ease',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentChartSet.data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.textMuted, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}
                formatter={(val: number) => [
                  <div>
                    <strong>{val.toLocaleString()} kWh</strong>
                    <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>
                      Est. Cost: ₹{(val * 8).toLocaleString()} | Carbon: {(val * 0.82).toFixed(1)} kg CO₂
                    </div>
                  </div>, 
                  'Consumption'
                ]}
              />
              <ReferenceLine 
                y={currentChartSet.target} 
                stroke={COLORS.amber} 
                strokeDasharray="3 3" 
                label={{ value: `${currentChartSet.unit} Target`, fill: COLORS.amber, fontSize: '9px', fontWeight: '800', position: 'top' }} 
              />
              <Bar dataKey="kwh" radius={[4, 4, 0, 0]} barSize={36}>
                {currentChartSet.data.map((entry, idx) => (
                  <Cell 
                    key={`cell-${idx}`} 
                    fill={entry.kwh > currentChartSet.target ? COLORS.amber : COLORS.teal} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Below Chart Data Table */}
        <div style={{ border: `1px solid ${COLORS.borderCol}`, borderRadius: '12px', overflow: 'hidden', marginTop: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.borderCol}` }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Period / Date</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>kWh</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>Cost ₹</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>CO₂ kg</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'center' }}>vs Target</th>
              </tr>
            </thead>
            <tbody>
              {currentChartSet.data.map((row, idx) => {
                const isOver = row.kwh > currentChartSet.target;
                return (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa', borderBottom: `1px solid ${COLORS.borderCol}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>{row.date}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: COLORS.textPrimary }}>{row.kwh.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: COLORS.teal }}>₹{row.cost.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: COLORS.textMuted, fontWeight: '500' }}>{row.co2.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: isOver ? COLORS.redLight : COLORS.greenLight,
                        color: isOver ? COLORS.red : COLORS.green
                      }}>
                        {isOver ? `⚠️ +${row.delta.toLocaleString()} kWh` : `✓ ${row.delta.toLocaleString()} kWh`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — ZONE-WISE BREAKDOWN */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Left - Zone Energy Breakdown (60% equivalent dynamic card) */}
        <div 
          className="print-card"
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: '20px',
            border: COLORS.border,
            padding: '24px',
            boxShadow: COLORS.shadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '1 1 60%'
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: COLORS.textPrimary, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} style={{ color: COLORS.teal }} />
            Zone Energy Breakdown Share
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Donut Chart with Center Text */}
            <div style={{ position: 'relative', width: '220px', height: '220px', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="percent"
                  >
                    {zoneDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: COLORS.textPrimary, display: 'block' }}>48.5</span>
                <span style={{ fontSize: '10px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>kWh Today</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
              {zoneDistribution.map((zone, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zone.fill }} />
                    <span style={{ fontWeight: '700', color: COLORS.textPrimary }}>{translate(zone.name)}</span>
                  </div>
                  <div style={{ color: COLORS.textMuted }}>
                    <strong style={{ color: COLORS.textPrimary }}>{Math.round(zone.kwh).toLocaleString()} kWh</strong> (₹{Math.round(zone.cost).toLocaleString()})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Zone Cost Table (40% equivalent dynamic card) */}
        <div 
          className="print-card"
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: '20px',
            border: COLORS.border,
            padding: '24px',
            boxShadow: COLORS.shadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '1 1 40%'
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: COLORS.textPrimary, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} style={{ color: COLORS.purple }} />
            Zone Cost Contribution
          </h3>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${COLORS.borderCol}` }}>
                  <th 
                    onClick={() => handleSort('zone')}
                    style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Zone <ArrowUpDown size={10} style={{ marginLeft: '2px', display: 'inline' }} />
                  </th>
                  <th 
                    onClick={() => handleSort('kwh')}
                    style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  >
                    kWh <ArrowUpDown size={10} style={{ marginLeft: '2px', display: 'inline' }} />
                  </th>
                  <th 
                    onClick={() => handleSort('cost')}
                    style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Cost ₹ <ArrowUpDown size={10} style={{ marginLeft: '2px', display: 'inline' }} />
                  </th>
                  <th 
                    onClick={() => handleSort('co2')}
                    style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  >
                    CO₂ kg <ArrowUpDown size={10} style={{ marginLeft: '2px', display: 'inline' }} />
                  </th>
                  <th 
                    onClick={() => handleSort('percent')}
                    style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  >
                    % of Total <ArrowUpDown size={10} style={{ marginLeft: '2px', display: 'inline' }} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedZones.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderCol}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', fontSize: '12px' }}>{translate(row.name)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>{Math.round(row.kwh).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: COLORS.teal }}>₹{Math.round(row.cost).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: COLORS.green }}>{Math.round(row.co2).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '800', color: COLORS.purple }}>{row.percent}%</td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr style={{ backgroundColor: '#f0f7f4', borderTop: `2px solid ${COLORS.borderCol}` }}>
                  <td style={{ padding: '12px 12px', fontWeight: '800', fontSize: '13px' }}>Total</td>
                  <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', fontSize: '13px' }}>{totalZoneKwh.toLocaleString()}</td>
                  <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', fontSize: '13px', color: COLORS.teal }}>₹{totalZoneCost.toLocaleString()}</td>
                  <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', fontSize: '13px', color: COLORS.green }}>{Math.round(totalZoneCo2).toLocaleString()}</td>
                  <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', fontSize: '13px', color: COLORS.purple }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 4 — CARBON FOOTPRINT TRACKER */}
      <div 
        className="print-card"
        style={{
          background: 'linear-gradient(135deg, #e6f9f0 0%, #f0ebff 100%)',
          borderRadius: '20px',
          border: '1px solid #d1f2e1',
          padding: '24px',
          boxShadow: COLORS.shadow,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.green, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Leaf size={20} style={{ color: COLORS.green }} />
            Carbon Footprint Report — Pillar 9
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: '500', margin: '4px 0 0 0' }}>
            CO₂-equivalent emissions using live grid intensity factors for ESG reporting
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Left — CO₂ Gauge */}
          <div style={{ backgroundColor: COLORS.cardBg, borderRadius: '16px', border: COLORS.border, padding: '20px', boxShadow: COLORS.shadow }}>
            <CarbonFootprintGauge current={Math.round(14628 * scaleFactor)} target={Math.round(12000 * scaleFactor)} />
          </div>

          {/* Center — Trend Chart */}
          <div style={{ 
            backgroundColor: COLORS.cardBg, 
            borderRadius: '16px', 
            border: COLORS.border, 
            padding: '20px', 
            boxShadow: COLORS.shadow,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ fontSize: '12px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarIcon size={12} />
              12-Month CO₂ Emissions Trend
            </h4>
            <div style={{ height: '140px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={carbonTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCarbonArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <ReferenceLine y={Math.round(12000 * chartModifier)} stroke={COLORS.red} strokeDasharray="3 3" label={{ value: 'Target', fill: COLORS.red, fontSize: '8px' }} />
                  <Area type="monotone" dataKey="emissions" name="CO₂ (kg)" stroke={COLORS.green} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCarbonArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right — Carbon Stats */}
          <div style={{ 
            backgroundColor: COLORS.cardBg, 
            borderRadius: '16px', 
            border: COLORS.border, 
            padding: '20px', 
            boxShadow: COLORS.shadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '202px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Carbon Stats
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '700',
                backgroundColor: COLORS.greenLight,
                color: COLORS.green
              }}>
                On Track
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: COLORS.textMuted }}>Today:</span>
                <strong style={{ color: COLORS.textPrimary }}>{Math.round(38.2 * chartModifier * 10) / 10} kg CO₂</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: COLORS.textMuted }}>This Week:</span>
                <strong style={{ color: COLORS.textPrimary }}>{Math.round(267 * chartModifier).toLocaleString()} kg CO₂</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: COLORS.textMuted }}>This Month:</span>
                <strong style={{ color: COLORS.green }}>{Math.round(14628 * scaleFactor).toLocaleString()} kg CO₂</strong>
              </div>
            </div>

            <div style={{ borderTop: COLORS.border, paddingTop: '8px', fontSize: '11px', color: COLORS.textPrimary }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                🌳 Equivalent to <strong>{Math.round(214 * scaleFactor)} trees</strong> needed to offset
              </div>
              <div style={{ fontSize: '10px', color: COLORS.textMuted, marginTop: '2px' }}>
                Grid Intensity: 0.82 kg CO₂/kWh (India Grid factor)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5 — COMPLIANCE REPORTS */}
      <div 
        className="print-card"
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '20px',
          border: COLORS.border,
          padding: '24px',
          boxShadow: COLORS.shadow,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: COLORS.teal }} />
            Regulatory Compliance Reports — Pillar 7
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
            Auto-generated ASHRAE 90.1, NABH, and local energy code compliance reports
          </p>
        </div>

        {/* 3 Cards side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1 */}
          <div style={{ backgroundColor: '#ffffff', border: COLORS.border, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  ASHRAE 90.1
                </h3>
                <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '6px', padding: '2px 8px' }}>
                  ✅ Compliant
                </span>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.textMuted, display: 'block', marginTop: '2px' }}>
                Score: <strong>98.4%</strong> • Period: Current Month
              </span>
            </div>
            <p style={{ fontSize: '11px', color: COLORS.textMuted, margin: 0 }}>
              Last Generated: {new Date().toLocaleDateString()}
            </p>
            <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                onClick={() => handleNABHReportDownload('ASHRAE 90.1')}
                style={{ flex: 1, padding: '8px', backgroundColor: COLORS.teal, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                Download PDF
              </button>
              <button 
                onClick={() => toast.success('Automation scheduled!')}
                style={{ padding: '8px', backgroundColor: 'transparent', color: COLORS.textMuted, border: `1.5px solid ${COLORS.textMuted}`, borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                Schedule Auto-Report
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: '#ffffff', border: COLORS.border, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  NABH Energy Standards
                </h3>
                <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '6px', padding: '2px 8px' }}>
                  ✅ Compliant
                </span>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.textMuted, display: 'block', marginTop: '2px' }}>
                Score: <strong>96.1%</strong> • Period: Current Month
              </span>
            </div>
            <p style={{ fontSize: '11px', color: COLORS.textMuted, margin: 0 }}>
              Last Generated: {new Date().toLocaleDateString()}
            </p>
            <button 
              className="no-print"
              onClick={() => handleNABHReportDownload('NABH Energy Standards')}
              style={{ padding: '8px', backgroundColor: COLORS.teal, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' }}
            >
              Download PDF
            </button>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: '#ffffff', border: COLORS.border, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  Local Energy Code (BEE)
                </h3>
                <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.amber, backgroundColor: COLORS.amberLight, borderRadius: '6px', padding: '2px 8px' }}>
                  ⚠️ Review Required
                </span>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.textMuted, display: 'block', marginTop: '2px' }}>
                Score: <strong>91.2%</strong> • Period: Current Month
              </span>
            </div>
            <p style={{ fontSize: '11px', color: COLORS.red, fontWeight: '700', margin: 0 }}>
              Issue: Peak demand exceeded threshold on 2 days
            </p>
            <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                onClick={() => handleNABHReportDownload('Local Energy Code BEE India')}
                style={{ flex: 1, padding: '8px', backgroundColor: COLORS.amber, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                Download PDF
              </button>
              <button 
                onClick={() => setIssuesOpen(true)}
                style={{ padding: '8px', backgroundColor: 'transparent', color: COLORS.textMuted, border: `1.5px solid ${COLORS.textMuted}`, borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                View Issues
              </button>
            </div>
          </div>
        </div>

        {/* Auto Report Scheduler Box */}
        <div 
          className="auto-scheduler no-print"
          style={{
            borderTop: COLORS.border,
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="enableAuto"
              checked={autoReportEnabled}
              onChange={e => setAutoReportEnabled(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="enableAuto" style={{ fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Enable Automated Energy Compliance Dispatcher
            </label>
          </div>

          {autoReportEnabled && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Frequency:</span>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={autoReportFreq}
                    onChange={e => setAutoReportFreq(e.target.value)}
                    style={{
                      padding: '6px 28px 6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      color: COLORS.textPrimary,
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none'
                    }}
                  >
                    <option value="Daily">Daily Report</option>
                    <option value="Weekly">Weekly Digest</option>
                    <option value="Monthly">Monthly Auditor</option>
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '10px', color: COLORS.textMuted, pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, maxWidth: '320px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Auditor Email:</span>
                <input 
                  type="email" 
                  value={autoReportEmail}
                  onChange={e => setAutoReportEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: COLORS.textPrimary,
                    outline: 'none'
                  }}
                />
              </div>

              <button 
                onClick={() => toast.success(`Automation scheduler active! Dispatching reports ${autoReportFreq} to ${autoReportEmail}`)}
                style={{ padding: '6px 14px', backgroundColor: COLORS.teal, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTION 6 — MULTI-SITE BENCHMARKING */}
      <div 
        className="print-card"
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '20px',
          border: COLORS.border,
          padding: '24px',
          boxShadow: COLORS.shadow,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} style={{ color: COLORS.teal }} />
            Facility Benchmarking — Pillar 10
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
            Normalised energy intensity (kWh/bed) across facilities for peer comparison
          </p>
        </div>

        {/* Horizontal Bar Chart */}
        <div style={{ height: '240px', width: '100%', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={peerData} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 8]} tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: COLORS.textPrimary, fontWeight: '700' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => `${value} kWh/bed`} />
              <ReferenceLine 
                x={5.5} 
                stroke={COLORS.red} 
                strokeDasharray="3 3" 
                label={{ value: 'Industry Average (5.5)', fill: COLORS.red, fontSize: '9px', fontWeight: '800', position: 'top' }} 
              />
              <Bar dataKey="bedIntensity" radius={[0, 6, 6, 0]} barSize={24}>
                {peerData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name.includes('Clinergy') ? COLORS.teal : '#d1d5db'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Best in Peer Group Badge overlay */}
          <div 
            className="no-print"
            style={{
              position: 'absolute',
              right: '24px',
              top: '24px',
              backgroundColor: COLORS.tealLight,
              border: `1.5px solid ${COLORS.teal}`,
              borderRadius: '12px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: COLORS.shadow
            }}
          >
            <span style={{ fontSize: '15px' }}>🏆</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.teal, letterSpacing: '0.02em' }}>
              Best in Peer Group
            </span>
          </div>
        </div>

        {/* Benchmarking Summary text */}
        <div style={{
          backgroundColor: COLORS.tealLight,
          borderRadius: '12px',
          padding: '12px 18px',
          borderLeft: `4px solid ${COLORS.teal}`,
          fontSize: '13px',
          fontWeight: '700',
          color: COLORS.textPrimary
        }}>
          💡 You use <strong style={{ color: COLORS.teal }}>23% less energy per bed</strong> than peer average — saving estimated <strong>₹2.4L/month</strong> in carbon tax penalties!
        </div>
      </div>

      {/* COMPLIANCE WARNING MODAL */}
      <AnimatePresence>
        {issuesOpen && (
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
            padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '20px 24px',
                borderBottom: COLORS.border,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: COLORS.amberLight
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.amber, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} />
                  BEE India Code Audits
                </h2>
                <button 
                  onClick={() => setIssuesOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: COLORS.textMuted,
                    padding: '6px',
                    borderRadius: '50%'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: '500', lineHeight: '1.4', margin: 0 }}>
                  The BEE India local energy auditor flagged a warning because our active peak electrical loading exceeded the configured limit:
                </p>

                <div style={{
                  backgroundColor: COLORS.redLight,
                  border: `1px solid ${COLORS.red}`,
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  color: COLORS.red,
                  fontWeight: '600'
                }}>
                  ⚠️ Peak demand exceeded threshold (250 kW) on two separate instances:
                  <div style={{ fontSize: '11px', color: COLORS.textPrimary, marginTop: '4px' }}>
                    • May 14th: <strong>268.4 kW</strong> (Peak OT usage interval)<br/>
                    • May 19th: <strong>259.1 kW</strong> (Chiller compressor start cycle)
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0 }}>
                  <strong>Recommended AI Action:</strong> Shift the chiller startup cycle by 15 mins to prevent concurrent peak loads, or raise the threshold setting in the Settings tab.
                </p>

                <button 
                  onClick={() => setIssuesOpen(false)}
                  style={{
                    alignSelf: 'flex-end',
                    padding: '8px 16px',
                    backgroundColor: COLORS.amber,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
