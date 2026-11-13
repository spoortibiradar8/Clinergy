import { useAccessibility } from '../context/AccessibilityContext'

export function useReadAloud() {
  const { settings, speak, stop } = useAccessibility()

  return { speak, stop, isEnabled: settings.readAloudMode }
}

