/** Wesley remittance splits from GRI (amounts in pesewas). Emergency = 2% of remaining 38% of GRI. */
export type RemittanceMinor = {
  connexionalMinor: number
  dioceseMinor: number
  circuitMinor: number
  emergencyMinor: number
}

export function remittanceFromGriMinor(griMinor: number): RemittanceMinor {
  const g = Math.max(0, Math.round(griMinor))
  return {
    connexionalMinor: Math.round(g * 0.4),
    dioceseMinor: Math.round(g * 0.09),
    circuitMinor: Math.round(g * 0.13),
    emergencyMinor: Math.round(g * 0.38 * 0.02),
  }
}
