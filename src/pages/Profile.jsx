// src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import * as Sentry from '@sentry/react'
import './Profile.css'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatar, setAvatar] = useState(user?.avatar || 'https://i.pravatar.cc/150')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setUsername(user?.username || '')
    setEmail(user?.email || '')
    setAvatar(user?.avatar || 'https://i.pravatar.cc/150')
  }, [user])

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!user?.token) return
    setSaving(true); setFeedback('')
    try {
      await api.updateUser(user.token, user.id, {
        username: username.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
      })
      // Uppdatera client state
      const updated = { ...user, username: username.trim(), email: email.trim(), avatar: avatar.trim() }
      setUser(updated)
      Sentry.captureMessage('profile updated', { level: 'info' })
      setFeedback('Profil uppdaterad ✅')
    } catch (err) {
      console.error('update error', err)
      Sentry.captureException(err)
      const backendError = err.response?.data?.error || err.response?.data?.detail || 'Tekniskt fel vid uppdatering.'
      setFeedback(String(backendError))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user?.token) return
    const ok = confirm('Är du säker? Detta raderar ditt konto permanent.')
    if (!ok) return
    setDeleting(true); setFeedback('')
    try {
      await api.deleteUser(user.token, user.id)
      Sentry.captureMessage('user deleted', { level: 'warning' })
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('delete error', err)
      Sentry.captureException(err)
      const backendError = err.response?.data?.error || err.response?.data?.detail || 'Tekniskt fel vid radering.'
      setFeedback(String(backendError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="profile-page">
      <h2>Profil</h2>

      <form onSubmit={handleUpdate} className="profile-form">
        <label>
          Användarnamn
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>

        <label>
          E-post
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Avatar URL
          <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
        </label>

        {avatar && <img src={avatar} alt="avatar preview" className="avatar-preview" />}

        <div className="profile-actions">
          <button type="submit" disabled={saving}>{saving ? 'Sparar…' : 'Spara ändringar'}</button>
          <button type="button" className="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Raderar…' : 'Radera konto'}
          </button>
        </div>
      </form>

      {feedback && <p className="feedback">{feedback}</p>}
    </div>
  )
}

