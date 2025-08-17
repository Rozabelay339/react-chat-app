import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import './Register.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('https://i.pravatar.cc/150')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setFeedback('')
    try {
      const csrfRes = await api.getCsrf()
      const csrfToken = csrfRes.data?.csrfToken
      if (!csrfToken) {
        setFeedback('Kunde inte hämta CSRF-token.')
        return
      }

      const payload = {
        username: username.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
        password: password.trim(),
        csrfToken,
      }

      const res = await api.register(payload)
      console.log(' Register response:', res.data)
      setFeedback('Registrering lyckades! Du skickas vidare...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      const backendError =
        err.response?.data?.error || err.response?.data?.detail || null
      if (backendError) {
        setFeedback(`Fel från servern: ${backendError}`)
      } else {
        setFeedback('Tekniskt fel vid registrering.')
      }
    }
  }

  return (
    <form onSubmit={handleRegister} className="register-form">
      <h2>Registrera</h2>
      <input type="text" placeholder="Användarnamn" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="url" placeholder="Avatar URL (valfritt)" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
      <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {avatar && <img src={avatar} alt="avatar preview" className="avatar-preview" />}
      <button type="submit">Registrera</button>
      {feedback && <p className="feedback">{feedback}</p>}
    </form>
  )
}
