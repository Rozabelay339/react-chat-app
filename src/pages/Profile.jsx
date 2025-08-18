import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import * as Sentry from '@sentry/react'
import './Profile.css';

export default function Profile() {
  const { user, logout, setUser } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatar, setAvatar] = useState(user?.avatar || 'https://i.pravatar.cc/150')
  const [feedback, setFeedback] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setUsername(user?.username || '')
    setEmail(user?.email || '')
    setAvatar(user?.avatar || 'https://i.pravatar.cc/150')
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setFeedback('')
    try {
      const res = await api.updateUser(user.token, user.id, {
        username: username.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
      })

      setUser((prev) => ({ ...prev, username, email, avatar }))
      setFeedback(' Profilen har uppdaterats')
      Sentry.addBreadcrumb({
        category: 'profile',
        message: 'update success',
        level: 'info',
        data: res.data,
      })
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Tekniskt fel'
      setFeedback(` Fel: ${msg}`)
      Sentry.captureException(err)
    }
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setFeedback(" Skriv exakt 'DELETE' i bekräftelsefältet för att radera kontot.")
      return
    }
    try {
      await api.deleteUser(user.token, user.id)
      await logout()
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Tekniskt fel'
      setFeedback(` Radering misslyckades: ${msg}`)
      Sentry.captureException(err)
    }
  }

  return (
    <div className="profile-page">
      <h2>Min profil</h2>
      <form onSubmit={handleSave} className="profile-form">
        <label>
          Användarnamn
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          E-post
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Avatar (URL)
          <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
        </label>
        {avatar && (
          <div className="avatar-preview">
            <img src={avatar} alt="avatar preview" />
          </div>
        )}
        <button type="submit"> Spara ändringar</button>
      </form>

      <div className="danger-zone">
        <h3> Radera konto</h3>
        <p>Skriv <code>DELETE</code> för att bekräfta.</p>
        <input
          placeholder="DELETE"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <button className="delete-btn" onClick={handleDelete}>
          Radera konto
        </button>
      </div>

      {feedback && <p className="feedback">{feedback}</p>}
    </div>
  )
}
