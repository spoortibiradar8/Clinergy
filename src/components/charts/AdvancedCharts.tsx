import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
  ScatterChart, Scatter, ZAxis,
  Sankey
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ==========================================
// 1. HEATMAP (ScatterChart with custom shape)
// ==========================================
const HEATMAP_DATA = Array.from({ length: 7 * 24 }, (_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][Math.floor(i / 24)],
  hour: i % 24,
  energy: Math.floor(Math.random() * (500 - 100 + 1)) + 100 // 100 to 500 kWh
}));

const CustomHeatmapShape = (props: any) => {
  const { cx, cy, payload } = props;
  const val = payload.energy;
  // Color scale: Green (low) -> Yellow (medium) -> Red (high)
  let fill = '#22c55e'; // green-500
  if (val > 400) fill = '#ef4444'; // red-500
  else if (val > 250) fill = '#eab308'; // yellow-500

  // Standardize block size
  const size = 16;
  return (
    <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} fill={fill} rx={2} />
  );
};

export function HourlyHeatmap() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Hourly Consumption Pattern</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" dataKey="hour" name="Hour" domain={[0, 23]} tickCount={24} stroke="#94a3b8" fontSize={12} />
              <YAxis type="category" dataKey="day" name="Day" stroke="#94a3b8" fontSize={12} />
              <ZAxis type="number" dataKey="energy" range={[100, 500]} name="Energy (kWh)" />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, name: any) => name === 'Energy (kWh)' ? [`${v} kWh`, 'Energy'] : [v, name]} />
              <Scatter data={HEATMAP_DATA} shape={<CustomHeatmapShape />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 2. WATERFALL CHART (Cost Breakdown)
// ==========================================
const WATERFALL_DATA = [
  { name: 'Base Cost', pv: [0, 5000], fill: '#94a3b8' },
  { name: 'Electricity', pv: [5000, 9000], fill: '#ef4444' }, // Addition
  { name: 'HVAC', pv: [9000, 15000], fill: '#ef4444' },     // Addition
  { name: 'Gas', pv: [15000, 18000], fill: '#ef4444' },      // Addition
  { name: 'Savings', pv: [18000, 14500], fill: '#22c55e' },  // Deduction
  { name: 'Total', pv: [0, 14500], fill: '#3b82f6' },        // Final
];

export function CostWaterfall() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Cost Breakdown (Waterfall)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WATERFALL_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `₹${v}`} />
              <RechartsTooltip 
                cursor={{fill: '#f8fafc'}}
                formatter={(val: any) => [`₹${Math.abs(val[1] - val[0])}`, "Amount"]}
              />
              <Bar dataKey="pv" radius={[4, 4, 0, 0]}>
                {WATERFALL_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 3. GAUGE CHARTS (Real-time Metrics)
// ==========================================
const Gauge = ({ value, label, color }: { value: number; label: string; color: string }) => {
  const data = [
    { name: 'Value', value: value, fill: color },
    { name: 'Remainder', value: 100 - value, fill: '#f1f5f9' }
  ];
  return (
    <div className="flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%" // Shift center down for half circle
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            stroke="none"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-2 inset-x-0 flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-900">{value}%</span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
    </div>
  );
};

export function PerformanceGauges() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Real-Time Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-2">
          <Gauge value={85} label="Efficiency Score" color="#22c55e" />
          <Gauge value={62} label="Carbon vs Target" color="#eab308" />
          <Gauge value={91} label="Budget Utilized" color="#ef4444" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 4. SANKEY DIAGRAM (Energy Flow)
// ==========================================
const SANKEY_DATA = {
  nodes: [
    { name: 'Total Energy' }, // 0
    { name: 'Electricity' },  // 1
    { name: 'HVAC' },        // 2
    { name: 'Gas' },         // 3
    { name: 'ICU' },         // 4
    { name: 'Operation' },   // 5
    { name: 'Wards' },       // 6
  ],
  links: [
    { source: 0, target: 1, value: 50 },
    { source: 0, target: 2, value: 30 },
    { source: 0, target: 3, value: 20 },
    { source: 1, target: 4, value: 20 },
    { source: 1, target: 5, value: 15 },
    { source: 1, target: 6, value: 15 },
    { source: 2, target: 4, value: 15 },
    { source: 2, target: 5, value: 10 },
    { source: 2, target: 6, value: 5 },
    { source: 3, target: 6, value: 20 },
  ]
};

export function EnergyFlowSankey() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Energy Flow Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={SANKEY_DATA}
              node={{ stroke: '#fff', strokeWidth: 2 }}
              link={{ stroke: '#cbd5e1' }}
              margin={{ top: 20, right: 40, bottom: 20, left: 20 }}
            >
              <RechartsTooltip />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 5. RADAR CHART (Zone Comparison)
// ==========================================
const RADAR_DATA = [
  { subject: 'Energy', ICU: 120, Operation: 110, Ward: 86, fullMark: 150 },
  { subject: 'Cost Efficiency', ICU: 98, Operation: 130, Ward: 130, fullMark: 150 },
  { subject: 'Carbon', ICU: 86, Operation: 130, Ward: 130, fullMark: 150 },
  { subject: 'Operating Hours', ICU: 99, Operation: 100, Ward: 100, fullMark: 150 },
  { subject: 'Equipment', ICU: 85, Operation: 90, Ward: 65, fullMark: 150 },
];

export function ZoneComparisonRadar() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Multi-Metric Zone Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RADAR_DATA}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
              <Radar name="ICU" dataKey="ICU" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
              <Radar name="Operation" dataKey="Operation" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Radar name="Wards" dataKey="Ward" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <RechartsTooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 6. AREA CHART (Cumulative Energy)
