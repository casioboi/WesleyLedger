import { motion, useReducedMotion } from 'framer-motion'
import styles from './DualRingLoader.module.css'

type Props = {
  size?: number
  label?: string
}

export function DualRingLoader({ size = 112, label }: Props) {
  const reduce = useReducedMotion()

  return (
    <div
      className={styles.wrap}
      style={{ width: size, height: size }}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
    >
      <div className={styles.rings} style={{ width: size, height: size }}>
        <motion.div
          className={styles.ringOuter}
          animate={reduce ? { rotate: 0 } : { rotate: 360 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 1.35, repeat: Infinity, ease: 'linear' }
          }
        />
        <motion.div
          className={styles.ringInner}
          animate={reduce ? { rotate: 0 } : { rotate: -360 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 2.4, repeat: Infinity, ease: 'linear' }
          }
        />
        <div className={styles.glow} aria-hidden />
      </div>
      <motion.div
        className={styles.core}
        animate={reduce ? { scale: 1 } : { scale: [1, 1.05, 1] }}
        transition={reduce ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className={styles.mark}>WL</span>
      </motion.div>
    </div>
  )
}
