import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, IndianRupee, AlertTriangle, Clock, Activity, ArrowUpRight, ArrowDownRight, ChevronRight, BarChart2, Cloud, Info, XCircle, Bell } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceDot } from "recharts";
import { StatSkeleton, ZoneSkeleton } from "@/components/SkeletonCard";
import type { ZoneReading } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { ZoneDetailDrawer } from "@/components/ZoneDetailDrawer";
import { useWeather, getHVACImpact } from "@/services/weatherService";

// ── Palette ──────────────────────────────────────────────────────────────────
// ── Palette & Zone Styles ────────────────────────────────────────────────────
const C = {
  teal: "#2d9e6b",
  tealLight: "#c8e6d8",
  tealBg: "#f0f7f4",
  tealBorder: "#e8f3ee",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const ZONE_STYLES: Record<string, {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  barColor: string;
  badgeBg: string;
  badgeText: string;
  headerAccent: string;
}> = {
  'ICU': {
    bg: '#fff5f7',
    border: '1px solid #f4a0b0',
    iconBg: '#fde8ed',
    iconColor: '#b5304f',
    valueColor: '#b5304f',
    barColor: '#f4a0b0',
    badgeBg: '#fde8ed',
    badgeText: '#b5304f',
    headerAccent: '3px solid #f4a0b0'
  },
  'Operation Theatre': {
    bg: '#f7f5ff',
    border: '1px solid #b8a9f5',
    iconBg: '#ede8ff',
    iconColor: '#5b3fc2',
    valueColor: '#5b3fc2',
    barColor: '#b8a9f5',
    badgeBg: '#ede8ff',
    badgeText: '#5b3fc2',
    headerAccent: '3px solid #b8a9f5'
  },
  'Emergency': {
    bg: '#fff8f3',
    border: '1px solid #f5b98a',
    iconBg: '#feecd8',
    iconColor: '#b35a10',
    valueColor: '#b35a10',
    barColor: '#f5b98a',
    badgeBg: '#feecd8',
    badgeText: '#b35a10',
    headerAccent: '3px solid #f5b98a'
  },
  'Ward A': {
    bg: '#f3f8ff',
    border: '1px solid #93c8f5',
    iconBg: '#daeeff',
    iconColor: '#1a6fa8',
    valueColor: '#1a6fa8',
    barColor: '#93c8f5',
    badgeBg: '#daeeff',
    badgeText: '#1a6fa8',
    headerAccent: '3px solid #93c8f5'
  },
  'Ward B': {
    bg: '#f3fdf8',
    border: '1px solid #85dbb8',
    iconBg: '#d4f5e6',
    iconColor: '#0d7a52',
    valueColor: '#0d7a52',
    barColor: '#85dbb8',
    badgeBg: '#d4f5e6',
    badgeText: '#0d7a52',
    headerAccent: '3px solid #85dbb8'
  },
  'Pharmacy': {
    bg: '#fffbf0',
    border: '1px solid #f5d080',
    iconBg: '#fef2c8',
    iconColor: '#926b00',
    valueColor: '#926b00',
    barColor: '#f5d080',
    badgeBg: '#fef2c8',
    badgeText: '#926b00',
    headerAccent: '3px solid #f5d080'
  }
};

function KPIStatTile({ id, title, value, trend, trendLabel, status, isAlertTile = false, alertCount = 0 }: {
  id: string; title: string; value: string | number; trend: number; trendLabel: string; status: "warning" | "semi-critical" | "normal"; isAlertTile?: boolean; alertCount?: number;
}) {
  const isUp = trend > 0;
  const isDown = trend < 0;
  const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : null;

  const trendColor = isAlertTile
    ? (alertCount > 0 ? "#c9184a" : "#2d9e6b")
    : (isUp ? "#c9184a" : isDown ? "#2d9e6b" : "#5a7a6e");

  const kpiStyles: Record<string, { bg: string; border: string; accent: string; icon: string; text: string }> = {
    power:  { bg: "#f0fdf8", border: "1px solid #b3ead8", accent: "#2d9e6b", icon: "#2d9e6b", text: "#1a5c45" },
    energy: { bg: "#f3f0ff", border: "1px solid #d4c5ff", accent: "#8b5cf6", icon: "#8b5cf6", text: "#6d28d9" },
    cost:   { bg: "#fff8ed", border: "1px solid #ffe5b4", accent: "#f59e0b", icon: "#f59e0b", text: "#b45309" },
    alerts: { bg: "#fff0f3", border: "1px solid #ffd6e0", accent: "#ff6b8a", icon: "#ff6b8a", text: "#c9184a" },
    co2:    { bg: "#f0f8ff", border: "1px solid #bde0ff", accent: "#38b6ff", icon: "#38b6ff", text: "#1d6fa4" }
  };
  const styleConf = kpiStyles[id] || { bg: "#ffffff", border: "1px solid #e8f3ee", accent: "#2d9e6b", icon: "#2d9e6b", text: "#1a5c45" };

  const dotColor = status === "warning" ? "#c9184a" : status === "semi-critical" ? "#f59e0b" : "#2d9e6b";
  const dotLabel = status === "warning" ? "Warning" : status === "semi-critical" ? "Watch" : "Normal";

  const renderIcon = () => {
    switch (id) {
      case "power":   return <Zap style={{ width: 22, height: 22, color: styleConf.icon }} />;
      case "energy":  return <Activity style={{ width: 22, height: 22, color: styleConf.icon }} />;
      case "cost":    return <IndianRupee style={{ width: 22, height: 22, color: styleConf.icon }} />;
      case "alerts":  return <Bell style={{ width: 22, height: 22, color: styleConf.icon }} />;
      case "co2":     return <Cloud style={{ width: 22, height: 22, color: styleConf.icon }} />;
      default:        return null;
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      role="button"
      tabIndex={0}
      className="speakable"
      aria-label={`${title}: ${value}`}
      onClick={() => {}}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--page-border)",
        borderTop: `3px solid ${styleConf.accent}`,
        borderRadius: "20px",
        padding: "20px",
        flex: 1,
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 2px 16px rgba(45, 158, 107, 0.06)",
        cursor: "pointer",
        outline: "none"
      }}
    >
      {/* Top row: title + status dot */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9dbfb3" }}>{title}</span>
        {renderIcon()}
      </div>

      {/* Value */}
      <div style={{ fontSize: 32, fontWeight: 800, color: styleConf.text, lineHeight: 1, marginBottom: 10 }}>
        {value}
      </div>

      {/* Bottom: trend + status dot */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e8f3ee", paddingTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {TrendIcon && <TrendIcon style={{ width: 13, height: 13, color: trendColor }} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: trendColor }}>
            {trend === 0 ? "—" : `${trend > 0 ? "+" : ""}${Math.abs(trend).toFixed(1)}%`}
          </span>
          <span style={{ fontSize: 11, color: "#9dbfb3" }}>{trendLabel}</span>
        </div>
        {/* Minimal status indicator */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#5a7a6e" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
          {dotLabel}
        </span>
      </div>
    </motion.div>
  );
}

// ── Zone Card ─────────────────────────────────────────────────────────────────
function HomeZoneCard({ zone, onViewDetails }: { zone: any; onViewDetails: () => void }) {
  const zStyle = ZONE_STYLES[zone.zone_name] || {
    bg: '#ffffff',
    border: '1px solid #ede9fe',
    iconBg: '#f5f3ff',
    iconColor: '#8b5cf6',
    valueColor: '#1a1a2e',
    barColor: '#8b5cf6',
    badgeBg: '#f3f0ff',
    badgeText: '#8b5cf6',
    headerAccent: '3px solid #8b5cf6'
  };

  const powerVal = Number(zone.power_kw) || 0;
  const maxCapacity = 250;
  const pct = Math.min(100, Math.max(0, (powerVal / maxCapacity) * 100));
  const isCritical = zone.status === "Critical" || zone.status === "critical" || zone.alertState === "CRITICAL";
  const isWarning = zone.status === "Warning" || zone.status === "warning" || zone.alertState === "WARNING";

  // Status colors
  const statusDot  = isCritical ? "#c9184a" : isWarning ? "#f59e0b" : "#2d9e6b";
  const statusLabel = isCritical ? "Critical" : isWarning ? "Warning" : "Normal";

  // Category display
  const rawCat = zone.category || 'Standard';
  const catLabel = rawCat.toLowerCase() === 'critical' ? 'Critical Care'
    : rawCat.toLowerCase() === 'essential' ? 'Essential'
    : 'Standard';

  return (
    <motion.div
      layout
      animate={isCritical ? { scale: [1, 1.003, 1] } : {}}
      transition={isCritical ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : {}}
      onClick={onViewDetails}
      role="button"
      tabIndex={0}
      className="speakable"
      aria-label={`${zone.zone_name}: ${powerVal.toFixed(1)} kW, status ${statusLabel}`}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--page-border)",
        borderTop: zStyle.headerAccent,
        borderRadius: "20px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        minHeight: 240,
        boxShadow: "0 2px 16px rgba(45, 158, 107, 0.06)",
        transition: "box-shadow 0.2s",
        cursor: "pointer",
        outline: "none"
      }}
      whileHover={{ boxShadow: "0 4px 16px rgba(45, 158, 107, 0.12)" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Zone name */}
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1a2e24", margin: "0 0 6px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {zone.zone_name}
          </h3>
          {/* Clean two-label row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Status dot + label */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#5a7a6e" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDot, display: "inline-block", flexShrink: 0 }} />
              {statusLabel}
            </span>
            <span style={{ color: "#c8e6d8", fontSize: 10 }}>·</span>
            {/* Category as plain text */}
            <span style={{ fontSize: 11, color: "#9dbfb3", fontWeight: 500 }}>{catLabel}</span>
          </div>
        </div>

        {/* Zap icon */}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: zStyle.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 10 }}>
          <Zap style={{ width: 16, height: 16, color: zStyle.iconColor }} />
        </div>
      </div>

      {/* Power */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9dbfb3", marginBottom: 4 }}>Power Draw</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: zStyle.valueColor, lineHeight: 1 }}>{powerVal.toFixed(1)}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#9dbfb3" }}>kW</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 5 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: zStyle.barColor, borderRadius: 99, transition: "width 1s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "#9dbfb3" }}>Usage</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#5a7a6e" }}>{Math.round(pct)}%</span>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="flex flex-col md:flex-row gap-3 md:gap-0 w-full"
        style={{ borderTop: "1px solid #e8f3ee", paddingTop: 12, alignItems: "center", marginTop: "auto" }}
      >
        <div className="flex items-center justify-center md:justify-start gap-1 w-full md:w-auto text-[#9dbfb3] text-[11px]">
          <Clock style={{ width: 11, height: 11 }} />
          <TimeTicker lastUpdated={zone.recorded_at} />
        </div>
        <button
          onClick={onViewDetails}
          className="w-full md:w-auto justify-center bg-[#f0f7f4] md:bg-transparent px-4 md:px-0 py-3 md:py-0 rounded-xl"
          style={{ fontSize: 12, fontWeight: 700, color: "#2d9e6b", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, minHeight: '48px' }}
        >
          View Details <ChevronRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </motion.div>
  );
}

