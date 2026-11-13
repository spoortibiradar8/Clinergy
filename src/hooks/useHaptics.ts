import { useCallback } from "react";

type HapticPattern = number | number[];

export function useHaptics() {
  const trigger = useCallback((pattern: HapticPattern = 50) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silently fail if vibration isn't allowed or supported
      }
    }
  }, []);

  const mediumTap = useCallback(() => trigger(50), [trigger]);
  const lightTap = useCallback(() => trigger(20), [trigger]);
  const heavyTap = useCallback(() => trigger(100), [trigger]);
  const successPattern = useCallback(() => trigger([50, 100, 50]), [trigger]);
  const errorPattern = useCallback(() => trigger([50, 100, 50, 100, 50]), [trigger]);

  return { trigger, lightTap, mediumTap, heavyTap, successPattern, errorPattern };
}
