import { Navigate, Outlet } from 'react-router-dom'
import { useChurchProfile } from '../context/useChurchProfile'

/** Allows /app only when society, circuit, and diocese are saved. */
export function RequireProfile() {
  const { isComplete } = useChurchProfile()
  if (!isComplete) {
    return <Navigate to="/setup" replace />
  }
  return <Outlet />
}
