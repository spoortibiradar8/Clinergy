import { supabase } from '../lib/supabase'

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function getApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY || ''
}

// Log initialization status
if (getApiKey()) {
  console.log("✅ [v3.0] Groq AI initialized with key:", getApiKey().substring(0, 8) + "...")
} else {
  console.warn("⚠️ Groq API key is missing in .env (VITE_GROQ_API_KEY)")
}

// Cache object stored in memory (also backed by localStorage)
let memoryCache = null

function isCacheValid() {
  if (!memoryCache) {
    const stored = localStorage.getItem('clinergy_ai_cache')
    if (stored) {
      memoryCache = JSON.parse(stored)
    }
  }
  if (!memoryCache) return false
  const fiveMinutesMs = 5 * 60 * 1000
  return (Date.now() - memoryCache.timestamp) < fiveMinutesMs
}

function saveCache(data) {
  memoryCache = { data, timestamp: Date.now() }
  localStorage.setItem('clinergy_ai_cache', JSON.stringify(memoryCache))
}

function getCache() {
  return memoryCache?.data || null
}

// Fallback data when API is unavailable
const FALLBACK_INSIGHTS = {
  forecast_kwh: 1250,
  estimated_cost_inr: 10625,
  confidence_percent: 0,
  at_risk_zone: 'Unavailable',
  risk_reason: 'AI analysis temporarily unavailable — showing estimates',
  recommendation: 'Unable to generate recommendation — check API connection',
  savings_inr: 0,
  day_predictions: [
    { day: 'Today', predicted_kwh: 1200 },
    { day: 'Tomorrow', predicted_kwh: 1250 },
    { day: 'Day 3', predicted_kwh: 1230 },
    { day: 'Day 4', predicted_kwh: 1210 },
    { day: 'Day 5', predicted_kwh: 1190 },
    { day: 'Day 6 (Sat)', predicted_kwh: 980 },
    { day: 'Day 7 (Sun)', predicted_kwh: 950 }
  ],
  anomaly_detected: false,
  anomaly_message: '',
  isfallback: true
}

async function fetchRecentZoneData() {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('zone_readings')
      .select('zone_name, power_kw, temperature, status, energy_kwh_today, recorded_at')
      .gte('recorded_at', twoHoursAgo)
      .order('recorded_at', { ascending: false })
      .limit(30)

    if (error) throw error
    if (!data || data.length === 0) return []

    // Aggregate per-zone to keep prompt compact
    const zoneMap = {}
    for (const r of data) {
      if (!zoneMap[r.zone_name]) {
        zoneMap[r.zone_name] = {
          zone: r.zone_name,
          latest_power_kw: r.power_kw,
          latest_temp: r.temperature,
          status: r.status,
          energy_kwh_today: r.energy_kwh_today,
          readings_count: 0,
          total_power: 0,
        }
      }
      zoneMap[r.zone_name].readings_count++
      zoneMap[r.zone_name].total_power += (r.power_kw || 0)
    }

    return Object.values(zoneMap).map(z => ({
      zone: z.zone,
      latest_power_kw: z.latest_power_kw,
      avg_power_kw: Math.round((z.total_power / z.readings_count) * 100) / 100,
      temperature: z.latest_temp,
      status: z.status,
      energy_kwh_today: z.energy_kwh_today,
    }))
  } catch (err) {
    console.error('Failed to fetch zone data for AI:', err)
    return []
  }

}

