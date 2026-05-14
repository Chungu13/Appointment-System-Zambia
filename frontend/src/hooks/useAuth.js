import { useMutation } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { useAuth as useAuthContext } from '../context/AuthContext'
import { LOGIN } from '../graphql/mutations/auth'

export function useLogin() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const [loginMutation, { loading, error }] = useMutation(LOGIN)

  async function doLogin(username, password) {
    const { data } = await loginMutation({ variables: { username, password } })
    const { accessToken, refreshToken, user } = data.login
    login(accessToken, refreshToken, user)
    if (user.role === 'OWNER') navigate('/owner')
    else navigate('/staff')
    return user
  }

  return { doLogin, loading, error }
}

export function useLogout() {
  const { logout } = useAuthContext()
  const navigate = useNavigate()

  return () => {
    logout()
    navigate('/login')
  }
}
