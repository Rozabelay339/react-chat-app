import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import * as Sentry from '@sentry/react';
import './Chat.css';

function sanitize(str) {
  return String(str).replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;')).trim();
}

export default function Chat() {
  const { user } = useAuth();
  const token = user?.token;

  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [userCache, setUserCache] = useState({});
  const [conversations, setConversations] = useState([]); // 👈 alla konversationer

  // --- hämta användarinfo ---
  const fetchUser = async (userId) => {
    if (userCache[userId]) return userCache[userId];
    try {
      const res = await api.getUser(token, userId);
      const username = res.data.username;
      setUserCache((prev) => ({ ...prev, [userId]: username }));
      return username;
    } catch (err) {
      Sentry.captureException(err);
      return userId;
    }
  };

  // --- hämta alla konversationer ---
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await api.getConversations(token);
      setConversations(res.data || []); // 👈 lagra listan
    } catch (err) {
      setFeedback('Kunde inte hämta konversationer');
      Sentry.captureException(err);
    }
  };

  // --- hämta meddelanden ---
  const fetchMessages = async () => {
    if (!token || !activeId) return;
    try {
      const res = await api.getMessages(token, activeId);
      const msgs = Array.isArray(res.data) ? res.data : [];

      for (const m of msgs) {
        if (!userCache[m.userId]) {
          await fetchUser(m.userId);
        }
      }

      setMessages(msgs);
    } catch (err) {
      setFeedback('Kunde inte hämta meddelanden');
      Sentry.captureException(err);
    }
  };

  useEffect(() => {
    fetchConversations(); // 👈 hämta när sidan laddas
  }, [token]);

  useEffect(() => {
    if (activeId) fetchMessages();
  }, [activeId]);

  // --- skapa ny konversation ---
  const handleNewConversation = () => {
    const newId = crypto.randomUUID();
    setActiveId(newId);
    setMessages([]);
    setFeedback(`Ny konversation skapad: ${newId}`);
  };

  // --- skicka nytt meddelande ---
  const handleSend = async (e) => {
    e.preventDefault();
    const clean = sanitize(text);
    if (!clean || !activeId) return;
    try {
      await api.postMessage(token, clean, activeId);
      setText('');
      fetchMessages();
    } catch (err) {
      setFeedback('Kunde inte skicka meddelande');
      Sentry.captureException(err);
    }
  };

  // --- ta bort meddelande ---
  const handleDelete = async (msgId) => {
    try {
      await api.deleteMessage(token, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      setFeedback('Kunde inte ta bort meddelande');
      Sentry.captureException(err);
    }
  };

  // --- bjuda in användare ---
  const handleInvite = async () => {
    if (!inviteUserId || !activeId) return;
    try {
      await api.inviteUser(token, inviteUserId, activeId);
      setFeedback(`Inbjudan skickad till användare ${inviteUserId}`);
      setInviteUserId('');
    } catch (err) {
      setFeedback('Kunde inte skicka inbjudan');
      Sentry.captureException(err);
    }
  };

  return (
    <div className="chat-page">
      <aside className="conversations">
        <h3>Konversationer</h3>
        <button onClick={handleNewConversation}>➕ Ny konversation</button>

        {/* lista över alla konversationer */}
        {conversations.length > 0 && (
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id}>
                {conv.id}{' '}
                <button onClick={() => setActiveId(conv.id)}>Öppna</button>
              </li>
            ))}
          </ul>
        )}

        {/* invites */}
        {Array.isArray(user?.invites) && user.invites.length > 0 && (
          <div className="invites-list">
            <h4>Mina inbjudningar</h4>
            <ul>
              {user.invites.map((id) => (
                <li key={id}>
                  {id} <button onClick={() => setActiveId(id)}>Anslut</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeId && (
          <div className="invite">
            <input
              placeholder="User ID att bjuda in"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
            />
            <button onClick={handleInvite}>Bjud in</button>
          </div>
        )}
      </aside>

      <section className="chat">
        {!activeId && <p>Välj eller skapa en konversation för att börja.</p>}

        {activeId && (
          <>
            <div className="messages-list">
              {messages.map((m) => {
                const senderName =
                  m.userId === user?.id
                    ? user?.username
                    : userCache[m.userId] || m.userId;

                return (
                  <div
                    key={m.id}
                    className={`message-row ${m.userId === user?.id ? 'own' : 'other'}`}
                  >
                    <div className="bubble">
                      <strong>{senderName}</strong>
                      <div dangerouslySetInnerHTML={{ __html: sanitize(m.text) }} />
                      {m.userId === user?.id && (
                        <button onClick={() => handleDelete(m.id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && <p>Inga meddelanden</p>}
            </div>

            <form onSubmit={handleSend} className="send-form">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Skriv ett meddelande..."
              />
              <button type="submit">Skicka</button>
            </form>
          </>
        )}

        {feedback && <p className="feedback">{feedback}</p>}
      </section>
    </div>
  );
}