export async function generateInsights(weather) {
  // Return cache if still valid (within 5 minutes)
  if (isCacheValid()) {
    return getCache()
  }

  const apiKey = getApiKey()

  // Prevent network error if API key is not configured
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.warn("Groq API key is not configured. Using mock insights.")
    return { 
      ...FALLBACK_INSIGHTS,
      risk_reason: 'API key not configured. Showing estimates.'
    }
  }

  // Fetch real zone data from Supabase
  const recentReadings = await fetchRecentZoneData()
  
  // If no data yet, return fallback
  if (recentReadings.length === 0) {
    return { ...FALLBACK_INSIGHTS, 
      risk_reason: 'No sensor data available yet — waiting for first readings' }
  }

  const currentTime = new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata' 
  })
  
  const currentHour = new Date().getHours()
  const tariffRate = currentHour >= 6 && currentHour < 22 ? 8.5 : 5.2
  const tariffPeriod = currentHour >= 6 && currentHour < 22 ? 'peak' : 'off-peak'

  const prompt = `You are an AI energy analyst for a hospital called CLINERGY 
in Bengaluru, India. Analyze this real sensor data and respond with 
valid JSON only. No markdown formatting. No text before or after the JSON.

REAL ZONE SENSOR DATA (last 2 hours):
${JSON.stringify(recentReadings, null, 2)}

CURRENT WEATHER IN BENGALURU (real data):
Temperature: ${weather?.temperature ?? 28}°C
Condition: ${weather?.condition ?? 'Unknown'}
Humidity: ${weather?.humidity ?? 65}%

CURRENT TIME: ${currentTime}
CURRENT TARIFF: ₹${tariffRate}/kWh (${tariffPeriod} hours)
PEAK HOURS: 6:00 AM to 10:00 PM IST

Respond with ONLY this JSON, no other text whatsoever:
{
  "forecast_kwh": <number>,
  "estimated_cost_inr": <number>,
  "confidence_percent": <integer between 60 and 95>,
  "at_risk_zone": "<exact zone name from the data>",
  "risk_reason": "<specific reason referencing actual numbers from the data>",
  "recommendation": "<one specific actionable recommendation with rupee savings>",
  "savings_inr": <number>,
  "day_predictions": [
    {"day": "Today", "predicted_kwh": <number>},
    {"day": "Tomorrow", "predicted_kwh": <number>},
    {"day": "Day 3", "predicted_kwh": <number>},
    {"day": "Day 4", "predicted_kwh": <number>},
    {"day": "Day 5", "predicted_kwh": <number>},
    {"day": "Day 6 (Sat)", "predicted_kwh": <number>},
    {"day": "Day 7 (Sun)", "predicted_kwh": <number>}
  ],
  "anomaly_detected": <true or false>,
  "anomaly_message": "<describe anomaly if detected, empty string if not>"
}`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an energy analytics AI. Always respond with valid JSON only. No markdown, no code fences, no extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Groq API error ${response.status}: ${errorBody}`)
    }

    const result = await response.json()
    const responseText = result.choices?.[0]?.message?.content || ''
    
    // Aggressively clean the response to extract pure JSON
    let cleanJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/^[^{]*/s, '')  // remove anything before first {
      .replace(/[^}]*$/s, '')  // remove anything after last }
      .trim()
    
    // Find the outermost JSON object
    const firstBrace = cleanJson.indexOf('{')
    const lastBrace = cleanJson.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No valid JSON object found in response')
    }
    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1)

    const parsed = JSON.parse(cleanJson)
    
    // Validate required fields exist
    const requiredFields = ['forecast_kwh', 'estimated_cost_inr', 
      'confidence_percent', 'at_risk_zone', 'recommendation', 
      'day_predictions']
    for (const field of requiredFields) {
      if (parsed[field] === undefined) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Validate day_predictions is array of 7
    if (!Array.isArray(parsed.day_predictions) || 
        parsed.day_predictions.length < 7) {
      parsed.day_predictions = FALLBACK_INSIGHTS.day_predictions
    }

    // Save valid result to Supabase for history
    supabase.from('ai_predictions').insert({
      forecast_kwh: parsed.forecast_kwh,
      estimated_cost_inr: parsed.estimated_cost_inr,
      confidence_percent: parsed.confidence_percent,
      at_risk_zone: parsed.at_risk_zone,
      risk_reason: parsed.risk_reason,
      recommendation: parsed.recommendation,
      savings_inr: parsed.savings_inr || 0,
      day_predictions: parsed.day_predictions,
      created_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.error('Failed to save AI prediction:', error)
    })

    // Add metadata
    parsed.isfallback = false
    parsed.generatedAt = new Date().toISOString()

    // Save to cache
    saveCache(parsed)

    return parsed

  } catch (err) {
    console.error('Groq API error:', err.message)
    // Return fallback — never crash the UI
    return { 
      ...FALLBACK_INSIGHTS,
      risk_reason: `AI service error: ${err.message}. Showing simulated estimates.`
    }
  }
}
