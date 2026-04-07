import { useContext } from 'react'
import { LedgerContext } from './ledgerContext'

export function useLedger() {
  const ctx = useContext(LedgerContext)
  if (!ctx) {
    throw new Error('useLedger must be used within LedgerProvider')
  }
  return ctx
}
