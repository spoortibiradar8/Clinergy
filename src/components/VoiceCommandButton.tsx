import { useVoiceCommands } from "../hooks/useVoiceCommands";
import { useAccessibility } from "../context/AccessibilityContext";
import { Mic, MicOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function VoiceCommandButton() {
  const { isListening, isSupported, startVoice, stopVoice, volume, lastWords, status } = useVoiceCommands();
  const { settings } = useAccessibility();

  if (!isSupported) return null;

  const toggle = () => {
    if (settings.voiceCommands) {
      stopVoice();
    } else {
      startVoice();
    }
  };

  // Status-based colors
  const getStatusColor = () => {
    if (status === 'on') return "#10B981"; // Green
    if (status === 'connecting') return "#F59E0B"; // Yellow
    if (status === 'error') return "#EF4444"; // Red
    return "var(--bg-card, #ffffff)";
  };

  const getStatusIcon = () => {
    if (status === 'connecting') return <Loader2 className="h-6 w-6 animate-spin" />;
    if (status === 'error') return <AlertCircle className="h-6 w-6" />;
    if (status === 'on') return <Mic className="h-6 w-6" />;
    return <MicOff className="h-6 w-6" />;
  };

  const pulseScale = isListening ? 1 + (volume / 80) : 1;

  return (
    <>
      {/* ── TOP HUD (Real-time speech) ─────────────────────────── */}
      {isListening && lastWords && (
        <div style={{
          position: "fixed",
          top: "84px", // Below TopNav (64px) + margin
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10000,
          background: "rgba(15, 110, 86, 0.85)", // Clinergy Teal
          backdropFilter: "blur(12px)",
          color: "white",
          padding: "12px 32px",
          borderRadius: "99px",
          fontSize: "15px",
          fontWeight: 600,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "hud-slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          maxWidth: "90vw",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          <div style={{ width: '8px', height: '8px', background: '#5DCAA5', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
          <span>{lastWords}</span>
        </div>
      )}

      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
        {/* Status Label */}
        {status === 'connecting' && (
          <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Initializing...
          </div>
        )}

      <button
        onClick={toggle}
        aria-label="Toggle Voice Commands"
        style={{
          width: "68px",
          height: "68px",
          borderRadius: "50%",
          backgroundColor: getStatusColor(),
          color: (status === 'on' || status === 'error') ? "#ffffff" : "var(--text-secondary, #64748b)",
          border: (status === 'on' || status === 'error' || status === 'connecting') ? "none" : "2px solid var(--border-color, #e2e8f0)",
          boxShadow: isListening
            ? `0 0 0 ${volume * 0.6}px rgba(16, 185, 129, 0.3)`
            : "0 10px 25px rgba(0,0,0,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: `scale(${pulseScale})`,
          position: "relative"
        }}
      >
        {getStatusIcon()}
        
        {/* Activity Indicator Ring */}
        {isListening && (
          <div style={{
            position: 'absolute',
            inset: '-4px',
            border: '2px solid #10B981',
            borderRadius: '50%',
            animation: 'ping 1.5s infinite'
          }} />
        )}
      </button>

      <style>
        {`
          @keyframes hud-slide-down {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes ping {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}
      </style>
    </div>
  </>
  );
}
