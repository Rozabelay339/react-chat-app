// src/components/SideNav.jsx
import { useAuth } from '../context/AuthContext'
import { useNavigate, NavLink } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './SideNav.css'

export default function SideNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    Sentry.addBreadcrumb({ category: 'auth', message: 'logout click', level: 'info' })
    navigate('/login')
  }

  return (
    <aside className="sidenav">
      <div className="sidenav-header">
        <img src={user?.avatar || 'https://i.pravatar.cc/100'} alt="Avatar" />
        <span>{user?.username || 'User'}</span>
      </div>

      <nav className="sidenav-links">
        <NavLink to="/profile">👤 Profile</NavLink>
        <NavLink to="/chat">💬 Chat</NavLink> 
      </nav>

      <div className="sidenav-footer">
        <button onClick={handleLogout}>🚪 Logout</button>
      </div>
    </aside>
  )
}
