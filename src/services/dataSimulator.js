import { supabase } from '../lib/supabase'

const ZONE_CONFIG = [
  {
    zone_name: 'ICU',
    category: 'Critical',
    basePower: 143, minPower: 120, maxPower: 175,
    baseTemp: 21.5, minTemp: 20, maxTemp: 23,
    occupancy_total: 15, baseOccupancy: 12,
    device_count: 18,
    criticalThreshold: 170, warningThreshold: 160
  },
  {
    zone_name: 'Operation Theatre',
    category: 'Critical',
    basePower: 210, minPower: 185, maxPower: 250,
    baseTemp: 20.5, minTemp: 19, maxTemp: 22,
    occupancy_total: 4, baseOccupancy: 3,
    device_count: 12,
    criticalThreshold: 240, warningThreshold: 225
  },
  {
    zone_name: 'Emergency',
    category: 'Critical',
    basePower: 97, minPower: 80, maxPower: 125,
    baseTemp: 23, minTemp: 21, maxTemp: 25,
    occupancy_total: 30, baseOccupancy: 25,
    device_count: 8,
    criticalThreshold: 120, warningThreshold: 110
  },
  {
    zone_name: 'Ward A',
    category: 'Semi-Critical',
    basePower: 55, minPower: 40, maxPower: 75,
    baseTemp: 22, minTemp: 20, maxTemp: 24,
    occupancy_total: 30, baseOccupancy: 18,
    device_count: 6,
    criticalThreshold: 72, warningThreshold: 65
  },
  {
    zone_name: 'Ward B',
    category: 'Semi-Critical',
    basePower: 50, minPower: 38, maxPower: 70,
    baseTemp: 22, minTemp: 20, maxTemp: 24,
    occupancy_total: 28, baseOccupancy: 16,
    device_count: 6,
    criticalThreshold: 68, warningThreshold: 60
  },
  {
    zone_name: 'Pharmacy',
    category: 'General',
    basePower: 28, minPower: 18, maxPower: 40,
    baseTemp: 18, minTemp: 16, maxTemp: 20,
    occupancy_total: 8, baseOccupancy: 5,
    device_count: 4,
    criticalThreshold: 38, warningThreshold: 34
  }
]

// Time of day load factors using REAL current time
function getLoadFactor(hour) {
  if (hour >= 0 && hour < 6)  return 0.60
  if (hour >= 6 && hour < 9)  return 0.75
  if (hour >= 9 && hour < 13) return 1.00
  if (hour >= 13 && hour < 16) return 0.95
  if (hour >= 16 && hour < 19) return 0.85
  if (hour >= 19 && hour < 22) return 0.75
  return 0.65
}

function randomWalk(previous, min, max, maxDrift = 0.04) {
  const drift = (Math.random() - 0.5) * 2 * maxDrift
  const loadFactor = getLoadFactor(new Date().getHours())
  let next = previous * (1 + drift) * loadFactor
  next = Math.max(min, Math.min(max, next))
  return parseFloat(next.toFixed(1))
}

function getStatus(power, config) {
  if (power >= config.criticalThreshold) return 'Critical'
  if (power >= config.warningThreshold) return 'Warning'
  return 'Normal'
}

function getOccupancy(config) {
  const hour = new Date().getHours()
  let factor = 1.0
  if (hour >= 0 && hour < 6)  factor = 0.70
  else if (hour >= 6 && hour < 9)  factor = 0.85
  else if (hour >= 18 && hour < 22) factor = 0.90
  else if (hour >= 22) factor = 0.75
  const base = Math.round(config.baseOccupancy * factor)
  const variation = Math.floor(Math.random() * 3) - 1
  return Math.max(0, Math.min(config.occupancy_total, base + variation))
}

// ─── In-memory store ─────────────────────────────────────────────────────────
// Always up-to-date regardless of Supabase connectivity
let _currentReadings = []

// Historical log for sparklines & hourly trend (last 24h of ticks)
let _readingsHistory = []
const MAX_HISTORY = 1440 // 60 ticks/hour × 24h

export function getCurrentReadings() {
  return _currentReadings
}

export function getReadingsHistory() {
  return _readingsHistory
}

// ─── Simulator class ──────────────────────────────────────────────────────────
class DataSimulator {
  constructor() {
    this.intervalId = null
    this.isRunning = false
    this.prevReadings = {}
    this.prevEnergyToday = {}
    this.prevStatus = {}

    ZONE_CONFIG.forEach(zone => {
      this.prevReadings[zone.zone_name] = zone.basePower
      this.prevEnergyToday[zone.zone_name] = 0
      this.prevStatus[zone.zone_name] = 'Normal'
    })
  }

