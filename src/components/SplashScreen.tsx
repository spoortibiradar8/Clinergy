import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"show" | "fade">("show");

  useEffect(() => {
    // After 1.3s start fading, then call onDone at 1.6s
    const t1 = setTimeout(() => setPhase("fade"), 1300);
    const t2 = setTimeout(() => onDone(), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-800 transition-opacity duration-300"
      style={{ opacity: phase === "fade" ? 0 : 1, pointerEvents: "none" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg">
          <Zap className="h-8 w-8 text-yellow-500" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">CLINERGY</h1>
          <p className="text-blue-200 text-sm font-medium tracking-widest uppercase">
            Hospital Energy Platform
          </p>
        </div>
      </div>

      {/* Status text */}
      <div className="flex items-center gap-2 text-blue-200 text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Initializing sensors...
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-48 h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full bg-white/70 rounded-full"
          style={{
            animation: "splashProgress 1.3s ease-out forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
