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
  const location = useLocation()
  const { doLogin, loading, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    const dest = location.state?.from?.pathname ?? (isOwner ? '/owner' : '/staff')
    return <Navigate to={dest} replace />
  }

  async function submit(e) {
    e.preventDefault()
    try { await doLogin(email, password) } catch {}
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-primary mb-3">
            <Scissors size={24} />
            <span className="font-display text-2xl font-bold">Kimawa</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Owner sign in</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Staff?{' '}
            <Link to="/staff" className="text-primary hover:underline font-medium">Use the staff portal</Link>
            {' '}(no account needed).
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-6">
          <form onSubmit={submit} className="space-y-4">
            {error && <ErrorMessage message={error.graphQLErrors?.[0]?.message ?? 'Invalid credentials.'} />}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="your@email.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
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
