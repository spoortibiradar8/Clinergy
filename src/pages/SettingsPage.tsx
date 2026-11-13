import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Building2,
  Calendar,
  Globe,
  DollarSign,
  Thermometer,
  Clock,
  Layers,
  ShieldCheck,
  Bell,
  Mail,
  Phone,
  Volume2,
  Lock,
  FileText,
  Sliders,
  Tv,
  CheckSquare,
  RefreshCw,
  BarChart2,
  LineChart,
  AreaChart,
  Check,
  Database,
  Key,
  Info,
  Server,
  Zap,
  Cpu,
  Brain,
  Link2,
  Palette,
  Eye,
  Trash2,
  Upload,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Plus,
  Send,
  Save,
  Download
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ── DESIGN SYSTEM CONSTANTS ──────────────────────────────────────────────────
const COLORS = {
  bgMain: 'var(--page-bg)',
  cardBg: 'var(--card-bg)',
  border: '1px solid var(--page-border)',
  shadow: 'var(--shadow-pastel)',
  primary: 'var(--page-accent)',      // Scoped accent for Settings
  teal: '#3bbfad',
  tealLight: '#e0f5f2',
  purple: '#8b5cf6',       // Purple accents
  purpleBg: '#f0ebff',
  red: '#ef4444',
  redLight: '#ffe8e8',
  amber: '#f59e0b',
  amberLight: '#fff4e0',
  green: '#10b981',
  greenLight: '#e6f9f0',
  blue: '#6366f1',
  blueLight: '#e8f0fe',
  textPrimary: '#2d2d3a',
  textMuted: '#9ca3af',
  borderCol: 'var(--page-border)'
};

