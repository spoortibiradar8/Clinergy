import { supabase } from '../lib/supabase';
import { fetchCurrentWeather } from './weatherService';

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

/** Fetch latest zone sensor readings */
async function fetchZoneSummary() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('zone_readings')
      .select('zone_name, power_kw, temperature, status, energy_kwh_today, recorded_at')
      .gte('recorded_at', oneHourAgo)
      .order('recorded_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/** Fetch recent active alerts */
async function fetchActiveAlerts() {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('severity, zone_id, message, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/** Fetch latest AI prediction from the predictions table */
async function fetchLatestPrediction() {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('forecast_kwh, estimated_cost_inr, at_risk_zone, recommendation, savings_inr')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data || null;
  } catch {
    return null;
  }
}

/** Fetch recent maintenance entries */
async function fetchMaintenanceData() {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select('zone_id, type, status, scheduled_at, technician')
      .order('scheduled_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Build the comprehensive system prompt for the chatbot.
 * It includes live data from all layers.
 */
async function buildSystemPrompt(currentPage, userRole) {
  const [zones, alerts, prediction, maintenance, weather] = await Promise.allSettled([
    fetchZoneSummary(),
    fetchActiveAlerts(),
    fetchLatestPrediction(),
    fetchMaintenanceData(),
    fetchCurrentWeather(),
  ]);

  const zonesData = zones.status === 'fulfilled' ? zones.value : [];
  const alertsData = alerts.status === 'fulfilled' ? alerts.value : [];
  const predictionData = prediction.status === 'fulfilled' ? prediction.value : null;
  const maintenanceData = maintenance.status === 'fulfilled' ? maintenance.value : [];
  const weatherData = weather.status === 'fulfilled' ? weather.value : null;

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const currentHour = new Date().getHours();
  const tariff = currentHour >= 6 && currentHour < 22 ? '₹8.5/kWh (Peak)' : '₹5.2/kWh (Off-Peak)';

  return `You are CLINERGY Assistant — a smart, friendly, and expert AI chatbot embedded in CLINERGY, a hospital energy management system in Bengaluru, India.

Your personality: Professional yet warm. Precise with numbers. Proactive with suggestions. You support all hospital staff roles — from admins to viewers.

## Current Context
- **Date & Time (IST):** ${now}
- **Current Electricity Tariff:** ${tariff}
- **User Role:** ${userRole || 'Staff'}
- **Current Page:** ${currentPage || 'Dashboard'}

## Live Zone Sensor Data (Last Hour)
${zonesData.length > 0 ? JSON.stringify(zonesData, null, 2) : 'No sensor data available yet.'}

## Active Alerts
${alertsData.length > 0 ? JSON.stringify(alertsData, null, 2) : 'No active alerts.'}

## Latest AI Energy Prediction
${predictionData ? JSON.stringify(predictionData, null, 2) : 'No prediction data available yet.'}

## Maintenance Schedule
${maintenanceData.length > 0 ? JSON.stringify(maintenanceData, null, 2) : 'No maintenance records found.'}

## Current Weather in Bengaluru
${weatherData ? `Temperature: ${weatherData.temperature}°C, Condition: ${weatherData.condition}, Humidity: ${weatherData.humidity}%` : 'Weather data unavailable.'}

## Your Capabilities
You can answer questions about:
1. **Energy Usage** — Real-time power consumption per zone (ICU, OPD, Surgery, etc.)
2. **Alerts & Anomalies** — Active alerts, severity, and which zones are at risk
3. **Cost & Tariffs** — Current tariff, estimated costs, savings recommendations
4. **AI Predictions** — Energy forecasts, confidence levels, at-risk zones
5. **Maintenance** — Scheduled tasks, technician assignments, equipment status
6. **Weather Impact** — How current weather affects energy (HVAC load, etc.)
7. **Navigation Help** — How to find features within CLINERGY (e.g., "where are reports?")
8. **General Hospital Energy Questions** — Best practices, efficiency tips, sustainability

## Rules
- Always be helpful, accurate, and concise.
- When referencing live data, cite the numbers.
- If data is unavailable, say so clearly and suggest where to find it.
- Format responses using markdown (bold for numbers, bullet points for lists).
- Keep responses under 200 words unless the user asks for a detailed report.
- Never fabricate data — only use what is in the context above.`;
}

/**
 * Send a message to the chatbot and get a response.
 * @param {Array} history - Array of {role, content} message objects
 * @param {string} userMessage - The latest user message
 * @param {string} currentPage - The current route/page name
 * @param {string} userRole - The authenticated user's role
 * @returns {Promise<string>} The AI response text
 */
export async function sendChatMessage(history, userMessage, currentPage, userRole) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return "⚠️ **AI not configured.** Please set `VITE_GROQ_API_KEY` in your `.env` file to enable the chatbot.\n\nIn the meantime, I can tell you that CLINERGY monitors energy usage across all hospital zones. Check the **Dashboard** or **AI Insights** page for live data.";
  }

  try {
    const systemPrompt = await buildSystemPrompt(currentPage, userRole);

    // Build chat history in OpenAI format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

  } catch (err) {
    console.error('Chatbot error:', err);
    if (err.message?.includes('API')) {
      return "⚠️ **Invalid API key.** Please check `VITE_GROQ_API_KEY` in your `.env` file.";
    }
    return "😔 I'm having trouble connecting right now. Please try again in a moment. You can also check the **AI Insights** page for energy data.";
  }
}

/** Quick-reply suggestions based on current page */
export function getQuickReplies(currentPage) {
  const base = [
    "What's the current energy status?",
    "Any active alerts?",
    "Show me cost savings tips",
  ];

  const pageMap = {
    '/': ["Which zone uses most energy?", "Today's energy forecast", "Any critical alerts?"],
    '/live': ["Which zone is overloading?", "Real-time power summary", "Temperature alerts?"],
    '/zones': ["Compare zone efficiency", "Which zone needs attention?", "Best performing zone?"],
    '/ai-insights': ["Explain the energy forecast", "What's the confidence level?", "Cost prediction for today?"],
    '/alerts': ["What caused the latest alert?", "How many critical alerts?", "Which zone has most alerts?"],
    '/maintenance': ["What's scheduled today?", "Pending maintenance tasks?", "Which equipment needs service?"],
    '/reports': ["Summarize last week", "Highest energy day?", "Carbon footprint summary"],
    '/settings': ["How do I change units?", "How do I enable dark mode?", "Notification settings?"],
  };

  return pageMap[currentPage] || base;
}
