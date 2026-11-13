import { useMemo } from 'react';
import { 
  HOME_RECOMMENDATIONS, 
  LIVE_RECOMMENDATIONS, 
  ZONE_RECOMMENDATIONS, 
  AI_RECOMMENDATIONS, 
  MAINTENANCE_RECOMMENDATIONS,
  REPORTS_RECOMMENDATIONS,
  type Recommendation 
} from '@/utils/recommendations';
import { useDashboardStats, useAlerts, useZoneReadings } from './useRealtimeData';
import { useWeather } from '@/services/weatherService';

export function useLiveRecommendations(context: 'home' | 'live' | 'zone' | 'ai' | 'maintenance' | 'reports' = 'home') {
  const { totalPowerKw, criticalZones, warningZones } = useDashboardStats();
  const { alerts } = useAlerts();
  const { zones } = useZoneReadings();
  const { weather } = useWeather();

  const dynamicRecs = useMemo(() => {
    let baseList: Recommendation[] = [];
    
    // Select base list based on context
    switch (context) {
      case 'home': baseList = [...HOME_RECOMMENDATIONS]; break;
      case 'live': baseList = [...LIVE_RECOMMENDATIONS]; break;
      case 'zone': baseList = [...ZONE_RECOMMENDATIONS]; break;
      case 'ai': baseList = [...AI_RECOMMENDATIONS]; break;
      case 'maintenance': baseList = [...MAINTENANCE_RECOMMENDATIONS]; break;
      case 'reports': baseList = [...REPORTS_RECOMMENDATIONS]; break;
    }

    // Dynamic filtering and prioritization logic
    return baseList.map(rec => {
      let priority = rec.priority;
      let shouldShow = true;

      // 1. Power Threshold Logic (Home/Live)
      if (rec.id === 'h1' || rec.tags?.includes('power')) {
        if (totalPowerKw > 800) priority = 'high';
        else if (totalPowerKw > 500) priority = 'medium';
        else priority = 'low';
      }

      // 2. Weather/HVAC Logic
      if (rec.id === 'h2' && weather) {
        if (weather.humidity > 75 || weather.temp > 32) priority = 'high';
      }

      // 3. Alerts Logic
      if (rec.tags?.includes('live')) {
        const hasCritical = alerts.some(a => a.severity === 'Critical' && !a.resolved);
        if (hasCritical) priority = 'high';
      }

      // 4. Maintenance / Critical Zone Logic
      if (rec.category === 'maintenance') {
        const hasCriticalZone = criticalZones.length > 0;
        if (hasCriticalZone) priority = 'high';
      }

      // 5. Zone specific logic (e.g., if any zone has high occupancy but low load)
      if (rec.id === 'z1') {
        const wastefulZones = zones.filter(z => z.occupancy > 70 && z.power_kw < 5);
        if (wastefulZones.length > 0) priority = 'high';
      }

      return { ...rec, priority };
    }).sort((a, b) => {
      // Sort by priority: high > medium > low
      const weights = { high: 3, medium: 2, low: 1 };
      return weights[b.priority] - weights[a.priority];
    });
  }, [context, totalPowerKw, criticalZones, warningZones, alerts, zones, weather]);

  return dynamicRecs;
}
