import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { app } from '../firebase'

export type PortalAccess = {
  canUseAdmin: boolean
}

export async function getPortalAccess(userId: string): Promise<PortalAccess> {
  if (!app) {
    throw new Error('Portal access cannot be verified because Firebase is not configured.')
  }

  const db = getFirestore(app)
  const adminSnapshot = await getDoc(doc(db, 'admins', userId))

  return {
    canUseAdmin: adminSnapshot.exists(),
  }
}
