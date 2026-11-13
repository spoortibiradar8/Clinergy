import { useAccessibility } from '../context/AccessibilityContext'

/**
 * Bridge Hook
 * Connects components to the Master Voice Engine in AccessibilityContext
 */
export function useVoiceCommands() {
  const { voiceState, startVoice, stopVoice } = useAccessibility()

  return {
    isListening: voiceState.isListening,
    volume: voiceState.volume,
    lastWords: voiceState.lastWords,
    status: voiceState.status,
    startVoice,
    stopVoice,
    isSupported: !!(window.webkitSpeechRecognition || window.SpeechRecognition)
  }
}
