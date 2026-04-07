import { useContext } from 'react'
import { ChurchProfileContext } from './churchProfileContext'

export function useChurchProfile() {
  const ctx = useContext(ChurchProfileContext)
  if (!ctx) {
    throw new Error('useChurchProfile must be used within ChurchProfileProvider')
  }
  return ctx
}
