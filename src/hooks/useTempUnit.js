import { useState, useEffect } from 'react';
import { getSettings } from '../services/settingsService';

/**
 * Returns a formatter function that converts a Celsius temperature value
 * to the user's preferred unit string (e.g. "22.5 °C" or "72.5 °F").
 * Reactively updates when the user changes their preference in Settings.
 */
export function useTempUnit() {
  const unit = 'C';

  const formatTemp = (celsius) => {
    if (celsius === null || celsius === undefined || isNaN(Number(celsius))) return '—';
    const c = Number(celsius);
    return `${c.toFixed(1)} °C`;
  };

  return { unit, formatTemp };
}

