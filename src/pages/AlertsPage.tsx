import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCheck, BellOff } from "lucide-react";
import {
  generateMockAlerts,
  timeAgo,
  SEVERITY_CONFIG,
} from "@/types/alerts";
import type { AlertItem, AlertSeverity } from "@/types/alerts";
import { useReadAloud } from "@/hooks/useReadAloud";
import { useLanguage } from "../context/LanguageContext";

type FilterType = "all" | AlertSeverity;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const { speak } = useReadAloud();
  const { t } = useLanguage();

  // Load & auto-refresh every 60s
  useEffect(() => {
    setAlerts(generateMockAlerts());
    const id = setInterval(() => setAlerts(generateMockAlerts()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Actions ──────────────────────────────────────────────
  const markAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    );
  };

  const dismiss = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const clearAll = () => setAlerts([]);

  // ── Filtered list ────────────────────────────────────────
  const filtered =
    filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  const unreadCount = alerts.filter((a) => !a.read).length;

  // ── Filter buttons config ───────────────────────────────
  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: `${t("alerts.all")} (${alerts.length})` },
    { key: "critical", label: `${t("alerts.critical")} (${alerts.filter((a) => a.severity === "critical").length})` },
    { key: "warning", label: `${t("alerts.warning")} (${alerts.filter((a) => a.severity === "warning").length})` },
    { key: "info", label: `${t("alerts.info")} (${alerts.filter((a) => a.severity === "info").length})` },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("alerts.title")}
          </h1>
          <p className="text-slate-500 mt-1">
            {unreadCount} {unreadCount !== 1 ? t("alerts.unread_plural") : t("alerts.unread_single")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="self-start sm:self-auto"
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> {t("alerts.clear_all")}
        </Button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* ── Alert cards ─────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <BellOff className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">{t("alerts.no_alerts")}</p>
          <p className="text-sm">{t("alerts.caught_up")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const alertSummary = `${cfg.label} alert in ${alert.zone} zone. ${alert.title}. ${alert.message}`;
            return (
              <Card
                key={alert.id}
                onClick={(e) => {
                  e.stopPropagation();
                  speak(alertSummary);
                }}
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    speak(alertSummary);
                  }
                }}
                className={`speakable shadow-sm border-slate-200 transition-colors ${
                  !alert.read ? "bg-blue-50/30 border-l-4" : ""
                } ${
                  !alert.read && alert.severity === "critical"
                    ? "border-l-red-500"
                    : !alert.read && alert.severity === "warning"
                      ? "border-l-amber-500"
                      : !alert.read
                        ? "border-l-green-500"
                        : ""
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left – content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl mt-0.5">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge role="status" aria-label={`Severity: ${cfg.label}`} className={`${cfg.badge} text-xs px-2 py-0.5`}>
                            {t(`alerts.${alert.severity}`)}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {t(alert.zone)}
                          </span>
                          {!alert.read && (
                            <span className="text-xs font-medium text-blue-600">
                              {t("alerts.new")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-sm font-semibold text-slate-900">
                            {alert.title}
                          </p>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {alert.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {timeAgo(alert.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Right – actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {!alert.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                        >
                          <CheckCheck className="h-3.5 w-3.5 mr-1" /> {t("alerts.read")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-500"
                        aria-label={`Dismiss alert ${alert.title}`}
                        onClick={() => dismiss(alert.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