  generateRows() {
    const now = new Date()
    const isNewDay = now.getHours() === 0 && now.getMinutes() === 0

    return ZONE_CONFIG.map(zone => {
      const newPower = randomWalk(
        this.prevReadings[zone.zone_name],
        zone.minPower,
        zone.maxPower
      )

      const newTemp = parseFloat(
        (zone.baseTemp + (Math.random() - 0.5) * 0.4).toFixed(1)
      )
      const clampedTemp = Math.max(zone.minTemp, Math.min(zone.maxTemp, newTemp))

      if (isNewDay) {
        this.prevEnergyToday[zone.zone_name] = 0
      }
      const addedKwh = parseFloat((newPower * (1 / 60)).toFixed(3))
      this.prevEnergyToday[zone.zone_name] = parseFloat(
        (this.prevEnergyToday[zone.zone_name] + addedKwh).toFixed(2)
      )

      const status = getStatus(newPower, zone)
      this.prevReadings[zone.zone_name] = newPower

      return {
        zone_name: zone.zone_name,
        power_kw: newPower,
        energy_kwh_today: this.prevEnergyToday[zone.zone_name],
        temperature: clampedTemp,
        humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
        occupancy_current: getOccupancy(zone),
        occupancy_total: zone.occupancy_total,
        device_count: zone.device_count,
        status,
        category: zone.category,
        recorded_at: now.toISOString()
      }
    })
  }

  async tick() {
    const rows = this.generateRows()
    const now = new Date()

    // ── 1. Always store in memory & dispatch event ───────────────────────────
    _currentReadings = rows
    _readingsHistory = [..._readingsHistory, ...rows].slice(-MAX_HISTORY)

    window.dispatchEvent(
      new CustomEvent('clinergy-data-update', { detail: { zones: rows, timestamp: now.toISOString() } })
    )

    // ── 2. Local Mock Alerts Generation ──────────────────────────────────────
    for (const row of rows) {
      const prev = this.prevStatus[row.zone_name]
      if (prev !== row.status) {
        let severity = 'info', message = ''
        if (row.status === 'Critical') {
          severity = 'critical'
          message = `${row.zone_name} exceeded critical threshold at ${row.power_kw} kW — immediate attention required`
        } else if (row.status === 'Warning') {
          severity = 'warning'
          message = `${row.zone_name} power approaching threshold at ${row.power_kw} kW`
        } else if (row.status === 'Normal' && prev !== 'Normal') {
          severity = 'info'
          message = `${row.zone_name} returned to normal operating range (${row.power_kw} kW)`
        }
        if (message) {
          const alertObj = {
            id: Math.random().toString(),
            zone_name: row.zone_name, alert_type: 'power_threshold',
            severity, message, resolved: row.status === 'Normal',
            created_at: now.toISOString()
          };
          window.dispatchEvent(new CustomEvent('clinergy-alert', { detail: alertObj }))
        }
        this.prevStatus[row.zone_name] = row.status
      } else {
         if (Math.random() < 0.25) {
             const events = [
               `${row.zone_name} diagnostic ping successful.`,
               `${row.zone_name} cooling efficiency optimized by 1.2%.`,
               `Minor voltage fluctuation normalized in ${row.zone_name}.`,
               `${row.zone_name} active endpoints verified.`,
               `Routine check: ${row.zone_name} telemetry stable at ${row.power_kw}kW`
             ];
             const fakeAlert = {
                 id: Math.random().toString(),
                 zone_name: row.zone_name, alert_type: 'system_event',
                 severity: 'info', message: events[Math.floor(Math.random() * events.length)],
                 resolved: true, created_at: now.toISOString()
             }
             window.dispatchEvent(new CustomEvent('clinergy-alert', { detail: fakeAlert }))
         }
      }
    }

    // ── 3. Try inserting into Supabase (best-effort, won't block UI) ─────────
    // Fire and forget wrapped in async IIFE
    (async () => {
      try {
        await supabase.from('zone_readings').insert(rows)
      } catch (err) {}
    })()
    
    // Also try to insert threshold alerts asynchronously
    rows.forEach(row => {
      const prev = this.prevStatus[row.zone_name];
      // Since prev got updated in step 2, we just blindly skip here, 
      // but if we really wanted to save them we could buffer.
      // But for offline mode, this is enough.
    });
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log('🚀 CLINERGY data simulator started')
    this.tick()
    // Default 10 seconds for initial demo if they go to Live
    this.intervalId = setInterval(() => this.tick(), 10000)
  }

  setUpdateInterval(ms) {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    this.intervalId = setInterval(() => this.tick(), ms)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
  }
}

export const dataSimulator = new DataSimulator()

export async function initializeFirstReadings() {
  console.log('📡 Initializing sensor readings...')
  await dataSimulator.tick()
}
