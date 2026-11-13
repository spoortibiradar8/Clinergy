import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Zap, Activity, Thermometer, Users, 
  AlertTriangle, CheckCircle2, BarChart3, 
  Cpu, Bell, Settings2, X, Clock, MicOff
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceDot, Label 
} from "recharts";
import { useZoneHistory } from "@/hooks/useRealtimeData";
import { useLanguage } from "@/context/LanguageContext";
import { useTempUnit } from "@/hooks/useTempUnit";
import { useReadAloud } from "@/hooks/useReadAloud";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { getSettings, saveSettings } from "@/services/settingsService";
import toast from "react-hot-toast";

type DrawerTab = "overview" | "devices" | "alerts" | "settings";

interface ZoneQuickViewProps {
  zone: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ZONE_DEVICES: Record<string, { name: string; count: number; type: string }[]> = {
  ICU:       [{ name: "Ventilators", count: 6, type: "Medical" }, { name: "Patient Monitors", count: 8, type: "Medical" }, { name: "HVAC Units", count: 2, type: "HVAC" }, { name: "Infusion Pumps", count: 12, type: "Medical" }],
  Operation: [{ name: "Surgical Lights", count: 4, type: "Lighting" }, { name: "Anesthesia Machines", count: 2, type: "Medical" }, { name: "HVAC Units", count: 2, type: "HVAC" }, { name: "Monitoring Equipment", count: 4, type: "Medical" }],
  Emergency: [{ name: "Defibrillators", count: 3, type: "Medical" }, { name: "Patient Monitors", count: 5, type: "Medical" }, { name: "HVAC Units", count: 2, type: "HVAC" }, { name: "X-Ray Machine", count: 1, type: "Imaging" }],
  "Ward A":  [{ name: "Patient Monitors", count: 10, type: "Medical" }, { name: "HVAC Units", count: 2, type: "HVAC" }, { name: "Nurse Call System", count: 1, type: "Equipment" }],
  "Ward B":  [{ name: "Patient Monitors", count: 8, type: "Medical" }, { name: "HVAC Units", count: 2, type: "HVAC" }, { name: "Nurse Call System", count: 1, type: "Equipment" }],
};

function getDevicesForZone(zoneName: string) {
  if (!zoneName) return [{ name: "General Equipment", count: 4, type: "Mixed" }];
  const key = Object.keys(ZONE_DEVICES).find(k => zoneName.toLowerCase().includes(k.toLowerCase()));
  return key ? ZONE_DEVICES[key] : [{ name: "General Equipment", count: 4, type: "Mixed" }];
}

export function ZoneQuickView({ zone, open, onOpenChange }: ZoneQuickViewProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [zoneAlerts, setZoneAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const { history: historyData } = useZoneHistory(zone?.zone_name, 1440);
  const { speak } = useReadAloud();
  const { formatTemp } = useTempUnit();
  const { t } = useLanguage();

  const zoneName = zone?.zone_name || "";
  
  // Warning / critical thresholds
  const defaultLimits = { w: 200, c: 350 };
  const storedLimits = zoneName ? getSettings(`threshold_${zoneName.replace(/\s+/g, "_")}`, defaultLimits) : defaultLimits;
  const [warnKw, setWarnKw] = useState(String(storedLimits.w ?? defaultLimits.w));
  const [critKw, setCritKw] = useState(String(storedLimits.c ?? defaultLimits.c));

  useEffect(() => {
    if (activeTab !== "alerts" || !zoneName) return;
    let mounted = true;
    setAlertsLoading(true);
    supabase
      .from("alerts")
      .select("*")
      .eq("zone_name", zoneName)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (mounted && data) setZoneAlerts(data);
        if (mounted) setAlertsLoading(false);
      });
    return () => { mounted = false; };
  }, [activeTab, zoneName]);

