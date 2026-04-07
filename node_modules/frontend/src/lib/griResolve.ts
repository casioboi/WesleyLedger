import { getIncomeLine } from '../data/ledgerLines'

export function defaultIncomeGriEligible(lineId: string): boolean {
  const line = getIncomeLine(lineId)
  return line?.defaultGriEligible === true
}

/** User overrides: only keys present differ from schedule defaults. */
export function resolveIncomeGriEligible(
  lineId: string,
  overrides: Readonly<Record<string, boolean>>
): boolean {
  if (Object.prototype.hasOwnProperty.call(overrides, lineId)) {
    return overrides[lineId] as boolean
  }
  return defaultIncomeGriEligible(lineId)
}
