import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireOwner = false }) {
  const { isAuthenticated, isOwner } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireOwner && !isOwner) {
    return <Navigate to="/staff" replace />
  }

  return children
}
