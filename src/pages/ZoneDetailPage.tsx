import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Zap,
  DollarSign,
  Leaf,
  Thermometer,
  Activity,
  Stethoscope,
  Siren,
  Bed,
  Building,
  Building2,
  Utensils,
  Lightbulb,
  Wrench,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  getZoneData,
  calculateTotalEnergy,
  calculateTotalCost,
} from "@/services/dataService";
import type { EnergyData, ZoneName, CriticalityLevel } from "@/types/energy";
import { useTempUnit } from "@/hooks/useTempUnit";

// ── Zone icon mapping ──────────────────────────────────────────────
const ZONE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ICU: Activity,
  Operation: Stethoscope,
  Emergency: Siren,
  "Ward A": Bed,
  "Ward B": Bed,
  OPD: Building,
  "Admin Block": Building2,
  Cafeteria: Utensils,
};

const VALID_ZONES: ZoneName[] = [
  "ICU", "Operation", "Emergency", "Ward A", "Ward B", "OPD", "Admin Block", "Cafeteria",
];

// ── Criticality styling ────────────────────────────────────────────
const CRITICALITY_BADGE: Record<CriticalityLevel, string> = {
  Critical: "bg-[var(--pastel-red,#ffe8e8)] text-[var(--accent-red,#ef4444)] border border-[var(--accent-red)]/20 hover:bg-[var(--pastel-red)]",
  "Semi-Critical": "bg-[var(--pastel-amber,#fff4e0)] text-[var(--accent-amber,#f59e0b)] border border-[var(--accent-amber)]/20 hover:bg-[var(--pastel-amber)]",
  "Non-Critical": "bg-[var(--pastel-green,#e6f9f0)] text-[var(--accent-green,#10b981)] border border-[var(--accent-green)]/20 hover:bg-[var(--pastel-green)]",
};

// ── Pie / bar chart colours ────────────────────────────────────────
const ENERGY_COLORS = ["#3bbfad", "#8b5cf6", "#f59e0b", "#ec4899", "#ef4444"];

// ── Chart toggle type ──────────────────────────────────────────────
type TrendMetric = "energy" | "cost" | "carbon";

// ── Mock AI recommendations ────────────────────────────────────────
const AI_RECOMMENDATIONS = [
  {
    icon: TrendingDown,
    title: "Reduce HVAC during off-peak hours",
    description:
      "HVAC runs at full capacity during low-occupancy periods. Scheduling a 30% reduction between 22:00–06:00 yields significant savings.",
    savings: "₹234/day",
    color: "text-[var(--accent-purple,#8b5cf6)]",
    bg: "bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px]",
    iconBg: "bg-[var(--pastel-purple,#f0ebff)]",
  },
  {
    icon: Wrench,
    title: "Schedule maintenance for Unit #2",
    description:
      "Efficiency drop of 12% detected in the past 48 hours. Preventive maintenance can restore performance and avoid breakdowns.",
    savings: "₹180/day",
    color: "text-[var(--accent-amber,#f59e0b)]",
    bg: "bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px]",
    iconBg: "bg-[var(--pastel-amber,#fff4e0)]",
  },
  {
    icon: Lightbulb,
    title: "Switch to LED lighting in common areas",
    description:
      "Halogen fixtures consume 40% more energy. Upgrading to LED can reduce lighting costs and lower carbon emissions.",
    savings: "₹95/day",
    color: "text-[var(--accent-teal,#3bbfad)]",
    bg: "bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px]",
    iconBg: "bg-[var(--pastel-teal,#e0f5f1)]",
  },
];

