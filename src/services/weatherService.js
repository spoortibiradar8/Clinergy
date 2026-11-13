import { useState, useEffect } from 'react';
import { backendApi } from './backendApi';

export async function fetchCurrentWeather() {
  const data = await backendApi.getWeather();
  return data.weather;
}

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        const data = await fetchCurrentWeather();
        if (mounted) {
          setWeather(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWeather();
    const intervalId = setInterval(fetchWeather, 600000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { weather, loading, error };
}

export function getHVACImpact(temperature) {
  if (temperature > 35) {
    return { impact: 'Very High', extraLoad: 15, message: 'Extreme heat — cooling load +15% above baseline' };
  } else if (temperature > 30) {
    return { impact: 'High', extraLoad: 8, message: 'High temperature — cooling load +8% above baseline' };
  } else if (temperature > 25) {
    return { impact: 'Moderate', extraLoad: 4, message: 'Warm weather — cooling load +4% above baseline' };
  } else {
    return { impact: 'Low', extraLoad: 0, message: 'Comfortable temperature — no extra cooling load' };
  }
}
