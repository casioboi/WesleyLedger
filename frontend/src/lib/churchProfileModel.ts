export type ChurchProfile = {
  society: string
  circuit: string
  diocese: string
  updatedAt: string
}

export function isProfileComplete(p: ChurchProfile | null): boolean {
  if (!p) return false
  return (
    p.society.trim() !== '' && p.circuit.trim() !== '' && p.diocese.trim() !== ''
  )
}
