import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import "./Login.css";


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();


  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);


    try {
      // ✅ 1. Hämta CSRF-token via axios
      const csrfRes = await api.getCsrf();
      const csrfToken = csrfRes.data.csrfToken;


      // ✅ 2. Logga in
      const res = await api.login({ username, password, csrfToken });
      const data = res.data;


      login(data.token); // spara i context + localStorage
      navigate("/chat");
    } catch (err) {
      console.error("Login error:", err);
      const errorDetail = err.response?.data?.detail || "Tekniskt fel. Försök igen.";
      setErrorMsg(
        errorDetail === "Invalid credentials"
          ? "Fel användarnamn eller lösenord."
          : errorDetail
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleLogin} className="login-form">
      <h2>Logga in</h2>


      <input
        type="text"
        placeholder="Användarnamn"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />


      <button type="submit" disabled={loading}>
        {loading ? "Loggar in..." : "Logga in"}
      </button>


      {errorMsg && <p className="error-msg">{errorMsg}</p>}
    </form>
  );
}

