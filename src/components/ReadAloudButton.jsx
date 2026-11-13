import { useReadAloud } from '../hooks/useReadAloud'

export function ReadAloudButton({ getText, label = 'Read aloud' }) {
  const { isEnabled, speak } = useReadAloud()

  if (!isEnabled) return null

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        speak(typeof getText === 'function' ? getText() : getText)
      }}
      aria-label={label}
      title={label}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '4px',
        borderRadius: '4px',
        color: 'var(--text-secondary)',
        lineHeight: 1,
      }}
    >
      🔊
    </button>
  )
}
