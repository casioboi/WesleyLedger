import { createContext } from 'react'
import type { ChurchProfile } from '../lib/churchProfileModel'

export type ChurchProfileContextValue = {
  profile: ChurchProfile
  isComplete: boolean
  saveProfile: (next: Omit<ChurchProfile, 'updatedAt'>) => void
}

export const ChurchProfileContext = createContext<ChurchProfileContextValue | null>(
  null
)
