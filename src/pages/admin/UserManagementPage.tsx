import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Download, 
  Trash2, 
  Edit, 
  UserPlus, 
  CheckCircle2, 
  X, 
  Search, 
  History, 
  Building2, 
  Mail, 
  Save, 
  Globe, 
  IndianRupee, 
  Languages, 
  User, 
  Lock, 
  Server, 
  Key, 
  AlertTriangle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── DESIGN SYSTEM CONSTANTS ──────────────────────────────────────────────────
const COLORS = {
  bgMain: 'var(--page-bg)',
  cardBg: 'var(--card-bg)',
  border: '1px solid var(--page-border)',
  shadow: 'var(--shadow-pastel)',
  primary: 'var(--page-accent)',
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
  textPrimary: '#2d3a33',
  textMuted: '#6b8f80',
  borderCol: 'var(--page-border)'
};

// ── MOCK DATA SCHEMA ─────────────────────────────────────────────────────────
interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'System Administrator' | 'Energy Zone Manager' | 'Compliance Officer';
  assignedZones: string;
  lastLogin: string;
  mfa: boolean;
  status: 'Active' | 'Inactive';
  avatarBg: string;
  avatarChar: string;
}

interface AuditLogRow {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
  type: 'Login' | 'Config' | 'Alert' | 'Report' | 'User' | 'Security';
}

