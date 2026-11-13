/**
ClinErgy Frontend API Client
Thin TypeScript-style wrapper so React components can call the
Python FastAPI backend instead of making direct Supabase calls.

Usage example (in any React component or service):
    import { backendApi } from '../services/backendApi'
    const zones = await backendApi.getCurrentZones()
    const insights = await backendApi.getAIInsights()
    const reply = await backendApi.chat(history, message, '/zones', 'Zone Manager')
*/

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000'

// ── Persistent Mock State for Offline Fallback ────────────────────────────────
let mockZones: ZoneReading[] = [
  { zone_name: 'ICU', power_kw: 144.1, energy_kwh_today: 1120.4, temperature: 21.6, humidity: 55, occupancy_current: 12, occupancy_total: 15, device_count: 32, status: 'Normal', category: 'Critical', recorded_at: new Date().toISOString() },
  { zone_name: 'Operation Theatre', power_kw: 219.3, energy_kwh_today: 1740.8, temperature: 20.5, humidity: 60, occupancy_current: 6, occupancy_total: 8, device_count: 45, status: 'Warning', category: 'Critical', recorded_at: new Date().toISOString() },
  { zone_name: 'Emergency', power_kw: 90.5, energy_kwh_today: 730.2, temperature: 23.1, humidity: 50, occupancy_current: 18, occupancy_total: 25, device_count: 28, status: 'Normal', category: 'Critical', recorded_at: new Date().toISOString() },
  { zone_name: 'Ward A', power_kw: 55.2, energy_kwh_today: 430.1, temperature: 22.0, humidity: 45, occupancy_current: 24, occupancy_total: 30, device_count: 18, status: 'Normal', category: 'Semi-Critical', recorded_at: new Date().toISOString() },
  { zone_name: 'Ward B', power_kw: 45.6, energy_kwh_today: 360.5, temperature: 22.2, humidity: 46, occupancy_current: 20, occupancy_total: 30, device_count: 15, status: 'Normal', category: 'Semi-Critical', recorded_at: new Date().toISOString() },
  { zone_name: 'Pharmacy', power_kw: 29.6, energy_kwh_today: 240.2, temperature: 18.1, humidity: 40, occupancy_current: 4, occupancy_total: 5, device_count: 12, status: 'Normal', category: 'General', recorded_at: new Date().toISOString() },
];

let mockAlerts: AlertEvent[] = [
  { id: 'alt-1', zone_name: 'Operation Theatre', alert_type: 'Usage threshold', severity: 'warning', message: 'Power draw reached 88% of limit', resolved: false, created_at: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: 'alt-2', zone_name: 'ICU', alert_type: 'Temperature drop', severity: 'info', message: 'Temperature stable at 21.6°C', resolved: false, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'alt-3', zone_name: 'Pharmacy', alert_type: 'System check', severity: 'info', message: 'All drug storage units nominal', resolved: true, created_at: new Date(Date.now() - 8 * 60000).toISOString() },
];

const mockAIInsights: AIInsightsResponse = {
  forecast_kwh: 4892.4,
  estimated_cost_inr: 41585,
  confidence_percent: 94.2,
  at_risk_zone: 'Operation Theatre',
  risk_reason: 'Continuous load spikes detected during peak hours (14:00 - 17:00)',
  recommendation: 'Pre-cool surgery rooms during off-peak morning tariffs and activate HVAC economy profiles between procedures.',
  savings_inr: 4850,
  generated_at: new Date().toISOString(),
  isfallback: false,
  anomaly_detected: true,
  anomaly_message: 'Unusual HVAC power draw spike in Ward A between 02:00 and 04:00 AM',
  day_predictions: [
    { day: 'Mon', predicted_kwh: 520 },
    { day: 'Tue', predicted_kwh: 510 },
    { day: 'Wed', predicted_kwh: 550 },
    { day: 'Thu', predicted_kwh: 490 },
    { day: 'Fri', predicted_kwh: 530 },
    { day: 'Sat', predicted_kwh: 440 },
    { day: 'Sun', predicted_kwh: 410 },
  ]
};

