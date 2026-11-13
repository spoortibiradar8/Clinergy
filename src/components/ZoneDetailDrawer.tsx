import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Thermometer, Activity, Download, Calendar, RefreshCw, Check } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/context/LanguageContext';
import { useTempUnit } from '@/hooks/useTempUnit';
import toast from 'react-hot-toast';

export interface ZoneDetailDrawerProps {
  zone: any;
  open: boolean;
  onClose: () => void;
}

/* ── Hardcoded chart data for all 5 tabs ── */
const chartData: Record<string, { time: string; kw: number }[]> = {
  '1H': [
    { time: '00m', kw: 198 }, { time: '15m', kw: 203 },
    { time: '30m', kw: 211 }, { time: '45m', kw: 206 }, { time: '60m', kw: 209 },
  ],
  '6H': [
    { time: '6am', kw: 180 }, { time: '7am', kw: 195 },
    { time: '8am', kw: 211 }, { time: '9am', kw: 223 },
    { time: '10am', kw: 218 }, { time: '11am', kw: 206 },
  ],
  '24H': [
    { time: '00', kw: 160 }, { time: '04', kw: 145 }, { time: '08', kw: 198 },
    { time: '12', kw: 225 }, { time: '16', kw: 210 }, { time: '20', kw: 185 }, { time: '24', kw: 162 },
  ],
  '7D': [
    { time: 'Mon', kw: 190 }, { time: 'Tue', kw: 205 }, { time: 'Wed', kw: 198 },
    { time: 'Thu', kw: 215 }, { time: 'Fri', kw: 222 }, { time: 'Sat', kw: 175 }, { time: 'Sun', kw: 168 },
  ],
  '30D': [
    { time: 'W1', kw: 195 }, { time: 'W2', kw: 208 },
    { time: 'W3', kw: 201 }, { time: 'W4', kw: 214 },
  ],
};

/* ── Hardcoded table rows ── */
const mockReadings = [
  { time: '08:00', kw: 198.2, temp: '20.1°C', state: 'Active' },
  { time: '08:15', kw: 203.7, temp: '20.3°C', state: 'Active' },
  { time: '08:30', kw: 211.4, temp: '20.4°C', state: 'Peak' },
  { time: '08:45', kw: 206.5, temp: '20.3°C', state: 'Active' },
  { time: '09:00', kw: 195.8, temp: '20.2°C', state: 'Idle' },
  { time: '09:15', kw: 188.3, temp: '20.0°C', state: 'Idle' },
  { time: '09:30', kw: 192.1, temp: '20.1°C', state: 'Active' },
  { time: '09:45', kw: 209.6, temp: '20.4°C', state: 'Peak' },
];

/* ── Hardcoded AI Insights ── */
const insights = [
  {
    icon: '⚠️', title: 'Peak Load Spike Detected',
    desc: 'Usage exceeded 90% threshold at 08:30', severity: 'HIGH', color: '#E53935',
  },
  {
    icon: '💡', title: 'Shift Load to Off-Peak',
    desc: 'Potential ₹1,240 savings if load shifted post 22:00', severity: 'MEDIUM', color: '#D97706',
  },
  {
    icon: '📈', title: 'Consumption Up 3.5% vs Yesterday',
    desc: 'Investigate HVAC schedule for morning surge', severity: 'LOW', color: '#00BFA5',
  },
];

const tabs = ['1H', '6H', '24H', '7D', '30D'] as const;

function StateBadge({ state }: { state: string }) {
  const bg =
    state === 'Active' ? '#00BFA5' :
    state === 'Peak'   ? '#E53935' : '#9CA3AF';
  return (
    <span style={{
      background: bg, color: '#fff', borderRadius: 999,
      padding: '2px 10px', fontSize: 11, fontWeight: 600,
      display: 'inline-block', lineHeight: '18px',
    }}>{state}</span>
  );
}

