import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import styles from './ToastHost.module.css'

export type ToastVariant = 'success' | 'info' | 'error'

type ToastState = { id: number; message: string; variant: ToastVariant }

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Keep in sync with `wlToastProgress` duration in ToastHost.module.css */
const DISMISS_MS = 4200

function variantHeadline(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return 'Saved'
    case 'error':
      return 'Error'
    case 'info':
    default:
      return 'Notice'
  }
}

function ToastGlyph({ variant }: { variant: ToastVariant }) {
  const common = { className: styles.glyphSvg, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (variant === 'success') {
    return (
      <svg {...common}>
        <path
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="m8.5 12.5 2.2 2.2 5.3-5.3"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (variant === 'error') {
    return (
      <svg {...common}>
        <path
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 16v-5M12 8h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const idRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    idRef.current += 1
    const id = idRef.current
    setToast({ id, message, variant })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setToast((t) => (t?.id === id ? null : t))
      timerRef.current = null
    }, DISMISS_MS)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const variantClass =
    toast?.variant === 'success'
      ? styles.variantSuccess
      : toast?.variant === 'error'
        ? styles.variantError
        : styles.variantInfo

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div className={styles.host} role="status" aria-live="polite" aria-atomic="true">
          <div key={toast.id} className={`${styles.popup} ${variantClass}`}>
            <div className={styles.iconWrap} aria-hidden>
              <ToastGlyph variant={toast.variant} />
            </div>
            <div className={styles.body}>
              <p className={styles.headline}>{variantHeadline(toast.variant)}</p>
              <p className={styles.message}>{toast.message}</p>
            </div>
            <div className={styles.progressTrack} aria-hidden>
              <div className={styles.progressBar} />
            </div>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
