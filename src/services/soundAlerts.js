function createBeep(frequency, duration, type = 'sine') {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  oscillator.frequency.value = frequency
  oscillator.type = type
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(
    0.001, audioCtx.currentTime + duration
  )

  oscillator.start(audioCtx.currentTime)
  oscillator.stop(audioCtx.currentTime + duration)
}

export const soundAlerts = {
  // High urgent beep for critical alerts
  critical: () => {
    createBeep(880, 0.3, 'square')
    setTimeout(() => createBeep(880, 0.3, 'square'), 400)
    setTimeout(() => createBeep(880, 0.3, 'square'), 800)
  },
  // Medium warning beep
  warning: () => {
    createBeep(660, 0.4, 'sine')
    setTimeout(() => createBeep(660, 0.4, 'sine'), 500)
  },
  // Gentle info chime
  info: () => {
    createBeep(523, 0.2, 'sine')
    setTimeout(() => createBeep(659, 0.3, 'sine'), 200)
  },
  // Success sound
  success: () => {
    createBeep(523, 0.15, 'sine')
    setTimeout(() => createBeep(659, 0.15, 'sine'), 150)
    setTimeout(() => createBeep(784, 0.3, 'sine'), 300)
  }
}
