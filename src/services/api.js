import axios from 'axios'
import * as Sentry from '@sentry/react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://chatify-api.up.railway.app'

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, 
})

axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      data: config.data,
      params: config.params,
    })
    return config
  },
  (error) => {
    Sentry.captureException(error)
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (res) => {
    console.log(`[API Response] ${res.config.url}`, res.data)
    return res
  },
  (error) => {
    console.error('[API Error]', error.response?.data || error.message)
    Sentry.captureException(error)
    return Promise.reject(error)
  }
)

export const normalizeUser = (u) => ({
  id: u?.userId ?? u?.id ?? null,
  username: u?.username ?? '',
  avatar: u?.avatar ?? 'https://i.pravatar.cc/100',
  email: u?.email ?? '',
})

const requireToken = (token) => {
  if (!token) throw new Error('JWT token missing')
}

export const api = {
  getCsrf: () => axiosInstance.patch('/csrf', {}),
  clearCsrf: () => axiosInstance.delete('/csrf'),


  register: ({ username, password, email, avatar, csrfToken }) =>
    axiosInstance.post('/auth/register', { username, password, email, avatar, csrfToken }),

  login: ({ username, password, csrfToken }) =>
    axiosInstance.post('/auth/token', { username, password, csrfToken }),

  
  getAllUsers: (token, username, limit, offset) => {
    requireToken(token)
    return axiosInstance.get('/users', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        ...(username ? { username } : {}),
        ...(limit ? { limit } : {}),
        ...(offset ? { offset } : {}),
      },
    })
  },

  getUser: (token, userId) => {
    requireToken(token)
    return axiosInstance.get(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

updateUser: (token, userId, { username, email, avatar }) => {
  requireToken(token)
  return axiosInstance.put(
    '/user',
    { userId, username, email, avatar }, 
    { headers: { Authorization: `Bearer ${token}` } }
  )
},




  deleteUser: (token, userId) => {
    requireToken(token)
    return axiosInstance.delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  inviteUser: (token, userId, conversationId) => {
  requireToken(token)
  return axiosInstance.post(
    `/invite/${userId}`,
    { conversationId },
    { headers: { Authorization: `Bearer ${token}` } }
  )
},



  getMessages: (token, conversationId) => {
    requireToken(token)
    return axiosInstance.get('/messages', {
      headers: { Authorization: `Bearer ${token}` },
      params: { ...(conversationId ? { conversationId } : {}) },
    })
  },

  postMessage: (token, text, conversationId) => {
    requireToken(token)
    return axiosInstance.post(
      '/messages',
      { text, conversationId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
  },

  deleteMessage: (token, messageId) => {
    requireToken(token)
    return axiosInstance.delete(`/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

    getConversations: (token) => {
    requireToken(token)
    return axiosInstance.get('/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

}