// ==========================================
const AREA_DATA = Array.from({ length: 7 }, (_, i) => ({
  name: `Day ${i + 1}`,
  icu: 400 + Math.random() * 100,
  operation: 300 + Math.random() * 100,
  ward: 200 + Math.random() * 100,
}));

export function CumulativeEnergyArea() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Cumulative Energy Contribution (Stacked)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={AREA_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIcu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorOperation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorWard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <RechartsTooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="ward" stackId="1" stroke="#22c55e" fill="url(#colorWard)" />
              <Area type="monotone" dataKey="operation" stackId="1" stroke="#3b82f6" fill="url(#colorOperation)" />
              <Area type="monotone" dataKey="icu" stackId="1" stroke="#ef4444" fill="url(#colorIcu)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 7. BUBBLE CHART (Cost vs Carbon vs Energy)
// ==========================================
const BUBBLE_DATA = [
  { zone: 'ICU', energy: 1200, cost: 15000, carbon: 450, crit: 'Critical' },
  { zone: 'OpT', energy: 950, cost: 12000, carbon: 300, crit: 'Critical' },
  { zone: 'WrdA', energy: 600, cost: 6500, carbon: 150, crit: 'Semi-Critical' },
  { zone: 'WrdB', energy: 500, cost: 5500, carbon: 120, crit: 'Semi-Critical' },
  { zone: 'OPD', energy: 400, cost: 4200, carbon: 90, crit: 'Non-Critical' },
  { zone: 'Adm', energy: 300, cost: 3100, carbon: 60, crit: 'Non-Critical' },
];

export function CostCarbonBubble() {
  const getFill = (crit: string) => {
    if (crit === 'Critical') return '#ef4444'; // red
    if (crit === 'Semi-Critical') return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Cost vs Carbon (Bubble Size = Carbon)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="energy" name="Energy (kWh)" stroke="#94a3b8" fontSize={12} tickCount={6} />
              <YAxis type="number" dataKey="cost" name="Cost (₹)" stroke="#94a3b8" fontSize={12} tickFormatter={v => `₹${v}`} />
              <ZAxis type="number" dataKey="carbon" range={[100, 1000]} name="Carbon (kg)" />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend content={() => (
                <div className="flex justify-center gap-4 text-xs font-medium text-slate-500 mt-2">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"/> Critical</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"/> Semi-Critical</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"/> Non-Critical</div>
                </div>
              )} />
              {BUBBLE_DATA.map((entry, index) => (
                <Scatter key={`scatter-${index}`} name={entry.zone} data={[entry]} fill={getFill(entry.crit)} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