// ════════════════════════════════════════════════════════════════════
export default function ZoneDetailPage() {
  const { zoneName: rawZoneName } = useParams<{ zoneName: string }>();
  const navigate = useNavigate();
  const zoneName = decodeURIComponent(rawZoneName ?? "");

  const [allZoneData, setAllZoneData] = useState<EnergyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("energy");
  const { formatTemp } = useTempUnit();

  // Validate zone name
  const isValidZone = VALID_ZONES.includes(zoneName as ZoneName);

  useEffect(() => {
    if (!isValidZone) return;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getZoneData(zoneName);
        setAllZoneData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load zone data");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [zoneName, isValidZone]);

  // ── Error state ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
        <h3 className="font-semibold text-lg mb-2">Error Loading Zone Data</h3>
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  // ── Invalid zone → 404-style ──────────────────────────────────────
  if (!isValidZone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-4xl font-bold text-slate-300">404</h1>
        <p className="text-slate-500">
          Zone "<span className="font-medium text-slate-700">{zoneName}</span>" not found.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  // ── Day 1 data (for charts) ───────────────────────────────────────
  const day1Data = useMemo(
    () => allZoneData.filter((d) => d.Day === 1),
    [allZoneData]
  );

  // ── Current-hour row (latest snapshot) ────────────────────────────
  const currentHour = new Date().getHours();
  const currentRow = useMemo(
    () => allZoneData.find((d) => d.Hour === currentHour && d.Day === 1),
    [allZoneData, currentHour]
  );

  // ── Aggregated day-1 totals ───────────────────────────────────────
  const totals = useMemo(() => {
    let energy = 0, cost = 0, carbon = 0;
    let elec = 0, hvac = 0, natGas = 0, heatGas = 0, boiler = 0;

    day1Data.forEach((row) => {
      energy += calculateTotalEnergy(row);
      cost += calculateTotalCost(row);
      carbon += row.Total_Carbon_kg || (row.Electricity_Carbon_kg + row.Gas_Carbon_kg) || 0;
      elec += row.Electricity_kWh || 0;
      hvac += row.HVAC_kWh || 0;
      natGas += row.Natural_Gas_kWh || 0;
      heatGas += row.Heating_Gas_kWh || 0;
      boiler += row.Boiler_Gas_kWh || 0;
    });
    return { energy, cost, carbon, elec, hvac, natGas, heatGas, boiler };
  }, [day1Data]);

  // ── Pie data for cost breakdown ───────────────────────────────────
  const costPieData = useMemo(() => {
    const parts = [
      { name: "Electricity", value: totals.elec },
      { name: "HVAC", value: totals.hvac },
      { name: "Gas", value: totals.natGas + totals.heatGas + totals.boiler },
    ];
    const total = parts.reduce((s, p) => s + p.value, 0);
    return parts.map((p) => ({
      ...p,
      percent: total > 0 ? Math.round((p.value / total) * 100) : 0,
    }));
  }, [totals]);

  // ── Energy breakdown bar data ─────────────────────────────────────
  const breakdownData = useMemo(
    () => [
      { name: "Electricity", value: Math.round(totals.elec * 100) / 100 },
      { name: "HVAC", value: Math.round(totals.hvac * 100) / 100 },
      { name: "Natural Gas", value: Math.round(totals.natGas * 100) / 100 },
      { name: "Heating Gas", value: Math.round(totals.heatGas * 100) / 100 },
      { name: "Boiler Gas", value: Math.round(totals.boiler * 100) / 100 },
    ],
    [totals]
  );

  // ── Hourly trend data ─────────────────────────────────────────────
  const hourlyTrend = useMemo(() => {
    return day1Data
      .map((row) => ({
        hour: row.Hour,
        energy: Math.round(calculateTotalEnergy(row) * 100) / 100,
        cost: Math.round(calculateTotalCost(row) * 100) / 100,
        carbon: Math.round((row.Total_Carbon_kg || (row.Electricity_Carbon_kg + row.Gas_Carbon_kg) || 0) * 100) / 100,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [day1Data]);

  // ── Derived meta ──────────────────────────────────────────────────
  const criticality = currentRow?.Criticality ?? day1Data[0]?.Criticality ?? "Non-Critical";
  const requiresContinuousPower = currentRow?.Requires_Continuous_Power ?? false;
  const outdoorTemp = currentRow?.Outdoor_Temperature_C ?? day1Data[0]?.Outdoor_Temperature_C ?? 0;
  const treeOffset = Math.round(totals.carbon / 20);
  const ZoneIcon = ZONE_ICONS[zoneName] ?? Activity;

  const statusLabel = criticality === "Critical" ? "Critical" : totals.energy > 0 ? "Active" : "Optimal";
  const statusStyle =
    statusLabel === "Critical"
      ? "bg-[var(--pastel-red,#ffe8e8)] text-[var(--accent-red,#ef4444)] border border-[var(--accent-red)]/20 hover:bg-[var(--pastel-red)]"
      : statusLabel === "Active"
        ? "bg-[var(--pastel-blue,#e8f0fe)] text-[var(--accent-purple,#8b5cf6)] border border-[var(--accent-purple)]/20 hover:bg-[var(--pastel-blue)]"
        : "bg-[var(--pastel-green,#e6f9f0)] text-[var(--accent-green,#10b981)] border border-[var(--accent-green)]/20 hover:bg-[var(--pastel-green)]";

  const trendColors: Record<TrendMetric, string> = { energy: "#3bbfad", cost: "#ec4899", carbon: "#8b5cf6" };
  const trendUnits: Record<TrendMetric, string> = { energy: "kWh", cost: "₹", carbon: "kg CO₂" };

  // ═══════════════════ RENDER ═══════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-[#faf8ff] rounded-full">
            <ArrowLeft className="h-5 w-5 text-[#2d2d3a]" />
          </Button>
          <div className="p-2.5 bg-[#f0ebff] rounded-xl">
            <ZoneIcon className="h-6 w-6 text-[var(--accent-purple)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#2d2d3a] tracking-tight">{zoneName}</h1>
            <p className="text-xs text-slate-400 font-bold">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${CRITICALITY_BADGE[criticality]} rounded-full px-4 py-1 font-extrabold text-[11px]`}>{criticality}</Badge>
          <Badge className={`${statusStyle} rounded-full px-4 py-1 font-extrabold text-[11px]`}>{statusLabel}</Badge>
        </div>
      </div>

      {/* ── SECTION 1: METRIC CARDS ────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 — Total Energy */}
        <Card className="bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Total Energy</CardTitle>
            <div className="p-2 bg-[var(--pastel-teal)] rounded-xl"><Zap className="h-4 w-4 text-[var(--accent-teal)]" /></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-9 w-28" /> : (
              <div className="text-3xl font-extrabold text-[#2d2d3a] tracking-tight">
                {totals.energy.toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
                <span className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider">kWh</span>
              </div>
            )}
            <p className="text-xs text-green-600 font-bold mt-2">↓ 5% vs yesterday</p>
          </CardContent>
        </Card>

        {/* Card 2 — Cost Analysis */}
        <Card className="bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Cost Analysis</CardTitle>
            <div className="p-2 bg-[var(--pastel-pink)] rounded-xl"><DollarSign className="h-4 w-4 text-[var(--accent-pink)]" /></div>
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading ? <Skeleton className="h-9 w-28" /> : (
              <>
                <div className="text-3xl font-extrabold text-[#2d2d3a] tracking-tight">
                  <span className="text-lg font-semibold text-[#6b7280] mr-0.5">₹</span>
                  {totals.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="mt-2 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={costPieData} dataKey="value" cx="50%" cy="50%" outerRadius={36} innerRadius={22} paddingAngle={3}>
                        {costPieData.map((_, i) => (
                          <Cell key={i} fill={ENERGY_COLORS[i % ENERGY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-2 text-[10px] text-[#6b7280] font-bold mt-1">
                  {costPieData.map((p, i) => (
                    <span key={p.name} className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ENERGY_COLORS[i % ENERGY_COLORS.length] }} />
                      {p.name} {p.percent}%
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 3 — Carbon Footprint */}
        <Card className="bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Carbon Footprint</CardTitle>
            <div className="p-2 bg-[var(--pastel-green)] rounded-xl"><Leaf className="h-4 w-4 text-[var(--accent-green)]" /></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-9 w-28" /> : (
              <>
                <div className="text-3xl font-extrabold text-[#2d2d3a] tracking-tight">
                  {totals.carbon.toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
                  <span className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider">kg CO₂</span>
                </div>
                <p className="text-xs text-[#6b7280] font-bold mt-3">
                  🌳 Offset: <span className="font-extrabold text-[var(--accent-green)]">{treeOffset} trees</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4 — Temperature & Status */}
        <Card className="bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Temperature & Status</CardTitle>
            <div className="p-2 bg-[var(--pastel-amber)] rounded-xl"><Thermometer className="h-4 w-4 text-[var(--accent-amber)]" /></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-9 w-28" /> : (
              <>
                <div className="text-3xl font-extrabold text-[#2d2d3a] tracking-tight">
                  {formatTemp(outdoorTemp)}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${requiresContinuousPower ? "bg-[var(--accent-green)] animate-pulse" : "bg-slate-300"}`} />
                  <span className="text-xs text-[#6b7280] font-bold">
                    {requiresContinuousPower ? "24/7 Continuous Power" : "Standard Schedule"}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 2: ENERGY BREAKDOWN CHART ──────────────────────── */}
      <Card className="bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#2d2d3a]">Energy Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={breakdownData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ebff" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} fontWeight={700} />
                <YAxis stroke="#9ca3af" fontSize={11} fontWeight={700} label={{ value: "kWh", angle: -90, position: "insideLeft", style: { fill: "#9ca3af", fontSize: 11, fontWeight: 700 } }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #f0ebff", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(value) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`]}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {breakdownData.map((_, index) => (
                    <Cell key={index} fill={ENERGY_COLORS[index % ENERGY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 3: HOURLY TREND ────────────────────────────────── */}
      <Card className="bg-white border border-[#f0ebff] shadow-[0_2px_12px_rgba(139,92,246,0.06)] rounded-[20px] overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#2d2d3a]">Hourly Trend — Day 1</CardTitle>
          <div className="flex gap-1 bg-[#faf8ff] p-1 border border-[#f0ebff] rounded-xl">
            {(["energy", "cost", "carbon"] as TrendMetric[]).map((m) => (
              <Button
                key={m}
                variant={trendMetric === m ? "default" : "ghost"}
                size="sm"
                onClick={() => setTrendMetric(m)}
                className={`text-xs font-bold rounded-lg ${trendMetric === m ? 'bg-[var(--accent-purple)] text-white hover:bg-[var(--accent-purple)]' : 'text-[#6b7280] hover:bg-[#faf8ff]'}`}
              >
                {m === "energy" ? "Energy" : m === "cost" ? "Cost" : "Carbon"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] md:h-[400px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 300 : 400}>
              <LineChart data={hourlyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ebff" />
                <XAxis dataKey="hour" tickFormatter={(v: number) => `${v}:00`} stroke="#9ca3af" fontSize={11} fontWeight={700} />
                <YAxis stroke="#9ca3af" fontSize={11} fontWeight={700} label={{ value: trendUnits[trendMetric], angle: -90, position: "insideLeft", style: { fill: "#9ca3af", fontSize: 11, fontWeight: 700 } }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #f0ebff", borderRadius: "12px", fontSize: "12px" }}
                  labelFormatter={(l) => `Hour: ${l}:00`}
                  formatter={(value) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${trendUnits[trendMetric]}`]}
                />
                <Line
                  type="monotone"
                  dataKey={trendMetric}
                  stroke={trendColors[trendMetric]}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 4: AI RECOMMENDATIONS ──────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#2d2d3a]">AI Recommendations</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {AI_RECOMMENDATIONS.map((rec) => {
            const RecIcon = rec.icon;
            return (
              <Card key={rec.title} className={`${rec.bg} hover:translate-y-[-2px] transition-transform`}>
                <CardContent className="p-5 flex flex-col justify-between h-full min-h-[170px]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2.5 ${rec.iconBg} rounded-xl shadow-sm`}>
                      <RecIcon className={`h-5 w-5 ${rec.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-extrabold text-[#2d2d3a] text-sm leading-snug">{rec.title}</h3>
                      <p className="text-xs text-[#6b7280] font-semibold mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f0ebff] pt-3 mt-3">
                    <span className="text-sm font-extrabold text-[var(--accent-green,#10b981)]">Save {rec.savings}</span>
                    <Button size="sm" variant="outline" className="border-[var(--accent-purple)] text-[var(--accent-purple)] hover:bg-[var(--pastel-purple)] rounded-full px-4 font-bold text-xs">Apply</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
