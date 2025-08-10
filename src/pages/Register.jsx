import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import './Register.css';


export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("https://i.pravatar.cc/150");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();


  const handleRegister = async (e) => {
    e.preventDefault();


    try {
      // ✅ Hämta CSRF-token
      const csrfRes = await api.getCsrf();
      const csrfToken = csrfRes.data.csrfToken;


      // ✅ Skicka register-anrop
      const res = await api.register({
        username,
        email,
        avatar,
        password,
        csrfToken,
      });


      const data = await res.json();


      if (!res.ok) {
        const isDuplicate = data.detail === "Username or email already exists";
        setFeedback(isDuplicate ? "Användarnamnet eller e-posten finns redan." : data.detail);
        return;
      }


      setFeedback("Registrering lyckades! Du skickas vidare...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Fel vid registrering:", err);
      setFeedback("Tekniskt fel vid registrering.");
    }
  };


  return (
    <form onSubmit={handleRegister} className="register-form">
      <h2>Registrera</h2>


      <input
        type="text"
        placeholder="Användarnamn"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="E-post"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="url"
        placeholder="Avatar URL (valfritt)"
        value={avatar}
        onChange={(e) => setAvatar(e.target.value)}
      />
      <input
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />


      {avatar && <img src={avatar} alt="avatar preview" className="avatar-preview" />}


      <button type="submit">Registrera</button>
      {feedback && <p className="feedback">{feedback}</p>}
    </form>
  );
}

