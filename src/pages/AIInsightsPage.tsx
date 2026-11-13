import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  Search, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ChevronRight, 
  ArrowUpRight, 
  X, 
  RotateCw, 
  Play, 
  Sliders, 
  BarChart3, 
  Cpu 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ReferenceArea,
  Area,
  Cell,
  LineChart
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

// ── DESIGN SYSTEM CONSTANTS ──────────────────────────────────────────────────
const COLORS = {
  bgMain: 'var(--page-bg)',
  cardBg: 'var(--card-bg)',
  border: '1px solid var(--page-border)',
  shadow: 'var(--shadow-pastel)',
  primary: 'var(--page-accent)',      // Scoped accent for AI
  primaryLight: 'var(--page-accent-light)',
  teal: '#3bbfad',         // Teal secondary
  tealLight: '#e0f5f2',
  red: '#ef4444',
  redLight: '#ffe8e8',
  amber: '#f4a261',
  amberLight: '#fff4e0',
  green: '#10b981',
  greenLight: '#e6f9f0',
  blue: '#6366f1',
  blueLight: '#e8f0fe',
  textPrimary: '#2d2d3a',
  textMuted: '#9ca3af',
  borderCol: 'var(--page-border)'
};

export default function AIInsightsPage() {
  const { t } = useLanguage();
  const translate = (key: string) => {
    try {
      return t(key) || key;
    } catch {
      return key;
    }
  };

  // ── 1. ACTIVE STATES & TIME SIMULATIONS ────────────────────────────────────
  const [isRetraining, setIsRetraining] = useState(false);
  const [lastRetrainedText, setLastRetrainedText] = useState("Sunday 00:00 IST");
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  
  // Real-time sensor readings counter for Digital Twin
  const [liveReadings, setLiveReadings] = useState(48320);
  const [twinSyncTime, setTwinSyncTime] = useState(0);

  // Active Anomaly State Array (Pillar 11)
  const [anomalies, setAnomalies] = useState([
    {
      id: '1',
      zone: 'Operation Theatre',
      type: 'Consumption Spike',
      detected: '12 minutes ago',
      detail: 'Power draw 34% above baseline for zone. Z-score: 3.2. Isolation Forest confidence: 91%',
      current: 220.8,
      baseline: 164.8,
      active: true,
      bg: COLORS.redLight,
      border: '#ffa39e',
      color: COLORS.red,
      sparklineData: [165, 168, 164, 166, 220, 220.8]
    },
    {
      id: '2',
      zone: 'Generator G-01',
      type: 'RPM Variance',
      detected: '2 hours ago',
      detail: 'RPM fluctuating ±42 rpm. Indicates early bearing degradation. Z-score: 2.8',
      current: 1542,
      baseline: 1500,
      active: true,
      bg: COLORS.amberLight,
      border: '#ffe58f',
      color: COLORS.amber,
      sparklineData: [1500, 1502, 1498, 1485, 1542, 1458]
    },
    {
      id: '3',
      zone: 'Ward B',
      type: 'Temperature Drift',
      resolved: '45 minutes ago',
      detail: 'Temperature spike of 2.4°C detected and auto-corrected by HVAC system',
      active: false,
      bg: '#f3f4f6',
      border: '#d9d9d9',
      color: '#595959',
      sparklineData: [22.0, 22.1, 24.5, 23.8, 22.4, 22.0]
    }
  ]);

  // Active HVAC recommendations applying triggers
  const [appliedHvac, setAppliedHvac] = useState<string[]>([]);
  
  // Dynamic Optimization suggestions applying triggers
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  // Utility Demand Response configurations
  const [drAutoResponse, setDrAutoResponse] = useState(true);
  const [drThreshold, setDrThreshold] = useState("680");

  // ── 2. BACKGROUND TELEMETRY LOOP ───────────────────────────────────────────
  useEffect(() => {
    // 1. Clock NOW reference updater (every minute)
    const clockInterval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);

    // 2. Twin sensor packets streaming increments (every second)
    const twinInterval = setInterval(() => {
      setLiveReadings(prev => prev + Math.floor(Math.random() * 20) + 12);
      setTwinSyncTime(prev => (prev + 1) % 4); // oscillate synced time between 0s and 3s
    }, 1000);

    // 3. Background anomaly generator (every 30 seconds, 15% chance to trigger anomaly)
    const anomalyInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        const zonesList = ['Pharmacy Cooling Unit', 'Emergency Substation', 'Ward A Ventilation'];
        const randomZone = zonesList[Math.floor(Math.random() * zonesList.length)];
        const newAnomaly = {
          id: Date.now().toString(),
          zone: randomZone,
          type: 'Supply Anomaly',
          detected: 'Just now',
          detail: 'Transient load deviation detected on phase feed B. Z-score: 3.4. Isolation Forest flagging alert.',
          current: 124.5,
          baseline: 92.1,
          active: true,
          bg: COLORS.amberLight,
          border: '#ffe58f',
          color: COLORS.amber,
          sparklineData: [92, 94, 91, 93, 119, 124.5]
        };

        setAnomalies(prev => [newAnomaly, ...prev]);
        toast.error(`⚠️ AI Engine: Anomaly detected in ${randomZone}!`, {
          duration: 5000,
          icon: '🔍'
        });
      }
    }, 30000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(twinInterval);
      clearInterval(anomalyInterval);
    };
  }, []);

  // Update Page Tab Title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "AI Insights — Clinergy";
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // ── 3. STATIC & REACTIVE DATA MODELS ───────────────────────────────────────

  // Dynamic anomaly count derived reactively
  const activeAnomalyCount = useMemo(() => {
    return anomalies.filter(a => a.active).length;
  }, [anomalies]);

  // Composed ARIMA + LSTM Mock Forecast Data (Pillar 5)
  // Splits into actual (up to currentHour) and predicted (after currentHour)
  const composedForecastData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hrStr = `${i.toString().padStart(2, '0')}:00`;
      
      // Calculate realistic baseline kW curve
      let baseLoad = 520;
      if (i >= 8 && i <= 18) {
        baseLoad += Math.sin((i - 8) * Math.PI / 10) * 180; // Peak loading in daytime
      }
      if (i >= 13 && i <= 15) {
        baseLoad += 30; // Peak demand hours spike
      }
      baseLoad += Math.sin(i * Math.PI / 12) * 20; // Natural day cycle

      const actualLoad = i <= currentHour ? Math.round(baseLoad + (Math.sin(i) * 10)) : null;
      const predictedLoad = i >= currentHour ? Math.round(baseLoad) : null;
      
      // Confidence intervals around predictions
      const confidenceRange = i >= currentHour ? [Math.round(baseLoad - 35), Math.round(baseLoad + 35)] : null;

      return {
        hour: hrStr,
        actual: actualLoad,
        predicted: predictedLoad,
        range: confidenceRange,
        lower: confidenceRange ? confidenceRange[0] : null,
        upper: confidenceRange ? confidenceRange[1] : null
      };
    });
    return hours;
  }, [currentHour]);

  // Anomaly severity trend over last 7 days (Bar per day, colored by severity)
  const anomalyTrendData = [
    { day: 'Mon', Critical: 1, Warning: 2, Resolved: 5 },
    { day: 'Tue', Critical: 0, Warning: 1, Resolved: 8 },
    { day: 'Wed', Critical: 2, Warning: 1, Resolved: 4 },
    { day: 'Thu', Critical: 1, Warning: 3, Resolved: 6 },
    { day: 'Fri', Critical: 0, Warning: 2, Resolved: 7 },
    { day: 'Sat', Critical: 3, Warning: 0, Resolved: 3 },
    { day: 'Sun', Critical: 2, Warning: 1, Resolved: 5 }
  ];

  // Occupancy vs HVAC correlation chart data
  const correlationData = [
    { name: 'ICU Wing', occupancy: 42, hvacPower: 88.5 },
    { name: 'OT Block', occupancy: 18, hvacPower: 120.4 },
    { name: 'Emergency', occupancy: 35, hvacPower: 65.2 },
    { name: 'Ward A', occupancy: 28, hvacPower: 45.8 },
    { name: 'Ward B', occupancy: 14, hvacPower: 38.2 },
    { name: 'Pharmacy', occupancy: 6, hvacPower: 22.1 }
  ];

  // 12-Week model accuracy retraining loop progress chart data (Pillar 20)
  const accuracyTrendData = [
    { week: 'Wk 1', ARIMA: 87.2, LSTM: 89.4 },
    { week: 'Wk 2', ARIMA: 87.8, LSTM: 90.1 },
    { week: 'Wk 3', ARIMA: 88.5, LSTM: 90.5 },
    { week: 'Wk 4', ARIMA: 88.9, LSTM: 91.2 },
    { week: 'Wk 5', ARIMA: 89.2, LSTM: 91.8 },
    { week: 'Wk 6', ARIMA: 89.5, LSTM: 92.2 },
    { week: 'Wk 7', ARIMA: 90.1, LSTM: 92.6 },
    { week: 'Wk 8', ARIMA: 90.4, LSTM: 93.1 },
    { week: 'Wk 9', ARIMA: 90.7, LSTM: 93.5 },
    { week: 'Wk 10', ARIMA: 90.9, LSTM: 93.8 },
    { week: 'Wk 11', ARIMA: 91.1, LSTM: 94.0 },
    { week: 'Wk 12', ARIMA: 91.2, LSTM: 94.2 }
  ];

  // ── 4. REACTIVE ACTIONS & TOASTS ──────────────────────────────────────────

  // Model Retraining handler
  const handleRetrainModels = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      setLastRetrainedText(`Just now (${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })})`);
      toast.success("✅ Model retraining scheduled for Sunday 00:00 IST", {
        duration: 4000,
        icon: '🧠'
      });
    }, 3000);
  };

  // HVAC recommendation applier
  const handleApplyHvac = (id: string, saving: number) => {
    if (appliedHvac.includes(id)) return;
    setAppliedHvac(prev => [...prev, id]);
    toast.success(`Applied HVAC setpoint optimization! Saving estimated ₹${saving}/day.`, {
      icon: '❄️'
    });
  };

  // Optimization Suggestion applier
  const handleApplySuggestion = (id: string, text: string, saving: number) => {
    if (appliedSuggestions.includes(id)) return;
    setAppliedSuggestions(prev => [...prev, id]);
    toast.success(`Action applied successfully: ${text}`, {
      icon: '💡'
    });
  };

  // Anomaly Action Toggles
  const handleInvestigateAnomaly = (zone: string) => {
    toast.success(`Work order dispatched. Critical energy diagnostics active on ${zone} sub-circuits.`, {
      icon: '🔍'
    });
  };

  const handleDismissAnomaly = (id: string, zone: string) => {
    setAnomalies(prev => prev.filter(a => a.id !== id));
    toast.success(`Anomaly in ${zone} dismissed successfully.`);
  };

  // Dynamic savings calculations based on applied state
  const hvacBaseSavings = 1240;
  const currentHvacSavings = useMemo(() => {
    let savings = hvacBaseSavings;
    if (appliedHvac.includes('wardA')) savings -= 420;
    if (appliedHvac.includes('cafeteria')) savings -= 820;
    return Math.max(0, savings);
  }, [appliedHvac]);

  const suggestionsTotalSavings = useMemo(() => {
    let base = 7320;
    if (appliedSuggestions.includes('mri')) base -= 4200;
    if (appliedSuggestions.includes('precool')) base -= 1840;
    if (appliedSuggestions.includes('wardB')) base -= 680;
    if (appliedSuggestions.includes('pharmacy')) base -= 420;
    if (appliedSuggestions.includes('led')) base -= 180;
    return base;
  }, [appliedSuggestions]);

  // ── 5. DR CURTAILMENT INPUT ────────────────────────────────────────────────
  const handleDrThresholdUpdate = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = parseFloat(drThreshold);
      if (isNaN(val) || val <= 0) {
        toast.error("Please enter a valid electrical load threshold in kW.");
      } else {
        toast.success(`Demand Response load curtailment threshold saved: ${val} kW!`, {
          icon: '📡'
        });
      }
    }
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
      
      {/* ── CSS KEYFRAMES INJECTION FOR PULSING ANOMALY CARDS ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pulse-amber {
          0% { box-shadow: 0 0 0 0 rgba(244, 162, 97, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(244, 162, 97, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 162, 97, 0); }
        }
        .pulse-card-red {
          animation: pulse-red 2s infinite !important;
        }
        .pulse-card-amber {
          animation: pulse-amber 2s infinite !important;
        }
        .shimmer-bg {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: loading-shimmer 1.5s infinite;
        }
        @keyframes loading-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

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
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            backgroundColor: COLORS.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: COLORS.shadow
          }}>
            <Brain style={{ width: '24px', height: '24px', color: COLORS.primary }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
              AI Insights
            </h1>
          </div>
        </div>

        {/* Retrain Models Button block */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ML Retraining Engine
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>
              Last retrained: {lastRetrainedText}
            </span>
          </div>

          <button 
            onClick={handleRetrainModels}
            disabled={isRetraining}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: COLORS.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.25)',
              transition: 'all 0.2s',
              opacity: isRetraining ? 0.7 : 1
            }}
          >
            <RotateCw size={14} style={{ animation: isRetraining ? 'spin 1s linear infinite' : 'none' }} />
            {isRetraining ? 'Compiling Datasets...' : 'Retrain Models'}
          </button>
        </div>

        {/* 4 Header Stat Pills */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          borderTop: `1px solid ${COLORS.borderCol}`,
          paddingTop: '16px',
          marginTop: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>Model Accuracy: <strong style={{ color: COLORS.primary }}>94.2%</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2d9e6b', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>20 AI Pillars Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff6b8a', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>
              {activeAnomalyCount} Anomalies Detected
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38b6ff', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>Next Retrain: Sunday</span>
          </div>
        </div>
      </div>

      {/* SECTION 1 — AI DEMAND FORECAST CHART */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '20px',
        border: COLORS.border,
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            24-Hour Demand Forecast — Pillar 5
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
            ARIMA + LSTM models trained on 24 months of historical consumption
          </p>
        </div>

        {/* Composed Chart */}
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={composedForecastData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: COLORS.textMuted, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} domain={[400, 800]} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}
                formatter={(value: any, name: string) => {
                  if (name === 'lower' || name === 'upper') return null; // hide in tooltip
                  return [`${value} kW`, name === 'actual' ? 'Actual Load' : 'AI Predicted'];
                }}
              />
              
              {/* Highlight Utility Peak Zone (13:00 - 15:00) */}
              <ReferenceArea 
                x1="13:00" 
                x2="15:00" 
                fill="#f4a261" 
                fillOpacity={0.12} 
                label={{ value: '⚠ Predicted Peak Zone', fill: '#d46b08', fontSize: '9px', fontWeight: '800', position: 'top' }} 
              />
              
              {/* Shaded Confidence Interval */}
              <Area 
                type="monotone" 
                dataKey="range" 
                stroke="none" 
                fill={COLORS.primary} 
                fillOpacity={0.12} 
                name="Confidence Band" 
              />

              {/* Vertical Reference Line at current hour */}
              <ReferenceLine 
                x={`${currentHour.toString().padStart(2, '0')}:00`} 
                stroke={COLORS.amber} 
                strokeDasharray="3 3" 
                strokeWidth={2}
                label={{ value: 'NOW', fill: COLORS.amber, fontSize: '10px', fontWeight: '800', position: 'top' }} 
              />

              {/* Actual Load solid teal line */}
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke={COLORS.teal} 
                strokeWidth={3} 
                dot={{ r: 2, fill: COLORS.teal }} 
                activeDot={{ r: 6 }} 
                name="Actual Load" 
              />

              {/* Predicted Load dashed purple line */}
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke={COLORS.primary} 
                strokeWidth={3} 
                strokeDasharray="5 5" 
                dot={{ r: 2, fill: COLORS.primary }} 
                activeDot={{ r: 6 }} 
                name="Predicted Load" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3 Forecast pills below chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: COLORS.border, paddingTop: '16px' }}>
          <div style={{ backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '12px', border: COLORS.border, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📈</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: COLORS.textPrimary }}>Peak: <strong>720 kW at 14:30</strong></span>
          </div>
          <div style={{ backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '12px', border: COLORS.border, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📉</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: COLORS.textPrimary }}>Off-Peak: <strong>498 kW at 03:00</strong></span>
          </div>
          <div style={{ backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '12px', border: COLORS.border, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>💰</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: COLORS.textPrimary }}>Estimated Cost Today: <strong style={{ color: COLORS.primary }}>₹4,820</strong></span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — ANOMALY DETECTION PANEL */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '20px',
        border: COLORS.border,
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
            Anomaly Detection — Pillar 11
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
            Isolation Forest & Z-score models flag consumption anomalies in real time
          </p>
        </div>

        {/* 3 Anomaly cards side by side */}
        {anomalies.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
            backgroundColor: COLORS.greenLight,
            border: `1px dashed ${COLORS.green}`,
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '32px' }}>✅</span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.green, margin: '10px 0 2px 0' }}>System Cleared</h3>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0 }}>No critical electrical load anomalies are currently active.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {anomalies.map((anom) => {
              const isOT = anom.zone.includes('Theatre');
              const isGen = anom.zone.includes('Generator');
              const pulseClass = anom.active ? (isOT ? 'pulse-card-red' : isGen ? 'pulse-card-amber' : '') : '';
              
              return (
                <div 
                  key={anom.id}
                  className={pulseClass}
                  style={{
                    backgroundColor: anom.bg,
                    border: `1.5px solid ${anom.active ? anom.color : '#e5e7eb'}`,
                    borderRadius: '16px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        backgroundColor: anom.active ? anom.color : '#cbd5e1',
                        color: '#ffffff',
                        display: 'inline-block',
                        marginBottom: '6px'
                      }}>
                        {anom.type}
                      </span>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                        {anom.zone}
                      </h3>
                      <span style={{ fontSize: '11px', color: COLORS.textMuted, display: 'block', marginTop: '2px' }}>
                        {anom.active ? `⚠️ Detected: ${anom.detected}` : `✅ Resolved: ${anom.resolved}`}
                      </span>
                    </div>

                    {!anom.active && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        backgroundColor: COLORS.greenLight,
                        color: COLORS.green,
                        borderRadius: '6px',
                        padding: '3px 8px',
                        border: `1px solid ${COLORS.green}`
                      }}>
                        Auto-Resolved
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.4', margin: 0 }}>
                    {anom.detail}
                  </p>

                  {/* Telemetry Current vs Baseline */}
                  {anom.current && (
                    <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: COLORS.textMuted }}>Current:</span> <strong style={{ color: anom.color }}>{anom.current.toLocaleString()} {isGen ? 'RPM' : 'kW'}</strong>
                      </div>
                      <div>
                        <span style={{ color: COLORS.textMuted }}>Baseline:</span> <strong>{anom.baseline.toLocaleString()} {isGen ? 'RPM' : 'kW'}</strong>
                      </div>
                    </div>
                  )}

                  {/* Mini Sparkline Chart */}
                  <div style={{ height: '40px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={anom.sparklineData.map((v, i) => ({ val: v, idx: i }))}>
                        <Line 
                          type="monotone" 
                          dataKey="val" 
                          stroke={anom.color} 
                          strokeWidth={2} 
                          dot={false} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
                    {anom.active ? (
                      <>
                        <button 
                          onClick={() => isOT ? handleInvestigateAnomaly(anom.zone) : handleRetrainModels()}
                          style={{
                            flex: 2,
                            padding: '8px 12px',
                            backgroundColor: anom.color,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {isOT ? 'Investigate →' : 'Schedule Maintenance →'}
                        </button>
                        <button 
                          onClick={() => handleDismissAnomaly(anom.id, anom.zone)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            backgroundColor: '#e5e7eb',
                            color: '#4b5563',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <button 
                        disabled
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: COLORS.greenLight,
                          color: COLORS.green,
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textAlign: 'center'
                        }}
                      >
                        ✓ Diagnostics Complete & Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 7-Day Anomaly Frequency Trend Chart */}
        <div style={{ borderTop: COLORS.border, paddingTop: '20px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            📅 Historical Anomaly Frequency (Last 7 Days)
          </h4>
          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={anomalyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="Resolved" stackId="a" fill={COLORS.green} radius={[0, 0, 0, 0]} barSize={28} />
                <Bar dataKey="Warning" stackId="a" fill={COLORS.amber} radius={[0, 0, 0, 0]} barSize={28} />
                <Bar dataKey="Critical" stackId="a" fill={COLORS.red} radius={[4, 4, 0, 0]} barSize={28} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3 — HVAC OPTIMISATION */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Left — HVAC Recommendations (55% equivalent layout width) */}
        <div style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '20px',
          border: COLORS.border,
          padding: '24px',
          boxShadow: COLORS.shadow,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: '1 1 55%'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              HVAC Setpoint Optimisation — Pillar 12
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '0 0 16px 0' }}>
              BACnet/IP integration auto-adjusts HVAC setpoints based on occupancy and weather
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Recommendation 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '12px 16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '4px', padding: '2px 6px', display: 'inline-block', marginBottom: '4px' }}>ICU Wing</span>
                <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Maintain 21°C — 12 occupants detected — optimal setting</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Saving: 0 kW</span>
            </div>

            {/* Recommendation 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '12px 16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.primary, backgroundColor: COLORS.primaryLight, borderRadius: '4px', padding: '2px 6px', display: 'inline-block', marginBottom: '4px' }}>Ward A</span>
                <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Reduce setpoint from 22°C to 23°C — only 8 occupants at 14:00</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.green }}>Saving: ~4.2 kW</span>
                {appliedHvac.includes('wardA') ? (
                  <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green }}>✅ Applied</span>
                ) : (
                  <button 
                    onClick={() => handleApplyHvac('wardA', 420)}
                    style={{ padding: '4px 12px', backgroundColor: COLORS.teal, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>

            {/* Recommendation 3 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '12px 16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.primary, backgroundColor: COLORS.primaryLight, borderRadius: '4px', padding: '2px 6px', display: 'inline-block', marginBottom: '4px' }}>Cafeteria</span>
                <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Lower HVAC by 40% — zone empty until 12:00</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.green }}>Saving: ~8.8 kW</span>
                {appliedHvac.includes('cafeteria') ? (
                  <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green }}>✅ Applied</span>
                ) : (
                  <button 
                    onClick={() => handleApplyHvac('cafeteria', 820)}
                    style={{ padding: '4px 12px', backgroundColor: COLORS.teal, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>

            {/* Recommendation 4 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '12px 16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.red, backgroundColor: COLORS.redLight, borderRadius: '4px', padding: '2px 6px', display: 'inline-block', marginBottom: '4px' }}>OT Block</span>
                <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Negative pressure mode active — infectious patient scheduled 14:00</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.teal, backgroundColor: COLORS.tealLight, borderRadius: '6px', padding: '3px 8px' }}>Auto-applied</span>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: COLORS.border, fontSize: '13px' }}>
            Total potential HVAC saving today: <strong style={{ color: COLORS.primary }}>~₹{currentHvacSavings.toLocaleString()} if recommendations applied</strong>
          </div>
        </div>

        {/* Right — Occupancy vs HVAC Chart (45% equivalent layout width) */}
        <div style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: '20px',
          border: COLORS.border,
          padding: '24px',
          boxShadow: COLORS.shadow,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: '1 1 45%'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: COLORS.textPrimary, margin: '0 0 4px 0' }}>
              Occupancy vs HVAC Loading
            </h3>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '0 0 16px 0' }}>
              Correlates real-time patient/staff load with active air handling draw
            </p>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={correlationData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: COLORS.textMuted, fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="occupancy" fill={COLORS.teal} radius={[4, 4, 0, 0]} barSize={20} name="Occupants (Count)" />
                <Line type="monotone" dataKey="hvacPower" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3 }} name="HVAC Power (kW)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4 — ENERGY OPTIMIZATION SUGGESTIONS */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '20px',
        border: COLORS.border,
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            AI Optimization Suggestions
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
            Smart recommendations to reduce waste and lower operational utility costs
          </p>
        </div>

        {/* Suggestion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Suggestion 1 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '14px 18px', borderRadius: '14px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: COLORS.red, backgroundColor: COLORS.redLight, borderRadius: '6px', padding: '3px 8px', textTransform: 'uppercase' }}>High</span>
              <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Shift MRI scans from 14:00–16:00 to 10:00–12:00 to avoid peak tariff window</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '12px', color: COLORS.teal, fontWeight: '700' }}>Save ₹4,200/day</span>
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>91% Conf</span>
              {appliedSuggestions.includes('mri') ? (
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green }}>✅ Active</span>
              ) : (
                <button 
                  onClick={() => handleApplySuggestion('mri', 'Shift MRI scans to off-peak tariff window', 4200)}
                  style={{ padding: '6px 14px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Suggestion 2 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '14px 18px', borderRadius: '14px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: COLORS.red, backgroundColor: COLORS.redLight, borderRadius: '6px', padding: '3px 8px', textTransform: 'uppercase' }}>High</span>
              <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Pre-cool OT Block at 13:00 (off-peak) before 14:00 surgery schedule</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '12px', color: COLORS.teal, fontWeight: '700' }}>Save ₹1,840/day</span>
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>88% Conf</span>
              {appliedSuggestions.includes('precool') ? (
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green }}>✅ Active</span>
              ) : (
                <button 
                  onClick={() => handleApplySuggestion('precool', 'Pre-cool OT Block during off-peak interval', 1840)}
                  style={{ padding: '6px 14px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Suggestion 3 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '14px 18px', borderRadius: '14px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: COLORS.amber, backgroundColor: COLORS.amberLight, borderRadius: '6px', padding: '3px 8px', textTransform: 'uppercase' }}>Medium</span>
              <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Reduce Ward B HVAC by 30% tonight — predicted 40% occupancy</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '12px', color: COLORS.teal, fontWeight: '700' }}>Save ₹680/day</span>
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>84% Conf</span>
              {appliedSuggestions.includes('wardb') ? (
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green }}>✅ Active</span>
              ) : (
                <button 
                  onClick={() => handleApplySuggestion('wardb', 'Reduce Ward B HVAC tonight based on low occupancy', 680)}
                  style={{ padding: '6px 14px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Suggestion 4 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '14px 18px', borderRadius: '14px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: COLORS.amber, backgroundColor: COLORS.amberLight, borderRadius: '6px', padding: '3px 8px', textTransform: 'uppercase' }}>Medium</span>
              <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Switch Pharmacy refrigeration to off-peak charging cycle</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '12px', color: COLORS.teal, fontWeight: '700' }}>Save ₹420/day</span>
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>79% Conf</span>
              {appliedSuggestions.includes('pharmacy') ? (
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green }}>✅ Active</span>
              ) : (
                <button 
                  onClick={() => handleApplySuggestion('pharmacy', 'Switch Pharmacy cooling systems to off-peak charging', 420)}
                  style={{ padding: '6px 14px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Suggestion 5 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf8ff', border: COLORS.border, padding: '14px 18px', borderRadius: '14px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '6px', padding: '3px 8px', textTransform: 'uppercase' }}>Low</span>
              <p style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary, margin: 0 }}>Replace 3 fluorescent fixtures in Admin block with LED</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '12px', color: COLORS.teal, fontWeight: '700' }}>Save ₹180/day</span>
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>95% Conf</span>
              {appliedSuggestions.includes('led') ? (
                <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green }}>✅ Active</span>
              ) : (
                <button 
                  onClick={() => handleApplySuggestion('led', 'Replace Admin fluorescent fixtures with LEDs', 180)}
                  style={{ padding: '6px 14px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Total potential savings summary */}
        <div style={{
          backgroundColor: COLORS.primaryLight,
          borderRadius: '12px',
          padding: '12px 18px',
          borderLeft: `4px solid ${COLORS.primary}`,
          fontSize: '13px',
          fontWeight: '700',
          color: COLORS.textPrimary
        }}>
          💰 Total potential daily saving: <strong style={{ color: COLORS.primary }}>₹{suggestionsTotalSavings.toLocaleString()}</strong> — approx <strong>₹{Math.round(suggestionsTotalSavings * 365).toLocaleString()}/year</strong> carbon-saving optimization profile!
        </div>
      </div>

      {/* SECTION 5 — DIGITAL TWIN STATUS */}
      <div style={{
        background: 'linear-gradient(135deg, #f0ebff 0%, #e8f0fe 100%)',
        borderRadius: '20px',
        border: '1px solid #dcd1ff',
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.primary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Digital Twin — Pillar 14
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: '500', margin: '4px 0 0 0' }}>
            Zone-level energy models updated continuously from live sensor telemetry data streams
          </p>
        </div>

        {/* 6 cards in 3x2 grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {[
            { zone: 'ICU Wing', conf: 96, variance: '±0.2 kW' },
            { zone: 'OT Block', conf: 98, variance: '±0.1 kW' },
            { zone: 'Emergency', conf: 94, variance: '±0.4 kW' },
            { zone: 'Ward A', conf: 91, variance: '±0.3 kW' },
            { zone: 'Ward B', conf: 92, variance: '±0.3 kW' },
            { zone: 'Pharmacy', conf: 95, variance: '±0.2 kW' }
          ].map((twin, index) => (
            <div key={index} style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>{twin.zone}</h3>
                <span style={{ fontSize: '10px', color: COLORS.green, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.green, display: 'inline-block' }} />
                  Live — synced {twinSyncTime}s ago
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: COLORS.textMuted }}>
                <span>Data points today:</span>
                <strong style={{ color: COLORS.textPrimary }}>{liveReadings.toLocaleString()} readings</strong>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px' }}>
                  <span>Model Confidence:</span>
                  <strong style={{ color: COLORS.primary }}>{twin.conf}%</strong>
                </div>
                <div style={{ height: '6px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${twin.conf}%`, height: '100%', backgroundColor: COLORS.primary }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '6px', color: COLORS.textMuted }}>
                <span>Physical vs Twin Variance:</span>
                <strong style={{ color: COLORS.teal }}>{twin.variance}</strong>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(139, 92, 246, 0.15)', paddingTop: '12px', fontSize: '12px', color: COLORS.textPrimary, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong style={{ color: COLORS.primary }}>Continuous Improvement Loop — Pillar 20</strong>: Models retrain every Sunday using new operational data. Next retrain: Sunday 00:00 IST
        </div>
      </div>

      {/* SECTION 6 — DEMAND RESPONSE */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '20px',
        border: COLORS.border,
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Demand Response — Pillar 13
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
            Automated load curtailment signals integrate with utility DR programmes
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Left side — DR Status Panel */}
          <div style={{ borderRight: `1px solid ${COLORS.borderCol}`, paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utility Program</span>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: '2px 0 4px 0' }}>
                BESCOM Demand Response Scheme
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: COLORS.greenLight,
                color: COLORS.green,
                border: `1.5px solid ${COLORS.green}`
              }}>
                Standby — No curtailment active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Next DR Window:</span>
                <strong>Today 18:00–20:00 (possible)</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                <span style={{ color: COLORS.textMuted }}>Auto-Response dispatcher:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="autoResponseToggle"
                    checked={drAutoResponse}
                    onChange={e => setDrAutoResponse(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="autoResponseToggle" style={{ fontWeight: '700', cursor: 'pointer' }}>
                    {drAutoResponse ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: COLORS.textMuted }}>Curtailment threshold (kW):</span>
                <input 
                  type="text" 
                  value={drThreshold}
                  onChange={e => setDrThreshold(e.target.value)}
                  onKeyDown={handleDrThresholdUpdate}
                  style={{
                    width: '80px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: COLORS.textPrimary,
                    outline: 'none',
                    fontWeight: '700',
                    textAlign: 'right'
                  }}
                />
              </div>
              <span style={{ fontSize: '9px', color: COLORS.textMuted, textAlign: 'right' }}>Press Enter to save changes</span>
            </div>
          </div>

          {/* Right side — Load Curtailment Priority list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Load Curtailment Priority list (DR-Triggered)
            </span>

            {[
              { zone: 'Cafeteria', details: 'curtail 100% first', pill: '⚫', color: '#1a1a27', bg: '#f1f1f4' },
              { zone: 'Admin Block', details: 'curtail 80%', pill: '⚫', color: '#1a1a27', bg: '#f1f1f4' },
              { zone: 'Ward A/B', details: 'reduce by 30%', pill: '🟢', color: COLORS.green, bg: COLORS.greenLight },
              { zone: 'Pharmacy', details: 'reduce by 10%', pill: '🟡', color: COLORS.amber, bg: COLORS.amberLight },
              { zone: 'ICU/OT/Emergency', details: 'NEVER curtailed (Critical protected)', pill: '🔴', color: COLORS.red, bg: COLORS.redLight }
            ].map((pri, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: pri.bg, border: `1px solid ${pri.color}22`, padding: '10px 14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: pri.color, fontSize: '12px' }}>{pri.pill}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.textPrimary }}>{pri.zone}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: pri.color }}>{pri.details}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 7 — MODEL PERFORMANCE METRICS */}
      <div style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: '20px',
        border: COLORS.border,
        padding: '24px',
        boxShadow: COLORS.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            📊 AI Model Performance & Audits
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
            ML audit reports and error rates checked against continuous training datasets
          </p>
        </div>

        {/* 3 model cards side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {/* ARIMA */}
          <div style={{ backgroundColor: '#ffffff', border: COLORS.border, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                ARIMA Forecasting
              </h3>
              <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '6px', padding: '2px 8px' }}>
                Active
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Model Accuracy:</span>
                <strong>91.2%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Mean Absolute Error:</span>
                <strong>18.4 kW</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Training data size:</span>
                <strong>24 months</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Last Retrained:</span>
                <strong>last Sunday</strong>
              </div>
            </div>
          </div>

          {/* LSTM */}
          <div style={{ backgroundColor: '#ffffff', border: COLORS.border, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                LSTM Neural Network
              </h3>
              <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '6px', padding: '2px 8px' }}>
                Active
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Model Accuracy:</span>
                <strong>94.2%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Mean Absolute Error:</span>
                <strong>12.1 kW</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Training epochs:</span>
                <strong>200 epochs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Layer topology:</span>
                <strong>2 LSTM + Dense</strong>
              </div>
            </div>
          </div>

          {/* Isolation Forest */}
          <div style={{ backgroundColor: '#ffffff', border: COLORS.border, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                Isolation Forest
              </h3>
              <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '6px', padding: '2px 8px' }}>
                Active
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Detection Precision:</span>
                <strong>89.4%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>False Positive Rate:</span>
                <strong>2.1%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Anomalies Today:</span>
                <strong>{activeAnomalyCount} Active</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted }}>Contamination index:</span>
                <strong>0.05</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Model Accuracy Line Chart */}
        <div style={{ borderTop: COLORS.border, paddingTop: '20px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            12-Week Model Accuracy Trend (Pillar 20 loop)
          </h4>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} tickLine={false} axisLine={false} domain={[85, 96]} />
                <Tooltip />
                <Line type="monotone" dataKey="LSTM" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 3 }} name="LSTM Neural Net (%)" />
                <Line type="monotone" dataKey="ARIMA" stroke={COLORS.teal} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="ARIMA Forecast (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