  const chartData = useMemo(() =>
    historyData.slice(-48).map((r: any) => ({
      time: r.recorded_at ? new Date(r.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      kw: r.power_kw ?? r.current_power_kw ?? 0,
    })),
    [historyData]
  );

  if (!zone) return null;

  const devices = getDevicesForZone(zoneName);
  const status = zone.status ?? "Normal";
  const criticality = zoneName.toLowerCase().includes("icu") || zoneName.toLowerCase().includes("operation") || zoneName.toLowerCase().includes("emergency") ? "Critical" : "General";

  const saveThresholds = () => {
    saveSettings(`threshold_${zoneName.replace(/\s+/g, "_")}`, { w: Number(warnKw), c: Number(critKw) });
    toast.success(`Thresholds saved for ${zoneName}`);
  };

  const TABS: { key: DrawerTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",  label: "Overview",  icon: <BarChart3 className="h-4 w-4" /> },
    { key: "devices",   label: "Devices",   icon: <Cpu className="h-4 w-4" /> },
    { key: "alerts",    label: "Alerts",    icon: <Bell className="h-4 w-4" /> },
    { key: "settings",  label: "Settings",  icon: <Settings2 className="h-4 w-4" /> },
  ];

  const stateColorClass = 
    status.toUpperCase() === 'CRITICAL' ? 'bg-critical-red-bg' : 
    status.toUpperCase() === 'WARNING' ? 'bg-warning-amber-bg' : 
    'bg-[#EAFAF1]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl border-0 shadow-2xl rounded-[24px] p-0 overflow-hidden outline-none flex flex-col h-[85vh] ${stateColorClass}`}>
        
        {/* Header */}
        <DialogHeader className={`px-6 py-4 border-b flex-row items-center justify-between space-y-0 ${
          status.toUpperCase() === 'CRITICAL' ? 'border-critical-red/20' : 
          status.toUpperCase() === 'WARNING' ? 'border-warning-amber/20' : 
          'border-[#27AE60]/20'
        }`}>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
             </div>
             <DialogTitle className="text-2xl font-bold text-[#042C53]">{t(zoneName)}</DialogTitle>
             <div className="flex gap-2">
                <Badge variant="secondary" className="bg-rose-50 text-rose-600 hover:bg-rose-50 border-rose-100 text-[10px] font-bold">
                  {criticality}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {status}
                </Badge>
             </div>
          </div>
        </DialogHeader>

        {/* Custom Tab Bar */}
        <div className={`flex px-6 border-b shrink-0 ${
          status.toUpperCase() === 'CRITICAL' ? 'border-critical-red/20' : 
          status.toUpperCase() === 'WARNING' ? 'border-warning-amber/20' : 
          'border-[#27AE60]/20'
        }`}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all relative ${
                activeTab === tab.key
                  ? "border-emerald-500 text-[#042C53]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative custom-scrollbar">
          
          {activeTab === "overview" && (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Power Now", value: `${(zone.power_kw ?? zone.current_power_kw ?? 0).toFixed(1)} kW`, icon: <Zap className="h-5 w-5 text-blue-500" />, bgColor: "bg-[#F1F7FF]" },
                  { label: "Energy Today", value: `${(zone.energy_kwh_today ?? 0).toFixed(0)} kWh`, icon: <Activity className="h-5 w-5 text-emerald-600" />, bgColor: "bg-[#F1F7FF]" },
                  { label: "Temperature", value: formatTemp(zone.temperature), icon: <Thermometer className="h-5 w-5 text-orange-600" />, bgColor: "bg-[#F1F7FF]" },
                  { label: "Occupancy", value: `${zone.occupancy_current ?? 0} / ${zone.occupancy_total ?? 0}`, icon: <Users className="h-5 w-5 text-purple-600" />, bgColor: "bg-[#F1F7FF]" },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bgColor} rounded-2xl p-5 border border-[#D9E9FF] shadow-sm transition-all hover:scale-[1.01]`}>
                    <div className="mb-3">{stat.icon}</div>
                    <div className="flex flex-col">
                       <span className="text-3xl font-black text-[#042C53] tracking-tight">{stat.value}</span>
                       <span className="text-xs font-bold text-[#5B88B0] mt-1">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Section */}
              <div className="space-y-4 pt-4">
                <h4 className="text-lg font-bold text-[#042C53]">24-Hour Power Trend</h4>
                <div className="h-[220px] w-full border border-white/50 rounded-2xl p-4 bg-white/60 shadow-sm">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                         <XAxis dataKey="time" hide />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} />
                         <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontWeight: 'bold', color: '#042C53' }}
                         />
                         <Line 
                            type="monotone" 
                            dataKey="kw" 
                            stroke="#2563eb" 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                         />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === "devices" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Connected Infrastructure</p>
              {devices.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-white/60 rounded-xl p-4 border border-white/80 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Cpu className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#042C53]">{d.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{d.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[9px] font-black">×{d.count} ACTIVE</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Security & Operational Logs</p>
              {alertsLoading ? (
                [1,2,3].map(i => <div key={i} className="h-20 bg-white/60 rounded-xl animate-pulse" />)
              ) : zoneAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white/60 rounded-2xl border border-white/80 shadow-sm">
                  <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-300" />
                  <p className="font-bold text-sm">All Systems Nominal</p>
                </div>
              ) : (
                zoneAlerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl border bg-white/60 border-white/80 transition-all shadow-sm">
                    <div className={`mt-1 p-1.5 rounded-lg ${
                      a.severity === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#042C53] leading-snug">{a.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(a.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
               <div className="p-5 bg-white/60 rounded-2xl border border-white/80 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#042C53] uppercase tracking-wider">Warning Level (kW)</label>
                    <Input type="number" value={warnKw} onChange={e => setWarnKw(e.target.value)} className="bg-white border-slate-200 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#042C53] uppercase tracking-wider">Critical Level (kW)</label>
                    <Input type="number" value={critKw} onChange={e => setCritKw(e.target.value)} className="bg-white border-slate-200 rounded-xl h-11" />
                  </div>
               </div>
               <Button className="w-full h-12 bg-[#042C53] hover:bg-[#063b6d] text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]" onClick={saveThresholds}>
                 Save Configuration
               </Button>
            </div>
          )}


          {/* Fixed Voice Button at bottom right of dialog */}
          <div className="sticky bottom-0 right-0 flex justify-end pointer-events-none mt-auto pt-4">
             <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full border border-slate-100 shadow-xl pointer-events-auto">
                <button className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400">
                   <MicOff className="h-5 w-5" />
                </button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