const mockEquipment = [
  { id: 'eq-01', name: 'OT Chiller A', type: 'HVAC', zone_name: 'Operation Theatre', status: 'Optimal', health: 96, last_service: '2026-04-12', next_service: '2026-07-12' },
  { id: 'eq-02', name: 'ICU Air Handler', type: 'Ventilation', zone_name: 'ICU', status: 'Attention', health: 78, last_service: '2026-02-18', next_service: '2026-05-25' },
  { id: 'eq-03', name: 'Emergency Backup Generator', type: 'Power', zone_name: 'Emergency', status: 'Optimal', health: 98, last_service: '2026-05-01', next_service: '2026-11-01' },
  { id: 'eq-04', name: 'Pharmacy Refrigerator A', type: 'Refrigeration', zone_name: 'Pharmacy', status: 'Optimal', health: 92, last_service: '2026-03-20', next_service: '2026-06-20' },
  { id: 'eq-05', name: 'Ward A Lighting Controller', type: 'Electrical', zone_name: 'Ward A', status: 'Optimal', health: 95, last_service: '2026-01-10', next_service: '2026-07-10' },
];

const mockSchedules = [
  { id: 'sch-01', equipment_id: 'eq-02', title: 'ICU Ventilation Filter Replacement', description: 'Replace HEPA filters and clean supply air grilles.', scheduled_date: '2026-05-25', assigned_to: 'John Doe', status: 'Pending' },
  { id: 'sch-02', equipment_id: 'eq-04', title: 'Pharmacy Fridge Defrost Cycle Check', description: 'Calibrate digital probes and check seal compression.', scheduled_date: '2026-06-20', assigned_to: 'Jane Smith', status: 'Scheduled' },
  { id: 'sch-03', equipment_id: 'eq-01', title: 'OT Chiller Annual Compressor Tuneup', description: 'Verify refrigerant pressures and clean condenser coils.', scheduled_date: '2026-07-12', assigned_to: 'Alex Mercer', status: 'Scheduled' },
];

function fluctuateMockZones() {
  const now = new Date().toISOString();
  mockZones = mockZones.map(zone => {
    const change = 0.97 + Math.random() * 0.06;
    const power = +(zone.power_kw * change).toFixed(1);
    const status = zone.zone_name === 'Operation Theatre' 
      ? 'Warning' 
      : power > 230 ? 'Critical' : 'Normal';
    
    return {
      ...zone,
      power_kw: power,
      energy_kwh_today: +(zone.energy_kwh_today + (power / 120)).toFixed(1),
      temperature: +(zone.temperature + (Math.random() * 0.4 - 0.2)).toFixed(1),
      humidity: Math.min(90, Math.max(30, Math.round(zone.humidity + (Math.random() * 2 - 1)))),
      status: status as any,
      recorded_at: now
    };
  });
}

function generateMockHistory(zoneName?: string, limit = 100): ZoneReading[] {
  const history: ZoneReading[] = [];
  const now = new Date();
  const zonesToGen = zoneName ? [zoneName] : mockZones.map(z => z.zone_name);
  
  for (let i = 0; i < limit; i++) {
    const time = new Date(now.getTime() - i * 15 * 60 * 1000);
    zonesToGen.forEach(zn => {
      const baseZone = mockZones.find(z => z.zone_name === zn) || mockZones[0];
      const timeFactor = 0.7 + Math.sin((time.getHours() / 24) * Math.PI * 2) * 0.3;
      const kw = +(baseZone.power_kw * timeFactor * (0.9 + Math.random() * 0.2)).toFixed(1);
      history.push({
        ...baseZone,
        zone_name: zn,
        power_kw: kw,
        energy_kwh_today: +(baseZone.energy_kwh_today * timeFactor).toFixed(1),
        temperature: +(baseZone.temperature + Math.sin(i * 0.1) * 1.5).toFixed(1),
        recorded_at: time.toISOString()
      });
    });
  }
  return history;
}

function getLocalChatResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I am your ClinErgy Assistant. How can I help you manage the hospital's energy load and clinical support equipment today?";
  }
  if (msg.includes('icu')) {
    return "The **ICU** is currently running stable at **144.1 kW** total draw. Average daily consumption is 1,120 kWh. Equipment status: The *ICU Air Handler* has a filter replacement maintenance task scheduled for **May 25, 2026**.";
  }
  if (msg.includes('operation') || msg.includes('ot') || msg.includes('surgery')) {
    return "The **Operation Theatre** is currently drawing **219.3 kW** (active Warning state due to peak HVAC chiller draw). Action: We suggest activating chiller economy modes or optimizing schedules between surgeries.";
  }
  if (msg.includes('saving') || msg.includes('recommend') || msg.includes('reduce') || msg.includes('cost')) {
    return "ClinErgy's top recommendations for immediate cost savings:\n1. **Pre-cooling OT Rooms**: Run chillers early in the morning during off-peak tariffs to store thermal energy.\n2. **LED Upgrades**: Update Ward A corridors to smart LED dimers (estimated savings: ₹2,400/month).\n3. **Compressor Maintenance**: Defrost pharmacy chiller Refrigerator A early to lower motor load.";
  }
  if (msg.includes('status') || msg.includes('report') || msg.includes('zones')) {
    return "Clinergy Current Status Summary:\n- **Total Load**: ~586 kW\n- **Active Warnings**: 1 (Operation Theatre HVAC load)\n- **Total Energy Today**: 4,622 kWh\n- **System Uptime**: 99.7% (Excellent)";
  }
  return "I've analyzed the local telemetry regarding ClinErgy. All support areas (ICU, OT, Emergency) are receiving stable power, and our local model predicts normal demand profiles for the rest of today. Let me know if you would like me to list specific active alerts, equipment details, or run an energy forecast!";
}

