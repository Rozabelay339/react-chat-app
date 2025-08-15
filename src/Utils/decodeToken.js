export function decodeToken(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const json = atob(payload)
    const decoded = JSON.parse(json)
    return {
      sub: decoded.sub,              // userId
      username: decoded.username,    // användarnamn
      email: decoded.email || null,  // kan saknas i token
      avatar: decoded.avatar || null,
      exp: decoded.exp || null,
    }
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export function isExpired(token) {
  const d = decodeToken(token)
  if (!d?.exp) return false
  const nowSec = Math.floor(Date.now() / 1000)
  return d.exp < nowSec
}
