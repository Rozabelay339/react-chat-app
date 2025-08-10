import axios from "axios";


const API_BASE = "https://chatify-api.up.railway.app";


export const api = {
  // ✅ KORREKT VERSION – använder axios
  getCsrf: () =>
    axios.patch(`${API_BASE}/csrf`, {}, {
      withCredentials: true,
    }),


  register: ({ username, email, avatar, password, csrfToken }) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ username, email, avatar, password }),
    }),


   login: ({ username, password, csrfToken }) =>
    axios.post(
      `${API_BASE}/auth/token`,
      { username, password },
      {
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        withCredentials: true,
      }
    ),

  getMessages: (token, conversationId) =>
    fetch(`${API_BASE}/messages?conversationId=${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  postMessage: (token, message, conversationId) =>
    fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId }),
    }),

    deleteMessage: (token, messageId) =>
  fetch(`${API_BASE}/messages/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }),



  updateUser: (token, userData) =>
    fetch(`${API_BASE}/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    }),

  deleteUser: (token, userId) =>
    fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};