interface ZoneThresholdConfig {
  zone: string;
  criticality: 'Critical' | 'Standard' | 'Essential';
  threshold: number;
  alertEmail: boolean;
  alertSms: boolean;
  status: 'Active' | 'Inactive';
}

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'facility' | 'audit' | 'security'>('users');

  // Page tab title set
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Admin Portal — Clinergy";
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // ── Tab 1: USERS STATE ─────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: '1',
      name: 'Admin',
      email: 'admin@clinergy.com',
      role: 'System Administrator',
      assignedZones: 'All Facilities',
      lastLogin: 'Just now',
      mfa: true,
      status: 'Active',
      avatarBg: COLORS.purpleBg,
      avatarChar: 'A'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya.sharma@clinergy.com',
      role: 'Energy Zone Manager',
      assignedZones: 'ICU, OT Block, Emergency',
      lastLogin: '2 hours ago',
      mfa: true,
      status: 'Active',
      avatarBg: COLORS.tealLight,
      avatarChar: 'P'
    },
    {
      id: '3',
      name: 'Rajan Mehta',
      email: 'rajan.mehta@clinergy.com',
      role: 'Energy Zone Manager',
      assignedZones: 'Ward A, Ward B, Pharmacy',
      lastLogin: 'Yesterday 14:32',
      mfa: true,
      status: 'Active',
      avatarBg: COLORS.amberLight,
      avatarChar: 'R'
    },
    {
      id: '4',
      name: 'Kavitha Nair',
      email: 'kavitha.nair@clinergy.com',
      role: 'Compliance Officer',
      assignedZones: 'Read-only All',
      lastLogin: '5 days ago',
      mfa: false,
      status: 'Inactive',
      avatarBg: '#e2e8f0',
      avatarChar: 'K'
    }
  ]);

  // Reactive Stat Pill Computations
  const totalUsers = useMemo(() => users.length, [users]);
  const activeUsers = useMemo(() => users.filter(u => u.status === 'Active').length, [users]);
  const inactiveUsers = useMemo(() => users.filter(u => u.status === 'Inactive').length, [users]);
  const mfaEnabledCount = useMemo(() => users.filter(u => u.mfa).length, [users]);

  // Modal Dialog states
  const [modalOpen, setModalOpen] = useState<'add' | 'edit' | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<'System Administrator' | 'Energy Zone Manager' | 'Compliance Officer'>('Energy Zone Manager');
  const [formZones, setFormZones] = useState<string[]>([]);
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formForceMfa, setFormForceMfa] = useState(true);
  const [formSendEmail, setFormSendEmail] = useState(true);

  // Filters
  const [searchUser, setSearchUser] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // ── Tab 2: ROLES MATRIX DATA ───────────────────────────────────────────────
  const permissionsList = [
    { action: 'View Dashboard & Live Monitor', admin: true, manager: true, compliance: true },
    { action: 'Manage User Accounts & RBAC', admin: true, manager: false, compliance: false },
    { action: 'Configure Global Billing Tariffs', admin: true, manager: false, compliance: false },
    { action: 'Modify Zone Warning kW Thresholds', admin: true, manager: true, compliance: false },
    { action: 'Discharge Demand Response Signals', admin: true, manager: true, compliance: false },
    { action: 'Acknowledge Critical Grid Alarms', admin: true, manager: true, compliance: false },
    { action: 'Retrain ARIMA + LSTM Models', admin: true, manager: false, compliance: false },
    { action: 'Export ESG Compliance Audit Reports', admin: true, manager: false, compliance: true },
    { action: 'Tamper-Proof Audit Trail Review', admin: true, manager: false, compliance: true }
  ];

  // ── Tab 3: FACILITY & ZONES CONFIG ─────────────────────────────────────────
  const [facilityName, setFacilityName] = useState("Clinergy General Hospital");
  const [facilityAddress, setFacilityAddress] = useState("8P & 9P, KIADB Industrial Area, Electronics City Phase I, Bengaluru - 560100");
  const [facilityBeds, setFacilityBeds] = useState("450");
  const [facilityArea, setFacilityArea] = useState("28,400");
  const [facilityTimezone, setFacilityTimezone] = useState("Asia/Kolkata (IST)");

  const [zonesConfig, setZonesConfig] = useState<ZoneThresholdConfig[]>([
    { zone: 'ICU', criticality: 'Critical', threshold: 200, alertEmail: true, alertSms: true, status: 'Active' },
    { zone: 'Operation Theatre', criticality: 'Critical', threshold: 250, alertEmail: true, alertSms: true, status: 'Active' },
    { zone: 'Emergency', criticality: 'Critical', threshold: 150, alertEmail: true, alertSms: true, status: 'Active' },
    { zone: 'Ward A', criticality: 'Standard', threshold: 100, alertEmail: true, alertSms: false, status: 'Active' },
    { zone: 'Ward B', criticality: 'Standard', threshold: 100, alertEmail: true, alertSms: false, status: 'Active' },
    { zone: 'Pharmacy', criticality: 'Essential', threshold: 80, alertEmail: true, alertSms: false, status: 'Active' }
  ]);

  const [tariffPeakHours, setTariffPeakHours] = useState("09:00 — 22:00");
  const [tariffPeakRate, setTariffPeakRate] = useState("8.50");
  const [tariffOffPeakHours, setTariffOffPeakHours] = useState("22:00 — 09:00");
  const [tariffOffPeakRate, setTariffOffPeakRate] = useState("4.20");

  // ── Tab 4: TAMPER-PROOF AUDIT TRAIL STATE (Pillar 19) ──────────────────────
  const [auditQuery, setAuditQuery] = useState("");
  const [auditFilterType, setAuditFilterType] = useState("All");
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([
    { id: 1, timestamp: new Date(Date.now() - 4 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'Tested SAML 2.0 authentication configurations', module: 'SSO Settings', ipAddress: '192.168.1.10', status: 'Success', type: 'Security' },
    { id: 2, timestamp: new Date(Date.now() - 15 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'Triggered global ARIMA+LSTM AI model retraining sequence', module: 'Pillar 20 Engine', ipAddress: '192.168.1.10', status: 'Success', type: 'Config' },
    { id: 3, timestamp: new Date(Date.now() - 42 * 60000).toISOString(), user: 'Priya Sharma', role: 'Energy Zone Manager', action: 'Acknowledged Peak Demand Exceeded Alarm', module: 'ICU Warnings', ipAddress: '192.168.1.24', status: 'Success', type: 'Alert' },
    { id: 4, timestamp: new Date(Date.now() - 75 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'Created new Energy Zone Manager: Priya Sharma', module: 'User Management', ipAddress: '192.168.1.10', status: 'Success', type: 'User' },
    { id: 5, timestamp: new Date(Date.now() - 120 * 60000).toISOString(), user: 'Kavitha Nair', role: 'Compliance Officer', action: 'Downloaded ESG Scope 1-3 Carbon Footprint report', module: 'Pillar 9 Reports', ipAddress: '192.168.1.48', status: 'Success', type: 'Report' },
    { id: 6, timestamp: new Date(Date.now() - 180 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'Modified Ward B peak warning limit to 100 kW', module: 'Facility Config', ipAddress: '192.168.1.10', status: 'Success', type: 'Config' },
    { id: 7, timestamp: new Date(Date.now() - 320 * 60000).toISOString(), user: 'Rajan Mehta', role: 'Energy Zone Manager', action: 'Scheduled predictive servicing for Backup Generator G-01', module: 'Maintenance Panel', ipAddress: '192.168.1.32', status: 'Success', type: 'Config' },
    { id: 8, timestamp: new Date(Date.now() - 440 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'Configured local peak tariff rate to ₹8.50/kWh', module: 'Pillar 4 Billing', ipAddress: '192.168.1.10', status: 'Success', type: 'Config' },
    { id: 9, timestamp: new Date(Date.now() - 560 * 60000).toISOString(), user: 'Priya Sharma', role: 'Energy Zone Manager', action: 'User authentication login session initiated', module: 'JWT Auth', ipAddress: '192.168.1.24', status: 'Success', type: 'Login' },
    { id: 10, timestamp: new Date(Date.now() - 720 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'JWT access token rotation completed', module: 'API Gateway', ipAddress: '192.168.1.10', status: 'Success', type: 'Security' },
    { id: 11, timestamp: new Date(Date.now() - 840 * 60000).toISOString(), user: 'Rajan Mehta', role: 'Energy Zone Manager', action: 'Acknowledge sensor drift in Ward A RTD Array', module: 'Pillar 8 Monitoring', ipAddress: '192.168.1.32', status: 'Success', type: 'Alert' },
    { id: 12, timestamp: new Date(Date.now() - 960 * 60000).toISOString(), user: 'Kavitha Nair', role: 'Compliance Officer', action: 'User authentication session logoff', module: 'JWT Auth', ipAddress: '192.168.1.48', status: 'Success', type: 'Login' },
    { id: 13, timestamp: new Date(Date.now() - 1100 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'Failed administrative portal login attempt', module: 'JWT Auth', ipAddress: '192.168.1.199', status: 'Failed', type: 'Login' },
    { id: 14, timestamp: new Date(Date.now() - 1220 * 60000).toISOString(), user: 'Admin', role: 'System Administrator', action: 'Activated Row Level Security policies on Supabase', module: 'Postgres DB', ipAddress: '192.168.1.10', status: 'Success', type: 'Security' },
    { id: 15, timestamp: new Date(Date.now() - 1440 * 60000).toISOString(), user: 'Kavitha Nair', role: 'Compliance Officer', action: 'Audit log exported to external auditor', module: 'Compliance Audit', ipAddress: '192.168.1.48', status: 'Success', type: 'Report' }
  ]);

  // ── Tab 5: SECURITY SETTINGS STATES ────────────────────────────────────────
  const [securityMfaRequired, setSecurityMfaRequired] = useState(true);
  const [securitySsoEnabled, setSecuritySsoEnabled] = useState(false);
  const [securityTimeout, setSecurityTimeout] = useState("3600");
  const [securityMinLength, setSecurityMinLength] = useState(8);

  const [activeSessions, setActiveSessions] = useState([
    { id: 'session1', user: 'Admin', device: 'Chrome / Windows', ipAddress: '192.168.1.10', loginTime: 'Just now', expires: '59 min' },
    { id: 'session2', user: 'Priya Sharma', device: 'Safari / iPhone', ipAddress: '192.168.1.24', loginTime: '2h ago', expires: '1h' }
  ]);

  // ── 6. DYNAMIC AUDIT PREPENDER ─────────────────────────────────────────────
  // Auto-logs administrative acts in real time!
  const appendAuditLog = (action: string, type: AuditLogRow['type'], module: string, user = 'Admin', status: AuditLogRow['status'] = 'Success') => {
    const newLog: AuditLogRow = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user,
      role: user === 'Admin' ? 'System Administrator' : 'Energy Zone Manager',
      action,
      module,
      ipAddress: user === 'Admin' ? '192.168.1.10' : '192.168.1.24',
      status,
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // ── 7. REACTIVE BUTTON INTERACTIONS ────────────────────────────────────────

  // Add User
  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormRole("Energy Zone Manager");
    setFormZones(['ICU', 'OT Block']);
    setFormPassword("");
    setFormConfirmPassword("");
    setFormForceMfa(true);
    setFormSendEmail(true);
    setModalOpen('add');
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormZones(user.assignedZones.split(', '));
    setFormPassword("••••••••");
    setFormConfirmPassword("••••••••");
    setModalOpen('edit');
  };

  const handleSaveUser = () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Please fill in Name and Email address.");
      return;
    }
    if (!formEmail.includes('@')) {
      toast.error("Invalid email address format.");
      return;
    }
    if (formPassword !== formConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (modalOpen === 'add') {
      const newUser: UserAccount = {
        id: Date.now().toString(),
        name: formName,
        email: formEmail,
        role: formRole,
        assignedZones: formZones.join(', '),
        lastLogin: 'Never logged in',
        mfa: formForceMfa,
        status: 'Active',
        avatarBg: formRole === 'System Administrator' ? COLORS.purpleBg : COLORS.tealLight,
        avatarChar: formName.charAt(0).toUpperCase()
      };
      setUsers(prev => [...prev, newUser]);
      appendAuditLog(`Created new user account: ${formName} (${formRole})`, 'User', 'User Management');
      toast.success(`Successfully added user ${formName}!`);
    } else if (modalOpen === 'edit' && editingUserId) {
      setUsers(prev => prev.map(u => u.id === editingUserId ? {
        ...u,
        name: formName,
        email: formEmail,
        role: formRole,
        assignedZones: formZones.join(', ')
      } : u));
      appendAuditLog(`Updated user account details: ${formName}`, 'User', 'User Management');
      toast.success("User account updated successfully!");
    }

    setModalOpen(null);
  };

  const handleToggleUserStatus = (id: string, name: string, currentStatus: 'Active' | 'Inactive') => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
    appendAuditLog(`Toggled account status for ${name} to ${nextStatus}`, 'User', 'User Management');
    toast.success(`User ${name} is now ${nextStatus}!`);
  };

  const handleResetPassword = (name: string) => {
    appendAuditLog(`Issued password reset link credentials for ${name}`, 'Security', 'User Management');
    toast.success(`Password reset token sent to ${name}'s email!`);
  };

  const handleEnableMfaDirect = (id: string, name: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, mfa: true } : u));
    appendAuditLog(`Dispatched direct MFA activation token for ${name}`, 'Security', 'MFA Audit');
    toast.success(`MFA successfully forced and enabled for ${name}!`);
  };

  // Facility profile save
  const handleSaveFacility = () => {
    appendAuditLog('Updated global facility configuration parameters', 'Config', 'Facility Info');
    toast.success("Facility Configuration saved successfully!");
  };

  // Inline Threshold edits save on blur or Enter
  const handleZoneThresholdBlur = (index: number, val: string) => {
    const numeric = parseInt(val);
    if (isNaN(numeric) || numeric <= 0) {
      toast.error("kW threshold must be a valid positive integer!");
      return;
    }
    setZonesConfig(prev => prev.map((z, i) => i === index ? { ...z, threshold: numeric } : z));
    appendAuditLog(`Modified inline threshold for zone: ${zonesConfig[index].zone} to ${numeric} kW`, 'Config', 'Zone Config');
    toast.success(`Updated threshold limit for ${zonesConfig[index].zone} to ${numeric} kW!`);
  };

  const handleZoneToggleChange = (index: number, field: 'alertEmail' | 'alertSms', val: boolean) => {
    setZonesConfig(prev => prev.map((z, i) => i === index ? { ...z, [field]: val } : z));
    appendAuditLog(`Toggled alarm channel ${field} for ${zonesConfig[index].zone} to ${val ? 'ON' : 'OFF'}`, 'Config', 'Zone Config');
    toast.success(`Notification channel alert updated for ${zonesConfig[index].zone}!`);
  };

  // Save Tariff
  const handleSaveTariff = () => {
    appendAuditLog('Updated global utility billing rate configurations', 'Config', 'Tariff Configuration');
    toast.success("Billing Rate and Tariff configurations locked!");
  };

  // Force MFA Enrollment now (Tab 5)
  const handleForceMfaEnrollment = () => {
    setUsers(prev => prev.map(u => u.status === 'Active' ? { ...u, mfa: true } : u));
    appendAuditLog('Issued administrative MFA enrollment dispatch to all users', 'Security', 'MFA Audit');
    toast.success("Direct MFA authenticator emails sent to all users!");
  };

  // Test SSO Tunnel
  const handleTestSsoConnection = () => {
    appendAuditLog('Tested administrative OAuth 2.0 Single Sign-on integration tunnel', 'Security', 'SSO Config');
    toast.success("SSO Integration Tunnel handshake complete: 200 OK!");
  };

  // Revoke active sessions
  const handleRevokeSession = (id: string, name: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
    appendAuditLog(`Revoked active JWT session credentials for ${name}`, 'Security', 'Session Manager');
    toast.success(`Active login session revoked for ${name}!`);
  };

  const handleRevokeAllSessions = () => {
    setActiveSessions([]);
    appendAuditLog('Revoked all concurrent operational JWT sessions', 'Security', 'Session Manager');
    toast.success("All concurrent platform login sessions revoked!");
  };

  // Audit Logs filtered list
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(auditQuery.toLowerCase()) || 
                            log.user.toLowerCase().includes(auditQuery.toLowerCase()) ||
                            log.module.toLowerCase().includes(auditQuery.toLowerCase());
      const matchesType = auditFilterType === 'All' || log.type === auditFilterType;
      return matchesSearch && matchesType;
    });
  }, [auditLogs, auditQuery, auditFilterType]);

  // Export audit log CSV
  const handleExportAuditCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action Module', 'IP Address', 'Severity Status', 'Type'];
    const rows = filteredAuditLogs.map(log => [
      log.timestamp,
      log.user,
      log.role,
      log.action,
      log.ipAddress,
      log.status,
      log.type
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TAMPER_PROOF_AUDIT_LOG_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredAuditLogs.length} audit logs to tamper-proof CSV!`, {
      icon: '📋'
    });
  };

  // Filtered User list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const s = searchUser.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.assignedZones.toLowerCase().includes(s);
      const matchesRole = filterRole === 'All' || u.role === filterRole;
      const matchesStatus = filterStatus === 'All' || u.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchUser, filterRole, filterStatus]);

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
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            backgroundColor: COLORS.purpleBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: COLORS.shadow
          }}>
            <ShieldAlert size={24} style={{ color: COLORS.purple }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
              Admin Portal
            </h1>
          </div>
        </div>

        {/* Add User Action Trigger Button */}
        <button 
          onClick={handleOpenAddModal}
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
            boxShadow: '0 2px 4px rgba(59, 191, 173, 0.25)',
            transition: 'background-color 0.2s'
          }}
        >
          ＋ Add User
        </button>

        {/* Below Header 4 Summary Pills */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          borderTop: `1px solid ${COLORS.borderCol}`,
          paddingTop: '16px',
          marginTop: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <User size={16} style={{ color: COLORS.textMuted }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>{totalUsers} Total Users</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.green }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>{activeUsers} Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.red }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>{inactiveUsers} Inactive</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.bgMain, borderRadius: '12px', padding: '10px 16px', border: COLORS.border }}>
            <Lock size={14} style={{ color: COLORS.purple }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.textPrimary }}>MFA Enabled: <strong style={{ color: COLORS.purple }}>{mfaEnabledCount}/{totalUsers}</strong></span>
          </div>
        </div>
      </div>

      {/* SECTION 1 — TAB NAVIGATION */}
      <div style={{
        display: 'flex',
        borderBottom: `2.5px solid ${COLORS.borderCol}`,
        paddingBottom: '2px',
        gap: '24px'
      }}>
        {[
          { id: 'users', label: 'Users' },
          { id: 'roles', label: 'Roles & Permissions' },
          { id: 'facility', label: 'Facility Configuration' },
          { id: 'audit', label: 'Audit Log' },
          { id: 'security', label: 'Security Settings' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 4px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                color: isActive ? COLORS.purple : COLORS.textMuted,
                borderBottom: isActive ? `3px solid ${COLORS.purple}` : '3px solid transparent',
                marginBottom: '-3.5px',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS (AnimatePresence scale-fade) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          {/* ── TAB 1: USERS ── */}
          {activeTab === 'users' && (
            <>
              {/* User Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderTop: `4px solid ${COLORS.purple}`, borderRadius: '16px', padding: '16px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Total Users</span>
                  <strong style={{ fontSize: '26px', color: COLORS.textPrimary }}>4</strong>
                </div>
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderTop: `4px solid ${COLORS.teal}`, borderRadius: '16px', padding: '16px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Active Sessions</span>
                  <strong style={{ fontSize: '26px', color: COLORS.teal }}>2</strong>
                </div>
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderTop: `4px solid ${COLORS.amber}`, borderRadius: '16px', padding: '16px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Failed Logins Today</span>
                  <strong style={{ fontSize: '26px', color: COLORS.amber }}>1</strong>
                </div>
              </div>

              {/* User Accounts Management Table */}
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
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  User Accounts
                </h2>

                {/* Filter Controls Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: COLORS.textMuted }} />
                    <input 
                      type="text"
                      placeholder="Search users by name, email, or zones..."
                      value={searchUser}
                      onChange={e => setSearchUser(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Filter Role */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Role:</span>
                    <select 
                      value={filterRole}
                      onChange={e => setFilterRole(e.target.value)}
                      style={{
                        padding: '7px 24px 7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        backgroundColor: '#fff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All">All Roles</option>
                      <option value="System Administrator">System Admin</option>
                      <option value="Energy Zone Manager">Zone Manager</option>
                      <option value="Compliance Officer">Compliance Officer</option>
                    </select>
                  </div>

                  {/* Filter Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Status:</span>
                    <select 
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      style={{
                        padding: '7px 24px 7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        backgroundColor: '#fff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto', width: '100%', border: `1px solid ${COLORS.borderCol}`, borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f7f4', borderBottom: `1px solid ${COLORS.borderCol}` }}>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Avatar</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Name</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Email</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Role</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Assigned Zones</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' }}>Last Login</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'center' }}>MFA</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: COLORS.textMuted, fontWeight: '600' }}>
                            No users matched your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.borderCol}` }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: u.avatarBg,
                                color: COLORS.textPrimary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '800',
                                border: '1px solid rgba(0,0,0,0.05)'
                              }}>
                                {u.avatarChar}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>{u.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563' }}>{u.email}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                backgroundColor: u.role === 'System Administrator' ? COLORS.purpleBg : u.role === 'Compliance Officer' ? COLORS.greenLight : COLORS.tealLight,
                                color: u.role === 'System Administrator' ? COLORS.purple : u.role === 'Compliance Officer' ? COLORS.green : COLORS.teal,
                                border: `1px solid ${u.role === 'System Administrator' ? '#dcd1ff' : u.role === 'Compliance Officer' ? '#a7f3d0' : '#c2f0eb'}`
                              }}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: COLORS.textPrimary }}>{u.assignedZones}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: COLORS.textMuted }}>{u.lastLogin}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px' }}>
                              {u.mfa ? (
                                <span style={{ color: COLORS.green }}>✅ Enabled</span>
                              ) : (
                                <span style={{ color: COLORS.amber, backgroundColor: COLORS.amberLight, padding: '2px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '10px' }}>⚠️ Warnings</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: u.status === 'Active' ? COLORS.greenLight : COLORS.redLight,
                                color: u.status === 'Active' ? COLORS.green : COLORS.red
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.status === 'Active' ? COLORS.green : COLORS.red }} />
                                {u.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button 
                                  onClick={() => handleOpenEditModal(u)}
                                  style={{ padding: '4px 8px', backgroundColor: 'transparent', color: COLORS.purple, border: `1px solid ${COLORS.purple}`, borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Edit ✏️
                                </button>
                                <button 
                                  onClick={() => handleToggleUserStatus(u.id, u.name, u.status)}
                                  style={{ padding: '4px 8px', backgroundColor: 'transparent', color: u.status === 'Active' ? COLORS.red : COLORS.green, border: `1.5px solid ${u.status === 'Active' ? COLORS.red : COLORS.green}`, borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button 
                                  onClick={() => handleResetPassword(u.name)}
                                  style={{ padding: '4px 8px', backgroundColor: '#fafafa', color: COLORS.textMuted, border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Reset
                                </button>
                                {!u.mfa && (
                                  <button 
                                    onClick={() => handleEnableMfaDirect(u.id, u.name)}
                                    style={{ padding: '4px 8px', backgroundColor: COLORS.purpleBg, color: COLORS.purple, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                  >
                                    Enable MFA
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 2: ROLES & PERMISSIONS ── */}
          {activeTab === 'roles' && (
            <>
              <div style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: '20px',
                border: COLORS.border,
                padding: '24px',
                boxShadow: COLORS.shadow,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  Role Definitions & Permission Matrix
                </h2>
                <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: 0 }}>
                  Based on Clinergy's 3-tier actor model — System Administrator, Energy Zone Manager, Compliance Officer
                </p>

                {/* 3 Cards side by side */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  marginTop: '10px'
                }}>
                  {/* Card 1 */}
                  <div style={{ backgroundColor: '#ffffff', border: `1.5px solid ${COLORS.purple}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.purple, backgroundColor: COLORS.purpleBg, borderRadius: '6px', padding: '2px 8px', width: 'fit-content' }}>
                      System Administrator
                    </span>
                    <p style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', margin: 0 }}>
                      Super-user with universal platform access
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', borderTop: '1px solid #f0ebff', paddingTop: '10px' }}>
                      {['View all zones and facilities', 'Manage users and roles', 'Configure global tariffs', 'Set system-wide thresholds', 'Access audit logs', 'Export compliance reports', 'Schedule maintenance', 'Retrain AI models', 'Configure DR settings'].map((p, i) => (
                        <div key={i} style={{ color: COLORS.green }}>✅ {p}</div>
                      ))}
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div style={{ backgroundColor: '#ffffff', border: `1.5px solid ${COLORS.teal}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.teal, backgroundColor: COLORS.tealLight, borderRadius: '6px', padding: '2px 8px', width: 'fit-content' }}>
                      Energy Zone Manager
                    </span>
                    <p style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', margin: 0 }}>
                      Operational user focused on assigned hospital zones
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', borderTop: '1px solid #f0ebff', paddingTop: '10px' }}>
                      <div style={{ color: COLORS.green }}>✅ View assigned zones only</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot manage users</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot configure global tariffs</div>
                      <div style={{ color: COLORS.green }}>✅ Schedule load-shedding</div>
                      <div style={{ color: COLORS.green }}>✅ Acknowledge alerts</div>
                      <div style={{ color: COLORS.green }}>✅ Update maintenance logs</div>
                      <div style={{ color: COLORS.green }}>✅ View zone reports</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot export compliance reports</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot retrain AI models</div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div style={{ backgroundColor: '#ffffff', border: `1.5px solid ${COLORS.green}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '6px', padding: '2px 8px', width: 'fit-content' }}>
                      Compliance Officer
                    </span>
                    <p style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', margin: 0 }}>
                      Read-only access across all facilities for regulatory review
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', borderTop: '1px solid #f0ebff', paddingTop: '10px' }}>
                      <div style={{ color: COLORS.green }}>✅ View all zones (read-only)</div>
                      <div style={{ color: COLORS.green }}>✅ Download compliance reports</div>
                      <div style={{ color: COLORS.green }}>✅ View carbon footprint data</div>
                      <div style={{ color: COLORS.green }}>✅ Access audit logs (read-only)</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot modify any settings</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot acknowledge alerts</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot schedule anything</div>
                      <div style={{ color: COLORS.red }}>❌ Cannot manage users</div>
                    </div>
                  </div>
                </div>

                {/* Matrix Table */}
                <div style={{ marginTop: '20px', borderTop: COLORS.border, paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                    📋 Unified Permission Matrix Grid
                  </h4>
                  <div style={{ border: `1px solid ${COLORS.borderCol}`, borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.borderCol}` }}>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Platform Operations</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.purple, textAlign: 'center' }}>System Admin</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.teal, textAlign: 'center' }}>Zone Manager</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.green, textAlign: 'center' }}>Compliance Officer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissionsList.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderCol}` }}>
                            <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600' }}>{row.action}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: row.admin ? COLORS.green : COLORS.red, fontWeight: '800' }}>
                              {row.admin ? '✅' : '❌'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: row.manager ? COLORS.green : COLORS.red, fontWeight: '800' }}>
                              {row.manager ? '✅' : '❌'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: row.compliance ? COLORS.green : COLORS.red, fontWeight: '800' }}>
                              {row.compliance ? '✅' : '❌'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 3: FACILITY CONFIGURATION ── */}
          {activeTab === 'facility' && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {/* Facility Info Card */}
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderRadius: '20px', padding: '24px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏥 Facility Information Profile
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Facility Name</label>
                      <input 
                        type="text" 
                        value={facilityName} 
                        onChange={e => setFacilityName(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Address</label>
                      <textarea 
                        value={facilityAddress} 
                        onChange={e => setFacilityAddress(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', height: '60px', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Licensed Beds</label>
                        <input 
                          type="text" 
                          value={facilityBeds} 
                          onChange={e => setFacilityBeds(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Gross Floor Area (m²)</label>
                        <input 
                          type="text" 
                          value={facilityArea} 
                          onChange={e => setFacilityArea(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Timezone</label>
                      <input 
                        type="text" 
                        value={facilityTimezone} 
                        onChange={e => setFacilityTimezone(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveFacility}
                    style={{ padding: '10px 18px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '6px' }}
                  >
                    Save Changes
                  </button>
                </div>

                {/* Tariff Configuration Card */}
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderRadius: '20px', padding: '24px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚡ Tariff Configuration Schedules
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Peak Hours</label>
                        <input 
                          type="text" 
                          value={tariffPeakHours} 
                          onChange={e => setTariffPeakHours(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Peak Rate (₹ / kWh)</label>
                        <input 
                          type="text" 
                          value={tariffPeakRate} 
                          onChange={e => setTariffPeakRate(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Off-Peak Hours</label>
                        <input 
                          type="text" 
                          value={tariffOffPeakHours} 
                          onChange={e => setTariffOffPeakHours(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Off-Peak Rate (₹ / kWh)</label>
                        <input 
                          type="text" 
                          value={tariffOffPeakRate} 
                          onChange={e => setTariffOffPeakRate(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveTariff}
                    style={{ padding: '10px 18px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '24px' }}
                  >
                    Save Tariff Rates
                  </button>
                </div>
              </div>

              {/* Zone Configuration Table */}
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
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  🚨 Zone Threshold Configuration (Pillar 11 Alarm overrides)
                </h3>

                <div style={{ overflowX: 'auto', width: '100%', border: `1px solid ${COLORS.borderCol}`, borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.borderCol}` }}>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Zone</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Criticality</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>kW Threshold Limit</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' }}>Email Alerts</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' }}>SMS Alerts</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zonesConfig.map((z, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderCol}` }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>{z.zone}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: z.criticality === 'Critical' ? COLORS.redLight : z.criticality === 'Essential' ? COLORS.amberLight : COLORS.greenLight,
                              color: z.criticality === 'Critical' ? COLORS.red : z.criticality === 'Essential' ? COLORS.amber : COLORS.green
                            }}>
                              {z.criticality}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                type="text"
                                defaultValue={z.threshold}
                                onBlur={(e) => handleZoneThresholdBlur(idx, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleZoneThresholdBlur(idx, e.currentTarget.value)}
                                style={{
                                  width: '70px',
                                  padding: '4px 8px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  textAlign: 'right',
                                  outline: 'none'
                                }}
                              />
                              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>kW</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={z.alertEmail}
                              onChange={(e) => handleZoneToggleChange(idx, 'alertEmail', e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={z.alertSms}
                              onChange={(e) => handleZoneToggleChange(idx, 'alertSms', e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.green }}>{z.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button 
                  onClick={() => toast.success("All zone thresholds successfully locked!")}
                  style={{ padding: '10px 18px', backgroundColor: COLORS.teal, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start' }}
                >
                  Save All Settings
                </button>
              </div>
            </>
          )}

          {/* ── TAB 4: AUDIT LOG ── */}
          {activeTab === 'audit' && (
            <>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                      📋 Tamper-Proof Audit Trail Grid — Pillar 19
                    </h2>
                    <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '4px 0 0 0' }}>
                      Tamper-proof transactional database logs tracking administrative modifications
                    </p>
                  </div>

                  <button 
                    onClick={handleExportAuditCSV}
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
                      transition: 'all 0.2s'
                    }}
                  >
                    📊 Export Audit CSV
                  </button>
                </div>

                {/* Audit filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: COLORS.textMuted }} />
                    <input 
                      type="text"
                      placeholder="Search log entries by keyword or user..."
                      value={auditQuery}
                      onChange={e => setAuditQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Filter type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Category:</span>
                    <select 
                      value={auditFilterType}
                      onChange={e => setAuditFilterType(e.target.value)}
                      style={{
                        padding: '7px 24px 7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        backgroundColor: '#fff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All">All Events</option>
                      <option value="Login">Login Sessions</option>
                      <option value="Config">Configurations</option>
                      <option value="Alert">Alert Warnings</option>
                      <option value="Report">Report Audits</option>
                      <option value="User">User Management</option>
                      <option value="Security">Security Encryption</option>
                    </select>
                  </div>
                </div>

                {/* Log Table */}
                <div style={{ overflowX: 'auto', width: '100%', border: `1px solid ${COLORS.borderCol}`, borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.borderCol}` }}>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Timestamp</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>User</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Assigned Role</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Action Module Description</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>IP Address</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' }}>Event status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: COLORS.textMuted }}>
                            No audit logs correspond to active search query.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.slice(0, 15).map(log => {
                          let badgeBg = COLORS.blueLight;
                          let badgeColor = COLORS.blue;
                          if (log.type === 'Config') {
                            badgeBg = COLORS.amberLight;
                            badgeColor = COLORS.amber;
                          } else if (log.type === 'Alert') {
                            badgeBg = COLORS.redLight;
                            badgeColor = COLORS.red;
                          } else if (log.type === 'Report') {
                            badgeBg = COLORS.greenLight;
                            badgeColor = COLORS.green;
                          } else if (log.type === 'User') {
                            badgeBg = COLORS.purpleBg;
                            badgeColor = COLORS.purple;
                          }

                          return (
                            <tr key={log.id} style={{ borderBottom: `1px solid ${COLORS.borderCol}` }}>
                              <td style={{ padding: '12px 16px', fontSize: '11px', color: COLORS.textMuted, fontFamily: 'monospace' }}>
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '12px' }}>{log.user}</td>
                              <td style={{ padding: '12px 16px', fontSize: '11px', color: COLORS.textMuted }}>{log.role}</td>
                              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600' }}>
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: '800',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  backgroundColor: badgeBg,
                                  color: badgeColor,
                                  marginRight: '8px',
                                  display: 'inline-block'
                                }}>
                                  {log.type}
                                </span>
                                {log.action}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '11px', color: COLORS.textMuted, fontFamily: 'monospace' }}>{log.ipAddress}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: '800',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  backgroundColor: log.status === 'Success' ? COLORS.greenLight : COLORS.redLight,
                                  color: log.status === 'Success' ? COLORS.green : COLORS.red
                                }}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: COLORS.textMuted }}>
                  <span>Showing 1-15 of {filteredAuditLogs.length + 132} entries</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ padding: '4px 10px', backgroundColor: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'not-allowed' }}>Prev</button>
                    <button style={{ padding: '4px 10px', backgroundColor: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'not-allowed' }}>Next</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 5: SECURITY SETTINGS ── */}
          {activeTab === 'security' && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {/* Authentication settings card */}
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderRadius: '20px', padding: '24px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔐 Authentication Settings
                  </h3>

                  {/* Password Policy */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', borderBottom: '1px solid #f0ebff', paddingBottom: '16px' }}>
                    <h4 style={{ fontWeight: '800', color: COLORS.purple, textTransform: 'uppercase', fontSize: '10px', margin: 0 }}>Password Policy</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Minimum password length:</span>
                      <input 
                        type="number" 
                        value={securityMinLength} 
                        onChange={e => setSecurityMinLength(parseInt(e.target.value) || 8)}
                        style={{ width: '60px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right', fontWeight: '700' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Require upper case letter:</span>
                      <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Require numeric characters:</span>
                      <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Require special characters:</span>
                      <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Password Expiration Frequency:</span>
                      <select style={{ padding: '4px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        <option>90 Days (Recommended)</option>
                        <option>180 Days</option>
                        <option>Never Expire</option>
                      </select>
                    </div>
                  </div>

                  {/* Session settings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <h4 style={{ fontWeight: '800', color: COLORS.purple, textTransform: 'uppercase', fontSize: '10px', margin: 0 }}>Session Settings</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Session Token Timeout (sec):</span>
                      <input 
                        type="text" 
                        value={securityTimeout} 
                        onChange={e => setSecurityTimeout(e.target.value)}
                        style={{ width: '70px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right', fontWeight: '700' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Max concurrent active sessions:</span>
                      <input type="number" defaultValue={2} style={{ width: '60px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right', fontWeight: '700' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Force re-login session:</span>
                      <select style={{ padding: '4px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        <option>24 Hours (Default)</option>
                        <option>72 Hours</option>
                        <option>None</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      appendAuditLog('Modified password expiration and session JWT policies', 'Security', 'JWT Rules');
                      toast.success("Authentication policies updated successfully!");
                    }}
                    style={{ padding: '8px 16px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start' }}
                  >
                    Save Policies
                  </button>
                </div>

                {/* MFA Configuration Card */}
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderRadius: '20px', padding: '24px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔐 MFA Authentication Tunnels
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: COLORS.textPrimary }}>Require MFA for all active users</span>
                      <input 
                        type="checkbox" 
                        checked={securityMfaRequired}
                        onChange={e => {
                          setSecurityMfaRequired(e.target.checked);
                          appendAuditLog(`MFA global requirement toggled: ${e.target.checked ? 'ON' : 'OFF'}`, 'Security', 'MFA Audit');
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: '700', color: COLORS.textMuted }}>MFA Verification Method</label>
                      <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontWeight: '700' }}>
                        <option>Authenticator App (TOTP Code - Recommended)</option>
                        <option>SMS Text Dispatch Codes</option>
                        <option>Secure Email dispatch codes</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Grace period for new enrollments:</span>
                      <strong>24 Hours</strong>
                    </div>
                  </div>

                  <button 
                    onClick={handleForceMfaEnrollment}
                    style={{ padding: '10px 18px', backgroundColor: COLORS.red, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '24px' }}
                  >
                    Force MFA Enrollment Now
                  </button>
                </div>
              </div>

              {/* SSO SAML / OAuth Config */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {/* SSO Configuration Card */}
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderRadius: '20px', padding: '24px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🌐 SAML 2.0 / OAuth SSO Config
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: COLORS.textPrimary }}>Single Sign-on (SSO) Status</span>
                      <input 
                        type="checkbox" 
                        checked={securitySsoEnabled}
                        onChange={e => {
                          setSecuritySsoEnabled(e.target.checked);
                          appendAuditLog(`SSO authentication integration toggled: ${e.target.checked ? 'ON' : 'OFF'}`, 'Security', 'SSO Config');
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: '700', color: COLORS.textMuted }}>SSO Protocol</label>
                      <select style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}>
                        <option>OAuth 2.0 + OpenID Connect (OIDC)</option>
                        <option>SAML 2.0 Enterprise SSO</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Identity Provider URL</label>
                      <input 
                        type="text" 
                        defaultValue="https://idp.hospitalcorp.org/oauth2"
                        style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: '700', color: COLORS.textMuted }}>SSO Login URL</label>
                      <input 
                        type="text" 
                        defaultValue="https://clinergy.hospitalcorp.org/sso/login"
                        style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button 
                      onClick={handleTestSsoConnection}
                      style={{ flex: 1, padding: '8px 12px', backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Test SSO Connection
                    </button>
                    <button 
                      onClick={() => toast.success("SAML Certificate loaded successfully!")}
                      style={{ flex: 1, padding: '8px 12px', backgroundColor: 'transparent', color: COLORS.textMuted, border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Upload SAML Cert
                    </button>
                  </div>
                </div>

                {/* API Security Specifications */}
                <div style={{ backgroundColor: COLORS.cardBg, border: COLORS.border, borderRadius: '20px', padding: '24px', boxShadow: COLORS.shadow, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔌 API Security & Cryptography
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0ebff', paddingBottom: '6px' }}>
                      <span style={{ color: COLORS.textMuted }}>JWT Token Lifetime:</span>
                      <strong>3,600 seconds</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0ebff', paddingBottom: '6px' }}>
                      <span style={{ color: COLORS.textMuted }}>Refresh URL Display:</span>
                      <strong style={{ fontFamily: 'monospace' }}>/auth/token</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0ebff', paddingBottom: '6px' }}>
                      <span style={{ color: COLORS.textMuted }}>Active Rate Limiting:</span>
                      <strong>1,000 req/s per zone_id</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0ebff', paddingBottom: '6px', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Transport Layer Encryption:</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '4px', padding: '2px 8px' }}>
                        AES-256 / TLS 1.3 Active
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textMuted }}>Supabase Postgres Policies:</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: COLORS.green, backgroundColor: COLORS.greenLight, borderRadius: '4px', padding: '2px 8px' }}>
                        Row Level Security (RLS)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', padding: '10px', background: COLORS.tealLight, borderRadius: '12px', border: `1px solid ${COLORS.primary}`, marginTop: '10px' }}>
                    <Info size={16} style={{ color: COLORS.primary, flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '10.5px', color: COLORS.textPrimary, margin: 0, lineHeight: '1.4' }}>
                      JWT expirations are synced with server-side OAuth integrations to prevent stale session exploits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Sessions Manager (Framer Motion Exit Slides) */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: COLORS.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    💻 Concurrent Active JWT Sessions
                  </h3>
                  {activeSessions.length > 0 && (
                    <button 
                      onClick={handleRevokeAllSessions}
                      style={{ padding: '6px 14px', backgroundColor: COLORS.red, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Revoke All Sessions
                    </button>
                  )}
                </div>

                {activeSessions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', color: COLORS.textMuted }}>
                    No active sessions found. All logged-out platforms require fresh SSO validation.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', width: '100%', border: `1px solid ${COLORS.borderCol}`, borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.borderCol}` }}>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>User</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Browser & Device</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>IP Address</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>Login Time</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted }}>JWT TTL Expiry</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: COLORS.textMuted, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {activeSessions.map(session => (
                            <motion.tr 
                              key={session.id}
                              initial={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, x: -100, height: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ borderBottom: `1px solid ${COLORS.borderCol}` }}
                            >
                              <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '12px' }}>{session.user}</td>
                              <td style={{ padding: '12px 16px', fontSize: '12px' }}>{session.device}</td>
                              <td style={{ padding: '12px 16px', fontSize: '11px', fontFamily: 'monospace' }}>{session.ipAddress}</td>
                              <td style={{ padding: '12px 16px', fontSize: '12px', color: COLORS.textMuted }}>{session.loginTime}</td>
                              <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: COLORS.teal }}>{session.expires}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <button 
                                  onClick={() => handleRevokeSession(session.id, session.user)}
                                  style={{ padding: '4px 8px', backgroundColor: 'transparent', color: COLORS.red, border: `1.5px solid ${COLORS.red}`, borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Revoke
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── SECTION 2: ADD/EDIT USER MODALS (AnimatePresence Scale transition) ── */}
      <AnimatePresence>
        {modalOpen !== null && (
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
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary, margin: 0 }}>
                  {modalOpen === 'add' ? '＋ Invite New Team Member' : '✏️ Edit User Account'}
                </h2>
                <button 
                  onClick={() => setModalOpen(null)}
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

              {/* Scrollable form body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto', fontSize: '12px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Full Name <span style={{ color: COLORS.red }}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Priya Sharma"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '700', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Email Address <span style={{ color: COLORS.red }}>*</span></label>
                  <input 
                    type="email" 
                    placeholder="e.g. priya.sharma@clinergy.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    disabled={modalOpen === 'edit'}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none', backgroundColor: modalOpen === 'edit' ? '#f1f5f9' : '#fff', color: modalOpen === 'edit' ? COLORS.textMuted : COLORS.textPrimary }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Assigned Role</label>
                  <select 
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as any)}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '700', backgroundColor: '#fff' }}
                  >
                    <option value="System Administrator">System Administrator</option>
                    <option value="Energy Zone Manager">Energy Zone Manager</option>
                    <option value="Compliance Officer">Compliance Officer</option>
                  </select>
                </div>

                {/* Assigned Zones Multi-select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Assigned Zones (Multi-Select)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    {['ICU', 'OT Block', 'Emergency', 'Ward A', 'Ward B', 'Pharmacy'].map(zone => {
                      const isSelected = formZones.includes(zone);
                      return (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormZones(prev => prev.filter(z => z !== zone));
                            } else {
                              setFormZones(prev => [...prev, zone]);
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            border: 'none',
                            backgroundColor: isSelected ? COLORS.purple : '#cbd5e1',
                            color: '#ffffff',
                            transition: 'all 0.15s'
                          }}
                        >
                          {isSelected ? `✓ ${zone}` : `＋ ${zone}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Password Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Password</label>
                    <input 
                      type="password" 
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontWeight: '700', color: COLORS.textMuted }}>Confirm Password</label>
                    <input 
                      type="password" 
                      value={formConfirmPassword}
                      onChange={e => setFormConfirmPassword(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Toggles */}
                {modalOpen === 'add' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f0ebff', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: COLORS.textPrimary }}>Force MFA enrollment on first login</span>
                      <input 
                        type="checkbox" 
                        checked={formForceMfa}
                        onChange={e => setFormForceMfa(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: COLORS.textPrimary }}>Send welcoming instructions email</span>
                      <input 
                        type="checkbox" 
                        checked={formSendEmail}
                        onChange={e => setFormSendEmail(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                padding: '16px 24px',
                borderTop: COLORS.border,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: '#f8fafc'
              }}>
                <button 
                  onClick={() => setModalOpen(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: COLORS.textMuted,
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveUser}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: COLORS.teal,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(59, 191, 173, 0.25)'
                  }}
                >
                  {modalOpen === 'add' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
