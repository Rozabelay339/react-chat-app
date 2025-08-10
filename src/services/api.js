import axios from "axios";

const API_BASE = "https://chatify-api.up.railway.app";

// Skapa en axios-instans för gemensamma inställningar
const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Viktigt för att cookies ska skickas med
});

export const api = {
  // 1. Hämta CSRF-token
  getCsrf: () =>
    axiosInstance.get("/csrf"), // GET istället för PATCH

  // 2. Registrera användare
  register: ({ username, email, avatar, password, csrfToken }) =>
    axiosInstance.post(
      "/auth/register",
      { username, email, avatar, password },
      {
        headers: { "X-CSRF-Token": csrfToken },
      }
    ),

  // 3. Logga in
  login: ({ username, password, csrfToken }) =>
    axiosInstance.post(
      "/auth/token",
      { username, password },
      {
        headers: { "X-CSRF-Token": csrfToken },
      }
    ),

  // 4. Hämta meddelanden
  getMessages: (token, conversationId) =>
    axiosInstance.get(`/messages?conversationId=${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // 5. Skicka meddelande
  postMessage: (token, message, conversationId) =>
    axiosInstance.post(
      "/messages",
      { message, conversationId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  // 6. Radera meddelande
  deleteMessage: (token, messageId) =>
    axiosInstance.delete(`/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // 7. Uppdatera användare
  updateUser: (token, userData) =>
    axiosInstance.put("/user", userData, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // 8. Radera användare
  deleteUser: (token, userId) =>
    axiosInstance.delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
