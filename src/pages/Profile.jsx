import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [feedback, setFeedback] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateUser(token, { username, email, avatar });
      if (!res.ok) {
        const err = await res.json();
        return setFeedback("Fel: " + err.detail);
      }
      const updated = await res.json();
      localStorage.setItem("user", JSON.stringify(updated));
      setFeedback("Profil uppdaterad!");
    } catch (err) {
      setFeedback("Något gick fel.");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm("Radera konto permanent?");
    if (!confirmDelete) return;

    try {
      const res = await api.deleteUser(token, user.id);
      if (res.ok) {
        logout();
        navigate("/login");
      } else {
        const err = await res.json();
        setFeedback("Fel: " + err.detail);
      }
    } catch (err) {
      setFeedback("Något gick fel vid radering.");
    }
  };

  return (
    <div className="profile-container">
      <h2>Min profil</h2>
      <form onSubmit={handleUpdate} className="profile-form">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          value={email}
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
        {avatar && <img src={avatar} alt="avatar preview" />}
        <button type="submit">Uppdatera</button>
      </form>

      <button onClick={handleDelete} className="delete-button">
        Radera mitt konto
      </button>

      {feedback && <p className="feedback">{feedback}</p>}
    </div>
  );
}
