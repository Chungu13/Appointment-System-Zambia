import { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLogin } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { ErrorMessage } from '../../components/ui/Spinner'

export default function Login() {
  const { isAuthenticated, isOwner } = useAuth()
  const { doLogin, loading, error } = useLogin()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    const dest = location.state?.from?.pathname ?? (isOwner ? '/owner' : '/staff')
    return <Navigate to={dest} replace />
  }

  async function submit(e) {
    e.preventDefault()
    try {
      await doLogin(username, password)
    } catch {
      // error surfaced via hook
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-primary mb-3">
            <Scissors size={24} />
            <span className="font-display text-2xl font-bold">BeautyBook ZM</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Welcome back</h1>
          <p className="text-on-surface-variant text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-6">
          {error && (
            <ErrorMessage
              message={error.graphQLErrors?.[0]?.message ?? 'Invalid username or password.'}
              className="mb-4"
            />
          )}
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" fullWidth loading={loading}>Sign in</Button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          <Link to="/" className="text-primary hover:underline">← Back to directory</Link>
        </p>
      </div>
    </div>
  )
}
