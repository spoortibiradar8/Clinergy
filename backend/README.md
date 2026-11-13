# ClinErgy Python Backend

A production-grade **FastAPI + Python** backend that replaces all JavaScript service logic in the ClinErgy platform with proper server-side implementations.

---

## What This Backend Replaces

| Old JS/TS File | New Python Module | What It Does |
|---|---|---|
| `src/services/dataSimulator.js` | `services/data_simulator.py` | Async IoT telemetry simulation via `asyncio` |
| `src/services/aiInsightsService.js` | `services/ai_insights.py` | Groq LLM + Scikit-Learn demand forecasting |
| `src/services/chatbotService.js` | `services/chatbot.py` | Live-data chatbot via Groq LLM |
| `src/services/weatherService.js` | `services/weather_service.py` | Open-Meteo weather + HVAC impact |
| `src/services/carbonService.js` | `services/carbon_service.py` | Carbon emission calculations |
| `src/components/ExportReports.tsx` (jsPDF) | `services/pdf_service.py` | Server-side PDF via ReportLab |
| `src/lib/supabase.ts` (direct client calls) | `database/connection.py` | Supabase singleton via `supabase-py` |

---

## Project Structure

```
backend/
├── main.py                    # FastAPI app — registers all routers & lifespan
├── config.py                  # Pydantic settings (loads backend/.env)
├── requirements.txt           # All Python dependencies
├── start.bat                  # Windows one-click launcher
├── .env                       # Backend environment variables
│
├── database/
│   ├── __init__.py
│   └── connection.py          # Singleton Supabase client
│
├── schemas/
│   ├── __init__.py
│   └── models.py              # All Pydantic request/response models
│
├── services/
│   ├── __init__.py
│   ├── data_simulator.py      # Async IoT telemetry simulator
│   ├── ai_insights.py         # Groq LLM + Scikit-Learn forecasting
│   ├── chatbot.py             # Chatbot with live Supabase context
│   ├── carbon_service.py      # Carbon footprint calculations
│   ├── weather_service.py     # Open-Meteo weather API wrapper
│   └── pdf_service.py         # ReportLab PDF report generator
│
└── routers/
    ├── __init__.py
    ├── zones.py               # GET /zones/current, /history, /db-history
    ├── alerts.py              # GET /alerts/recent, /db, SSE /stream
    ├── ai_insights.py         # GET /ai-insights/
    ├── chatbot.py             # POST /chatbot/message, GET /quick-replies
    ├── environment.py         # GET /environment/weather, /carbon
    ├── reports.py             # POST /reports/pdf
    └── maintenance.py         # GET/POST /maintenance/equipment, /schedules
```

---

## Quick Start (Windows)

### Option 1 — Double-click (Recommended)
```
Double-click:  backend/start.bat
```
This automatically:
1. Creates a Python virtual environment (`venv/`)
2. Installs all dependencies from `requirements.txt`
3. Starts Uvicorn on `http://127.0.0.1:8000`

### Option 2 — Manual
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## API Documentation

Once running, open in your browser:

| URL | Description |
|---|---|
| `http://127.0.0.1:8000/docs` | Interactive Swagger UI (try every endpoint) |
| `http://127.0.0.1:8000/redoc` | ReDoc documentation |
| `http://127.0.0.1:8000/health` | Health check + simulator status |

---

## Key API Endpoints

### Zones (IoT Telemetry)
```
GET  /zones/current        → Latest live reading for all 6 zones
GET  /zones/history        → In-memory history (up to 1440 ticks)
GET  /zones/db-history     → Historical data from Supabase
```

### Alerts
```
GET  /alerts/recent        → In-memory alert buffer (this session)
GET  /alerts/db            → Persisted alerts from Supabase
GET  /alerts/stream        → Server-Sent Events stream (real-time push)
```

### AI Insights
```
GET  /ai-insights/         → 7-day forecast (Groq LLM or Scikit-Learn fallback)
```

### Chatbot
```
POST /chatbot/message      → Send message, get AI reply with live context
GET  /chatbot/quick-replies?page=/zones → Page-aware suggestions
```

### Environment
```
GET  /environment/weather             → Bengaluru weather + HVAC impact
GET  /environment/carbon?energy_kwh=X → Carbon footprint for given kWh
```

### Reports (PDF)
```
POST /reports/pdf          → Generate & download compliance PDF
Body: { "start_date": "2025-05-01", "end_date": "2025-05-18",
        "zones": null, "include_ai": true, "include_maintenance": true }
```

### Maintenance
```
GET  /maintenance/equipment           → Equipment registry
GET  /maintenance/schedules           → All schedules
POST /maintenance/schedules           → Create new schedule
PATCH /maintenance/equipment/{id}     → Update health score/status
```

---

## Using from the React Frontend

A typed TypeScript client is provided at `src/services/backendApi.ts`.

```typescript
import { backendApi } from '../services/backendApi'

// Get live zone data from Python backend
const { zones } = await backendApi.getCurrentZones()

// Get AI energy forecast
const insights = await backendApi.getAIInsights()

// Chat with the AI assistant
const { reply } = await backendApi.chat(history, "Which zone uses most energy?", '/zones', 'Zone Manager')

// Download a PDF report (triggers browser download)
await backendApi.downloadPDF({ start_date: '2025-05-01', end_date: '2025-05-18' })

// Get Bengaluru weather
const { weather, hvac_impact } = await backendApi.getWeather()

// Calculate carbon emissions
const carbon = await backendApi.getCarbon(1250)  // 1250 kWh
```

---

## Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GROQ_API_KEY` | Groq API key for LLM features |
| `SIMULATOR_INTERVAL_SECONDS` | Telemetry tick rate (default: 10s) |
| `FRONTEND_ORIGIN` | Frontend URL for CORS (default: http://localhost:5173) |

---

## Python Libraries Used

| Library | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.5 | Web framework & routing |
| `uvicorn` | 0.32.1 | ASGI server |
| `supabase` | 2.10.0 | Database client |
| `httpx` | 0.27.2 | Async HTTP (Groq, Open-Meteo) |
| `pydantic` | 2.10.3 | Data validation & schemas |
| `pandas` | 2.2.3 | Data aggregation & analysis |
| `numpy` | 2.1.3 | Numerical computations |
| `scikit-learn` | 1.5.2 | Linear regression fallback forecast |
| `reportlab` | 4.2.5 | Server-side PDF generation |
| `python-dotenv` | 1.0.1 | Environment variable loading |
