import { useTheme } from '../theme/useTheme'
import styles from './ThemeToggle.module.css'

type Props = {
  /** 'default' = icon + label; 'compact' = icon only (e.g. header) */
  variant?: 'default' | 'compact'
  className?: string
}

export function ThemeToggle({ variant = 'default', className }: Props) {
  const { theme, setTheme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div
      className={`${styles.wrap} ${variant === 'compact' ? styles.compact : ''} ${className ?? ''}`}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        className={`${styles.option} ${!isLight ? styles.optionActive : ''}`}
        onClick={() => setTheme('dark')}
        aria-pressed={!isLight}
      >
        <IconMoon />
        {variant === 'default' ? <span>Dark</span> : null}
      </button>
      <button
        type="button"
        className={`${styles.option} ${isLight ? styles.optionActive : ''}`}
        onClick={() => setTheme('light')}
        aria-pressed={isLight}
      >
        <IconSun />
        {variant === 'default' ? <span>Light</span> : null}
      </button>
    </div>
  )
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  )
}
