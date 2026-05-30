import { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { Scissors } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { publicClient } from '../../lib/apollo'
import { OWNER_LOGIN } from '../../graphql/mutations/auth'
import { setTokens, saveRole } from '../../lib/auth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { ErrorMessage } from '../../components/ui/Spinner'

export default function Login() {
  const { isAuthenticated, isOwner } = useAuth()
  const location = useLocation()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [ownerLogin, { loading }] = useMutation(OWNER_LOGIN, { client: publicClient })

  // Already authenticated on this origin — go straight to the dashboard
  if (isAuthenticated) {
    const dest = location.state?.from?.pathname ?? (isOwner ? '/owner' : '/staff')
    return <Navigate to={dest} replace />
  }

  async function submit(e) {
    e.preventDefault()
    setErrorMsg('')
    try {
      const { data } = await ownerLogin({ variables: { email: email.trim().toLowerCase(), password } })
      const { accessToken, refreshToken, tenantSlug } = data.ownerLogin

      // Store tokens on the current origin so AuthContext can read them
      setTokens(accessToken, refreshToken)
      saveRole('owner')

      // Redirect to the tenant subdomain, passing tokens via URL for AuthContext
      const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
      const dest = appDomain
        ? new URL(`https://${tenantSlug}.${appDomain}/owner`)
        : new URL(`http://${tenantSlug}.localhost:${window.location.port || '3000'}/owner`)
      dest.searchParams.set('t', accessToken)
      dest.searchParams.set('r', refreshToken)
      window.location.href = dest.toString()
    } catch (err) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Invalid credentials.'
      setErrorMsg(msg)
    }
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
            {errorMsg && <ErrorMessage message={errorMsg} />}
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