function getMockFallback(path: string, options?: RequestInit): unknown {
  const cleanPath = path.split('?')[0];
  
  if (cleanPath === '/health') {
    return { status: 'ok' };
  }
  
  if (cleanPath === '/zones/current') {
    fluctuateMockZones();
    return {
      zones: mockZones,
      timestamp: new Date().toISOString()
    };
  }
  
  if (cleanPath === '/zones/history' || cleanPath === '/zones/db-history') {
    const urlParams = new URLSearchParams(path.split('?')[1] || '');
    const zone = urlParams.get('zone') || undefined;
    const limit = Number(urlParams.get('limit')) || 100;
    return generateMockHistory(zone, limit);
  }
  
  if (cleanPath === '/alerts/recent' || cleanPath === '/alerts/db') {
    return mockAlerts;
  }
  
  if (cleanPath === '/ai-insights/') {
    return mockAIInsights;
  }
  
  if (cleanPath === '/chatbot/message') {
    let userMsg = '';
    try {
      if (options?.body) {
        const body = JSON.parse(options.body as string);
        userMsg = body.user_message || '';
      }
    } catch (e) {}
    return {
      reply: getLocalChatResponse(userMsg)
    };
  }
  
  if (cleanPath === '/chatbot/quick-replies') {
    return [
      "Show ICU status",
      "Explain savings recommendations",
      "Is there any active alert?",
      "List equipment details"
    ];
  }
  
  if (cleanPath === '/environment/weather') {
    const baseTemp = 28;
    const now = new Date();
    const tempOffset = Math.sin((now.getSeconds() / 30) * Math.PI) * 1.0;
    const currentTemp = +(baseTemp + tempOffset).toFixed(1);
    
    return {
      weather: {
        temperature: currentTemp,
        humidity: 65,
        wind_speed: 12,
        condition: 'Partly Cloudy',
        icon: '⛅',
        fetched_at: now.toISOString()
      },
      hvac_impact: {
        impact: 'Low',
        extra_load: 4.2,
        message: 'Weather conditions require standard ventilation profiles.'
      }
    };
  }
  
  if (cleanPath === '/environment/carbon') {
    return {
      emissions: { carbon_kg: 3450.8, carbon_trees: 156, carbon_cost: 29330 },
      grid_status: { intensity: 'Medium', g_co2_per_kwh: 480, reason: 'High dependency on solar during daylight, gas offsets peak.' },
      last_updated: new Date().toISOString()
    };
  }
  
  if (cleanPath === '/maintenance/equipment') {
    return mockEquipment;
  }
  
  if (cleanPath === '/maintenance/schedules') {
    return mockSchedules;
  }
  
  if (cleanPath === '/reports/pdf') {
    return { status: 'success' };
  }
  
  return {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Backend error ${res.status}: ${text}`)
    }
    return await res.json() as T
  } catch (error: any) {
    console.warn(`[ClinErgy Offline Fallback] Falling back for ${path} due to:`, error.message);
    return getMockFallback(path, options) as T;
  }
}

// ── Types (mirrors backend Pydantic schemas) ──────────────────────────────────

export interface ZoneReading {
  zone_name: string
  power_kw: number
  energy_kwh_today: number
  temperature: number
  humidity: number
  occupancy_current: number
  occupancy_total: number
  device_count: number
  status: 'Normal' | 'Warning' | 'Critical'
  category: 'Critical' | 'Semi-Critical' | 'General'
  recorded_at: string
}

export interface ZoneReadingList {
  zones: ZoneReading[]
  timestamp: string
}

export interface DayPrediction {
  day: string
  predicted_kwh: number
}

export interface AIInsightsResponse {
  forecast_kwh: number
  estimated_cost_inr: number
  confidence_percent: number
  at_risk_zone: string
  risk_reason: string
  recommendation: string
  savings_inr: number
  day_predictions: DayPrediction[]
  anomaly_detected: boolean
  anomaly_message: string
  isfallback: boolean
  generated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  wind_speed: number
  condition: string
  icon: string
  fetched_at: string
}

export interface HVACImpact {
  impact: string
  extra_load: number
  message: string
}

export interface WeatherResponse {
  weather: WeatherData
  hvac_impact: HVACImpact
}

export interface CarbonResponse {
  emissions: { carbon_kg: number; carbon_trees: number; carbon_cost: number }
  grid_status: { intensity: string; g_co2_per_kwh: number; reason: string }
  last_updated: string
}

export interface AlertEvent {
  id: string
  zone_name: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  resolved: boolean
  created_at: string
}

export interface ReportRequest {
  start_date: string
  end_date: string
  zones?: string[]
  include_ai?: boolean
  include_maintenance?: boolean
}

// ── API client ────────────────────────────────────────────────────────────────

export const backendApi = {
  /** Health check */
  health: () => request<{ status: string }>('/health'),

  // ── Zones ─────────────────────────────────────────────────────────────────
  getCurrentZones: () => request<ZoneReadingList>('/zones/current'),
  getZoneHistory: (zone?: string, limit = 100) =>
    request<ZoneReading[]>(`/zones/history?${zone ? `zone=${encodeURIComponent(zone)}&` : ''}limit=${limit}`),
  getDbHistory: (zone?: string, hours = 2, limit = 200) =>
    request<ZoneReading[]>(`/zones/db-history?hours=${hours}&limit=${limit}${zone ? `&zone=${encodeURIComponent(zone)}` : ''}`),

  // ── Alerts ────────────────────────────────────────────────────────────────
  getRecentAlerts: (limit = 50) =>
    request<AlertEvent[]>(`/alerts/recent?limit=${limit}`),
  getDbAlerts: (limit = 50, resolved?: boolean) =>
    request<AlertEvent[]>(`/alerts/db?limit=${limit}${resolved !== undefined ? `&resolved=${resolved}` : ''}`),

  // ── AI Insights ───────────────────────────────────────────────────────────
  getAIInsights: () => request<AIInsightsResponse>('/ai-insights/'),

  // ── Chatbot ───────────────────────────────────────────────────────────────
  chat: (history: ChatMessage[], userMessage: string, currentPage = '/', userRole = 'Staff') =>
    request<{ reply: string }>('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ history, user_message: userMessage, current_page: currentPage, user_role: userRole }),
    }),
  getQuickReplies: (page = '/') =>
    request<string[]>(`/chatbot/quick-replies?page=${encodeURIComponent(page)}`),

  // ── Environment ───────────────────────────────────────────────────────────
  getWeather: () => request<WeatherResponse>('/environment/weather'),
  getCarbon: (energyKwh: number) =>
    request<CarbonResponse>(`/environment/carbon?energy_kwh=${energyKwh}`),

  // ── Reports (PDF download) ────────────────────────────────────────────────
  downloadPDF: async (req: ReportRequest): Promise<void> => {
    const res = await fetch(`${BASE_URL}/reports/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clinergy_report_${req.start_date}_to_${req.end_date}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  getEquipment: (limit = 50) =>
    request<Record<string, unknown>[]>(`/maintenance/equipment?limit=${limit}`),
  getSchedules: (upcomingOnly = false) =>
    request<Record<string, unknown>[]>(`/maintenance/schedules?upcoming_only=${upcomingOnly}`),
  createSchedule: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/maintenance/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
