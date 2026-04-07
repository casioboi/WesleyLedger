import { createContext } from 'react'

export type GriEligibilityContextValue = {
  overrides: Readonly<Record<string, boolean>>
  resolveIncomeGriEligible: (lineId: string) => boolean
  setLineGriEligible: (lineId: string, eligible: boolean) => void
  setSectionGriEligible: (sectionId: string, eligible: boolean) => void
  resetGriOverridesToDefaults: () => void
}

export const GriEligibilityContext = createContext<GriEligibilityContextValue | null>(null)
