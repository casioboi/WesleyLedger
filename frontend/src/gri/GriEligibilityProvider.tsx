import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { resolveIncomeGriEligible as resolveGri } from '../lib/griResolve'
import { GriEligibilityContext } from './griEligibilityContext'
import {
  getGriOverridesSnapshot,
  resetGriOverridesToDefaults,
  setLineGriEligible as storeSetLine,
  setSectionGriEligible as storeSetSection,
  subscribeGriOverrides,
} from './griOverridesStore'

export function GriEligibilityProvider({ children }: { children: ReactNode }) {
  const overrides = useSyncExternalStore(
    subscribeGriOverrides,
    getGriOverridesSnapshot,
    () => ({})
  )

  const resolveIncomeGriEligible = useCallback(
    (lineId: string) => resolveGri(lineId, overrides),
    [overrides]
  )

  const setLineGriEligible = useCallback((lineId: string, eligible: boolean) => {
    storeSetLine(lineId, eligible)
  }, [])

  const setSectionGriEligible = useCallback((sectionId: string, eligible: boolean) => {
    storeSetSection(sectionId, eligible)
  }, [])

  const resetGriOverridesToDefaultsCb = useCallback(() => {
    resetGriOverridesToDefaults()
  }, [])

  const value = useMemo(
    () => ({
      overrides,
      resolveIncomeGriEligible,
      setLineGriEligible,
      setSectionGriEligible,
      resetGriOverridesToDefaults: resetGriOverridesToDefaultsCb,
    }),
    [
      overrides,
      resolveIncomeGriEligible,
      setLineGriEligible,
      setSectionGriEligible,
      resetGriOverridesToDefaultsCb,
    ]
  )

  return (
    <GriEligibilityContext.Provider value={value}>{children}</GriEligibilityContext.Provider>
  )
}