export const ZoneDetailDrawer: React.FC<ZoneDetailDrawerProps> = ({ zone, open, onClose }) => {
  const { t } = useLanguage();
  const { formatTemp } = useTempUnit();
  const [activeTab, setActiveTab] = useState('24H');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [actionType, setActionType] = useState('HVAC_REDUCTION');
  const [reduction, setReduction] = useState(20);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!zone) return null;

  const rawStatus = (zone?.status || zone?.alertState || 'Normal').toLowerCase();
  const isCrit = rawStatus === 'critical';
  const isWarn = rawStatus === 'warning';
  const statusDot = isCrit ? '#E53935' : isWarn ? '#F59E0B' : '#00BFA5';
  const statusLabel = isCrit ? 'Critical' : isWarn ? 'Warning' : 'Normal';
  const rawCat = (zone?.category || 'Standard').toLowerCase();
  const catLabel = rawCat === 'critical' ? 'CRITICAL CARE' : rawCat === 'essential' ? 'ESSENTIAL' : 'STANDARD';

  const baseKw = zone?.power_kw || 120;
  const baseTemp = zone?.temp || 21.5;
  const energy = zone?.kwh ?? +(baseKw * 0.24).toFixed(1);

  const handleExportCSV = () => {
    const header = 'Time,kW,Temp,State\n';
    const rows = mockReadings.map(r => `${r.time},${r.kw},${r.temp},${r.state}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${zone?.zone_name || 'zone'}_readings.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exported.');
  };

  const handleSaveAction = () => {
    if (!startTime || !endTime) { toast.error('Please set start and end times.'); return; }
    toast.success(`Action scheduled for ${t(zone.zone_name)}.`);
    setIsScheduleOpen(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => { setIsRefreshing(false); toast.success('AI Insights refreshed.'); }, 1400);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 49 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="drawer-root"
            style={{
              position: 'fixed', top: 0, right: 0,
              width: '480px', height: '100vh',
              display: 'flex', flexDirection: 'column',
              background: '#fff', zIndex: 50,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            }}
          >

            {/* ═══ HEADER — never scrolls ═══ */}
            <div style={{ flexShrink: 0, padding: '24px 24px 16px', borderBottom: '1px solid #F0F0F0' }}>
              {/* Row 1: name + close */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: '#E0F5F1', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap style={{ width: 18, height: 18, color: '#00BFA5' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C2B2A', margin: 0, lineHeight: 1.2 }}>
                      {t(zone.zone_name)}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#546E7A' }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: statusDot, display: 'inline-block',
                          boxShadow: `0 0 0 3px ${statusDot}28`,
                        }} />
                        {statusLabel}
                      </span>
                      <span style={{ color: '#E8ECEF', fontSize: 10 }}>·</span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.07em',
                        textTransform: 'uppercase', color: '#00897B',
                        background: '#E0F5F1', border: '1px solid #B2DFDB',
                        borderRadius: 6, padding: '2px 8px',
                      }}>
                        {catLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close drawer"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid #E8ECEF', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#9CA3AF',
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Row 2: KPI tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div style={{ background: '#F5F6FA', borderRadius: 10, padding: '10px 12px', border: '1px solid #E8ECEF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                    <Zap style={{ width: 11, height: 11, color: '#00BFA5' }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#9CA3AF' }}>kW Draw</span>
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#00BFA5', lineHeight: 1 }}>
                    {baseKw.toFixed(1)}
                  </span>
                </div>
                <div style={{ background: '#F5F6FA', borderRadius: 10, padding: '10px 12px', border: '1px solid #E8ECEF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                    <Activity style={{ width: 11, height: 11, color: '#546E7A' }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#9CA3AF' }}>Energy</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1C2B2A', lineHeight: 1 }}>
                    {energy.toFixed ? energy.toFixed(1) : energy}<span style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', marginLeft: 2 }}>kWh</span>
                  </div>
                </div>
                <div style={{
                  background: baseTemp > 24 ? '#FFF5F5' : '#F5F6FA',
                  borderRadius: 10, padding: '10px 12px',
                  border: `1px solid ${baseTemp > 24 ? '#FFCDD2' : '#E8ECEF'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                    <Thermometer style={{ width: 11, height: 11, color: baseTemp > 24 ? '#E53935' : '#546E7A' }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#9CA3AF' }}>Temp</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: baseTemp > 24 ? '#E53935' : '#1C2B2A', lineHeight: 1 }}>
                    {formatTemp(baseTemp)}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ SCROLLABLE BODY — only this scrolls ═══ */}
            <div style={{
              flex: 1, overflowY: 'auto',
              overflowX: 'hidden', padding: '16px 24px 24px',
            }}>

              {/* ── ENERGY TREND ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                    Energy Trend
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#E53935', background: '#FFEBEE',
                    padding: '2px 8px', borderRadius: 99,
                    border: '1px solid #FFCDD2',
                  }}>
                    -3.5% vs yesterday
                  </span>
                </div>

                {/* Time filter tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {tabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '5px 12px', borderRadius: 99, border: 'none',
                        cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        background: activeTab === tab ? '#00BFA5' : '#F5F6FA',
                        color: activeTab === tab ? '#fff' : '#9CA3AF',
                        boxShadow: activeTab === tab ? '0 2px 8px rgba(0,191,165,0.28)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >{tab}</button>
                  ))}
                </div>

                {/* Chart */}
                <div style={{ height: '180px', width: '100%', marginTop: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData[activeTab]} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00BFA5" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#00BFA5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #E8ECEF', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(v: any) => [`${v} kW`, 'Power']}
                      />
                      <Area type="monotone" dataKey="kw" stroke="#00BFA5" strokeWidth={2} fill="url(#tealGrad)" dot={false}
                        activeDot={{ r: 4, fill: '#00BFA5', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* divider */}
              <div style={{ borderBottom: '1px solid #F0F0F0', marginBottom: 20 }} />

              {/* ── HISTORICAL READINGS ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                    Historical Readings
                  </span>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 11px', borderRadius: 8,
                      border: '1.5px solid #00BFA5', background: 'transparent',
                      color: '#00BFA5', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <Download style={{ width: 11, height: 11 }} />
                    Export CSV
                  </button>
                </div>

                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F5F6FA' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#9CA3AF', borderBottom: '1.5px solid #F0F0F0' }}>Time</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#9CA3AF', borderBottom: '1.5px solid #F0F0F0' }}>kW</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#9CA3AF', borderBottom: '1.5px solid #F0F0F0' }}>Temp</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#9CA3AF', borderBottom: '1.5px solid #F0F0F0' }}>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReadings.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FFFE', borderBottom: '1px solid #F0F0F0' }}>
                        <td style={{ padding: '10px 12px', color: '#546E7A', fontWeight: 600 }}>{row.time}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#00BFA5', fontVariantNumeric: 'tabular-nums' }}>{row.kw}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#546E7A', fontWeight: 600 }}>{row.temp}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <StateBadge state={row.state} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* divider */}
              <div style={{ borderBottom: '1px solid #F0F0F0', marginBottom: 20 }} />

              {/* ── AI INSIGHTS ── */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                    AI Insights
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 11, fontWeight: 600, color: '#7C5CFC',
                      background: 'none', border: 'none', cursor: 'pointer',
                      opacity: isRefreshing ? 0.6 : 1,
                    }}
                  >
                    <RefreshCw style={{ width: 11, height: 11 }} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>

                {insights.map((ins, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #F0F0F0', borderRadius: 12,
                    padding: 14, marginBottom: 10, background: '#FAFAFA',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{ins.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1C2B2A' }}>{ins.title}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                          textTransform: 'uppercase', color: '#fff',
                          background: ins.color, borderRadius: 99,
                          padding: '2px 8px', whiteSpace: 'nowrap',
                        }}>{ins.severity}</span>
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.5, color: '#546E7A', margin: 0 }}>{ins.desc}</p>
                    </div>
                  </div>
                ))}

                <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0, textAlign: 'right', fontStyle: 'italic' }}>
                  AI-generated. Review before acting.
                </p>
              </div>

            </div>{/* end scrollable body */}

            {/* ═══ FOOTER — never scrolls ═══ */}
            <div style={{
              flexShrink: 0, padding: '16px 24px',
              borderTop: '1px solid #E5E7EB', background: '#fff',
            }}>
              {!isScheduleOpen ? (
                <button
                  onClick={() => setIsScheduleOpen(true)}
                  style={{
                    width: '100%', height: 46, borderRadius: 12,
                    border: '1.5px solid #00BFA5', background: '#fff',
                    color: '#00BFA5', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <Calendar style={{ width: 15, height: 15 }} />
                  Schedule Energy Action
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#F5F6FA', borderRadius: 14, border: '1px solid #E8ECEF',
                    padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  <div>
                    <Label style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 8 }}>
                      Action Type
                    </Label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {['HVAC Reduction', 'Lighting Reduction', 'Full Standby', 'Pre-Cool'].map(opt => {
                        const key = opt.toUpperCase().replace(' ', '_');
                        const active = actionType === key;
                        return (
                          <button key={opt} onClick={() => setActionType(key)}
                            style={{
                              padding: '8px 10px', fontSize: 11, fontWeight: 600,
                              borderRadius: 8, cursor: 'pointer',
                              border: `1.5px solid ${active ? '#00BFA5' : '#E8ECEF'}`,
                              background: active ? '#00BFA5' : '#fff',
                              color: active ? '#fff' : '#546E7A',
                            }}
                          >{opt}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Label style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                        Target Reduction
                      </Label>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#00BFA5' }}>
                        {reduction}% (~{((zone.power_kw || 100) * reduction / 100).toFixed(1)} kW saved)
                      </span>
                    </div>
                    <Slider value={[reduction]} min={5} max={50} step={5} onValueChange={(v: number[]) => setReduction(v[0])} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <Label style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 5 }}>Start</Label>
                      <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                        style={{ fontSize: 11, height: 36, borderRadius: 8, border: '1px solid #E8ECEF' }} />
                    </div>
                    <div>
                      <Label style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 5 }}>End</Label>
                      <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                        style={{ fontSize: 11, height: 36, borderRadius: 8, border: '1px solid #E8ECEF' }} />
                    </div>
                  </div>
                  <div>
                    <Label style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 5 }}>Notes</Label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Pre-cooling before scheduled surgery at 14:00"
                      style={{
                        width: '100%', minHeight: 56, padding: '8px 12px', fontSize: 12,
                        background: '#fff', border: '1px solid #E8ECEF', borderRadius: 8,
                        resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#1C2B2A',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSaveAction}
                      style={{
                        flex: 1, height: 40, borderRadius: 10, border: 'none',
                        background: '#00BFA5', color: '#fff', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <Check style={{ width: 14, height: 14 }} />
                      Save Action
                    </button>
                    <button onClick={() => setIsScheduleOpen(false)}
                      style={{
                        padding: '0 14px', height: 40, borderRadius: 10,
                        border: '1px solid #E8ECEF', background: '#fff',
                        color: '#546E7A', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >Cancel</button>
                  </div>
                </motion.div>
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
