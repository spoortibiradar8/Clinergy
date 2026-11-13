import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  CalendarClock, 
  AlertCircle, 
  Activity, 
  BrainCircuit, 
  Download, 
  Sparkles, 
  TrendingUp, 
  Search, 
  SlidersHorizontal, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldAlert, 
  BarChart3,
  X,
  Plus,
  ChevronDown,
  Edit3
} from 'lucide-react';
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
  amber: '#f59e0b',
  amberLight: '#fff4e0',
  green: '#10b981',
  greenLight: '#e6f9f0',
  blue: '#6366f1',
  blueLight: '#e8f0fe',
  pink: '#ec4899',
  pinkLight: '#fce8f3',
  textPrimary: '#2d3a33',
  textMuted: '#6b8f80',
  greyLight: '#fafafa',
  borderCol: 'var(--page-border)'
};

// ── REUSABLE ANIMATED CIRCULAR PROGRESS RING ────────────────────────────────
const CircularProgressRing = ({ score }: { score: number }) => {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVal(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (val / 100) * circumference;

  let ringColor = COLORS.green;
  if (score < 50) ringColor = COLORS.red;
  else if (score <= 80) ringColor = COLORS.amber;

  return (
    <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg style={{ transform: 'rotate(-90deg)', width: '60px', height: '60px' }}>
        {/* Track */}
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: '13px', fontWeight: '800', color: COLORS.textPrimary }}>
        {Math.round(val)}%
      </span>
    </div>
  );
};

// ── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_TIMELINE = [
  { date: 'Overdue by 8 days', dateVal: -8, assetCode: 'CH-02', asset: 'Main Chiller CH-02', task: 'Alternator fault inspection + voltage test', assigned: 'Engineer B', priority: 'Critical', status: 'Urgent' },
  { date: 'In 3 days', dateVal: 3, assetCode: 'G-01', asset: 'Backup Generator G-01', task: 'Bearing inspection + RPM calibration', assigned: 'Engineer A', priority: 'High', status: 'Scheduled' },
  { date: 'In 9 days', dateVal: 9, assetCode: 'AHU-03', asset: 'Air Handling Unit AHU-03', task: 'Filter replacement', assigned: 'Technician C', priority: 'Medium', status: 'Scheduled' },
  { date: 'In 18 days', dateVal: 18, assetCode: 'ATS-01', asset: 'ATS Panel ATS-01', task: 'Transfer relay test', assigned: 'Engineer A', priority: 'Low', status: 'Planned' },
  { date: 'In 25 days', dateVal: 25, assetCode: 'UPS-01', asset: 'UPS System UPS-01', task: 'Battery load test', assigned: 'Technician D', priority: 'Low', status: 'Planned' },
  { date: 'In 45 days', dateVal: 45, assetCode: 'Sensor Array', asset: 'RTD Temp Sensor Array', task: 'Full calibration check', assigned: 'Engineer B', priority: 'Low', status: 'Planned' }
];

const INITIAL_LOGS = [
  { date: '2026-05-18', asset: 'Main Chiller CH-02', task: 'Output alternator cleaning', engineer: 'Engineer B', duration: '3.5 hrs', result: 'Completed ✓', notes: 'Harmonics reduced to within nominal threshold values' },
  { date: '2026-05-15', asset: 'Backup Generator G-01', task: 'Fuel injector flush & filter wash', engineer: 'Engineer A', duration: '2.0 hrs', result: 'Completed ✓', notes: 'Injectors operating at peak capacity' },
  { date: '2026-05-12', asset: 'RTD Temp Sensor Array', task: 'RTD channel 14 calibration', engineer: 'Engineer B', duration: '1.0 hr', result: 'Completed ✓', notes: 'Calibrated using precise reference thermocouple' },
  { date: '2026-05-08', asset: 'UPS System UPS-01', task: 'Module 3 cell replacement', engineer: 'Technician D', duration: '4.5 hrs', result: 'Completed ✓', notes: 'Replaced degrading cells with fresh lithium-ion modules' },
  { date: '2026-05-05', asset: 'ATS Panel ATS-01', task: 'Toggle relay visual check', engineer: 'Engineer A', duration: '0.8 hr', result: 'Completed ✓', notes: 'ATS contacts cleaned and checked for physical pitting' },
  { date: '2026-04-28', asset: 'Air Handling Unit AHU-03', task: 'Fan motor bearing lubrication', engineer: 'Technician C', duration: '1.5 hrs', result: 'Completed ✓', notes: 'Reduced vibration level by estimated 18%' },
  { date: '2026-04-22', asset: 'Backup Generator G-01', task: 'Engine oil and coolant flush', engineer: 'Engineer A', duration: '2.5 hrs', result: 'Completed ✓', notes: 'Filter replaced and oil level filled to maximum indicator line' },
  { date: '2026-04-15', asset: 'Main Chiller CH-02', task: 'Compressor belt calibration', engineer: 'Engineer B', duration: '3.0 hrs', result: 'Partial ⚠', notes: 'Slight belt squeal remains, scheduled for full replacement' }
];

