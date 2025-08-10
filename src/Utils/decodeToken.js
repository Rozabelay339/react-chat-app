import axios from 'axios';

export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));

    return {
      sub: decoded.sub,
      username: decoded.username,
      avatar: decoded.avatar,
      exp: decoded.exp,
    };
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

// ✅ Another named export
export const fetchCSRFToken = async () => {
  const res = await axios.patch(`${import.meta.env.VITE_API_URL}/csrf`, {}, {
    withCredentials: true,
  });
  return res.data.csrfToken;
};
