import { useState, useEffect, useMemo, useCallback } from 'react';
import { backendApi } from '../services/backendApi';
import { getSettings } from '../services/settingsService';
import { soundAlerts } from '../services/soundAlerts';

// Helper to get relative date
const getStartDate = (dateRange) => {
  const d = new Date();
  if (dateRange === '7days') d.setDate(d.getDate() - 7);
  else if (dateRange === '30days') d.setDate(d.getDate() - 30);
  else if (dateRange === '90days') d.setDate(d.getDate() - 90);
  else if (dateRange === 'today') d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export function useZoneReadings() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchLatest = async () => {
      try {
        const data = await backendApi.getCurrentZones();
        if (mounted && data) {
          setZones(data.zones);
          setLastUpdated(data.timestamp);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLatest();
    
    // Poll the python backend every 10 seconds (simulator tick rate)
    const intervalId = setInterval(fetchLatest, 10000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { zones, loading, error, lastUpdated };
}

export function useZoneHistory(zoneName, minutes = 60) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zoneName) return;
    let mounted = true;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Using backendApi.getZoneHistory instead of db query to get in-memory history
        const limit = Math.max(60, minutes); 
        const data = await backendApi.getZoneHistory(zoneName, limit);
        if (mounted && data) {
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch zone history", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // Polling for history too

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [zoneName, minutes]);

  return { history, loading };
}

export function useAlerts(limit = 20) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let eventSource = null;

    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await backendApi.getDbAlerts(limit);
        if (mounted && data) {
          setAlerts(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAlerts();

    // Setup Server-Sent Events (SSE) from the python backend for real-time alerts
    const baseUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000';
    try {
      eventSource = new EventSource(`${baseUrl}/alerts/stream`);
      
      eventSource.onmessage = (event) => {
        if (!mounted) return;
        try {
          const newAlert = JSON.parse(event.data);
          const a11y = JSON.parse(localStorage.getItem('clinergy_a11y') || '{}');
          if (a11y.soundAlerts) {
            soundAlerts[newAlert.severity?.toLowerCase()]?.();
          }
          setAlerts((current) => {
            // Check if we already have this alert to avoid duplicates
            if (current.some(a => a.id === newAlert.id)) return current;
            const nextAlerts = [newAlert, ...current];
            return nextAlerts.slice(0, limit);
          });
        } catch (e) {
          console.error("Error parsing SSE alert", e);
        }
      };
    } catch (e) {
      console.error("Failed to connect to alert stream", e);
    }

    return () => {
      mounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [limit]);

  const markAllRead = async () => {
    try {
      setAlerts(current => current.map(a => ({ ...a, resolved: true })));
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  const unreadCount = alerts.filter((a) => !a.resolved).length;

  return { alerts, unreadCount, markAllRead, loading, error };
}

export function useDashboardStats() {
  const { zones, loading, error } = useZoneReadings();

  const stats = useMemo(() => {
    if (!zones || zones.length === 0) {
      return {
        totalPowerKw: 0,
        totalEnergyKwhToday: 0,
        totalCostToday: 0,
        activeAlerts: 0,
        carbonKgToday: 0,
        criticalZones: [],
        warningZones: []
      };
    }

    let totalPower = 0;
    let totalEnergy = 0;
    let activeAlerts = 0;
    const criticalZones = [];
    const warningZones = [];

    zones.forEach((zone) => {
      totalPower += Number(zone.power_kw) || 0;
      totalEnergy += Number(zone.energy_kwh_today) || 0;

      if (zone.status !== 'Normal') {
        activeAlerts++;
      }
      if (zone.status === 'Critical') {
        criticalZones.push(zone.zone_name);
      } else if (zone.status === 'Warning') {
        warningZones.push(zone.zone_name);
      }
    });

    const peakRate = Number(getSettings('tariff_peak', 8.5));
    const totalCost = totalEnergy * peakRate;
    const carbonKg = totalEnergy * 0.82;

    return {
      totalPowerKw: totalPower,
      totalEnergyKwhToday: totalEnergy,
      totalCostToday: totalCost,
      activeAlerts,
      carbonKgToday: carbonKg,
      criticalZones,
      warningZones
    };
  }, [zones]);

  return { ...stats, loading, error };
}

export function useReportsData(dateRange, zoneName) {
  const [reportData, setReportData] = useState({
    readings: [],
    totalEnergyKwh: 0,
    totalCostInr: 0,
    carbonKg: 0,
    avgPerDay: 0,
    zoneBreakdown: [],
    dailyTotals: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const startDate = getStartDate(dateRange);
        
        let hours = 24;
        if (dateRange === '7days') hours = 24 * 7;
        else if (dateRange === '30days') hours = 24 * 30;
        else if (dateRange === '90days') hours = 24 * 90;
        
        const zoneFilter = (zoneName && zoneName !== 'All Zones') ? zoneName : undefined;
        // Fetch from python backend db history
        const data = await backendApi.getDbHistory(zoneFilter, hours, 50000);

        if (mounted && data) {
          let totalEnergyRaw = 0;
          const zoneSums = {};
          const dailySums = {};

          data.forEach((r) => {
            const energy = Number(r.energy_kwh_today) || 0; 
            const dateStr = new Date(r.recorded_at).toISOString().split('T')[0];
            const zone = r.zone_name;

            if (!zoneSums[zone]) zoneSums[zone] = { category: r.category || 'General', days: {} };
            if (!zoneSums[zone].days[dateStr] || energy > zoneSums[zone].days[dateStr]) {
                zoneSums[zone].days[dateStr] = energy;
            }
          });

          const finalZoneSums = {};
          Object.keys(zoneSums).forEach(zone => {
             finalZoneSums[zone] = { total: 0, category: zoneSums[zone].category };
             Object.keys(zoneSums[zone].days).forEach(dateStr => {
                 const dEn = zoneSums[zone].days[dateStr];
                 finalZoneSums[zone].total += dEn;
                 totalEnergyRaw += dEn;
                 
                 if (!dailySums[dateStr]) dailySums[dateStr] = 0;
                 dailySums[dateStr] += dEn;
             });
          });

          const peakRate = Number(getSettings('tariff_peak', 8.5));
          const totalCost = totalEnergyRaw * peakRate;
          const carbon = totalEnergyRaw * 0.82;

          let numberOfDays = 1;
          if (dateRange === '7days') numberOfDays = 7;
          else if (dateRange === '30days') numberOfDays = 30;
          else if (dateRange === '90days') numberOfDays = 90;
          
          const avgPerDay = totalEnergyRaw / numberOfDays;

          const zoneBreakdown = Object.keys(finalZoneSums).map(z => {
              const ez = finalZoneSums[z].total;
              return {
                  zoneName: z,
                  category: finalZoneSums[z].category,
                  energyKwh: ez,
                  cost: ez * peakRate,
                  carbon: ez * 0.82,
                  percentOfTotal: totalEnergyRaw ? (ez / totalEnergyRaw) * 100 : 0,
                  trend: 'Stable'
              };
          });

          const dailyTotals = Object.keys(dailySums).map(d => ({
              date: d,
              energyKwh: dailySums[d]
          })).sort((a,b) => a.date.localeCompare(b.date));

          setReportData({
            readings: data,
            totalEnergyKwh: totalEnergyRaw,
            totalCostInr: totalCost,
            carbonKg: carbon,
            avgPerDay,
            zoneBreakdown,
            dailyTotals
          });
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReports();
  }, [dateRange, zoneName]);

  return { reportData, loading, error };
}

export function useAIInsights() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [nextRefreshIn, setNextRefreshIn] = useState(300)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await backendApi.getAIInsights()
      setInsights(data)
      setLastUpdated(new Date())
      setNextRefreshIn(300) 
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const interval = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          return 300
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const nextRefreshDisplay = nextRefreshIn >= 60
    ? `${Math.floor(nextRefreshIn / 60)}m ${nextRefreshIn % 60}s`
    : `${nextRefreshIn}s`

  return { 
    insights, 
    loading, 
    error, 
    lastUpdated, 
    nextRefreshDisplay,
    refresh
  }
}

export function useMaintenanceData() {
  const [equipment, setEquipment] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [eqRes, schedRes] = await Promise.all([
          backendApi.getEquipment(100),
          backendApi.getSchedules()
        ]);

        if (mounted) {
          if (eqRes) setEquipment(eqRes);
          if (schedRes) setSchedule(schedRes);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching maintenance data:", err);
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    // Since we don't have SSE for maintenance yet, just poll occasionally 
    const intervalId = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { equipment, schedule, loading };
}
