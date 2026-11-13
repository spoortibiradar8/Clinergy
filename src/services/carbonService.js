import { useState, useEffect } from 'react';
import { backendApi } from './backendApi';

export function calculateCarbonEmissions(energyKwh) {
  const kwh = parseFloat(energyKwh) || 0;
  const carbonKgRaw = kwh * 0.82;
  return { 
    carbonKg: Number(carbonKgRaw.toFixed(2)), 
    carbonTrees: Math.round(carbonKgRaw / 21.7), 
    carbonCost: Number((carbonKgRaw * 0.15).toFixed(2))
  };
}

export function getGridCarbonStatus(hour = new Date().getHours()) {
  if (hour >= 6 && hour < 9) return { intensity: 'High', gCO2perKwh: 950, reason: 'Morning peak demand, coal-heavy grid' };
  if (hour >= 9 && hour < 15) return { intensity: 'Medium', gCO2perKwh: 750, reason: 'Solar generation offsetting coal' };
  if (hour >= 15 && hour < 18) return { intensity: 'Low', gCO2perKwh: 580, reason: 'Peak solar hours — greenest window' };
  if (hour >= 18 && hour < 21) return { intensity: 'High', gCO2perKwh: 920, reason: 'Evening peak, solar gone, coal dominates' };
  return { intensity: 'Medium', gCO2perKwh: 720, reason: 'Night load, moderate carbon intensity' };
}

export function useCarbon(energyKwh = 0) {
  const [data, setData] = useState({
    emissions: { carbon_kg: 0, carbon_trees: 0, carbon_cost: 0 },
    gridStatus: { intensity: 'Medium', gCO2perKwh: 720, reason: '' },
    lastUpdated: new Date().toISOString()
  });

  useEffect(() => {
    let mounted = true;
    const fetchCarbon = async () => {
      try {
        const result = await backendApi.getCarbon(energyKwh);
        if (mounted && result) {
          setData({
            emissions: result.emissions,
            gridStatus: result.grid_status,
            lastUpdated: result.last_updated
          });
        }
      } catch (err) {
        console.error("Failed to fetch carbon from backend", err);
      }
    };
    fetchCarbon();
    const intervalId = setInterval(fetchCarbon, 300000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [energyKwh]);

  return data;
}
