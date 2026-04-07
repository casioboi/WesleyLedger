import { useContext } from 'react'
import { GriEligibilityContext } from './griEligibilityContext'

export function useGriEligibility() {
  const ctx = useContext(GriEligibilityContext)
  if (!ctx) {
    throw new Error('useGriEligibility must be used within GriEligibilityProvider')
  }
  return ctx
}