export default function MaintenancePage() {
  const { t } = useLanguage();
  const translate = (key: string) => {
    try {
      return t(key) || key;
    } catch {
      return key;
    }
  };

  // State Declarations
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);
  const [historyLogs, setHistoryLogs] = useState(INITIAL_LOGS);
  
  // Search & Filter state for Logs
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');

  // Service Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAsset, setModalAsset] = useState('');
  const [modalTaskType, setModalTaskType] = useState('Inspection');
  const [modalPriority, setModalPriority] = useState('High');
  const [modalDate, setModalDate] = useState('');
  const [modalEngineer, setModalEngineer] = useState('');
  const [modalNotes, setModalNotes] = useState('');

  // Real-time Telemetry state (updates every 5s)
  const [telemetry, setTelemetry] = useState({
    genRPM: 1498,
    genToggle: 8.2,
    chillerRPM: 2201,
    chillerConsistency: 94.2,
    atsToggle: 6.1,
    atsTransfers: 142,
    ahuRPM: 890,
    ahuFilter: 68,
    upsCapacity: 45,
    sensorDrift: 0.0
  });

  // Tab Title Update
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Maintenance — Clinergy";
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // Telemetry updates ±2% every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => {
        const fluctuate = (val: number, range = 0.02) => +(val * (1 + (Math.random() * range * 2 - range))).toFixed(1);
        return {
          genRPM: Math.round(fluctuate(prev.genRPM)),
          genToggle: +(prev.genToggle + (Math.random() * 0.4 - 0.2)).toFixed(1),
          chillerRPM: Math.round(fluctuate(prev.chillerRPM)),
          chillerConsistency: Math.min(100, +(prev.chillerConsistency + (Math.random() * 1.0 - 0.5)).toFixed(1)),
          atsToggle: Math.max(3, +(prev.atsToggle + (Math.random() * 0.4 - 0.2)).toFixed(1)),
          atsTransfers: prev.atsTransfers + (Math.random() > 0.9 ? 1 : 0),
          ahuRPM: Math.round(fluctuate(prev.ahuRPM)),
          ahuFilter: Math.min(100, prev.ahuFilter + (Math.random() > 0.85 ? 1 : 0)),
          upsCapacity: prev.upsCapacity,
          sensorDrift: +(prev.sensorDrift + (Math.random() * 0.02 - 0.01)).toFixed(3)
        };
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Static/Dynamic Asset Definitions (calculated based on telemetry state)
  const assets = useMemo(() => {
    return [
      {
        id: 'G-01',
        name: 'Backup Generator G-01',
        icon: '⚡',
        iconBg: COLORS.amberLight,
        iconColor: COLORS.amber,
        health: 62,
        status: 'Degrading',
        statusBg: COLORS.amberLight,
        statusColor: COLORS.amber,
        stats: [
          { label: 'RPM', value: `${telemetry.genRPM} rpm` },
          { label: 'ATS Toggle Time', value: `${telemetry.genToggle} ms` },
          { label: 'Runtime Hours', value: '4,820 hrs' },
          { label: 'Last Maintained', value: '42 days ago' }
        ],
        nextDue: 'In 3 days',
        aiRisk: 'Bearing wear detected — schedule inspection',
        btnType: 'teal'
      },
      {
        id: 'CH-02',
        name: 'Main Chiller CH-02',
        icon: '❄️',
        iconBg: COLORS.blueLight,
        iconColor: COLORS.blue,
        health: 45,
        status: 'Action Required',
        statusBg: COLORS.redLight,
        statusColor: COLORS.red,
        stats: [
          { label: 'RPM', value: `${telemetry.chillerRPM} rpm` },
          { label: 'Electrical Consistency', value: `${telemetry.chillerConsistency}% stable` },
          { label: 'Runtime Hours', value: '8,340 hrs' },
          { label: 'Last Maintained', value: '78 days ago' }
        ],
        nextDue: 'Overdue by 8 days',
        aiRisk: 'Voltage sag detected on output circuit — alternator fault risk high',
        btnType: 'red'
      },
      {
        id: 'ATS-01',
        name: 'ATS Panel ATS-01',
        icon: '🔌',
        iconBg: COLORS.greenLight,
        iconColor: COLORS.green,
        health: 88,
        status: 'Healthy',
        statusBg: COLORS.greenLight,
        statusColor: COLORS.green,
        stats: [
          { label: 'ATS Toggle Time', value: `${telemetry.atsToggle} ms` },
          { label: 'Transfer Count', value: `${telemetry.atsTransfers} transfers` },
          { label: 'Last Tested', value: '12 days ago' },
          { label: 'Relay Status', value: 'Normal' }
        ],
        nextDue: 'In 18 days',
        aiRisk: 'Operating within normal parameters',
        btnType: 'outline'
      },
      {
        id: 'AHU-03',
        name: 'Air Handling Unit AHU-03',
        icon: '💨',
        iconBg: COLORS.purpleBg,
        iconColor: COLORS.purple,
        health: 71,
        status: 'Healthy',
        statusBg: COLORS.greenLight,
        statusColor: COLORS.green,
        stats: [
          { label: 'Fan RPM', value: `${telemetry.ahuRPM} rpm` },
          { label: 'Filter Status', value: `${telemetry.ahuFilter}% blocked` },
          { label: 'Runtime Hours', value: '3,210 hrs' },
          { label: 'Last Maintained', value: '31 days ago' }
        ],
        nextDue: 'In 9 days',
        aiRisk: 'Filter replacement recommended within 2 weeks',
        btnType: 'outline'
      },
      {
        id: 'UPS-01',
        name: 'UPS System UPS-01',
        icon: '🔋',
        iconBg: COLORS.tealLight,
        iconColor: COLORS.teal,
        health: 91,
        status: 'Healthy',
        statusBg: COLORS.greenLight,
        statusColor: COLORS.green,
        stats: [
          { label: 'Battery Health', value: '91%' },
          { label: 'Last Test', value: '5 days ago' },
          { label: 'Runtime Capacity', value: '45 min' },
          { label: 'Charge Status', value: '100%' }
        ],
        nextDue: 'In 25 days',
        aiRisk: 'All systems nominal',
        btnType: 'outline'
      },
      {
        id: 'Sensor Array',
        name: 'RTD Temperature Sensor Array',
        icon: '🌡',
        iconBg: COLORS.pinkLight,
        iconColor: COLORS.pink,
        health: 95,
        status: 'Healthy',
        statusBg: COLORS.greenLight,
        statusColor: COLORS.green,
        stats: [
          { label: 'Precision', value: '±0.1°C' },
          { label: 'Active Sensors', value: '24/24' },
          { label: 'Last Calibrated', value: '15 days ago' },
          { label: 'Drift Detected', value: telemetry.sensorDrift === 0 ? 'None' : `${telemetry.sensorDrift > 0 ? '+' : ''}${telemetry.sensorDrift.toFixed(3)}°C` }
        ],
        nextDue: 'In 45 days',
        aiRisk: 'All sensors calibrated and within spec',
        btnType: 'outline'
      }
    ].sort((a, b) => a.health - b.health); // worst first
  }, [telemetry]);

  // Open scheduling modal prefilled
  const openScheduleModal = (assetName = '') => {
    setModalAsset(assetName);
    setIsModalOpen(true);
  };

  // Timeline Urgency Sorting
  const sortedTimeline = useMemo(() => {
    return [...timeline].sort((a, b) => a.dateVal - b.dateVal);
  }, [timeline]);

  // Logs Filtering
  const filteredLogs = useMemo(() => {
    return historyLogs.filter(log => {
      const matchesSearch = log.asset.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            log.task.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            log.engineer.toLowerCase().includes(logSearchQuery.toLowerCase());
      
      const logTime = new Date(log.date).getTime();
      const startLimit = logStartDate ? new Date(logStartDate).getTime() : -Infinity;
      const endLimit = logEndDate ? new Date(logEndDate).getTime() : Infinity;

      return matchesSearch && logTime >= startLimit && logTime <= endLimit;
    });
  }, [historyLogs, logSearchQuery, logStartDate, logEndDate]);

  // Dynamic Summary Counts
  const actionRequiredCount = useMemo(() => 
    assets.filter(a => a.status === 'Action Required').length,
    [assets]
  );
  
  const degradingCount = useMemo(() => 
    assets.filter(a => a.status === 'Degrading').length,
    [assets]
  );

  const healthyCount = useMemo(() => 
    assets.filter(a => a.status === 'Healthy').length,
    [assets]
  );

  // Form Submitter
  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAsset) {
      toast.error('Please select an asset');
      return;
    }
    if (!modalEngineer.trim()) {
      toast.error('Please assign an engineer');
      return;
    }
    if (!modalDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    const dateObj = new Date(modalDate);
    const timeDiff = dateObj.getTime() - Date.now();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let dateLabel = `In ${daysDiff} days`;
    if (daysDiff === 0) dateLabel = 'Today';
    else if (daysDiff === 1) dateLabel = 'Tomorrow';
    else if (daysDiff < 0) dateLabel = `Overdue by ${Math.abs(daysDiff)} days`;

    const newTimelineItem = {
      date: dateLabel,
      dateVal: daysDiff,
      assetCode: modalAsset.split(' ').slice(-1)[0] || 'EQ',
      asset: modalAsset,
      task: `${modalTaskType} - ${modalNotes || 'Routine Inspection'}`,
      assigned: modalEngineer,
      priority: modalPriority,
      status: daysDiff < 0 ? 'Urgent' : 'Scheduled'
    };

    setTimeline(prev => [...prev, newTimelineItem]);
    setIsModalOpen(false);

    // Reset Form
    setModalAsset('');
    setModalTaskType('Inspection');
    setModalPriority('High');
    setModalDate('');
    setModalEngineer('');
    setModalNotes('');

    toast.success(`Successfully scheduled ${modalTaskType} for ${modalAsset}`);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Date', 'Asset', 'Task Performed', 'Engineer', 'Duration', 'Result', 'Notes'];
    const rows = filteredLogs.map(log => [
      log.date,
      log.asset,
      log.task,
      log.engineer,
      log.duration,
      log.result,
      log.notes
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clinergy_maintenance_log_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Maintenance history log exported successfully!');
  };

  return (
    <div style={{
      backgroundColor: COLORS.bgMain,
      color: COLORS.textPrimary,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      overflowY: 'auto'
    }}>
      
      {/* PAGE HEADER */}
      <div style={{
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
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: COLORS.purpleBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid #e0d7ff`
            }}>
              <Wrench size={20} style={{ color: COLORS.purple }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
              Maintenance
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '12px',
              backgroundColor: COLORS.redLight,
              color: COLORS.red,
              border: `1px solid #ffa39e`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.red, flexShrink: 0 }} />
              {actionRequiredCount} Action Required
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '12px',
              backgroundColor: COLORS.amberLight,
              color: COLORS.amber,
              border: `1px solid #ffe58f`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.amber, flexShrink: 0 }} />
              {degradingCount} Degrading
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '12px',
              backgroundColor: COLORS.greenLight,
              color: COLORS.green,
              border: `1px solid #c2f0eb`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.green, flexShrink: 0 }} />
              {healthyCount} Healthy
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '12px',
              backgroundColor: COLORS.blueLight,
              color: COLORS.blue,
              border: `1px solid #adc6ff`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.blue, flexShrink: 0 }} />
              Next Due: Generator G-01 — 3 days
            </span>
          </div>
        </div>

        <button 
          onClick={() => openScheduleModal('')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: COLORS.teal,
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(59, 191, 173, 0.25)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#238276'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = COLORS.teal}
        >
          <Plus size={16} />
          Schedule Maintenance
        </button>
      </div>

      {/* SECTION 1 — ASSET HEALTH OVERVIEW CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {assets.map((asset) => {
          const isAction = asset.status === 'Action Required';
          const isDegrading = asset.status === 'Degrading';

          let statusBg = COLORS.greenLight;
          let statusColor = COLORS.green;
          let borderHighlight = COLORS.border;

          if (isAction) {
            statusBg = COLORS.redLight;
            statusColor = COLORS.red;
            borderHighlight = `1.5px solid #ffa39e`;
          } else if (isDegrading) {
            statusBg = COLORS.amberLight;
            statusColor = COLORS.amber;
            borderHighlight = `1.5px solid #ffe58f`;
          }

          return (
            <div 
              key={asset.id}
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: '20px',
                border: borderHighlight,
                padding: '20px',
                boxShadow: COLORS.shadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                minHeight: '340px'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: asset.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {asset.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                      {asset.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: '500' }}>
                      Pillar 8 Predictive Asset
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    backgroundColor: statusBg,
                    color: statusColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {asset.status}
                  </span>
                </div>
              </div>

              {/* Score Display (Circle + Details) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <CircularProgressRing score={asset.health} />
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Asset Health
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.textPrimary, marginTop: '2px' }}>
                    {asset.health >= 80 ? 'Optimal Condition' : asset.health >= 50 ? 'Minor Wear' : 'Critical Maintenance Needed'}
                  </div>
                  <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '1px' }}>
                    Next Due: <strong style={{ color: COLORS.textPrimary }}>{asset.nextDue}</strong>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                borderTop: COLORS.border,
                borderBottom: COLORS.border,
                padding: '12px 0'
              }}>
                {asset.stats.map((stat, sIdx) => (
                  <div key={sIdx}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {stat.label}
                    </span>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary, margin: '1px 0 0 0' }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* AI Risk Purple Box */}
              <div style={{
                backgroundColor: COLORS.purpleBg,
                border: `1.5px dashed ${COLORS.purple}`,
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11px',
                fontWeight: '600',
                color: COLORS.purple,
                lineHeight: '1.3',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px'
              }}>
                <BrainCircuit size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>AI Risk: {asset.aiRisk}</span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  onClick={() => openScheduleModal(asset.name)}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isAction ? COLORS.red : COLORS.teal,
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {asset.id === 'Sensor Array' ? 'Calibrate' : 'Schedule Now'}
                </button>
                <button 
                  style={{
                    padding: '8px 12px',
                    border: `1.5px solid ${COLORS.textMuted}`,
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: COLORS.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = COLORS.textPrimary;
                    e.currentTarget.style.borderColor = COLORS.textPrimary;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = COLORS.textMuted;
                    e.currentTarget.style.borderColor = COLORS.textMuted;
                  }}
                >
                  View History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2 — MAINTENANCE SCHEDULE TIMELINE */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '20px',
        border: COLORS.border,
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={20} style={{ color: COLORS.purple }} />
          Upcoming Maintenance Schedule
        </h2>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{
                backgroundColor: '#f0f7f4',
                borderBottom: `2px solid ${COLORS.borderCol}`,
              }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Asset</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Task Details</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Assigned To</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'center' }}>Priority</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTimeline.map((item, idx) => {
                const isOverdue = item.dateVal < 0;
                let borderLeft = 'none';
                let rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';

                if (isOverdue) {
                  borderLeft = `4px solid ${COLORS.red}`;
                  rowBg = 'rgba(239, 68, 68, 0.03)';
                }

                // Priority Badge
                let prioColor = COLORS.green;
                let prioBg = COLORS.greenLight;
                if (item.priority === 'Critical' || item.priority === 'High') {
                  prioColor = COLORS.red;
                  prioBg = COLORS.redLight;
                } else if (item.priority === 'Medium') {
                  prioColor = COLORS.amber;
                  prioBg = COLORS.amberLight;
                }

                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      backgroundColor: rowBg, 
                      borderBottom: `1px solid ${COLORS.borderCol}`,
                      borderLeft,
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: isOverdue ? COLORS.red : COLORS.textPrimary }}>
                      {item.date}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '13px' }}>
                      {translate(item.asset)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: COLORS.textPrimary, fontWeight: '500' }}>
                      {item.task}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: COLORS.textMuted, fontWeight: '600' }}>
                      {item.assigned}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: prioBg,
                        color: prioColor
                      }}>
                        {item.priority}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: item.status === 'Urgent' ? COLORS.red : COLORS.teal
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.status === 'Urgent' ? COLORS.red : COLORS.teal }} />
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: COLORS.teal }}
                        onClick={() => openScheduleModal(item.asset)}
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — AI PREDICTIVE INSIGHTS PANEL */}
      <div style={{
        background: 'linear-gradient(135deg, #f0ebff 0%, #e8f0fe 100%)',
        borderRadius: '20px',
        border: '1px solid #e0d7ff',
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.purple, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={22} style={{ color: COLORS.purple }} />
            AI Predictive Maintenance Insights
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: '500', margin: '4px 0 0 0' }}>
            Generated from real-time RPM, ATS toggle, and electrical consistency telemetry
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {/* Insight 1 */}
          <div style={{ backgroundColor: COLORS.cardBg, borderRadius: '16px', border: `1px solid #e0d7ff`, padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  Generator G-01
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.teal, fontWeight: '700' }}>Confidence: 87%</span>
            </div>
            <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: '87%', height: '100%', backgroundColor: COLORS.teal }} />
            </div>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, lineHeight: '1.4', margin: 0 }}>
              RPM variance of ±42 rpm detected over last 72 hours. Historical pattern matches early-stage bearing degradation. Recommend inspection within 3 days.
            </p>
            <button 
              onClick={() => openScheduleModal('Backup Generator G-01')}
              style={{ alignSelf: 'flex-start', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: COLORS.purple, padding: 0 }}
            >
              Schedule Inspection →
            </button>
          </div>

          {/* Insight 2 */}
          <div style={{ backgroundColor: COLORS.cardBg, borderRadius: '16px', border: `1px solid #e0d7ff`, padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>❄️</span>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  Chiller CH-02
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.red, fontWeight: '700' }}>Confidence: 92%</span>
            </div>
            <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: '92%', height: '100%', backgroundColor: COLORS.red }} />
            </div>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, lineHeight: '1.4', margin: 0 }}>
              Voltage sag of 4.2V detected on output circuit during peak load. Harmonic distortion rising. Risk of alternator fault within 7-10 days if unaddressed.
            </p>
            <button 
              onClick={() => openScheduleModal('Main Chiller CH-02')}
              style={{ alignSelf: 'flex-start', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: COLORS.red, padding: 0 }}
            >
              Schedule Urgent Repair →
            </button>
          </div>

          {/* Insight 3 */}
          <div style={{ backgroundColor: COLORS.cardBg, borderRadius: '16px', border: `1px solid #e0d7ff`, padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💨</span>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  AHU-03
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: COLORS.amber, fontWeight: '700' }}>Confidence: 79%</span>
            </div>
            <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: '79%', height: '100%', backgroundColor: COLORS.amber }} />
            </div>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, lineHeight: '1.4', margin: 0 }}>
              Filter blockage at 68% capacity. Airflow restriction increasing HVAC energy consumption by estimated 12%. Replace within 2 weeks.
            </p>
            <button 
              onClick={() => openScheduleModal('Air Handling Unit AHU-03')}
              style={{ alignSelf: 'flex-start', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: COLORS.teal, padding: 0 }}
            >
              Order Replacement →
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4 — MAINTENANCE LOG TABLE */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '20px',
        border: COLORS.border,
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={20} style={{ color: COLORS.teal }} />
          Maintenance History Log
        </h2>

        {/* Log Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '4px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            {/* Search input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: COLORS.textMuted }} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={logSearchQuery}
                onChange={e => setLogSearchQuery(e.target.value)}
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

            {/* Date range pickers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="date" 
                value={logStartDate}
                onChange={e => setLogStartDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  color: COLORS.textPrimary,
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>to</span>
              <input 
                type="date" 
                value={logEndDate}
                onChange={e => setLogEndDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  color: COLORS.textPrimary,
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button 
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: COLORS.textPrimary,
              border: `1.5px solid ${COLORS.textMuted}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
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
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {/* Historical Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{
                backgroundColor: '#f0f7f4',
                borderBottom: `2px solid ${COLORS.borderCol}`,
              }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Asset</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Task Performed</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Engineer</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>Duration</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'center' }}>Result</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                const isPart = log.result.includes('Partial');
                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa', 
                      borderBottom: `1px solid ${COLORS.borderCol}`,
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '13px' }}>{log.date}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: COLORS.textPrimary }}>{translate(log.asset)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '500' }}>{log.task}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: COLORS.textMuted, fontWeight: '600' }}>{log.engineer}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>{log.duration}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: isPart ? COLORS.amberLight : COLORS.greenLight,
                        color: isPart ? COLORS.amber : COLORS.green
                      }}>
                        {log.result}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: COLORS.textMuted, lineHeight: '1.4' }}>{log.notes}</td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted }}>
                    No historical logs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE MAINTENANCE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
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
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: COLORS.border,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(to right, #f0ebff, #e8f0fe)'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.purple, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarClock size={20} />
                  Schedule Maintenance
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
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

              {/* Form */}
              <form onSubmit={handleConfirmSchedule} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Asset Select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Target Asset *
                    </label>
                    <select 
                      value={modalAsset}
                      onChange={e => setModalAsset(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select Asset</option>
                      <option value="Backup Generator G-01">Backup Generator G-01</option>
                      <option value="Main Chiller CH-02">Main Chiller CH-02</option>
                      <option value="ATS Panel ATS-01">ATS Panel ATS-01</option>
                      <option value="Air Handling Unit AHU-03">Air Handling Unit AHU-03</option>
                      <option value="UPS System UPS-01">UPS System UPS-01</option>
                      <option value="RTD Temp Sensor Array">RTD Temperature Sensor Array</option>
                    </select>
                  </div>

                  {/* Task Type */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Task Type
                    </label>
                    <select 
                      value={modalTaskType}
                      onChange={e => setModalTaskType(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Inspection">Inspection</option>
                      <option value="Repair">Repair</option>
                      <option value="Calibration">Calibration</option>
                      <option value="Replacement">Replacement</option>
                      <option value="Test">Test</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Priority Select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Priority Tier
                    </label>
                    <select 
                      value={modalPriority}
                      onChange={e => setModalPriority(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Scheduled Date *
                    </label>
                    <input 
                      type="date" 
                      value={modalDate}
                      onChange={e => setModalDate(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Engineer Assign */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Assign Engineer / Tech *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Engineer A, Technician C"
                    value={modalEngineer}
                    onChange={e => setModalEngineer(e.target.value)}
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

                {/* Notes Textarea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Specific Task Notes
                  </label>
                  <textarea 
                    placeholder="Provide specific notes regarding bearing levels, voltage test targets, or replacement filters..."
                    value={modalNotes}
                    onChange={e => setModalNotes(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: COLORS.textPrimary,
                      minHeight: '80px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#ffffff',
                      border: `1.5px solid ${COLORS.textMuted}`,
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
                    Confirm Schedule
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
