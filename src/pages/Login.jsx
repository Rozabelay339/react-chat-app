import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setFeedback('')
    try {
      const csrfRes = await api.getCsrf()
      const csrfToken = csrfRes.data?.csrfToken
      if (!csrfToken) {
        setFeedback('Kunde inte hämta CSRF-token.')
        return
      }
      const res = await api.login({
        username: username.trim(),
        password: password.trim(),
        csrfToken,
      })
      const token = res.data?.token
      if (!token) throw new Error('Token saknas i svaret')
      login(token)
      navigate('/chat')
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.response?.data?.error || err.message
      if (String(msg).toLowerCase().includes('invalid credentials')) {
        setFeedback('Invalid credentials')
      } else {
        setFeedback('Tekniskt fel vid inloggning.')
      }
    }
  }

  return (
    <form onSubmit={handleLogin} className="login-form">
      <h2>Logga in</h2>
      <input
        type="text"
        placeholder="Användarnamn"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Logga in</button>
      {feedback && <p className="feedback">{feedback}</p>}
    </form>
  )
}