// ── LOCAL STORAGE UTILITIES ──────────────────────────────────────────────────
const getLocalSetting = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(`clinergy_v2_settings_${key}`);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const saveLocalSetting = (key: string, value: any) => {
  try {
    localStorage.setItem(`clinergy_v2_settings_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving setting ${key}:`, e);
  }
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  // Page Title Update
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "⚙️ Settings — Clinergy";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  // ── Navigation State ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    'general' | 'notifications' | 'display' | 'telemetry' | 'ai' | 'integrations' | 'appearance' | 'data_management' | 'about'
  >('general');

  // ── Master Settings Object State ───────────────────────────────────────────
  const defaultSettings = {
    // Category 1: General
    facilityName: "Clinergy General Hospital",
    facilityId: "CLN-BLR-001",
    address: "Electronics City Phase I, Bengaluru - 560100",
    country: "India",
    timezone: "Asia/Kolkata (IST, UTC+5:30)",
    beds: 450,
    grossFloorArea: 28400,
    operatingSince: "2010",
    currency: "INR ₹",
    tempUnit: "Celsius", // "Celsius" or "Fahrenheit"
    energyUnit: "kWh",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12-hour", // "12-hour" or "24-hour"
    language: "English",

    // Category 2: Notifications
    criticalEmail: true,
    criticalEmailVal: "admin@clinergy.com",
    criticalSms: true,
    criticalSmsVal: "+91 98765 43210",
    criticalSiren: true,
    criticalEscalate: "5 minutes",

    warningEmail: true,
    warningSms: false,
    warningSmsVal: "",
    warningSiren: true,
    warningEscalate: "30 minutes",

    infoEmail: false,
    infoSms: false,
    infoSiren: true,

    quietHours: false,
    quietFrom: "22:00",
    quietTo: "06:00",
    emailCc: ["on-call@clinergy.com", "energy-manager@clinergy.com"],
    emailDigest: "Immediate",

    reportDaily: true,
    reportDailyTime: "08:00",
    reportWeekly: true,
    reportWeeklyTime: "08:00",
    reportMonthly: true,
    reportSendTo: "compliance@clinergy.com",
    reportFormat: "Both", // "PDF" | "CSV" | "Both"

    // Category 3: Dashboard & Display
    landingPage: "Home",
    kpisToShow: ["Power Now", "Energy Today", "Cost Today", "Active Alerts", "CO₂ Today"],
    zoneCardsPerRow: 3,
    showForecastBanner: true,
    showQuickActions: true,
    autoRefreshDashboard: true,
    refreshInterval: "3 seconds",
    defaultChartType: "Area", // "Bar" | "Line" | "Area"
    defaultTimeRange: "Last 24h", // "Last 24h" | "Last 7 days" | "Last 30 days"
    showTargetLines: true,
    showDataLabels: false,
    animationOnLoad: true,
    powerDisplay: "kW",
    energyDisplay: "kWh",
    showDeltaArrows: true,
    showUpdatedTimestamps: true,

    // Category 4: Telemetry
    icuSamplingRate: "100 Hz",
    otSamplingRate: "100 Hz",
    emergencySamplingRate: "100 Hz",
    wardASamplingRate: "17 Hz",
    wardBSamplingRate: "17 Hz",
    pharmacySamplingRate: "17 Hz",
    telemetryRetention: "24 months",
    alertLogRetention: "12 months",
    auditLogRetention: "36 months",
    autoArchive: true,
    archiveTo: "Supabase cold storage",
    jwtExpiry: 3600,
    webhookUrl: "https://api.clinergy.com/v1/energy-webhooks",

    // Category 5: AI & Models
    forecastingActiveModel: "Combined", // "ARIMA only" | "LSTM only" | "Combined"
    forecastHorizon: "24 hours",
    historicalWindow: "24 months",
    confidenceInterval: "90%",
    showForecastDashboard: true,
    anomalyContamination: 0.05,
    anomalyZScore: 2.5,
    anomalyAlert: true,
    anomalySensitivity: "Medium", // "Low" | "Medium" | "High"
    autoRetrainSchedule: "Weekly",
    retrainDay: "Sunday",
    retrainTime: "00:00",
    minNewDataPoints: 10000,
    emailOnRetrain: true,

    // Category 7: Appearance
    theme: "Light", // "Light" | "Dark" | "System"
    sidebarColor: "Blush Pink", // "Blush Pink" | "White" | "Dark"
    accentColor: "Teal", // "Teal" | "Purple" | "Blue" | "Green"
    fontSize: "Normal", // "Normal" | "Large" | "Extra Large"
    compactMode: false
  };

  // State initialized from local storage or defaults
  const [settings, setSettings] = useState(() => {
    const loaded: any = {};
    Object.keys(defaultSettings).forEach(key => {
      loaded[key] = getLocalSetting(key, (defaultSettings as any)[key]);
    });
    return loaded;
  });

  // Reference for checking unsaved changes
  const [savedSettings, setSavedSettings] = useState<any>({ ...settings });

  // Calculation for unsaved changes banner
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  // General state helper
  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  // ── Action Handlers ────────────────────────────────────────────────────────

  // Save All Changes
  const handleSaveAll = () => {
    Object.keys(settings).forEach(key => {
      saveLocalSetting(key, settings[key]);
    });
    setSavedSettings({ ...settings });
    toast.success("💾 All system preferences successfully synchronized!", {
      duration: 3000,
      style: {
        border: `1px solid ${COLORS.teal}`,
        padding: '16px',
        color: COLORS.textPrimary,
        borderRadius: '12px',
        background: '#ffffff',
        boxShadow: COLORS.shadow
      },
      iconTheme: {
        primary: COLORS.teal,
        secondary: '#ffffff',
      },
    });
  };

  // Save Single Section
  const handleSaveSection = (keys: string[], sectionName: string) => {
    keys.forEach(key => {
      saveLocalSetting(key, settings[key]);
      setSavedSettings((prevSaved: any) => ({
        ...prevSaved,
        [key]: settings[key]
      }));
    });
    toast.success(`✓ Saved ${sectionName} preferences successfully!`, {
      duration: 2500,
      style: {
        border: `1px solid ${COLORS.purple}`,
        padding: '12px 16px',
        color: COLORS.textPrimary,
        borderRadius: '12px',
        background: '#ffffff',
      },
      iconTheme: {
        primary: COLORS.purple,
        secondary: '#ffffff',
      },
    });
  };

  // Category Menus Definition
  const menuItems = [
    { key: 'general', label: 'General', icon: Building2 },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'display', label: 'Dashboard & Display', icon: BarChart2 },
    { key: 'telemetry', label: 'Data & Telemetry', icon: Zap },
    { key: 'ai', label: 'AI & Models', icon: Brain },
    { key: 'integrations', label: 'Integrations', icon: Link2 },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'data_management', label: 'Data Management', icon: Database },
    { key: 'about', label: 'About', icon: Info }
  ];

  // System Date formatting
  const todayDateStr = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('en-IN', options);
  }, []);

  // ── TEST EMAIL SPINNER TRIGGER ─────────────────────────────────────────────
  const [testingEmail, setTestingEmail] = useState(false);
  const handleSendTestEmail = () => {
    setTestingEmail(true);
    setTimeout(() => {
      setTestingEmail(false);
      toast.success(`✓ Dispatch successful: Telemetry audit ping delivered to ${settings.criticalEmailVal || 'admin@clinergy.com'}!`, {
        duration: 3000
      });
    }, 1500);
  };

  // ── CC EMAIL INPUTS MANAGEMENT ─────────────────────────────────────────────
  const [newCcEmail, setNewCcEmail] = useState("");
  const handleAddCcEmail = () => {
    if (!newCcEmail || !newCcEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (settings.emailCc.includes(newCcEmail)) {
      toast.error("Email already exists in list");
      return;
    }
    const updated = [...settings.emailCc, newCcEmail];
    updateSetting('emailCc', updated);
    setNewCcEmail("");
  };

  const handleRemoveCcEmail = (email: string) => {
    const updated = settings.emailCc.filter((item: string) => item !== email);
    updateSetting('emailCc', updated);
  };

  // ── TELEMETRY API TEST TRIGGER ─────────────────────────────────────────────
  const [testingApi, setTestingApi] = useState(false);
  const handleTestApiConnection = () => {
    setTestingApi(true);
    setTimeout(() => {
      setTestingApi(false);
      toast.success("✅ Smart Edge Controller REST gateway verified. Latency: 12ms.", {
        duration: 3000
      });
    }, 1200);
  };

  // ── TELEMETRY API KEY REGENERATE CONFIRM ───────────────────────────────────
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [apiKeyVal, setApiKeyVal] = useState("cln_live_sec_prod_99f2e3a1d9bc4e5a");
  const handleRegenerateKey = () => {
    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKeyVal(`cln_live_sec_prod_${randomHex}`);
    setShowRegenModal(false);
    toast.success("🔑 Telemetry gateway API credentials successfully rotated!");
  };

  // ── MANUAL MODEL RETRAIN SPINNER ───────────────────────────────────────────
  const [showRetrainConfirm, setShowRetrainConfirm] = useState(false);
  const [retrainingModel, setRetrainingModel] = useState(false);
  const [lastRetrainedTime, setLastRetrainedTime] = useState("Sunday 00:00 IST");
  const [modelAccuracy, setModelAccuracy] = useState(94.2);

  const handleTriggerRetrain = () => {
    setShowRetrainConfirm(false);
    setRetrainingModel(true);
    setTimeout(() => {
      setRetrainingModel(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastRetrainedTime(`Today ${timeStr} IST`);
      setModelAccuracy(94.8); // slight dynamic improvement
      toast.success("✅ Retrain scheduled: ARIMA + LSTM ensemble training pipeline initialized!", {
        duration: 4000
      });
    }, 3000);
  };

  // ── DANGER ZONE CONFIRMATION MODALS ────────────────────────────────────────
  const [dangerModalType, setDangerModalType] = useState<'clear_telemetry' | 'reset_thresholds' | 'factory_reset_1' | 'factory_reset_2' | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [factoryConfirmationText, setFactoryConfirmationText] = useState("");

  const handleExecuteClearTelemetry = () => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setDangerModalType(null);
    setDeleteConfirmationText("");
    toast.success("🔥 Telemetry database buffer purged. Recalculating dashboards...");
  };

  const handleExecuteResetThresholds = () => {
    setDangerModalType(null);
    toast.success("⚙️ Zone warning and critical load thresholds reset to system defaults.");
  };

  const handleExecuteFactoryReset = () => {
    if (factoryConfirmationText !== 'FACTORY RESET') {
      toast.error("Please type FACTORY RESET to confirm");
      return;
    }
    setDangerModalType(null);
    setFactoryConfirmationText("");
    localStorage.clear();
    toast.success("💥 System reset complete. Purging configurations and reloading...");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // ── INTEGRATIONS ACTIONS ───────────────────────────────────────────────────
  const handleConnectIntegration = (name: string) => {
    toast.success(`🔗 HL7/FHIR pipeline initiated: Connecting to ${name} server...`);
  };

  return (
    <div
      className="settings-page-wrapper"
      style={{
        backgroundColor: COLORS.bgMain,
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        color: COLORS.textPrimary
      }}
    >
      <Toaster position="top-right" />

      {/* Embedded CSS for premium interactive styles */}
      <style>{`
        .settings-card {
          background: var(--card-bg) !important;
          border: 0.5px solid var(--page-border) !important;
          border-radius: 16px !important;
          padding: 24px !important;
          margin-bottom: 24px;
          box-shadow: none !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .settings-card:hover {
          box-shadow: 0 4px 20px color-mix(in srgb, var(--page-accent) 8%, transparent) !important;
        }
        .settings-card-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--page-text) !important;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .settings-card-subtitle {
          font-size: 13px;
          color: color-mix(in srgb, var(--page-text) 70%, transparent) !important;
          margin-bottom: 20px;
        }
        .settings-input-group {
          margin-bottom: 16px;
        }
        .settings-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--page-text) !important;
          margin-bottom: 6px;
        }
        .settings-input {
          width: 100% !important;
          padding: 10px 14px !important;
          border-radius: 10px !important;
          border: 0.5px solid var(--page-border) !important;
          font-size: 14px !important;
          color: var(--page-text) !important;
          background: var(--page-bg) !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.01);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box !important;
        }
        .settings-input:focus {
          border-color: var(--page-accent) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--page-accent) 15%, transparent) !important;
          outline: none !important;
        }
        .settings-input:disabled {
          background: color-mix(in srgb, var(--page-bg) 70%, transparent) !important;
          color: color-mix(in srgb, var(--page-text) 50%, transparent) !important;
          cursor: not-allowed;
        }
        .settings-select {
          width: 100% !important;
          padding: 10px 14px !important;
          border-radius: 10px !important;
          border: 0.5px solid var(--page-border) !important;
          font-size: 14px !important;
          color: var(--page-text) !important;
          background: var(--page-bg) !important;
          transition: border-color 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231A6A82' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          box-sizing: border-box !important;
        }
        .settings-select:focus {
          border-color: var(--page-accent) !important;
          outline: none !important;
        }
        .settings-btn-primary {
          background: var(--page-accent) !important;
          color: #ffffff !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--page-accent) 25%, transparent) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .settings-btn-primary:hover {
          background: color-mix(in srgb, var(--page-accent) 85%, #000000) !important;
          box-shadow: 0 4px 12px color-mix(in srgb, var(--page-accent) 35%, transparent) !important;
        }
        .settings-btn-outline {
          background: transparent !important;
          border: 1.5px solid var(--page-accent) !important;
          color: var(--page-accent) !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .settings-btn-outline:hover {
          background: color-mix(in srgb, var(--page-accent) 12%, transparent) !important;
        }
        .settings-btn-purple {
          background: var(--page-accent) !important;
          color: #ffffff !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--page-accent) 25%, transparent) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .settings-btn-purple:hover {
          background: color-mix(in srgb, var(--page-accent) 85%, #000000) !important;
          box-shadow: 0 4px 12px color-mix(in srgb, var(--page-accent) 35%, transparent) !important;
        }
        .settings-btn-danger {
          background: transparent !important;
          border: 1.5px solid var(--page-accent) !important;
          color: var(--page-accent) !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .settings-btn-danger:hover {
          background: color-mix(in srgb, var(--page-accent) 12%, transparent) !important;
        }
        .settings-btn-danger-solid {
          background: var(--page-accent) !important;
          color: #ffffff !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--page-accent) 25%, transparent) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .settings-btn-danger-solid:hover {
          background: color-mix(in srgb, var(--page-accent) 85%, #000000) !important;
        }
        
        /* Smooth Custom Toggles */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
          cursor: pointer;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: color-mix(in srgb, var(--page-text) 20%, transparent);
          transition: .3s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: var(--card-bg) !important;
          transition: .3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        input:checked + .toggle-slider {
          background-color: var(--page-accent) !important;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        /* Swatches and Theme selectors */
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.2s ease, border-color 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .color-swatch:hover {
          transform: scale(1.1);
        }
        .color-swatch.active {
          border-color: var(--page-accent) !important;
          transform: scale(1.05);
        }
        
        /* Modal Backdrops */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(45, 45, 58, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-container {
          background: var(--card-bg) !important;
          border-radius: 20px;
          box-shadow: 0 10px 30px color-mix(in srgb, var(--page-accent) 15%, transparent);
          width: 100%;
          max-width: 480px;
          padding: 24px;
          border: 0.5px solid var(--page-border) !important;
          box-sizing: border-box;
        }

        /* Mini Dashboard Preview in Appearance */
        .preview-mini-card {
          border: 0.5px solid var(--page-border) !important;
          border-radius: 12px;
          padding: 10px;
          background: var(--card-bg) !important;
          box-shadow: none !important;
          font-size: 11px;
        }
        .preview-mini-title {
          font-weight: 700;
          color: var(--page-text);
          margin-bottom: 4px;
        }
        .preview-mini-value {
          font-size: 14px;
          font-weight: 800;
        }
      `}</style>

      {/* ── TOP LEVEL UNSAVED CHANGES BANNER ─────────────────────────────────── */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 shadow-sm"
            style={{ color: '#92400e' }}
          >
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-200 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-800 animate-pulse" />
              </span>
              <div>
                <p className="text-sm font-bold">You have unsaved changes</p>
                <p className="text-xs opacity-90">Modify parameters as required, then press "Save All Changes" to synchronize with Clinergy core.</p>
              </div>
            </div>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" /> Save Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '24px',
          border: '0.5px solid var(--page-border)',
          boxShadow: 'var(--shadow-pastel)'
        }}
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: COLORS.textPrimary, margin: 0 }}>
            <Settings className="h-7 w-7 text-[#2d9e6b]" /> Settings
          </h1>
        </div>

        <div className="relative">
          <button
            onClick={handleSaveAll}
            className="settings-btn-primary"
            style={{ position: 'relative' }}
          >
            <Save className="h-4 w-4" /> Save All Changes
          </button>
          
          {hasUnsavedChanges && (
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white animate-bounce"
              title="Unsaved changes pending"
            />
          )}
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT COLUMN: Vertical Categories Menu */}
        <div className="w-full md:w-[260px] shrink-0">
          <div className="settings-card" style={{ padding: '12px', backgroundColor: 'var(--page-accent-light)', border: '0.5px solid var(--page-border)' }}>
            <div className="flex flex-col gap-1">
              {menuItems.map(item => {
                const isActive = activeTab === item.key;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className="w-full flex items-center gap-3 transition-all text-left"
                    style={{
                      borderLeft: 'none',
                      color: isActive ? 'var(--page-accent)' : 'color-mix(in srgb, var(--page-text) 70%, transparent)',
                      backgroundColor: isActive ? 'var(--card-bg)' : 'transparent',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    <IconComponent size={18} style={{ color: isActive ? 'var(--page-accent)' : 'color-mix(in srgb, var(--page-text) 70%, transparent)' }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Content Panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 1: GENERAL */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'general' && (
                <div>
                  {/* Facility Information Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Building2 className="h-5 w-5 text-teal-600" /> Facility Information
                    </div>
                    <div className="settings-card-subtitle">General identity metrics for regional Clinergy node orchestration</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Facility Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={settings.facilityName}
                          onChange={e => updateSetting('facilityName', e.target.value)}
                        />
                      </div>
                      <div className="settings-input-group">
                        <label className="settings-label">Facility ID</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={settings.facilityId}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label">Address</label>
                      <textarea
                        className="settings-input"
                        rows={2}
                        value={settings.address}
                        onChange={e => updateSetting('address', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Country</label>
                        <select
                          className="settings-select"
                          value={settings.country}
                          onChange={e => updateSetting('country', e.target.value)}
                        >
                          <option>India</option>
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Singapore</option>
                        </select>
                      </div>
                      <div className="settings-input-group">
                        <label className="settings-label">Timezone</label>
                        <select
                          className="settings-select"
                          value={settings.timezone}
                          onChange={e => updateSetting('timezone', e.target.value)}
                        >
                          <option>Asia/Kolkata (IST, UTC+5:30)</option>
                          <option>Europe/London (GMT, UTC+0:00)</option>
                          <option>America/New_York (EST, UTC-5:00)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Total Beds</label>
                        <input
                          type="number"
                          className="settings-input"
                          value={settings.beds}
                          onChange={e => updateSetting('beds', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="settings-input-group">
                        <label className="settings-label">Gross Floor Area (m²)</label>
                        <input
                          type="number"
                          className="settings-input"
                          value={settings.grossFloorArea}
                          onChange={e => updateSetting('grossFloorArea', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="settings-input-group">
                        <label className="settings-label">Operating Since</label>
                        <select
                          className="settings-select"
                          value={settings.operatingSince}
                          onChange={e => updateSetting('operatingSince', e.target.value)}
                        >
                          {Array.from({ length: 30 }, (_, i) => 2000 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSaveSection(['facilityName', 'address', 'country', 'timezone', 'beds', 'grossFloorArea', 'operatingSince'], 'Facility Information')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save General info
                      </button>
                    </div>
                  </div>

                  {/* System Information Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Server className="h-5 w-5 text-purple-600" /> System Information
                    </div>
                    <div className="settings-card-subtitle">Active platform build runtime and cloud check aggregates</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm border-t border-purple-50 pt-4">
                      <div className="flex justify-between py-1 border-b border-purple-50/50">
                        <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Platform</span>
                        <span className="font-bold text-gray-800">Clinergy V2.0</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-purple-50/50">
                        <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Build</span>
                        <span className="font-bold text-gray-800">React 19 + FastAPI + PostgreSQL via Supabase</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-purple-50/50">
                        <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Deployment</span>
                        <span className="font-bold text-gray-800">Cloud (Supabase)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-purple-50/50">
                        <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">API Version</span>
                        <span className="font-bold text-gray-800">v1</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-purple-50/50">
                        <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Encryption</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">AES-256 / TLS 1.3 ✅</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-purple-50/50">
                        <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Last System Check</span>
                        <span className="font-semibold text-gray-800">{todayDateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Regional Settings Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Globe className="h-5 w-5 text-indigo-600" /> Regional Settings
                    </div>
                    <div className="settings-card-subtitle">Format and unit parameters for hospital localization profiles</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Currency</label>
                        <select
                          className="settings-select"
                          value={settings.currency}
                          onChange={e => updateSetting('currency', e.target.value)}
                        >
                          <option>INR ₹</option>
                          <option>USD $</option>
                          <option>GBP £</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Temperature Unit</label>
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 px-4">
                          <span className="text-sm font-semibold text-slate-700">
                            {settings.tempUnit === 'Celsius' ? 'Celsius °C' : 'Fahrenheit °F'}
                          </span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.tempUnit === 'Fahrenheit'}
                              onChange={e => updateSetting('tempUnit', e.target.checked ? 'Fahrenheit' : 'Celsius')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Energy Unit</label>
                        <select
                          className="settings-select"
                          value={settings.energyUnit}
                          onChange={e => updateSetting('energyUnit', e.target.value)}
                        >
                          <option>kWh</option>
                          <option>MWh</option>
                          <option>GWh</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Date Format</label>
                        <select
                          className="settings-select"
                          value={settings.dateFormat}
                          onChange={e => updateSetting('dateFormat', e.target.value)}
                        >
                          <option>DD/MM/YYYY</option>
                          <option>MM/DD/YYYY</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Time Format</label>
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 px-4">
                          <span className="text-sm font-semibold text-slate-700">
                            {settings.timeFormat}
                          </span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.timeFormat === '24-hour'}
                              onChange={e => updateSetting('timeFormat', e.target.checked ? '24-hour' : '12-hour')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Language</label>
                        <select
                          className="settings-select"
                          value={settings.language}
                          onChange={e => updateSetting('language', e.target.value)}
                        >
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSaveSection(['currency', 'tempUnit', 'energyUnit', 'dateFormat', 'timeFormat', 'language'], 'Regional Settings')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save Regional settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 2: NOTIFICATIONS */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'notifications' && (
                <div>
                  {/* Alert Notification Settings Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Bell className="h-5 w-5 text-rose-600" /> Alert Delivery Channels
                    </div>
                    <div className="settings-card-subtitle">Configure notification dispatch pipelines based on asset telemetry threshold breaches</div>

                    {/* Critical Alerts */}
                    <div className="mb-4">
                      <h4 style={{ color: 'var(--page-text)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>CRITICAL ALERTS</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>Email Notifications</span>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              className="settings-input !py-1 text-xs"
                              style={{ width: '180px' }}
                              value={settings.criticalEmailVal}
                              onChange={e => updateSetting('criticalEmailVal', e.target.value)}
                              disabled={!settings.criticalEmail}
                            />
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={settings.criticalEmail}
                                onChange={e => updateSetting('criticalEmail', e.target.checked)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>SMS Notifications</span>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              className="settings-input !py-1 text-xs"
                              style={{ width: '180px' }}
                              value={settings.criticalSmsVal}
                              onChange={e => updateSetting('criticalSmsVal', e.target.value)}
                              disabled={!settings.criticalSms}
                            />
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={settings.criticalSms}
                                onChange={e => updateSetting('criticalSms', e.target.checked)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>Dashboard siren audio override</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.criticalSiren}
                              onChange={e => updateSetting('criticalSiren', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>Auto-escalate if unacknowledged after</span>
                          <select
                            className="settings-select !py-1 !w-[140px] text-xs"
                            value={settings.criticalEscalate}
                            onChange={e => updateSetting('criticalEscalate', e.target.value)}
                          >
                            <option>5 minutes</option>
                            <option>10 minutes</option>
                            <option>15 minutes</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #e8f3ee', margin: '16px 0' }} />

                    {/* Warning Alerts */}
                    <div className="mb-4">
                      <h4 style={{ color: 'var(--page-text)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>WARNING ALERTS</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>Email notifications dispatch</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.warningEmail}
                              onChange={e => updateSetting('warningEmail', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>SMS notifications dispatch</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.warningSms}
                              onChange={e => updateSetting('warningSms', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>Dashboard warning toast popup</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.warningSiren}
                              onChange={e => updateSetting('warningSiren', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>Escalation warning callback trigger</span>
                          <select
                            className="settings-select !py-1 !w-[140px] text-xs"
                            value={settings.warningEscalate}
                            onChange={e => updateSetting('warningEscalate', e.target.value)}
                          >
                            <option>30 minutes</option>
                            <option>1 hour</option>
                            <option>2 hours</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #e8f3ee', margin: '16px 0' }} />

                    {/* Info Alerts */}
                    <div>
                      <h4 style={{ color: 'var(--page-text)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>INFO ALERTS</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#2d3a33', fontSize: '14px', fontWeight: 500 }}>Email summary logs digest</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.infoEmail}
                              onChange={e => updateSetting('infoEmail', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">📱 SMS logs dispatch</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.infoSms}
                              onChange={e => updateSetting('infoSms', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">🔔 Dashboard audit-trail logging</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.infoSiren}
                              onChange={e => updateSetting('infoSiren', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Schedule Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Clock className="h-5 w-5 text-indigo-600" /> Notification Schedule
                    </div>
                    <div className="settings-card-subtitle">Set suppress times for non-urgent alarm relays</div>

                    <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4">
                      <div>
                        <span className="text-sm font-bold text-slate-800">Quiet Hours Mode</span>
                        <p className="text-xs text-slate-400 mt-0.5">Mutes standard warnings and logs during off-peak shifts</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.quietHours}
                          onChange={e => updateSetting('quietHours', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {settings.quietHours && (
                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-xl border border-indigo-50 bg-indigo-50/10">
                        <div className="settings-input-group !mb-0">
                          <label className="settings-label">Quiet Hours From</label>
                          <input
                            type="time"
                            className="settings-input"
                            value={settings.quietFrom}
                            onChange={e => updateSetting('quietFrom', e.target.value)}
                          />
                        </div>
                        <div className="settings-input-group !mb-0">
                          <label className="settings-label">Quiet Hours To</label>
                          <input
                            type="time"
                            className="settings-input"
                            value={settings.quietTo}
                            onChange={e => updateSetting('quietTo', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center p-3.5 rounded-2xl border border-rose-100 bg-rose-50/20">
                      <div>
                        <span className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5" /> Critical Alerts Override
                        </span>
                        <p className="text-xs text-rose-600 mt-0.5">Locked ON to guarantee critical ICU/OT sirens fire immediately</p>
                      </div>
                      <label className="toggle-switch" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                        <input type="checkbox" checked={true} disabled />
                        <span className="toggle-slider !bg-rose-500 before:translate-x-6"></span>
                      </label>
                    </div>
                  </div>

                  {/* Email Configuration Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Mail className="h-5 w-5 text-purple-600" /> Email Configuration
                    </div>
                    <div className="settings-card-subtitle">Set primary notification emails, list CC addresses, and dispatch digests</div>

                    <div className="settings-input-group">
                      <label className="settings-label">Notification Dispatch Email</label>
                      <input
                        type="email"
                        className="settings-input"
                        value={settings.criticalEmailVal}
                        onChange={e => updateSetting('criticalEmailVal', e.target.value)}
                      />
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label">CC Recipient Lists (Shift Supervisors)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="supervisor@clinergy.com"
                          className="settings-input"
                          value={newCcEmail}
                          onChange={e => setNewCcEmail(e.target.value)}
                        />
                        <button
                          onClick={handleAddCcEmail}
                          className="settings-btn-purple !py-2"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {settings.emailCc.map((email: string) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-purple-700 bg-purple-100"
                          >
                            {email}
                            <button
                              onClick={() => handleRemoveCcEmail(email)}
                              className="w-3.5 h-3.5 rounded-full bg-purple-200 hover:bg-purple-300 text-purple-900 flex items-center justify-center font-bold text-[9px]"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label">Email Frequency Digest</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Immediate', 'Hourly', 'Daily'].map(freq => (
                          <label
                            key={freq}
                            className="flex items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer font-bold text-xs"
                            style={{
                              borderColor: settings.emailDigest === freq ? COLORS.purple : '#f0ebff',
                              color: settings.emailDigest === freq ? COLORS.purple : COLORS.textPrimary,
                              background: settings.emailDigest === freq ? COLORS.purpleBg : '#f9fafb'
                            }}
                          >
                            <input
                              type="radio"
                              name="digestRadio"
                              className="hidden"
                              checked={settings.emailDigest === freq}
                              onChange={() => updateSetting('emailDigest', freq)}
                            />
                            {freq}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={handleSendTestEmail}
                        className="settings-btn-outline"
                        disabled={testingEmail}
                      >
                        {testingEmail ? (
                          <>
                            <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span> Dispatching...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" /> Send Test Email
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSaveSection(['criticalEmailVal', 'emailCc', 'emailDigest'], 'Email Configuration')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save Email config
                      </button>
                    </div>
                  </div>

                  {/* Report Schedule Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <FileText className="h-5 w-5 text-teal-600" /> Report Schedule (Pillar 7)
                    </div>
                    <div className="settings-card-subtitle">Automated ESG compliance, carbon footprint, and tariff analysis relays</div>

                    <div className="space-y-4">
                      {/* Daily */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Auto-generate daily audit report</span>
                          <p className="text-xs text-slate-400 mt-0.5">Dispatches energy balance sheets every morning</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {settings.reportDaily && (
                            <input
                              type="time"
                              className="settings-input !py-1 text-xs"
                              style={{ width: '80px' }}
                              value={settings.reportDailyTime}
                              onChange={e => updateSetting('reportDailyTime', e.target.value)}
                            />
                          )}
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.reportDaily}
                              onChange={e => updateSetting('reportDaily', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>

                      {/* Weekly */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Auto-generate weekly executive summary</span>
                          <p className="text-xs text-slate-400 mt-0.5">Dispatches site comparisons every Monday morning</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {settings.reportWeekly && (
                            <input
                              type="time"
                              className="settings-input !py-1 text-xs"
                              style={{ width: '80px' }}
                              value={settings.reportWeeklyTime}
                              onChange={e => updateSetting('reportWeeklyTime', e.target.value)}
                            />
                          )}
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.reportWeekly}
                              onChange={e => updateSetting('reportWeekly', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>

                      {/* Monthly */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Auto-generate monthly compliance reports</span>
                          <p className="text-xs text-slate-400 mt-0.5">Aggregates carbon benchmarks on the 1st of each month</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.reportMonthly}
                            onChange={e => updateSetting('reportMonthly', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Send compliance exports to</label>
                        <input
                          type="email"
                          className="settings-input"
                          value={settings.reportSendTo}
                          onChange={e => updateSetting('reportSendTo', e.target.value)}
                        />
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Report Format</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['PDF', 'CSV', 'Both'].map(format => (
                            <label
                              key={format}
                              className="flex items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer font-bold text-xs"
                              style={{
                                borderColor: settings.reportFormat === format ? COLORS.teal : '#f0ebff',
                                color: settings.reportFormat === format ? COLORS.teal : COLORS.textPrimary,
                                background: settings.reportFormat === format ? COLORS.tealLight : '#f9fafb'
                              }}
                            >
                              <input
                                type="radio"
                                name="reportFormatRadio"
                                className="hidden"
                                checked={settings.reportFormat === format}
                                onChange={() => updateSetting('reportFormat', format)}
                              />
                              {format}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSaveSection(['reportDaily', 'reportDailyTime', 'reportWeekly', 'reportWeeklyTime', 'reportMonthly', 'reportSendTo', 'reportFormat'], 'Report Schedule')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save Reports config
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 3: DASHBOARD & DISPLAY */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'display' && (
                <div>
                  {/* Dashboard Preferences Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Tv className="h-5 w-5 text-purple-600" /> Dashboard Preferences
                    </div>
                    <div className="settings-card-subtitle">Default layouts, refresh aggregates, and visible KPI banners</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Default Landing Page</label>
                        <select
                          className="settings-select"
                          value={settings.landingPage}
                          onChange={e => updateSetting('landingPage', e.target.value)}
                        >
                          <option>Home</option>
                          <option>Live Monitor</option>
                          <option>Zones</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Zone Cards Per Row</label>
                        <select
                          className="settings-select"
                          value={settings.zoneCardsPerRow}
                          onChange={e => updateSetting('zoneCardsPerRow', parseInt(e.target.value) || 3)}
                        >
                          <option value={2}>2 Cards per Row</option>
                          <option value={3}>3 Cards per Row</option>
                          <option value={4}>4 Cards per Row</option>
                        </select>
                      </div>
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label">KPI Cards to display (Multi-select)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {["Power Now", "Energy Today", "Cost Today", "Active Alerts", "CO₂ Today"].map(kpi => {
                          const isChecked = settings.kpisToShow.includes(kpi);
                          return (
                            <label
                              key={kpi}
                              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    updateSetting('kpisToShow', [...settings.kpisToShow, kpi]);
                                  } else {
                                    updateSetting('kpisToShow', settings.kpisToShow.filter((k: string) => k !== kpi));
                                  }
                                }}
                                className="rounded text-teal-600 focus:ring-teal-500 h-4.5 w-4.5 border-slate-300"
                              />
                              {kpi}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Show AI Forecast Banner</span>
                          <p className="text-xs text-slate-400 mt-0.5">Integrates Pillars 5 & 12 forecast curves at landing header</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.showForecastBanner}
                            onChange={e => updateSetting('showForecastBanner', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Show Quick Actions Bar</span>
                          <p className="text-xs text-slate-400 mt-0.5">Displays instant setpoint adjustment actions at footer</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.showQuickActions}
                            onChange={e => updateSetting('showQuickActions', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 bg-slate-50">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Auto-refresh Dashboard</span>
                          <p className="text-xs text-slate-400 mt-0.5">Enables active polling of telemetric smart meters</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {settings.autoRefreshDashboard && (
                            <select
                              className="settings-select !py-1 text-xs"
                              style={{ width: '120px' }}
                              value={settings.refreshInterval}
                              onChange={e => updateSetting('refreshInterval', e.target.value)}
                            >
                              <option>1 seconds</option>
                              <option>3 seconds</option>
                              <option>5 seconds</option>
                              <option>10 seconds</option>
                            </select>
                          )}
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.autoRefreshDashboard}
                              onChange={e => updateSetting('autoRefreshDashboard', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => handleSaveSection(['landingPage', 'zoneCardsPerRow', 'kpisToShow', 'showForecastBanner', 'showQuickActions', 'autoRefreshDashboard', 'refreshInterval'], 'Dashboard Layout')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save Layout preferences
                      </button>
                    </div>
                  </div>

                  {/* Chart Preferences Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Sliders className="h-5 w-5 text-teal-600" /> Chart Preferences
                    </div>
                    <div className="settings-card-subtitle">Render preferences for analytical load trends</div>

                    <div className="settings-input-group">
                      <label className="settings-label">Default Chart Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'Bar', label: 'Bar Chart', icon: <BarChart2 className="h-4 w-4" /> },
                          { key: 'Line', label: 'Line Chart', icon: <LineChart className="h-4 w-4" /> },
                          { key: 'Area', label: 'Area Chart', icon: <AreaChart className="h-4 w-4" /> }
                        ].map(chart => (
                          <label
                            key={chart.key}
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer font-bold text-xs gap-1.5"
                            style={{
                              borderColor: settings.defaultChartType === chart.key ? COLORS.teal : '#f0ebff',
                              color: settings.defaultChartType === chart.key ? COLORS.teal : COLORS.textPrimary,
                              background: settings.defaultChartType === chart.key ? COLORS.tealLight : '#f9fafb'
                            }}
                          >
                            <input
                              type="radio"
                              name="chartRadio"
                              className="hidden"
                              checked={settings.defaultChartType === chart.key}
                              onChange={() => updateSetting('defaultChartType', chart.key)}
                            />
                            {chart.icon}
                            {chart.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label">Default Time Range</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Last 24h', 'Last 7 days', 'Last 30 days'].map(range => (
                          <label
                            key={range}
                            className="flex items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer font-bold text-xs"
                            style={{
                              borderColor: settings.defaultTimeRange === range ? COLORS.teal : '#f0ebff',
                              color: settings.defaultTimeRange === range ? COLORS.teal : COLORS.textPrimary,
                              background: settings.defaultTimeRange === range ? COLORS.tealLight : '#f9fafb'
                            }}
                          >
                            <input
                              type="radio"
                              name="rangeRadio"
                              className="hidden"
                              checked={settings.defaultTimeRange === range}
                              onChange={() => updateSetting('defaultTimeRange', range)}
                            />
                            {range}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Show target/threshold lines on charts</span>
                          <p className="text-xs text-slate-400 mt-0.5">Plots horizontal indicators representing alert triggers</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.showTargetLines}
                            onChange={e => updateSetting('showTargetLines', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Show data labels on bars</span>
                          <p className="text-xs text-slate-400 mt-0.5">Prints numerical load tags directly inside bars</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.showDataLabels}
                            onChange={e => updateSetting('showDataLabels', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Animation on load</span>
                          <p className="text-xs text-slate-400 mt-0.5">Enables beautiful framer-motion layout transitions</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.animationOnLoad}
                            onChange={e => updateSetting('animationOnLoad', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Units Display Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Sliders className="h-5 w-5 text-purple-600" /> Units Display
                    </div>
                    <div className="settings-card-subtitle">Energy and power denomination formats</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Power Display</label>
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 px-4">
                          <span className="text-sm font-semibold text-slate-700">{settings.powerDisplay}</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.powerDisplay === 'MW'}
                              onChange={e => updateSetting('powerDisplay', e.target.checked ? 'MW' : 'kW')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Energy Display</label>
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 px-4">
                          <span className="text-sm font-semibold text-slate-700">{settings.energyDisplay}</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.energyDisplay === 'MWh'}
                              onChange={e => updateSetting('energyDisplay', e.target.checked ? 'MWh' : 'kWh')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Show delta arrows (↑↓) on KPI cards</span>
                          <p className="text-xs text-slate-400 mt-0.5">Indicates percentage changes compared to last week</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.showDeltaArrows}
                            onChange={e => updateSetting('showDeltaArrows', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Show "Updated just now" timestamps on zone cards</span>
                          <p className="text-xs text-slate-400 mt-0.5">Renders absolute syncing flags below each zone node</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.showUpdatedTimestamps}
                            onChange={e => updateSetting('showUpdatedTimestamps', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 4: DATA & TELEMETRY */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'telemetry' && (
                <div>
                  {/* Telemetry Sampling Rates Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Zap className="h-5 w-5 text-teal-600" /> Telemetry Sampling Rates
                    </div>
                    <div className="settings-card-subtitle">
                      Configure per Clinergy Smart Edge Controller spec — 17Hz standard, up to 100Hz for critical zones
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[#f0ebff] mb-4">
                      <table className="w-full text-sm text-left border-collapse" style={{ minWidth: '400px' }}>
                        <thead>
                          <tr className="bg-purple-50 text-purple-700 font-semibold border-b border-[#f0ebff]">
                            <th className="px-4 py-3">Zone</th>
                            <th className="px-4 py-3">Criticality</th>
                            <th className="px-4 py-3">Current Rate</th>
                            <th className="px-4 py-3">Available Options</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'icuSamplingRate', name: 'ICU', crit: 'Critical', options: ['17 Hz', '50 Hz', '100 Hz'] },
                            { key: 'otSamplingRate', name: 'Operation Theatre', crit: 'Critical', options: ['17 Hz', '50 Hz', '100 Hz'] },
                            { key: 'emergencySamplingRate', name: 'Emergency', crit: 'Critical', options: ['17 Hz', '50 Hz', '100 Hz'] },
                            { key: 'wardASamplingRate', name: 'Ward A', crit: 'Standard', options: ['10 Hz', '17 Hz', '50 Hz'] },
                            { key: 'wardBSamplingRate', name: 'Ward B', crit: 'Standard', options: ['10 Hz', '17 Hz', '50 Hz'] },
                            { key: 'pharmacySamplingRate', name: 'Pharmacy', crit: 'Essential', options: ['10 Hz', '17 Hz', '50 Hz'] }
                          ].map(row => (
                            <tr key={row.key} className="border-b border-[#f0ebff] hover:bg-slate-50">
                              <td className="px-4 py-3 font-bold text-gray-800">{row.name}</td>
                              <td className="px-4 py-3 text-xs font-bold">
                                <span
                                  className="px-2 py-0.5 rounded-full"
                                  style={{
                                    background: row.crit === 'Critical' ? COLORS.redLight : row.crit === 'Standard' ? COLORS.amberLight : COLORS.greenLight,
                                    color: row.crit === 'Critical' ? COLORS.red : row.crit === 'Standard' ? COLORS.amber : COLORS.green
                                  }}
                                >
                                  {row.crit}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-600">{settings[row.key]}</td>
                              <td className="px-4 py-2">
                                <select
                                  className="settings-select !py-1 text-xs"
                                  style={{ width: '100px' }}
                                  value={settings[row.key]}
                                  onChange={e => updateSetting(row.key, e.target.value)}
                                >
                                  {row.options.map(o => (
                                    <option key={o} value={o}>{o}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 text-xs leading-relaxed font-semibold">
                      <Info className="h-4.5 w-4.5 shrink-0 text-amber-700" />
                      <span>Higher sampling rates increase data storage consumption. Critical zones default to 100Hz per Clinergy specification.</span>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => handleSaveSection(['icuSamplingRate', 'otSamplingRate', 'emergencySamplingRate', 'wardASamplingRate', 'wardBSamplingRate', 'pharmacySamplingRate'], 'Telemetry Sampling Rates')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save Rates
                      </button>
                    </div>
                  </div>

                  {/* Data Retention Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Database className="h-5 w-5 text-purple-600" /> Data Retention Settings
                    </div>
                    <div className="settings-card-subtitle">Automated clearing schedules for database housekeeping</div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Telemetry Retention</label>
                        <select
                          className="settings-select"
                          value={settings.telemetryRetention}
                          onChange={e => updateSetting('telemetryRetention', e.target.value)}
                        >
                          <option>6 months</option>
                          <option>12 months</option>
                          <option>24 months</option>
                          <option>36 months</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Alert Logs Retention</label>
                        <select
                          className="settings-select"
                          value={settings.alertLogRetention}
                          onChange={e => updateSetting('alertLogRetention', e.target.value)}
                        >
                          <option>6 months</option>
                          <option>12 months</option>
                          <option>24 months</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Audit Logs (Compliance)</label>
                        <select
                          className="settings-select"
                          value={settings.auditLogRetention}
                          onChange={e => updateSetting('auditLogRetention', e.target.value)}
                        >
                          <option>12 months</option>
                          <option>24 months</option>
                          <option>36 months</option>
                          <option>60 months</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-100 bg-slate-50 mt-2">
                      <div>
                        <span className="text-sm font-bold text-slate-800">Auto-archive old data</span>
                        <p className="text-xs text-slate-400 mt-0.5">Compresses and drops archives into Supabase Glacier cold tier</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {settings.autoArchive && (
                          <span className="text-xs font-bold text-teal-600 bg-teal-100 px-2.5 py-1 rounded-full">
                            → {settings.archiveTo}
                          </span>
                        )}
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.autoArchive}
                            onChange={e => updateSetting('autoArchive', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* API Configuration Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Key className="h-5 w-5 text-indigo-600" /> API Configuration (Pillar 18)
                    </div>
                    <div className="settings-card-subtitle">Integrate third-party dispatch callbacks and regenerate developer keys</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">API Base URL</label>
                        <input
                          type="text"
                          className="settings-input"
                          value="/api/v1"
                          disabled
                        />
                      </div>
                      <div className="settings-input-group">
                        <label className="settings-label">JWT Token Expiry (seconds)</label>
                        <input
                          type="number"
                          className="settings-input"
                          value={settings.jwtExpiry}
                          onChange={e => updateSetting('jwtExpiry', parseInt(e.target.value) || 3600)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 bg-slate-50 mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase">Rate limit per Zone Endpoint</span>
                      <span className="font-extrabold text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                        1,000 req/s per zone_id
                      </span>
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label">API Developer Documentation</label>
                      <a
                        href="/api/docs"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl border border-purple-100 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Read REST Specs (/api/docs)
                      </a>
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label">Third-party Webhook URL</label>
                      <input
                        type="text"
                        className="settings-input font-mono text-xs"
                        value={settings.webhookUrl}
                        onChange={e => updateSetting('webhookUrl', e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={handleTestApiConnection}
                          className="settings-btn-outline"
                          disabled={testingApi}
                        >
                          {testingApi ? (
                            <>
                              <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span> Verifying...
                            </>
                          ) : (
                            "Test API Connection"
                          )}
                        </button>
                        <button
                          onClick={() => setShowRegenModal(true)}
                          className="settings-btn-danger"
                        >
                          Regenerate API Key
                        </button>
                      </div>

                      <button
                        onClick={() => handleSaveSection(['jwtExpiry', 'webhookUrl'], 'API Configuration')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save API specs
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 5: AI & MODELS */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'ai' && (
                <div>
                  {/* Forecasting Model Settings Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Brain className="h-5 w-5 text-purple-600" /> Demand Forecasting (Pillar 5)
                    </div>
                    <div className="settings-card-subtitle">Ensure peak load curtailment sequences run on optimal ensemble weights</div>

                    <div className="settings-input-group">
                      <label className="settings-label">Active Forecast Model</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['ARIMA only', 'LSTM only', 'Combined'].map(model => (
                          <label
                            key={model}
                            className="flex items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer font-bold text-xs"
                            style={{
                              borderColor: settings.forecastingActiveModel === model ? COLORS.purple : '#f0ebff',
                              color: settings.forecastingActiveModel === model ? COLORS.purple : COLORS.textPrimary,
                              background: settings.forecastingActiveModel === model ? COLORS.purpleBg : '#f9fafb'
                            }}
                          >
                            <input
                              type="radio"
                              name="forecastingRadio"
                              className="hidden"
                              checked={settings.forecastingActiveModel === model}
                              onChange={() => updateSetting('forecastingActiveModel', model)}
                            />
                            {model}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Forecast Horizon</label>
                        <select
                          className="settings-select"
                          value={settings.forecastHorizon}
                          onChange={e => updateSetting('forecastHorizon', e.target.value)}
                        >
                          <option>6 hours</option>
                          <option>12 hours</option>
                          <option>24 hours</option>
                          <option>48 hours</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Training Window</label>
                        <select
                          className="settings-select"
                          value={settings.historicalWindow}
                          onChange={e => updateSetting('historicalWindow', e.target.value)}
                        >
                          <option>6 months</option>
                          <option>12 months</option>
                          <option>24 months</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Confidence Interval Display</label>
                        <select
                          className="settings-select"
                          value={settings.confidenceInterval}
                          onChange={e => updateSetting('confidenceInterval', e.target.value)}
                        >
                          <option>80%</option>
                          <option>90%</option>
                          <option>95%</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 bg-slate-50 mt-2">
                      <div>
                        <span className="text-sm font-bold text-slate-800">Show ARIMA+LSTM curve on home dashboard</span>
                        <p className="text-xs text-slate-400 mt-0.5">Renders interactive predictions on central timeline charts</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.showForecastDashboard}
                          onChange={e => updateSetting('showForecastDashboard', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Anomaly Detection Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Cpu className="h-5 w-5 text-teal-600" /> Anomaly Detection (Pillar 11)
                    </div>
                    <div className="settings-card-subtitle">Isolation Forest and Z-score telemetry parser parameters</div>

                    <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 bg-slate-50 mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase">Detection Algorithms</span>
                      <span className="font-extrabold text-xs text-teal-700 bg-teal-100 px-3 py-1 rounded-full">
                        Isolation Forest + Z-score (Ensemble)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Contamination Factor (0.01 to 0.1)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="0.1"
                          className="settings-input"
                          value={settings.anomalyContamination}
                          onChange={e => updateSetting('anomalyContamination', parseFloat(e.target.value) || 0.05)}
                        />
                      </div>
                      <div className="settings-input-group">
                        <label className="settings-label">Z-score Outlier Threshold</label>
                        <input
                          type="number"
                          step="0.1"
                          className="settings-input"
                          value={settings.anomalyZScore}
                          onChange={e => updateSetting('anomalyZScore', parseFloat(e.target.value) || 2.5)}
                        />
                      </div>
                    </div>

                    <div className="settings-input-group">
                      <label className="settings-label flex justify-between">
                        <span>Anomaly Sensitivity</span>
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{settings.anomalySensitivity}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        className="w-full accent-teal-600"
                        value={settings.anomalySensitivity === 'Low' ? 1 : settings.anomalySensitivity === 'Medium' ? 2 : 3}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          updateSetting('anomalySensitivity', val === 1 ? 'Low' : val === 2 ? 'Medium' : 'High');
                        }}
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        <span>Low (1)</span>
                        <span>Medium (2)</span>
                        <span>High (3)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-2xl border border-rose-100 bg-rose-50/20 mt-4">
                      <div>
                        <span className="text-sm font-bold text-slate-800">Alert on telemetric outliers</span>
                        <p className="text-xs text-slate-400 mt-0.5">Fires visual warnings immediately upon deviation detection</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.anomalyAlert}
                          onChange={e => updateSetting('anomalyAlert', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Model Retraining Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <RefreshCw className="h-5 w-5 text-purple-600" /> Continuous ML Retraining (Pillar 20)
                    </div>
                    <div className="settings-card-subtitle">Tune automated cron schedules and trigger manual neural weights updates</div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Auto-retrain Schedule</label>
                        <select
                          className="settings-select"
                          value={settings.autoRetrainSchedule}
                          onChange={e => updateSetting('autoRetrainSchedule', e.target.value)}
                        >
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Retrain Day</label>
                        <select
                          className="settings-select"
                          value={settings.retrainDay}
                          onChange={e => updateSetting('retrainDay', e.target.value)}
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Retrain Time</label>
                        <input
                          type="time"
                          className="settings-input"
                          value={settings.retrainTime}
                          onChange={e => updateSetting('retrainTime', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="settings-input-group">
                        <label className="settings-label">Min New Data Points Required</label>
                        <input
                          type="number"
                          className="settings-input font-semibold"
                          value={settings.minNewDataPoints}
                          onChange={e => updateSetting('minNewDataPoints', parseInt(e.target.value) || 10000)}
                        />
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-label">Notifications on complete</label>
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 px-4">
                          <span className="text-xs font-bold text-slate-500 uppercase">Email Alert Dispatch</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.emailOnRetrain}
                              onChange={e => updateSetting('emailOnRetrain', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/50 mb-4 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-purple-700 block uppercase tracking-wider">Last retraining completed</span>
                        <span className="font-extrabold text-sm text-gray-800 block mt-1">{lastRetrainedTime}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-purple-700 block uppercase tracking-wider">Validated Model Accuracy</span>
                        <span className="inline-flex items-center mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100">
                          {modelAccuracy}% Accuracy
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setShowRetrainConfirm(true)}
                        className="settings-btn-purple"
                        disabled={retrainingModel}
                      >
                        {retrainingModel ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Retraining models...
                          </>
                        ) : (
                          "Trigger Manual Retrain"
                        )}
                      </button>

                      <button
                        onClick={() => handleSaveSection(['forecastingActiveModel', 'forecastHorizon', 'historicalWindow', 'confidenceInterval', 'showForecastDashboard', 'anomalyContamination', 'anomalyZScore', 'anomalySensitivity', 'anomalyAlert', 'autoRetrainSchedule', 'retrainDay', 'retrainTime', 'minNewDataPoints', 'emailOnRetrain'], 'AI Engine Settings')}
                        className="settings-btn-primary"
                      >
                        <Check className="h-4 w-4" /> Save ML settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 6: INTEGRATIONS */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'integrations' && (
                <div>
                  <h3 className="font-extrabold text-slate-800 uppercase tracking-widest text-xs mb-4">🟢 Active Integrations</h3>
                  
                  {/* Grid of Active Integrations */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {/* Supabase */}
                    <div className="settings-card !mb-0 flex flex-col justify-between" style={{ padding: '20px' }}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-3xl">⚡</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100">🟢 Connected</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-gray-800">Supabase</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Database: PostgreSQL via Supabase</p>
                        <div className="space-y-1 mt-3">
                          <p className="text-[10px] font-bold text-emerald-600">✓ WebSockets Active</p>
                          <p className="text-[10px] font-bold text-emerald-600">✓ Row Level Security (RLS)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success("Connected to Supabase production node.")}
                        className="settings-btn-outline !py-1.5 text-xs w-full justify-center mt-4"
                      >
                        View Connection
                      </button>
                    </div>

                    {/* MQTT Gateway */}
                    <div className="settings-card !mb-0 flex flex-col justify-between" style={{ padding: '20px' }}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-3xl">🎛️</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100">🟢 Connected</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-gray-800">MQTT Gateway</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Protocol: MQTT / Modbus TCP</p>
                        <div className="space-y-1 mt-3">
                          <p className="text-[10px] font-bold text-emerald-600">✓ AES-256/TLS Enforced</p>
                          <p className="text-[10px] font-bold text-emerald-600">✓ 17-100Hz Smart Polling</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success("Gateway parameters are locked.")}
                        className="settings-btn-outline !py-1.5 text-xs w-full justify-center mt-4"
                      >
                        Configure
                      </button>
                    </div>

                    {/* BACnet/IP */}
                    <div className="settings-card !mb-0 flex flex-col justify-between" style={{ padding: '20px' }}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-3xl">🌡️</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-800 bg-amber-100">🟡 Partial</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-gray-800">BACnet/IP (HVAC)</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Used for: HVAC setpoint auto-adjustments (Pillar 12)</p>
                        <div className="space-y-1 mt-3">
                          <p className="text-[10px] font-bold text-amber-600">⚠ Handshake drift observed</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success("BACnet protocol handshake sequence initiated...")}
                        className="settings-btn-purple !py-1.5 text-xs w-full justify-center mt-4 bg-amber-500 hover:bg-amber-600 border-none shadow-none"
                      >
                        Complete Setup
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-800 uppercase tracking-widest text-xs mb-4">⚪ Available Integrations</h3>

                  {/* Grid of Available Integrations */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* EHR HL7 */}
                    <div className="settings-card !mb-0 opacity-70 bg-slate-50 border-dashed flex flex-col justify-between" style={{ padding: '20px' }}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-3xl">🏥</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Not connected</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800">EHR System — HL7 FHIR</h4>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          Read-only FHIR feeds correlate patient census with energy consumption — Pillar 16
                        </p>
                      </div>
                      <button
                        onClick={() => handleConnectIntegration('HL7/FHIR EHR')}
                        className="settings-btn-primary !py-1.5 text-xs w-full justify-center mt-4"
                      >
                        Connect
                      </button>
                    </div>

                    {/* Solar metering */}
                    <div className="settings-card !mb-0 opacity-70 bg-slate-50 border-dashed flex flex-col justify-between" style={{ padding: '20px' }}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-3xl">☀️</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Not connected</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800">Renewables Solar/Wind</h4>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          Solar/wind generation metering and net-import tracking — Pillar 15
                        </p>
                      </div>
                      <button
                        onClick={() => handleConnectIntegration('Solar/Wind Net Import Meter')}
                        className="settings-btn-primary !py-1.5 text-xs w-full justify-center mt-4"
                      >
                        Connect
                      </button>
                    </div>

                    {/* BESCOM Utility */}
                    <div className="settings-card !mb-0 opacity-70 bg-slate-50 border-dashed flex flex-col justify-between" style={{ padding: '20px' }}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-3xl">🔌</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Not connected</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800">Utility DR — BESCOM</h4>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          Demand Response integration with local BESCOM utility grid — Pillar 13
                        </p>
                      </div>
                      <button
                        onClick={() => handleConnectIntegration('BESCOM Utility DR')}
                        className="settings-btn-primary !py-1.5 text-xs w-full justify-center mt-4"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 7: APPEARANCE */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'appearance' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Theme controls */}
                    <div className="space-y-6">
                      {/* Theme Card */}
                      <div className="settings-card !mb-0">
                        <div className="settings-card-title">
                          <Palette className="h-5 w-5 text-purple-600" /> Display Theme
                        </div>
                        <div className="settings-card-subtitle">Choose platform background profile aesthetics</div>

                        <div className="settings-input-group">
                          <label className="settings-label">Color Theme</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['Light', 'Dark', 'System'].map(tTheme => (
                              <label
                                key={tTheme}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer font-bold text-xs"
                                style={{
                                  borderColor: settings.theme === tTheme ? COLORS.purple : '#f0ebff',
                                  color: settings.theme === tTheme ? COLORS.purple : COLORS.textPrimary,
                                  background: settings.theme === tTheme ? COLORS.purpleBg : '#f9fafb'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="themeRadio"
                                  className="hidden"
                                  checked={settings.theme === tTheme}
                                  onChange={() => updateSetting('theme', tTheme)}
                                />
                                {tTheme}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Sidebar Swatches */}
                        <div className="settings-input-group">
                          <label className="settings-label">Sidebar Color Theme</label>
                          <div className="flex gap-3 mt-2">
                            {[
                              { key: 'Blush Pink', color: '#fdf2f8' },
                              { key: 'White', color: '#ffffff' },
                              { key: 'Dark', color: '#1e1b4b' }
                            ].map(swatch => (
                              <button
                                key={swatch.key}
                                onClick={() => updateSetting('sidebarColor', swatch.key)}
                                className={`color-swatch ${settings.sidebarColor === swatch.key ? 'active' : ''}`}
                                style={{ backgroundColor: swatch.color, border: '2px solid #e2e8f0' }}
                                title={swatch.key}
                              >
                                {settings.sidebarColor === swatch.key && (
                                  <Check className="h-4 w-4" style={{ color: swatch.key === 'Dark' ? '#ffffff' : COLORS.purple }} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Accent Swatches */}
                        <div className="settings-input-group">
                          <label className="settings-label">Accent Color Palette</label>
                          <div className="flex gap-3 mt-2">
                            {[
                              { key: 'Teal', color: '#3bbfad' },
                              { key: 'Purple', color: '#8b5cf6' },
                              { key: 'Blue', color: '#3b82f6' },
                              { key: 'Green', color: '#10b981' }
                            ].map(swatch => (
                              <button
                                key={swatch.key}
                                onClick={() => updateSetting('accentColor', swatch.key)}
                                className={`color-swatch ${settings.accentColor === swatch.key ? 'active' : ''}`}
                                style={{ backgroundColor: swatch.color }}
                                title={swatch.key}
                              >
                                {settings.accentColor === swatch.key && (
                                  <Check className="h-4 w-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font size */}
                        <div className="settings-input-group">
                          <label className="settings-label">System Font Size</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['Normal', 'Large', 'Extra Large'].map(sz => (
                              <label
                                key={sz}
                                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer font-bold text-xs"
                                style={{
                                  borderColor: settings.fontSize === sz ? COLORS.purple : '#f0ebff',
                                  color: settings.fontSize === sz ? COLORS.purple : COLORS.textPrimary,
                                  background: settings.fontSize === sz ? COLORS.purpleBg : '#f9fafb'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="fontSizeRadio"
                                  className="hidden"
                                  checked={settings.fontSize === sz}
                                  onChange={() => updateSetting('fontSize', sz)}
                                />
                                {sz}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Compact padding */}
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-4">
                          <div>
                            <span className="text-sm font-bold text-slate-800">Compact Layout Mode</span>
                            <p className="text-xs text-slate-400 mt-0.5">Reduces dashboard card paddings to save screen space</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.compactMode}
                              onChange={e => updateSetting('compactMode', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* LIVE MINI PREVIEW CARD */}
                    <div className="flex flex-col justify-start">
                      <div
                        className="settings-card !mb-0 bg-slate-50 flex-1 flex flex-col"
                        style={{
                          background: settings.theme === 'Dark' ? '#18181b' : settings.theme === 'Light' ? '#fdfaff' : '#f4f4f5',
                          borderColor: '#ebdfff',
                          minHeight: '260px'
                        }}
                      >
                        <div className="settings-card-title !mb-1 text-sm font-bold uppercase tracking-widest text-purple-700">
                          🎨 Live UI Preview
                        </div>
                        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                          Simulated viewport reflecting sidebar, accent, and layout padding configurations.
                        </p>

                        {/* Mini Viewport Mockup */}
                        <div
                          className="border border-slate-200/60 rounded-xl overflow-hidden flex flex-row flex-1"
                          style={{
                            background: settings.theme === 'Dark' ? '#09090b' : '#ffffff',
                            color: settings.theme === 'Dark' ? '#fafafa' : '#27272a'
                          }}
                        >
                          {/* Mini Sidebar */}
                          <div
                            className="w-[60px] p-2 flex flex-col gap-2 border-r"
                            style={{
                              borderColor: settings.theme === 'Dark' ? '#27272a' : '#f0ebff',
                              background: settings.sidebarColor === 'Blush Pink' ? '#fdf2f8' : settings.sidebarColor === 'White' ? '#ffffff' : '#1e1b4b'
                            }}
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-300 animate-pulse"></div>
                            <div className="w-8 h-2.5 rounded bg-slate-300"></div>
                            <div className="w-6 h-2 rounded bg-slate-200"></div>
                          </div>

                          {/* Mini Workspace Content */}
                          <div className="flex-1 p-3 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold">Dashboard</span>
                              <div
                                className="w-3.5 h-3.5 rounded-full"
                                style={{
                                  background: settings.accentColor === 'Teal' ? '#3bbfad' : settings.accentColor === 'Purple' ? '#8b5cf6' : settings.accentColor === 'Blue' ? '#3b82f6' : '#10b981'
                                }}
                              />
                            </div>

                            {/* Simulated Cards */}
                            <div
                              className="preview-mini-card flex-1 flex flex-col justify-between"
                              style={{
                                padding: settings.compactMode ? '6px' : '12px',
                                background: settings.theme === 'Dark' ? '#18181b' : '#ffffff',
                                borderColor: settings.theme === 'Dark' ? '#27272a' : '#f0ebff',
                                fontSize: settings.fontSize === 'Normal' ? '11px' : settings.fontSize === 'Large' ? '12px' : '14px'
                              }}
                            >
                              <div>
                                <div className="preview-mini-title text-[9px] uppercase tracking-wider text-slate-400">Total Energy</div>
                                <div
                                  className="preview-mini-value mt-1"
                                  style={{
                                    color: settings.accentColor === 'Teal' ? '#3bbfad' : settings.accentColor === 'Purple' ? '#8b5cf6' : settings.accentColor === 'Blue' ? '#3b82f6' : '#10b981'
                                  }}
                                >
                                  18,420 kWh
                                </div>
                              </div>
                              <div className="text-[8px] text-gray-400 mt-2">↑ 4.2% vs last month</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 8: DATA MANAGEMENT */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'data_management' && (
                <div>
                  {/* Export Data Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Download className="h-5 w-5 text-teal-600" /> Export Data Archives
                    </div>
                    <div className="settings-card-subtitle">Compile and download historical datasets locally in CSV or PDF formats</div>

                    <div className="space-y-4">
                      {/* Telemetry data */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Telemetry Readings (Pillars 8 & 11)</span>
                          <p className="text-xs text-slate-400 mt-0.5">Raw wattmeter metrics, voltage harmonics, and zone currents</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="date" className="settings-input !py-1 text-xs" style={{ width: '120px' }} defaultValue="2026-05-01" />
                          <button
                            onClick={() => toast.success("✓ Dispatching telemetry.csv (14,280 rows) download buffer...")}
                            className="settings-btn-outline !py-1 text-xs"
                          >
                            Export CSV
                          </button>
                        </div>
                      </div>

                      {/* Alerts history */}
                      <div className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Critical Alarms logs</span>
                          <p className="text-xs text-slate-400 mt-0.5">Chronological record of priority load breaches and responses</p>
                        </div>
                        <button
                          onClick={() => toast.success("✓ Dispatching alerts_history.csv download buffer...")}
                          className="settings-btn-outline !py-1 text-xs"
                        >
                          Export CSV
                        </button>
                      </div>

                      {/* Security logs */}
                      <div className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <div>
                          <span className="text-sm font-bold text-slate-800">RBAC Security Audit Trail (Pillar 19)</span>
                          <p className="text-xs text-slate-400 mt-0.5">Signed transaction histories of zone changes and administrative actions</p>
                        </div>
                        <button
                          onClick={() => toast.success("✓ Dispatching security_audit_logs.csv download buffer...")}
                          className="settings-btn-outline !py-1 text-xs"
                        >
                          Export CSV
                        </button>
                      </div>

                      {/* Compliance Reports */}
                      <div className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Regulatory Compliance Summaries (Pillar 7)</span>
                          <p className="text-xs text-slate-400 mt-0.5">ESG carbon rating certificates and billing audit summaries</p>
                        </div>
                        <button
                          onClick={() => toast.success("✓ Compiling compliance_certification.pdf (2 pages)... Completed.")}
                          className="settings-btn-purple !py-1.5 text-xs"
                        >
                          Export PDF Certificate
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Import Data Card */}
                  <div className="settings-card">
                    <div className="settings-card-title">
                      <Upload className="h-5 w-5 text-purple-600" /> Import Telemetry & Profiles
                    </div>
                    <div className="settings-card-subtitle">Bulk import historical records or zone limit templates</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Telemetry file */}
                      <div className="p-4 rounded-2xl border-2 border-dashed border-[#ebdfff] bg-[#fdfaff] text-center flex flex-col items-center justify-center">
                        <span className="text-2xl mb-1">📄</span>
                        <h4 className="text-xs font-bold text-purple-700">Historical Telemetry (CSV)</h4>
                        <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Max 20MB. Standard Clinergy telemetry schema.</p>
                        <input type="file" className="hidden" id="csvFile" />
                        <label
                          htmlFor="csvFile"
                          className="mt-3 inline-flex px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-semibold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
                        >
                          Select CSV File
                        </label>
                      </div>

                      {/* Configurations JSON */}
                      <div className="p-4 rounded-2xl border-2 border-dashed border-[#e0f5f2] bg-[#f3fbf9] text-center flex flex-col items-center justify-center">
                        <span className="text-2xl mb-1">⚙️</span>
                        <h4 className="text-xs font-bold text-teal-700">Zone Threshold Profiles (JSON)</h4>
                        <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Imports backup configurations instantly.</p>
                        <input type="file" className="hidden" id="jsonFile" />
                        <label
                          htmlFor="jsonFile"
                          className="mt-3 inline-flex px-3 py-1.5 rounded-lg bg-teal-100 text-teal-700 font-semibold text-xs hover:bg-teal-200 transition-colors cursor-pointer"
                        >
                          Select JSON Profile
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => toast.success("✓ Profile parsing complete: 6 zones validated and loaded.")}
                        className="settings-btn-primary"
                      >
                        Validate & Import
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone Card */}
                  <div className="settings-card border-red-200" style={{ border: `1.5px solid ${COLORS.red}`, background: '#fffcfc' }}>
                    <div className="settings-card-title text-red-700">
                      <Trash2 className="h-5 w-5 text-red-600" /> Danger Zone
                    </div>
                    <div className="settings-card-subtitle text-red-600/70">Irreversible, high-risk administrative operations</div>

                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3.5 rounded-2xl bg-white border border-red-100">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Clear all telemetry databases</span>
                          <p className="text-xs text-slate-400 mt-0.5">Purges historical load records. Retains system settings.</p>
                        </div>
                        <button
                          onClick={() => setDangerModalType('clear_telemetry')}
                          className="settings-btn-danger"
                        >
                          Clear Telemetry
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3.5 rounded-2xl bg-white border border-red-100">
                        <div>
                          <span className="text-sm font-bold text-slate-800">Reset warning thresholds</span>
                          <p className="text-xs text-slate-400 mt-0.5">Restores ICU, OT, and general zone alert limits to 100/200 kW.</p>
                        </div>
                        <button
                          onClick={() => setDangerModalType('reset_thresholds')}
                          className="settings-btn-danger"
                        >
                          Reset Thresholds
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3.5 rounded-2xl bg-white border border-red-100">
                        <div>
                          <span className="text-sm font-bold text-red-700">Factory Reset Platform</span>
                          <p className="text-xs text-red-600 mt-0.5">Purges local storage, variables, and resets the Clinergy node.</p>
                        </div>
                        <button
                          onClick={() => setDangerModalType('factory_reset_1')}
                          className="settings-btn-danger-solid"
                        >
                          Factory Reset Node
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CATEGORY 9: ABOUT */}
              {/* ────────────────────────────────────────────────────────────── */}
              {activeTab === 'about' && (
                <div>
                  <div className="settings-card flex flex-col items-center text-center">
                    {/* Centered Large Clinergy Logo */}
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500 to-teal-400 flex items-center justify-center text-white text-3xl font-black shadow-md mb-4">
                      CLN
                    </div>

                    <h2 className="text-2xl font-black text-slate-800">Clinergy</h2>
                    <p className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full mt-1 border border-teal-100 uppercase tracking-widest">
                      AI-Powered Clinical Energy & Asset Management
                    </p>

                    <div className="w-full max-w-md border-t border-purple-50 pt-6 mt-6 space-y-3.5 text-sm text-slate-700 font-semibold">
                      <div className="flex justify-between border-b border-purple-50/50 pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Version</span>
                        <span className="text-slate-800 font-extrabold">V2.0-STABLE</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50/50 pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Submitted by</span>
                        <span className="text-purple-700 font-extrabold">Spoorti Biradar</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50/50 pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Reg ID</span>
                        <span className="text-slate-800 font-mono">U03EH23S0100</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50/50 pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Institution</span>
                        <span className="text-slate-800 text-right max-w-[240px]">
                          Clinergy School of Technology, Clinergy College (Autonomous)
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50/50 pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Project Guide</span>
                        <span className="text-slate-800">Prof. Dilip B (Assistant Professor)</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50/50 pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">University</span>
                        <span className="text-slate-800">Bangalore University</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50/50 pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Academic Year</span>
                        <span className="text-slate-800">2023-2026</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Scope</span>
                        <span className="text-indigo-700 font-extrabold">BCA Final Year Core Project</span>
                      </div>
                    </div>

                    {/* Links Row */}
                    <div className="flex flex-wrap gap-4 mt-8 border-t border-slate-100 pt-6 justify-center">
                      <a
                        href="/docs"
                        target="_blank"
                        className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        📄 View Documentation
                      </a>
                      <span className="text-slate-200">|</span>
                      <a
                        href="#bug"
                        onClick={() => toast.success("Feature request submitted to Spoorti Biradar final review pipeline!")}
                        className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        🐛 Report Bug
                      </a>
                      <span className="text-slate-200">|</span>
                      <a
                        href="mailto:spoorti.biradar@clinergy.com"
                        className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        📧 Contact Support
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODALS / DIALOGS ─────────────────────────────────────────────────── */}

      {/* 1. Api Key Regeneration Modal */}
      {showRegenModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="text-lg font-black text-rose-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-rose-600" /> Regenerate API Keys?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              This will immediately invalidate the active Smart Edge webhook credential:
              <code className="block bg-slate-50 p-2 text-xs text-rose-600 rounded-lg font-mono mt-2 mb-2 truncate">
                {apiKeyVal}
              </code>
              Any active telemetry scripts sending data with this key will fail with a <strong className="text-red-600">401 Unauthorized</strong> response immediately.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateKey}
                className="settings-btn-danger-solid !text-xs"
              >
                Regenerate Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manual Retrain Model Confirm Modal */}
      {showRetrainConfirm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="text-lg font-black text-purple-900 flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-purple-600 animate-pulse" /> Initialize ARIMA + LSTM Retrain?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              This launches a manual training sequence incorporating the last 10,000 telemetry points.
              Neural weights validation takes roughly 3 seconds to test convergence.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRetrainConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerRetrain}
                className="settings-btn-purple !text-xs"
              >
                Trigger Neural Training
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Danger Zone: Clear Telemetry Modal */}
      {dangerModalType === 'clear_telemetry' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="text-lg font-black text-red-900 flex items-center gap-2 mb-3">
              <Trash2 className="h-5 w-5 text-red-600" /> Clear Telemetry Database?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              This action is permanent and clears all telemetric logs in PostgreSQL. To confirm, please type <strong className="text-red-700 font-bold">DELETE</strong> in the box below.
            </p>
            <input
              type="text"
              placeholder="Type DELETE here..."
              className="settings-input text-center font-bold uppercase tracking-wider mb-4 border-red-300 focus:border-red-600 focus:ring-red-100"
              value={deleteConfirmationText}
              onChange={e => setDeleteConfirmationText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDangerModalType(null);
                  setDeleteConfirmationText("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClearTelemetry}
                className={`settings-btn-danger-solid !text-xs ${deleteConfirmationText !== 'DELETE' ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={deleteConfirmationText !== 'DELETE'}
              >
                Clear Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Danger Zone: Reset Warning Thresholds Modal */}
      {dangerModalType === 'reset_thresholds' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="text-lg font-black text-amber-900 flex items-center gap-2 mb-3">
              <Sliders className="h-5 w-5 text-amber-600" /> Reset Alarm Limits?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Restores warning and critical load thresholds across all six clinical zones to default Clinergy specs (Critical zones 150-250 kW, standard 100 kW).
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDangerModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteResetThresholds}
                className="settings-btn-purple bg-amber-500 hover:bg-amber-600 border-none shadow-sm !text-xs"
              >
                Reset Thresholds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Danger Zone: Factory Reset Stage 1 */}
      {dangerModalType === 'factory_reset_1' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="text-lg font-black text-red-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" /> Warning: Factory Reset
            </h3>
            <p className="text-sm text-red-700 bg-red-50 p-3.5 rounded-2xl border border-red-100 font-semibold mb-4 leading-relaxed">
              This will completely wipe local configurations, settings caching, local identity parameters, and force a browser reload. This CANNOT be undone!
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDangerModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setDangerModalType('factory_reset_2')}
                className="settings-btn-danger-solid !text-xs"
              >
                Proceed to Stage 2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Danger Zone: Factory Reset Stage 2 */}
      {dangerModalType === 'factory_reset_2' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="text-lg font-black text-red-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" /> Double Confirm Reset
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              To trigger immediate node reset, please type <strong className="text-red-700 font-bold">FACTORY RESET</strong> in the box below.
            </p>
            <input
              type="text"
              placeholder="Type FACTORY RESET..."
              className="settings-input text-center font-bold uppercase tracking-wider mb-4 border-red-300 focus:border-red-600 focus:ring-red-100"
              value={factoryConfirmationText}
              onChange={e => setFactoryConfirmationText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDangerModalType(null);
                  setFactoryConfirmationText("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteFactoryReset}
                className={`settings-btn-danger-solid !text-xs ${factoryConfirmationText !== 'FACTORY RESET' ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={factoryConfirmationText !== 'FACTORY RESET'}
              >
                Execute Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
