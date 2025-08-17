import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import * as Sentry from '@sentry/react'
import './Chat.css'

function sanitize(str) {
  return String(str)
    .replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'))
    .trim()
}

export default function Chat() {
  const { user } = useAuth()
  const token = user?.token

  const [conversations, setConversations] = useState([])
  const [conversationUsers, setConversationUsers] = useState({}) // { convoId: [{id,username,avatar},...] }
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [inviteUserId, setInviteUserId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [inviteUsers, setInviteUsers] = useState([])

  const fetchConversations = async () => {
    if (!token) return
    try {
      const res = await api.getConversations(token)
      const convos = Array.isArray(res.data) ? res.data : []
      setConversations(convos)
      if (convos.length > 0 && !activeId) {
        setActiveId(convos[0].id)
      }
     
      convos.forEach((c) => fetchConversationUsers(c.id))
    } catch (err) {
      setFeedback('Kunde inte hämta konversationer')
      Sentry.captureException(err)
    }
  }


  const fetchConversationUsers = async (convoId) => {
    try {
      const res = await api.getConversation(token, convoId) 
      const participants = res.data?.participants || []
      const userData = await Promise.all(
        participants.map(async (id) => {
          try {
            const uRes = await api.getUser(token, id)
            return uRes.data
          } catch {
            return { id, username: id, avatar: 'https://i.pravatar.cc/50' }
          }
        })
      )
      setConversationUsers((prev) => ({ ...prev, [convoId]: userData }))
    } catch (err) {
      console.error('Kunde inte hämta användare för konversation:', convoId)
      Sentry.captureException(err)
    }
  }

  const fetchMessages = async () => {
    if (!token || !activeId) return
    try {
      const res = await api.getMessages(token, activeId)
      setMessages(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setFeedback('Kunde inte hämta meddelanden')
      Sentry.captureException(err)
    }
  }

  const fetchInviteUsers = async () => {
    if (!token || !user?.invites?.length) return
    try {
      const results = await Promise.all(
        user.invites.map(async (id) => {
          try {
            const res = await api.getUser(token, id)
            return res.data
          } catch {
            return { id, username: id, avatar: 'https://i.pravatar.cc/50' }
          }
        })
      )
      setInviteUsers(results)
    } catch (err) {
      Sentry.captureException(err)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [token])

  useEffect(() => {
    if (activeId) fetchMessages()
  }, [activeId])

  useEffect(() => {
    fetchInviteUsers()
  }, [user?.invites])

  const handleSend = async (e) => {
    e.preventDefault()
    const clean = sanitize(text)
    if (!clean || !activeId) return
    try {
      await api.postMessage(token, clean, activeId)
      setText('')
      fetchMessages()
    } catch (err) {
      setFeedback('Kunde inte skicka meddelande')
      Sentry.captureException(err)
    }
  }

  const handleDelete = async (msgId) => {
    try {
      await api.deleteMessage(token, msgId)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
    } catch (err) {
      setFeedback('Kunde inte ta bort meddelande')
      Sentry.captureException(err)
    }
  }

 
  const handleInvite = async () => {
    if (!inviteUserId || !activeId) return
    try {
      await api.inviteUser(token, inviteUserId, activeId)
      setFeedback(`Inbjudan skickad till användare ${inviteUserId}`)
      setInviteUserId('')
    } catch (err) {
      setFeedback('Kunde inte skicka inbjudan')
      Sentry.captureException(err)
    }
  }

  return (
    <div className="chat-page">
      <aside className="conversations">
        <h3>Mina konversationer</h3>
        <ul>
          {conversations.map((c) => (
            <li
              key={c.id}
              className={`conversation-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(c.id)}
            >
              {conversationUsers[c.id]?.map((u) => (
                <div key={u.id} className="conversation-user">
                  <img src={u.avatar || 'https://i.pravatar.cc/40'} alt="avatar" />
                  <span>{u.username || u.id}</span>
                </div>
              ))}
            </li>
          ))}
        </ul>

        {inviteUsers.length > 0 && (
          <div className="invites-list">
            <h4>Mina inbjudningar</h4>
            <ul>
              {inviteUsers.map((u) => (
                <li key={u.id} className="invite-user">
                  <img src={u.avatar || 'https://i.pravatar.cc/50'} alt="avatar" />
                  <span>{u.username || u.id}</span>
                  <button onClick={() => setActiveId(u.id)}>Anslut</button>
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
        {!activeId && <p>Välj en konversation för att börja.</p>}

        {activeId && (
          <>
            <div className="messages-list">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`message ${m.userId === user?.id ? 'own' : 'other'}`}
                >
                  <div className="bubble">
                    <strong>{m.userId === user?.id ? 'Du' : m.userId}</strong>
                    <div dangerouslySetInnerHTML={{ __html: sanitize(m.text) }} />
                    {m.userId === user?.id && (
                      <button onClick={() => handleDelete(m.id)}>🗑️</button>
                    )}
                  </div>
                </div>
              ))}
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
  )
}
