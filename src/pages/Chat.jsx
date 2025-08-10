import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import './Chat.css';

export default function Chat() {
  const { user, auth } = useAuth();
  const token = auth?.token;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [conversationId, setConversationId] = useState("default-1");

  const [conversations] = useState([
    { id: "default-1", name: "Allmänt" },
    { id: "default-2", name: "Projektgrupp" },
  ]);

  const fetchMessages = async () => {
    if (!token) return;
    const res = await api.getMessages(token, conversationId);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.reverse());
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    await api.postMessage(token, text.trim(), conversationId);
    setText("");
    fetchMessages();
  };

  const handleDelete = async (id) => {
    if (!token) return;
    await api.deleteMessage(token, id);
    fetchMessages();
  };

  return (
    <div>
      <h2>Välkommen, {user?.username}</h2>

      <select value={conversationId} onChange={(e) => setConversationId(e.target.value)}>
        {conversations.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="chat-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.user.id === user.id ? "right" : "left"}`}
          >
            <strong>{msg.user.username}</strong>
            <p>{msg.message}</p>
            {msg.user.id === user.id && (
              <button onClick={() => handleDelete(msg.id)}>✕</button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv ett meddelande..."
        />
        <button type="submit">Skicka</button>
      </form>
    </div>
  );
}
