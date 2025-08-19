import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import * as Sentry from '@sentry/react';
import { v4 as uuidv4 } from 'uuid';
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
  const [conversations, setConversations] = useState([]);
  const [invites, setInvites] = useState([]);
  const [newConversationId, setNewConversationId] = useState('');
  const prevInvitesRef = useRef([]);

  useEffect(() => {
    if (!token) return;
    api.getConversations(token).then(res => {
      const { invitesReceived = [], invitesSent = [], participating = [] } = res.data || {};
      const allConvos = [...new Set([...invitesReceived, ...invitesSent, ...participating])];
      setInvites(invitesReceived);
      setConversations(allConvos);
      if (!activeId && allConvos.length) setActiveId(allConvos[0]);
    }).catch(err => {
      setFeedback('Kunde inte hämta konversationer');
      Sentry.captureException(err);
    });
  }, [token]);

  useEffect(() => {
    if (!token || !activeId) return;
    api.getMessages(token, activeId).then(res => {
      setMessages(Array.isArray(res.data) ? res.data : []);
    }).catch(err => {
      setFeedback('Kunde inte hämta meddelanden');
      Sentry.captureException(err);
    });
  }, [token, activeId]);

  useEffect(() => {
    const prevInvites = prevInvitesRef.current;
    const newOnes = invites.filter(id => !prevInvites.includes(id));
    if (newOnes.length) {
      setActiveId(newOnes[newOnes.length - 1]);
      setFeedback(`Ny inbjudan mottagen – ansluter till ${newOnes[newOnes.length - 1]}`);
    }
    prevInvitesRef.current = invites;
  }, [invites]);

  const handleSend = async e => {
    e.preventDefault();
    const clean = sanitize(text);
    if (!clean || !activeId) return;
    try {
      await api.postMessage(token, clean, activeId);
      setText('');
      const res = await api.getMessages(token, activeId);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFeedback('Kunde inte skicka meddelande');
      Sentry.captureException(err);
    }
  };

  const handleDelete = async msgId => {
    try {
      await api.deleteMessage(token, msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      setFeedback('Kunde inte ta bort meddelande');
      Sentry.captureException(err);
    }
  };

  const handleInvite = async () => {
    if (!inviteUserId) return;
    try {
      const newId = newConversationId || uuidv4();
      await api.inviteUser(token, inviteUserId, newId);
      setFeedback(`Inbjudan skickad till användare ${inviteUserId}`);
      setActiveId(newId);
      setInviteUserId('');
      setNewConversationId(newId);
      const res = await api.getConversations(token);
      const { invitesReceived = [], invitesSent = [], participating = [] } = res.data || {};
      const allConvos = [...new Set([...invitesReceived, ...invitesSent, ...participating])];
      setInvites(invitesReceived);
      setConversations(allConvos);
    } catch (err) {
      setFeedback('Kunde inte skicka inbjudan');
      Sentry.captureException(err);
    }
  };

  return (
    <div className="chat-page">
      <aside className="conversations">
        <h3>Konversationer</h3>
        <ul>
          {conversations.length ? (
            conversations.map(id => (
              <li key={id}>
                <button
                  className={id === activeId ? 'active conversation-btn' : 'conversation-btn'}
                  onClick={() => setActiveId(id)}
                >
                  {id.slice(0, 8)}…
                </button>
              </li>
            ))
          ) : (
            <li>Inga konversationer ännu.</li>
          )}
        </ul>

        {invites.length > 0 && (
          <div className="invites-list">
            <h4>Mina inbjudningar</h4>
            <ul>
              {invites.map(id => (
                <li key={id}>
                  {id}
                  <button onClick={() => setActiveId(id)}>Anslut</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="new-convo">
          <label>Conversation ID:</label>
          <input
            type="text"
            value={newConversationId}
            placeholder="Generera eller klistra in GUID..."
            onChange={e => setNewConversationId(e.target.value)}
            onClick={e => e.target.select()}
          />
          <button onClick={() => setNewConversationId(uuidv4())}>Generera GUID</button>
        </div>

        <div className="invite">
          <input
            placeholder="User ID att bjuda in"
            value={inviteUserId}
            onChange={e => setInviteUserId(e.target.value)}
          />
          <button onClick={handleInvite}>Bjud in</button>
        </div>
      </aside>

      <section className="chat">
        {!activeId && <p>Välj eller skapa en konversation för att börja.</p>}
        {activeId && (
          <>
            <div className="messages-list">
              {messages.length === 0 ? (
                <p>Inga meddelanden</p>
              ) : (
                messages.map(m => (
                  <div
                    key={m.id}
                    className={`message-row ${String(m.userId) === String(user?.id) ? 'own' : 'other'}`}
                  >
                    <div className="bubble">
                      <strong>{String(m.userId) === String(user?.id) ? user?.username : `User ${m.userId}`}</strong>
                      <div dangerouslySetInnerHTML={{ __html: sanitize(m.text) }} />
                      {String(m.userId) === String(user?.id) && (
                        <button onClick={() => handleDelete(m.id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="send-form">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
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
