export function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload);
    const decoded = JSON.parse(json);

    return {
      id: decoded.id ?? null,
      username: decoded.user ?? decoded.username ?? '',
      email: decoded.email ?? null,
      avatar: decoded.avatar ?? null,
      invites: decoded.invite ?? [], 
      exp: decoded.exp ?? null,
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function isExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}
