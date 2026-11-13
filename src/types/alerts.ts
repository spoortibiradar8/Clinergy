// Shared alert types and mock data for the notification system.

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  zone: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

/** Generates a stable set of mock alerts relative to "now". */
export function generateMockAlerts(): AlertItem[] {
  const now = new Date();
  return [
    // ── Critical ──────────────────────────────────
    {
      id: "c1",
      severity: "critical",
      title: "HVAC Temperature Out of Range",
      zone: "ICU",
      message: "ICU - HVAC temperature out of range (26°C). Immediate attention required.",
      timestamp: new Date(now.getTime() - 2 * 60_000), // 2 min ago
      read: false,
    },
    {
      id: "c2",
      severity: "critical",
      title: "Backup Generator Test Overdue",
      zone: "Operation",
      message: "Operation Theatre - Backup generator test overdue by 48 hours.",
      timestamp: new Date(now.getTime() - 15 * 60_000),
      read: false,
    },
    {
      id: "c3",
      severity: "critical",
      title: "Power Spike Detected",
      zone: "Emergency",
      message: "Emergency - Power spike detected (+40% above normal). Check load distribution.",
      timestamp: new Date(now.getTime() - 28 * 60_000),
      read: false,
    },

    // ── Warning ───────────────────────────────────
    {
      id: "w1",
      severity: "warning",
      title: "Energy Usage Above Average",
      zone: "Ward A",
      message: "Ward A - Energy usage 18% above average for this hour.",
      timestamp: new Date(now.getTime() - 35 * 60_000),
      read: false,
    },
    {
      id: "w2",
      severity: "warning",
      title: "Peak Tariff Starting Soon",
      zone: "OPD",
      message: "OPD - Peak tariff starting in 30 minutes. Consider reducing non-essential loads.",
      timestamp: new Date(now.getTime() - 45 * 60_000),
      read: false,
    },
    {
      id: "w3",
      severity: "warning",
      title: "Equipment Efficiency Drop",
      zone: "Admin Block",
      message: "Admin Block - Equipment efficiency drop detected (−12% over last 24h).",
      timestamp: new Date(now.getTime() - 60 * 60_000),
      read: true,
    },

    // ── Info ──────────────────────────────────────
    {
      id: "i1",
      severity: "info",
      title: "Cost Savings Achieved",
      zone: "Cafeteria",
      message: "Cafeteria - Successfully saved ₹234 today through optimised scheduling.",
      timestamp: new Date(now.getTime() - 90 * 60_000),
      read: true,
    },
    {
      id: "i2",
      severity: "info",
      title: "Carbon Target Exceeded",
      zone: "All Zones",
      message: "Overall carbon footprint 12% below target. Great progress!",
      timestamp: new Date(now.getTime() - 120 * 60_000),
      read: true,
    },
    {
      id: "i3",
      severity: "info",
      title: "Report Generated",
      zone: "System",
      message: "Scheduled weekly energy report has been generated and is ready for download.",
      timestamp: new Date(now.getTime() - 180 * 60_000),
      read: true,
    },
  ];
}

/** Pretty-print a time delta as "X mins ago", "X hrs ago", etc. */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Severity → visual config */
export const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { dot: string; badge: string; label: string; icon: string }
> = {
  critical: {
    dot: "bg-red-500",
    badge: "bg-red-500 text-white hover:bg-red-600",
    label: "Critical",
    icon: "🔴",
  },
  warning: {
    dot: "bg-amber-500",
    badge: "bg-amber-500 text-white hover:bg-amber-600",
    label: "Warning",
    icon: "🟡",
  },
  info: {
    dot: "bg-green-500",
    badge: "bg-green-500 text-white hover:bg-green-600",
    label: "Info",
    icon: "🟢",
  },
};
