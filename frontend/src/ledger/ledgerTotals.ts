import { isIsoDateInRange } from '../lib/quarters'
import { remittanceFromGriMinor } from '../lib/remittance'
import type { LedgerTransaction, QuarterTotals } from './ledgerTypes'

export function computeTotalsForRange(
  transactions: LedgerTransaction[],
  startIso: string,
  endIso: string,
  isIncomeGriEligible: (lineId: string) => boolean
): QuarterTotals {
  let incomeMinor = 0
  let expenditureMinor = 0
  let griIncomeMinor = 0
  let remittanceConnexionalLoggedMinor = 0
  let remittanceDioceseLoggedMinor = 0
  let remittanceCircuitLoggedMinor = 0
  let remittanceEmergencyLoggedMinor = 0

  for (const t of transactions) {
    if (!isIsoDateInRange(t.dateIso, startIso, endIso)) continue
    if (t.kind === 'income') {
      incomeMinor += t.amountMinor
      if (isIncomeGriEligible(t.lineId)) {
        griIncomeMinor += t.amountMinor
      }
    } else {
      expenditureMinor += t.amountMinor
      if (t.lineId === 'e8-1') remittanceConnexionalLoggedMinor += t.amountMinor
      else if (t.lineId === 'e8-2') remittanceDioceseLoggedMinor += t.amountMinor
      else if (t.lineId === 'e8-3') remittanceCircuitLoggedMinor += t.amountMinor
      else if (t.lineId === 'e8-5') remittanceEmergencyLoggedMinor += t.amountMinor
    }
  }

  const rem = remittanceFromGriMinor(griIncomeMinor)
  const computedRemittanceMinor =
    (remittanceConnexionalLoggedMinor > 0 ? 0 : rem.connexionalMinor) +
    (remittanceDioceseLoggedMinor > 0 ? 0 : rem.dioceseMinor) +
    (remittanceCircuitLoggedMinor > 0 ? 0 : rem.circuitMinor) +
    (remittanceEmergencyLoggedMinor > 0 ? 0 : rem.emergencyMinor)

  const totalExpenditureMinor = expenditureMinor + computedRemittanceMinor

  return {
    incomeMinor,
    expenditureMinor: totalExpenditureMinor,
    griIncomeMinor,
    surplusMinor: incomeMinor - totalExpenditureMinor,
  }
}
