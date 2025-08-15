import { createContext, useState, useEffect, useContext } from 'react'
import { decodeToken, isExpired } from '../Utils/decodeToken'
import * as Sentry from '@sentry/react'
import { api } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
    if (isExpired(token)) { localStorage.removeItem('token'); return null }
    const decoded = decodeToken(token)
    if (!decoded) return null
    return {
      token,
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email || null,
      avatar: decoded.avatar || 'https://i.pravatar.cc/100',
    }
  })

  // Sync localStorage + Sentry user
  useEffect(() => {
    if (user?.token) {
      localStorage.setItem('token', user.token)
      Sentry.setUser({ id: user.id, username: user.username })
    } else {
      localStorage.removeItem('token')
      Sentry.setUser(null)
    }
  }, [user])

  const login = (token) => {
    const decoded = decodeToken(token)
    const loggedInUser = {
      token,
      id: decoded?.sub,
      username: decoded?.username,
      email: decoded?.email || null,
      avatar: decoded?.avatar || 'https://i.pravatar.cc/100',
    }
    Sentry.addBreadcrumb({ category: 'auth', message: 'login success', level: 'info' })
    setUser(loggedInUser)
  }

  const logout = async () => {
    try {
      await api.clearCsrf() // valfritt men nice att städa
    } catch (_) {}
    Sentry.addBreadcrumb({ category: 'auth', message: 'logout', level: 'info' })
    setUser(null)
    localStorage.removeItem('token')
    Sentry.setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

