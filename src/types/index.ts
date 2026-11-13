export interface ZoneReading {
  id: string
  zone_name: string
  power_kw: number
  energy_kwh_today: number
  temperature: number
  humidity: number
  occupancy_current: number
  occupancy_total: number
  device_count: number
  status: 'Normal' | 'Warning' | 'Critical'
  recorded_at: string
}

export interface Alert {
  id: string
  zone_name: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  resolved: boolean
  created_at: string
}

export interface MaintenanceEquipment {
  id: string
  equipment_name: string
  equipment_id_code: string
  zone_name: string
  health_score: number
  status: 'Healthy' | 'Warning' | 'Critical'
  last_service_date: string
  next_service_date: string
  is_overdue: boolean
  recorded_at: string
}

export interface MaintenanceSchedule {
  id: string
  equipment_id: string
  equipment_name: string
  technician_name: string
  scheduled_date: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  notes: string
  status: string
  created_at: string
}

export interface AIPrediction {
  forecast_kwh: number
  estimated_cost_inr: number
  confidence_percent: number
  at_risk_zone: string
  risk_reason: string
  recommendation: string
  savings_inr: number
  day_predictions: Array<{
    day: string
    predicted_kwh: number
  }>
  anomaly_detected: boolean
  anomaly_message: string
  isfallback: boolean
  generatedAt: string
}

export interface User {
  id: string
  full_name: string
  email: string
  role: 'Admin' | 'Energy Manager' | 'Zone Manager' | 'Viewer'
  status: 'Active' | 'Inactive'
  last_login: string
  created_at: string
}

export interface Weather {
  temperature: number
  humidity: number
  windSpeed: number
  condition: string
  icon: string
  fetchedAt: string
}

export interface DashboardStats {
  totalPowerKw: number
  totalEnergyKwhToday: number
  totalCostToday: number
  activeAlerts: number
  carbonKgToday: number
  criticalZones: string[]
  warningZones: string[]
}
