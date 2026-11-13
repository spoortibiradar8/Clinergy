import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { useAlerts } from "@/hooks/useRealtimeData";

function timeAgo(ts: string): string {
  if (!ts) return "";
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function severityIcon(severity: string) {
  const s = (severity ?? "").toLowerCase();
  if (s.includes("critical")) return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
  if (s.includes("warn"))    return <AlertCircle   className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
  if (s.includes("info"))    return <Info          className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />;
  return                             <CheckCircle  className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
}

function severityDot(severity: string): string {
  const s = (severity ?? "").toLowerCase();
  if (s.includes("critical")) return "#ef4444";
  if (s.includes("warn"))     return "#f59e0b";
  return "#3b82f6";
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { alerts, unreadCount } = useAlerts(20);
  const [open, setOpen] = useState(false);
  const [rightOffset, setRightOffset] = useState<string>('0px');
  const ref = useRef<HTMLDivElement>(null);

  const latest5 = alerts.slice(0, 5);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keep dropdown neatly anchored and within screen bounds
  useEffect(() => {
    const updatePosition = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const dropdownWidth = Math.min(380, window.innerWidth - 32);
        const currentLeft = rect.right - dropdownWidth;
        if (currentLeft < 16) {
          const shiftRight = (window.innerWidth - 16) - rect.right;
          setRightOffset(`-${Math.max(0, Math.round(shiftRight))}px`);
        } else {
          setRightOffset('0px');
        }
      }
    };

    if (open) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative cursor-pointer p-1.5 rounded-full hover:bg-[#d9efe8] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-[#2d9e6b]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: rightOffset,
            marginTop: '12px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '16px',
            padding: '8px',
            maxHeight: '460px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2EEF5',
            zIndex: 100,
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              boxSizing: 'border-box'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Notifications
            </h3>
            <span
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              {unreadCount} unread
            </span>
          </div>

          {/* Alert list */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {latest5.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '32px 16px', color: '#94a3b8' }}>
                <CheckCircle className="h-8 w-8 text-emerald-400" />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#64748b' }}>All clear — no alerts</p>
              </div>
            ) : latest5.map((alert: any, i: number) => {
              const isLast = i === latest5.length - 1;
              const isUnread = !alert.resolved;
              const dotColor = severityDot(alert.severity ?? alert.alert_type ?? "");

              return (
                <div
                  key={alert.id}
                  onClick={() => { setOpen(false); navigate("/alerts"); }}
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    borderRadius: '10px',
                    backgroundColor: isUnread ? 'rgba(239, 246, 255, 0.5)' : 'transparent',
                    borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = isUnread ? '#dbeafe' : '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = isUnread ? 'rgba(239, 246, 255, 0.5)' : 'transparent')}
                >
                  {/* Icon */}
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {severityIcon(alert.severity ?? alert.alert_type ?? "")}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: isUnread ? '20px' : 0 }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
                      {alert.alert_type ?? "Alert"}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', lineHeight: 1.45, color: '#475569' }}>
                      {alert.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      {alert.zone_name && (
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
                          {alert.zone_name}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {timeAgo(alert.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Unread dot positioned 16px from right edge */}
                  {isUnread && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '18px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <button
              onClick={() => { setOpen(false); navigate("/alerts"); }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
