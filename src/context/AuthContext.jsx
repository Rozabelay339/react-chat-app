import { createContext, useState, useEffect, useContext } from "react";
import { decodeToken } from "../utils/decodeToken";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      return {
        token,
        id: decoded?.sub,
        username: decoded?.username,
        email: decoded?.email,
        avatar: decoded?.avatar,
      };
    }
    return null;
  });

  useEffect(() => {
    if (user?.token) {
      localStorage.setItem("token", user.token);
    } else {
      localStorage.removeItem("token");
    }
  }, [user]);

  const login = (token) => {
    const decoded = decodeToken(token);
    setUser({
      token,
      id: decoded?.sub,
      username: decoded?.username,
      email: decoded?.email,
      avatar: decoded?.avatar,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
