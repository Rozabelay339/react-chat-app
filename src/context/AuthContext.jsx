import React, { createContext, useState, useEffect, useContext } from 'react'
import { decodeToken, isExpired } from '../Utils/decodeToken'
import * as Sentry from '@sentry/react'
import { api } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
    if (isExpired(token)) {
      localStorage.removeItem('token')
      return null
    }
    const decoded = decodeToken(token)
    if (!decoded) return null
    return {
      token,
      id: decoded.id,
      username: decoded.username ?? '',
      email: decoded.email ?? null,
      avatar: decoded.avatar ?? 'https://i.pravatar.cc/100',
      invites: decoded.invites ?? [], 
    }
  })

  useEffect(() => {
    if (user?.token) {
      localStorage.setItem('token', user.token)
      Sentry.setUser({ id: String(user.id), username: user.username })
    } else {
      localStorage.removeItem('token')
      Sentry.setUser(null)
    }
  }, [user])


  const login = async (token) => {
    const decoded = decodeToken(token)
    let invites = []
    try {
      const res = await api.getConversations(token)
      invites = res.data?.invitesReceived || []
    } catch (err) {
      console.error('Kunde inte hämta invites:', err)
      Sentry.captureException(err)
    }

    const loggedInUser = {
      token,
      id: decoded?.id,
      username: decoded?.username ?? '',
      email: decoded?.email ?? null,
      avatar: decoded?.avatar ?? 'https://i.pravatar.cc/100',
      invites, 
    }

    Sentry.addBreadcrumb({ category: 'auth', message: 'login success', level: 'info' })
    setUser(loggedInUser)
  }

  const logout = async () => {
    try {
      await api.clearCsrf()
    } catch (_) {}
    Sentry.addBreadcrumb({ category: 'auth', message: 'logout', level: 'info' })
    setUser(null)
    localStorage.removeItem('token')
    Sentry.setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token: user?.token || null, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
