import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireOwner = false }) {
  const { isAuthenticated, isOwner, authLoading } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role not yet determined (old token without embedded role — ProfileLoader is fetching it)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (requireOwner && !isOwner) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