function TimeTicker({ lastUpdated }: { lastUpdated: string }) {
  const [ticker, setTicker] = useState("Updated just now");
  useEffect(() => {
    const update = () => {
      if (!lastUpdated) return;
      const s = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
      setTicker(s < 5 ? "Updated just now" : `Updated ${s}s ago`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [lastUpdated]);
  return <span>{ticker}</span>;
}

function AlertRow({ alert }: { alert: any }) {
  const navigate = useNavigate();
  const timeAgo = (ts: string) => {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };
  const sev = (alert.severity || "info").toLowerCase();
  const rowBg = sev === "critical" ? "#fff0f3" : sev === "warning" ? "#fff8ed" : "#f0fdf8";
  const borderLeftColor = sev === "critical" ? "#ff6b8a" : sev === "warning" ? "#f59e0b" : "#2d9e6b";
  return (
    <div onClick={() => navigate(`/zones?zone=${encodeURIComponent(alert.zone_name)}`)}
      style={{ 
        display: "flex", 
        gap: 10, 
        padding: "12px 16px", 
        borderRadius: 12, 
        border: "1px solid #e8f3ee", 
        borderLeft: `3px solid ${borderLeftColor}`,
        background: rowBg, 
        cursor: "pointer", 
        alignItems: "flex-start" 
      }}>
      <div style={{ marginTop: 2 }}>
        {sev === "critical" ? <XCircle style={{ width: 16, height: 16, color: "#c9184a" }} /> :
          sev === "warning" ? <AlertTriangle style={{ width: 16, height: 16, color: "#b45309" }} /> :
            <Info style={{ width: 16, height: 16, color: "#2d9e6b" }} />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#2d2d3a", margin: 0 }}>{alert.message}</p>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{timeAgo(alert.created_at)}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedZoneName, setSelectedZoneName] = useState<string | null>(null);
  const [energyRange, setEnergyRange] = useState("This Week");
  const statsLoading = false;
  const zonesLoading = false;
  const alertsLoading = false;
  const weatherLoading = false;

  const [zones, setZones] = useState([
    { zone_name: 'ICU', category: 'Critical', power_kw: 144.1, voltage: 415.2, current: 347.1, temp: 21.6, kwh: 11.7, usage: 58, status: 'Normal' },
    { zone_name: 'Operation Theatre', category: 'Critical', power_kw: 219.3, voltage: 414.8, current: 528.6, temp: 20.5, kwh: 18.3, usage: 88, status: 'Warning' },
    { zone_name: 'Emergency', category: 'Critical', power_kw: 90.5, voltage: 415.9, current: 217.6, temp: 23.1, kwh: 7.5, usage: 36, status: 'Normal' },
    { zone_name: 'Ward A', category: 'Standard', power_kw: 55.2, voltage: 416.1, current: 132.7, temp: 22.0, kwh: 9.2, usage: 22, status: 'Normal' },
    { zone_name: 'Ward B', category: 'Standard', power_kw: 45.6, voltage: 415.5, current: 109.6, temp: 22.2, kwh: 7.9, usage: 18, status: 'Normal' },
    { zone_name: 'Pharmacy', category: 'Essential', power_kw: 29.6, voltage: 416.3, current: 71.1, temp: 18.1, kwh: 4.8, usage: 12, status: 'Normal' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setZones(prev => prev.map(zone => {
        const nextKw = +(zone.power_kw * (0.97 + Math.random() * 0.06)).toFixed(1);
        return {
          ...zone,
          power_kw: nextKw,
          voltage: +(415 + (Math.random() * 2 - 1)).toFixed(1),
          temp: +(zone.temp + (Math.random() * 0.4 - 0.2)).toFixed(1),
          usage: Math.min(100, Math.round(zone.usage + (Math.random() * 4 - 2)))
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [liveAlerts, setLiveAlerts] = useState([
    { id: 1, severity: 'Warning', zone: 'Operation Theatre', message: 'Usage at 88% of threshold', time: '2 min ago' },
    { id: 2, severity: 'Info', zone: 'ICU', message: 'Temperature stable at 21.6°C', time: '5 min ago' },
    { id: 3, severity: 'Info', zone: 'Pharmacy', message: 'All systems operating normally', time: '8 min ago' },
  ]);

  useEffect(() => {
    const infoPool = [
      { zone: 'Ward A', message: 'Ventilation system check completed' },
      { zone: 'Emergency', message: 'Backup generator self-test passed' },
      { zone: 'Ward B', message: 'Lighting levels optimized' },
      { zone: 'Pharmacy', message: 'Chiller temperature calibrated' },
      { zone: 'ICU', message: 'Secondary power source online' },
      { zone: 'Operation Theatre', message: 'Medical gas pressure normal' }
    ];
    let alertCounter = 4;
    const interval = setInterval(() => {
      const randomPick = infoPool[Math.floor(Math.random() * infoPool.length)];
      const newAlert = {
        id: alertCounter++,
        severity: 'Info',
        zone: randomPick.zone,
        message: randomPick.message,
        time: 'Just now'
      };
      setLiveAlerts(prev => {
        const updated = [newAlert, ...prev];
        if (updated.length > 5) {
          return updated.slice(0, 5);
        }
        return updated;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const { weather: liveWeather } = useWeather();

  const weather = liveWeather ? {
    city: 'Electronics City Phase I, Bengaluru',
    temp: liveWeather.temperature,
    condition: liveWeather.condition,
    humidity: liveWeather.humidity,
    windSpeed: liveWeather.wind_speed,
    feelsLike: Math.round(liveWeather.temperature + (liveWeather.humidity > 60 ? 2 : -1)),
    icon: liveWeather.icon || '⛅'
  } : {
    city: 'Electronics City Phase I, Bengaluru',
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    feelsLike: 30,
    icon: '⛅'
  };

  const [kpi, setKpi] = useState({
    powerNow: 586.1,
    energyToday: 48.5,
    costToday: 412,
    activeAlerts: 1,
    co2Today: 38.2
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setKpi(prev => ({
        powerNow: +(prev.powerNow * (0.98 + Math.random() * 0.04)).toFixed(1),
        energyToday: +(prev.energyToday + 0.05).toFixed(2),
        costToday: Math.round(prev.costToday + 0.5),
        activeAlerts: prev.activeAlerts,
        co2Today: +(prev.co2Today + 0.01).toFixed(2)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => setMounted(true), []);

  const hvacImpact = liveWeather
    ? getHVACImpact(liveWeather.temperature)
    : {
        impact: 'Moderate',
        message: 'Ambient weather conditions indicate moderate cooling loads for clinical HVAC operations.'
      };

  const weeklyData = [
    { name: "Mon", energy: 2400 }, { name: "Tue", energy: 3240 },
    { name: "Wed", energy: 2900 }, { name: "Thu", energy: 3800 },
    { name: "Fri", energy: 3100 }, { name: "Sat", energy: 2200 },
    { name: "Sun", energy: 1900 },
  ];
  const lastWeeklyData = [
    { name: "Mon", energy: 2600 }, { name: "Tue", energy: 3100 },
    { name: "Wed", energy: 2800 }, { name: "Thu", energy: 3500 },
    { name: "Fri", energy: 3300 }, { name: "Sat", energy: 2400 },
    { name: "Sun", energy: 2000 },
  ];
  const monthlyData = [
    { name: "Week 1", energy: 18500 }, { name: "Week 2", energy: 19200 },
    { name: "Week 3", energy: 17800 }, { name: "Week 4", energy: 20500 },
  ];

  const currentEnergyData = 
    energyRange === "This Week" ? weeklyData :
    energyRange === "Last Week" ? lastWeeklyData :
    monthlyData;
  const uptimeData = [
    { time: "00:00", uptime: 99.8 }, { time: "04:00", uptime: 99.9 },
    { time: "08:00", uptime: 99.5 }, { time: "12:00", uptime: 98.2 },
    { time: "16:00", uptime: 99.1 }, { time: "20:00", uptime: 99.7 },
    { time: "23:59", uptime: 99.9 },
  ];

  if (statsLoading || zonesLoading) {
    return (
      <div style={{ background: "var(--bg-main)", minHeight: "100vh", padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20, marginBottom: 24 }}>
          <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <ZoneSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--page-border)",
    borderRadius: 20,
    boxShadow: "var(--shadow-pastel)",
    overflow: "hidden",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 14, fontWeight: 800, color: "#2d2d3a",
    display: "flex", alignItems: "center", gap: 8,
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100%' }}>

      {/* ── KPI ROW (dynamic status sorting) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5" style={{ gap: 20, marginBottom: 28, alignItems: "stretch" }}>
        {(() => {
          const kpiCards = [
            { id: "power",  title: "POWER NOW",     value: `${kpi.powerNow} kW`,       trend: 0,    trendLabel: "vs 1h ago" },
            { id: "energy", title: "ENERGY TODAY",  value: `${kpi.energyToday} kWh`,   trend: 2.4,  trendLabel: "vs 1h ago" },
            { id: "cost",   title: "COST TODAY",    value: `₹${kpi.costToday}`,          trend: 2.1,  trendLabel: "vs 1h ago" },
            { id: "alerts", title: "ACTIVE ALERTS", value: kpi.activeAlerts,            trend: 0,    trendLabel: "vs 1h ago", isAlertTile: true, alertCount: kpi.activeAlerts },
            { id: "co2",    title: "CO₂ TODAY",      value: `${kpi.co2Today} kg`,        trend: -1.3, trendLabel: "vs 1h ago" }
          ];

          const getKPICardState = (id: string, kpi: any) => {
            switch (id) {
              case "power": {
                const val = kpi.powerNow;
                if (val > 600) return "warning";
                if (val >= 560) return "semi-critical";
                return "normal";
              }
              case "energy": {
                const val = kpi.energyToday;
                if (val > 120) return "warning";
                if (val >= 60) return "semi-critical";
                return "normal";
              }
              case "cost": {
                const val = kpi.costToday;
                if (val > 600) return "warning";
                if (val >= 450) return "semi-critical";
                return "normal";
              }
              case "alerts": {
                const val = kpi.activeAlerts;
                if (val > 2) return "warning";
                if (val > 0) return "semi-critical";
                return "normal";
              }
              case "co2": {
                const val = kpi.co2Today;
                if (val > 60) return "warning";
                if (val >= 45) return "semi-critical";
                return "normal";
              }
              default:
                return "normal";
            }
          };

          return [...kpiCards]
            .sort((a, b) => {
              const stateA = getKPICardState(a.id, kpi);
              const stateB = getKPICardState(b.id, kpi);
              
              const rank = (state: string) => {
                if (state === "warning") return 0;
                if (state === "semi-critical") return 1;
                return 2;
              };
              
              return rank(stateA) - rank(stateB);
            })
            .map(card => (
              <KPIStatTile
                key={card.id}
                id={card.id}
                title={card.title}
                value={card.value}
                trend={card.trend}
                trendLabel={card.trendLabel}
                status={getKPICardState(card.id, kpi) as any}
                isAlertTile={(card as any).isAlertTile}
                alertCount={(card as any).alertCount}
              />
            ));
        })()}
      </div>

      {/* ── ZONE CARDS (severity-sorted) ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 className="text-[18px] md:text-[13px]" style={{ fontWeight: 800, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
            Zone Overview
          </h2>
          {zones.filter(z => z.status === "Critical" || z.status === "critical" || (z as any).alertState === "CRITICAL").length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", background: "#ffe8e8", border: "1px solid #ffe8e8", borderRadius: 6, padding: "3px 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {zones.filter(z => z.status === "Critical" || z.status === "critical" || (z as any).alertState === "CRITICAL").length} Critical
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 20 }}>
          {[...zones]
            .sort((a, b) => {
              const rank = (z: any) => {
                const s = (z.status || z.alertState || "").toUpperCase();
                return s === "CRITICAL" ? 0 : s === "WARNING" ? 1 : 2;
              };
              return rank(a) - rank(b);
            })
            .slice(0, 6)
            .map(zone => (
              <HomeZoneCard 
                key={zone.zone_name} 
                zone={zone} 
                onViewDetails={() => setSelectedZoneName(zone.zone_name)} 
              />
            ))}
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20, marginBottom: 28 }}>

        {/* Energy Summary */}
        <div style={cardStyle}>
          <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={sectionTitle}>
              <div style={{ background: "#c8e6d8", borderRadius: 8, padding: 6 }}>
                <BarChart2 style={{ width: 16, height: 16, color: "#2d9e6b" }} />
              </div>
              📊 Energy Summary
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["This Week", "Last Week", "This Month"].map(r => (
                <button 
                  key={r} 
                  onClick={() => setEnergyRange(r)}
                  style={{
                    padding: "6px 12px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                    background: r === energyRange ? "#2d9e6b" : "#c8e6d8",
                    color: r === energyRange ? "#fff" : "#1a5c45",
                    border: "none", cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 260, padding: "16px 16px 16px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentEnergyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  cursor={{ fill: "#c8e6d8" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e8f3ee", boxShadow: "0 2px 16px rgba(45, 158, 107, 0.06)", background: "#fff" }}
                  labelStyle={{ color: "#2d2d3a", fontWeight: 700 }}
                />
                <Bar dataKey="energy" fill="#2d9e6b" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facility Uptime */}
        <div style={cardStyle}>
          <div style={{ padding: "20px 24px 0" }}>
            <div style={sectionTitle}>
              <div style={{ background: "#d4c5ff", borderRadius: 8, padding: 6 }}>
                <Activity style={{ width: 16, height: 16, color: "#8b5cf6" }} />
              </div>
              📈 Facility Uptime
            </div>
          </div>
          <div style={{ height: 260, padding: "16px 16px 16px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} domain={[95, 100]} ticks={[95, 97, 99, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8f3ee", boxShadow: "0 2px 16px rgba(45, 158, 107, 0.06)", background: "#fff" }} />
                <Area type="monotone" dataKey="uptime" stroke="#8b5cf6" strokeWidth={3} fill="url(#uptimeGrad)" />
                {uptimeData.map((e, i) => e.uptime < 99 ? (
                  <ReferenceDot key={i} x={e.time} y={e.uptime} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                ) : null)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Weather + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20 }}>

        {/* Local Conditions */}
        <div style={{ ...cardStyle, background: "linear-gradient(to bottom, var(--page-accent-light), var(--card-bg))" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--page-border)" }}>
            <div style={sectionTitle}>
              <div style={{ background: "#c8e6d8", borderRadius: 8, padding: 6 }}>
                <Cloud style={{ width: 16, height: 16, color: "#2d9e6b" }} />
              </div>
              🌤 Local Conditions
            </div>
          </div>
          <div style={{ padding: "24px" }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '56px', margin: '0 0 10px 0', display: 'block', lineHeight: 1 }}>{weather.icon}</span>
              <div style={{ fontSize: '42px', fontWeight: 900, color: "#1a5c45", lineHeight: 1 }}>{weather.temp}°C</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: "#4a6258", marginTop: '4px' }}>{weather.condition}</div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '18px 0 10px 0', width: '100%', flexWrap: 'wrap' }}>
                <span style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#4a6258', border: '1px solid #c8e6d8' }}>💧 {weather.humidity}%</span>
                <span style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#4a6258', border: '1px solid #c8e6d8' }}>🌬 {weather.windSpeed} km/h</span>
                <span style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#4a6258', border: '1px solid #c8e6d8' }}>🌡 {weather.feelsLike}°C</span>
              </div>
              
              <div style={{ fontSize: '11px', color: "#9dbfb3", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{weather.city}</div>
            </div>
          </div>
        </div>

        {/* Live Alerts */}
        <div style={{ ...cardStyle }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8f3ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={sectionTitle}>
              <div style={{ background: "#ffd6e0", borderRadius: 8, padding: 6 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: "#c9184a" }} />
              </div>
              ⚠ Live Alerts System
            </div>
            <Link to="/live" style={{ fontSize: 12, fontWeight: 700, color: "#2d9e6b", textDecoration: "none" }}>View All</Link>
          </div>
          <div style={{ padding: "16px 20px", maxHeight: 280, overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alertsLoading ? (
                [1, 2, 3].map(i => <div key={i} style={{ height: 52, background: "#ffffff", borderRadius: 10, border: "1px solid #e8f3ee" }} />)
              ) : !liveAlerts?.length ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 99, background: "#c8e6d8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity style={{ width: 20, height: 20, color: "#2d9e6b" }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#9dbfb3", letterSpacing: "0.1em", textTransform: "uppercase" }}>No alerts in last 24 hours ✓</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {liveAlerts.map(a => {
                    const sev = (a.severity || "info").toLowerCase();
                    const rowBg = sev === "critical" ? "#fff0f3" : sev === "warning" ? "#fff8ed" : "#f0fdf8";
                    const borderLeftColor = sev === "critical" ? "#ff6b8a" : sev === "warning" ? "#f59e0b" : "#2d9e6b";
                    const emoji = sev === "critical" ? "🔴" : sev === "warning" ? "🟡" : "🔵";
                    return (
                      <motion.div key={a.id} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }}>
                        <div 
                          style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            padding: "12px 16px", 
                            borderRadius: 12, 
                            border: "1px solid #e8f3ee", 
                            borderLeft: `3px solid ${borderLeftColor}`,
                            background: rowBg, 
                            gap: 12 
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 12, flexShrink: 0 }}>
                              {emoji}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: 13, color: "#2d2d3a", flexShrink: 0 }}>
                              {a.zone}
                            </span>
                            <span style={{ color: "#6b7280", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 4 }}>
                              {a.message}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                            {a.time}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ZONE DETAIL DRAWER ── */}
      <ZoneDetailDrawer 
        zone={zones.find(z => z.zone_name === selectedZoneName) || null} 
        open={!!selectedZoneName} 
        onClose={() => setSelectedZoneName(null)} 
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
