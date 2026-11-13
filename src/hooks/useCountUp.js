import { useState, useEffect } from 'react';

export function useCountUp(targetValue, duration = 1200, decimals = 0) {
  const [currentDisplayValue, setCurrentDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = currentDisplayValue;
    const finalTarget = Number(targetValue);
    
    if (isNaN(finalTarget)) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + easeOut * (finalTarget - startValue);
      setCurrentDisplayValue(Number(nextValue.toFixed(decimals)));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [targetValue, duration, decimals]);

  return currentDisplayValue;
}
