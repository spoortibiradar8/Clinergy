import { useState } from "react";
import type { PanInfo } from "framer-motion";
import { motion, useAnimation } from "framer-motion";
import { ChevronRight, Settings, AlertTriangle, Zap, ThermometerSun } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import type { ZoneName } from "@/types/energy";
import { useNavigate } from "react-router-dom";

interface MobileZoneCardProps {
  name: ZoneName;
  criticality: string;
  energy: number;
  temperature: number;
  status: "Normal" | "Warning" | "Critical";
}

export function MobileZoneCard({ name, criticality, energy, temperature, status }: MobileZoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const controls = useAnimation();
  const { lightTap, mediumTap } = useHaptics();
  const navigate = useNavigate();

  // Action threshold limits
  const SWIPE_THRESHOLD = -80;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      // Swiped far enough to reveal actions
      mediumTap();
      controls.start({ x: -100 });
    } else {
      // Snap back
      controls.start({ x: 0 });
    }
  };

  const getStatusColor = () => {
    if (status === "Critical") return "bg-rose-500";
    if (status === "Warning") return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStatusBg = () => {
    if (status === "Critical") return "bg-rose-50";
    if (status === "Warning") return "bg-amber-50";
    return "bg-white";
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden mb-3 bg-slate-100 touch-pan-y">
      {/* Background Actions (Revealed on Swipe) */}
      <div className="absolute inset-y-0 right-0 w-[100px] flex items-center justify-center gap-2 px-4 bg-slate-200">
        <button 
          onClick={() => {
            lightTap();
            navigate(`/zones/${encodeURIComponent(name)}`);
          }}
          className="flex flex-col items-center justify-center p-2 text-blue-600 h-full w-full"
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Manage</span>
        </button>
      </div>

      {/* Foreground Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`relative z-10 w-full rounded-xl border border-slate-200 shadow-sm ${getStatusBg()}`}
        style={{ touchAction: "pan-y" }}
      >
        <div 
          className="flex items-center justify-between p-4 cursor-pointer min-h-[72px]"
          onClick={() => {
            lightTap();
            // In an uncontrolled drag with useAnimation, testing position is tricky.
            // We just toggle isExpanded when clicked.
            setIsExpanded(!isExpanded);
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-10 rounded-full ${getStatusColor()}`} />
            <div>
              <h3 className="font-semibold text-slate-900">{name}</h3>
              <p className="text-xs text-slate-500">{criticality}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-slate-900">{energy} <span className="text-xs font-normal text-slate-500">kWh</span></p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.div>
          </div>
        </div>

        {/* Expandable Details Menu */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
          className="overflow-hidden bg-slate-50 border-t border-slate-100"
        >
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Energy</p>
                <p className="text-sm font-bold">{energy} kWh</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <ThermometerSun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">HVAC Temp</p>
                <p className="text-sm font-bold">{temperature}°C</p>
              </div>
            </div>

            {status !== "Normal" && (
              <div className="col-span-2 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-medium">Temperature abnormality detected. HVAC efficiency may be compromised.</p>
              </div>
            )}
            
            <div className="col-span-2 mt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/zones/${encodeURIComponent(name)}`);
                }}
                className="w-full py-2.5 bg-white border border-slate-200 text-sm font-medium rounded-lg text-slate-700 shadow-sm active:bg-slate-50"
              >
                View Full Zone Details
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
