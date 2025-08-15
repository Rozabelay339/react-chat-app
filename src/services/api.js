// src/services/api.js
import axios from 'axios'
import * as Sentry from '@sentry/react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://chatify-api.up.railway.app'

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// Log all API errors to Sentry
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    Sentry.captureException(error)
    return Promise.reject(error)
  }
)

// Hjälpare för att normalisera user-objekt (Swagger använder userId)
export const normalizeUser = (u) => ({
  id: u?.userId ?? u?.id ?? null,
  username: u?.username ?? '',
  avatar: u?.avatar ?? 'https://i.pravatar.cc/100',
  email: u?.email ?? null,
})

export const api = {
  // CSRF
  getCsrf: () => axiosInstance.patch('/csrf', {}),
  clearCsrf: () => axiosInstance.delete('/csrf'),

  // Auth
  register: ({ username, email, avatar, password, csrfToken }) =>
    axiosInstance.post('/auth/register', { username, email, avatar, password, csrfToken }),

  login: ({ username, password, csrfToken }) =>
    axiosInstance.post('/auth/token', { username, password, csrfToken }),

  // Users
  getAllUsers: (token, username, limit, offset) =>
    axiosInstance.get('/users', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        ...(username ? { username } : {}),
        ...(limit ? { limit } : {}),
        ...(offset ? { offset } : {}),
      },
    }),

  getUser: (token, userId) =>
    axiosInstance.get(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateUser: (token, userId, updatedData) =>
    axiosInstance.put(
      '/user',
      { userId, updatedData }, // 🔴 Viktigt: matchar Swagger-body
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  deleteUser: (token, userId) =>
    axiosInstance.delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Conversations
  getConversations: (token) =>
    axiosInstance.get('/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  inviteUser: (token, userId, conversationId) =>
    axiosInstance.post(
      `/invite/${userId}`,
      { conversationId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  // Messages
  getMessages: (token, conversationId) =>
    axiosInstance.get('/messages', {
      headers: { Authorization: `Bearer ${token}` },
      params: { conversationId },
    }),

  postMessage: (token, text, conversationId) =>
    axiosInstance.post(
      '/messages',
      { text, conversationId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  deleteMessage: (token, messageId) =>
    axiosInstance.delete(`/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

