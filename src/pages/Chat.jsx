// src/pages/Chat.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, normalizeUser } from '../services/api';
import * as Sentry from '@sentry/react'
import './Chat.css';

function sanitize(input) {
  return input
    .replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'))
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

export default function Chat() {
  const { user } = useAuth();
  const token = user?.token;

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  // Maps: id -> user/meta
  const [userMap, setUserMap] = useState({});      // userId -> user
  const [convTitles, setConvTitles] = useState({}) // conversationId -> title

  // Fetch all conversations (VG-krav) 
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await api.getConversations(token);
      const { invitesReceived = [], invitesSent = [], participating = [] } = res.data || {};
      const allConvos = [...new Set([...invitesReceived, ...invitesSent, ...participating])];
      setConversations(allConvos);
      if (!activeId && allConvos.length) {
        setActiveId(allConvos[0]);
      }
    } catch (err) {
      console.error('getConversations error', err);
      Sentry.captureException(err);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async () => {
    if (!token || !activeId) return;
    try {
      const res = await api.getMessages(token, activeId);
      const msgs = Array.isArray(res.data) ? res.data : [];
      setMessages(msgs);

      // Resolve sender usernames (robust mot userId vs id)
      const uniqueUserIds = [...new Set(msgs.map((m) => String(m.userId)).filter(Boolean))];
      for (const uid of uniqueUserIds) {
        if (!userMap[uid]) {
          try {
            // /users/{userId} kräver ID. Ofta numeriskt – skicka som är, funkar i API:t.
            const uRes = await api.getUser(token, uid);
            const raw = Array.isArray(uRes.data) ? uRes.data[0] : uRes.data;
            if (raw) {
              setUserMap((prev) => ({ ...prev, [String(raw.userId ?? raw.id)]: normalizeUser(raw) }));
            }
          } catch (err) {
            console.error(`Failed to fetch user ${uid}`, err);
          }
        }
      }

      // Sätt ett läsbart konversationstitel baserat på mottagare (ej du)
      const others = uniqueUserIds.filter((uid) => String(uid) !== String(user?.id));
      const otherNames = others
        .map((uid) => userMap[uid]?.username)
        .filter(Boolean);

      const title = otherNames.length ? otherNames.join(', ') : `Konversation ${activeId.slice(0, 8)}…`;
      setConvTitles((prev) => ({ ...prev, [activeId]: title }));
    } catch (err) {
      console.error('fetchMessages error', err);
      Sentry.captureException(err);
    }
  };

  // Invite user by ID or username
  const handleInvite = async () => {
    if (!token || !targetUserId) return;
    try {
      Sentry.addBreadcrumb({ category: 'chat', message: 'invite start', data: { target: targetUserId }, level: 'info' })

      let numericId = targetUserId;
      let invitedUser = null;

      if (isNaN(Number(targetUserId))) {
        // username-sökning (partial match stöds i /users?username=) 
        const res = await api.getAllUsers(token, targetUserId);
        if (!res.data?.length) {
          alert(`No user found with username "${targetUserId}"`);
          return;
        }
        invitedUser = normalizeUser(res.data[0]);
        numericId = invitedUser.id; // 🔧 RÄTT fält
      } else {
        const res = await api.getUser(token, targetUserId);
        const raw = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!raw) { alert('User not found'); return; }
        invitedUser = normalizeUser(raw);
        numericId = invitedUser.id;
      }

      const conversationId = crypto.randomUUID(); // VG: GUID 
      await api.inviteUser(token, numericId, conversationId);

      setConversations((prev) => [conversationId, ...prev]);
      setConvTitles((prev) => ({ ...prev, [conversationId]: invitedUser.username || `Konversation ${conversationId.slice(0,8)}…` }))
      setActiveId(conversationId);
      setTargetUserId('');

      Sentry.captureMessage('invite success', { level: 'info' })
      setMessages([]) // tom tills meddelanden finns
    } catch (err) {
      console.error('invite error', err);
      Sentry.captureException(err);
    }
  };

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    const clean = sanitize(text);
    if (!clean || !activeId) return;
    try {
      await api.postMessage(token, clean, activeId);
      setText('');
      Sentry.addBreadcrumb({ category: 'chat', message: 'message sent', data: { conversationId: activeId }, level: 'info' })
      fetchMessages();
    } catch (err) {
      console.error('send error', err);
      Sentry.captureException(err);
    }
  };

  // Delete message
  const handleDelete = async (id) => {
    try {
      await api.deleteMessage(token, id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      Sentry.addBreadcrumb({ category: 'chat', message: 'message deleted', data: { id }, level: 'info' })
    } catch (err) {
      console.error('delete error', err);
      Sentry.captureException(err);
    }
  };

  const isOwn = (m) => String(m.userId) === String(user?.id);

  const header = useMemo(() => {
    if (activeId) {
      return `Konversation: ${convTitles[activeId] || activeId}`;
    }
    return 'Ingen konversation vald';
  }, [activeId, convTitles]);

  useEffect(() => { fetchConversations(); }, [token]);
  useEffect(() => { fetchMessages(); }, [activeId, token]);

  return (
    <div className="chat-page">
      <aside className="conversations">
        <div className="conversations-header"><h3>Konversationer</h3></div>
        <ul>
          {conversations.map((id) => (
            <li key={id}>
              <button
                className={`conversation-btn ${id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(id)}
                title={id}
              >
                {convTitles[id] || `Konversation ${id.slice(0, 8)}…`}
              </button>
            </li>
          ))}
          {conversations.length === 0 && <li>Inga konversationer ännu.</li>}
        </ul>
        <div className="invite-user">
          <input
            type="text"
            placeholder="User ID eller username..."
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
          />
          <button onClick={handleInvite}>Bjud in</button>
        </div>
      </aside>

      <section className="chat">
        <h3>{header}</h3>
        <div className="messages-list">
          {messages.map((m) => (
            <div key={m.id} className={`message ${isOwn(m) ? 'own' : 'other'}`}>
              <div className="message-bubble">
                <div className="message-user">
                  {isOwn(m)
                    ? 'Du'
                    : (userMap[String(m.userId)]?.username || `User ${m.userId}`)}
                </div>
                <div
                  className="message-text"
                  dangerouslySetInnerHTML={{ __html: sanitize(m.text) }}
                />
                {isOwn(m) && (
                  <div className="message-actions">
                    <button onClick={() => handleDelete(m.id)}>🗑️ delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="send-message-form">
          <input
            type="text"
            placeholder="Skriv ett meddelande..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!activeId}
            required
          />
          <button type="submit" disabled={!activeId}>Skicka</button>
        </form>
      </section>
    </div>
  );
}

