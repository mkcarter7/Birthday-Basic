'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/utils/context/authContext';
import { signIn } from '@/utils/auth';
import { useParty } from '@/utils/context/partyContext';

export default function GuestbookPage() {
  const config = useParty();
  const { user, userLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const prevUserRef = useRef(user);
  useEffect(() => {
    if (!prevUserRef.current && user && error) {
      setError('');
    }
    prevUserRef.current = user;
  }, [user, error]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const headers = {};

        if (user) {
          try {
            const token = await user.getIdToken();
            headers.Authorization = `Bearer ${token}`;
          } catch (tokenError) {
            console.error('Error getting token:', tokenError);
          }
        }

        const res = await fetch('/api/guestbook', { headers });

        if (res.ok) {
          const data = await res.json();
          const partyId = config.id;

          const filtered = Array.isArray(data)
            ? data.filter((m) => {
                if (m.deleted || m.is_deleted) return false;
                const msgPartyId = m.party || m.party_id || m.party_name;
                return msgPartyId === partyId || String(msgPartyId) === String(partyId);
              })
            : [];
          filtered.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
          setMessages(filtered);
        } else if (res.status === 403) {
          setError('Unable to load messages. You may not have permission to view the guestbook.');
          setMessages([]);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchMessages();
    }
  }, [user, userLoading, config.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setError('Please sign in to leave a message'); return; }
    if (!message.trim()) { setError('Please write a message'); return; }
    if (!name.trim()) { setError('Please enter your name'); return; }

    const messageName = name.trim();
    setSubmitting(true);
    setError('');

    try {
      let token;
      try {
        token = await user.getIdToken(true);
        if (!token) throw new Error('Failed to get authentication token');
      } catch (tokenError) {
        console.error('Token error:', tokenError);
        setError('Authentication error. Please try signing out and signing back in.');
        return;
      }

      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: messageName, message: message.trim(), party: config.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages([data, ...messages]);
        setName('');
        setMessage('');
        setError('');
      } else if (res.status === 403 || res.status === 401) {
        if (!(data.details?.includes('token') || data.error?.includes('token'))) {
          setError(data.details || data.error || 'You do not have permission to perform this action.');
        }
      } else {
        setError(data.details || data.error || 'Failed to submit message. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting message:', err);
      if (!err.message?.includes('token')) {
        setError('Failed to submit message. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAuthorName = (msg) => {
    if (msg.name?.trim()) return msg.name.trim();
    if (msg.author_name?.trim()) return msg.author_name.trim();
    if (msg.full_name?.trim()) return msg.full_name.trim();
    if (msg.author && typeof msg.author === 'object') {
      if (msg.author.first_name && msg.author.last_name) return `${msg.author.first_name} ${msg.author.last_name}`.trim();
      if (msg.author.first_name?.trim()) return msg.author.first_name.trim();
      if (msg.author.name?.trim()) return msg.author.name.trim();
      if (msg.author.email) return msg.author.email.split('@')[0];
    }
    if (msg.username?.trim()) return msg.username.trim();
    return 'Anonymous';
  };

  const isMessageOwner = (msg) => {
    if (!user) return false;
    const userId = user.uid;
    const userEmail = user.email?.toLowerCase().trim();
    if (msg.can_edit === true) return true;
    if (msg.author_username === userId) return true;
    const checkEmail = (email) => email?.toLowerCase().trim() === userEmail;
    if (msg.author && typeof msg.author === 'object') {
      if (checkEmail(msg.author.email)) return true;
      if (msg.author.username === userId) return true;
    }
    if (msg.author_id && (String(msg.author_id) === userId || msg.author_id === userId)) return true;
    if (typeof msg.author === 'string' && msg.author === userId) return true;
    if (userEmail && (checkEmail(msg.author_email) || checkEmail(msg.user_email) || checkEmail(msg.email))) return true;
    return false;
  };

  const handleEdit = (msg) => {
    setEditingId(msg.id);
    setEditName(getAuthorName(msg));
    setEditMessage(msg.message || msg.content || '');
  };

  const handleCancelEdit = () => { setEditingId(null); setEditName(''); setEditMessage(''); };

  const handleSaveEdit = async (msgId) => {
    if (!editName.trim() || !editMessage.trim()) { setError('Please fill in both name and message'); return; }
    setSavingEdit(true);
    setError('');

    try {
      let token;
      try {
        token = await user.getIdToken(true);
        if (!token) throw new Error('Failed to get authentication token');
      } catch (tokenError) {
        console.error('Token error:', tokenError);
        setError('Authentication error. Please try signing out and signing back in.');
        return;
      }

      const res = await fetch(`/api/guestbook/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), message: editMessage.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(messages.map((msg) => (msg.id === msgId ? data : msg)));
        setEditingId(null); setEditName(''); setEditMessage(''); setError('');
      } else if ((res.status === 403 || res.status === 401) && !data.error?.includes('token')) {
        setError(data.error || 'You do not have permission to edit this message.');
      } else if (res.status !== 403 && res.status !== 401) {
        setError(data.error || 'Failed to update message. Please try again.');
      }
    } catch (err) {
      console.error('Error updating message:', err);
      if (!err.message?.includes('token')) setError('Failed to update message. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (msgId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    setDeletingId(msgId);
    setError('');

    try {
      let token;
      try {
        token = await user.getIdToken(true);
        if (!token) throw new Error('Failed to get authentication token');
      } catch (tokenError) {
        console.error('Token error:', tokenError);
        setError('Authentication error. Please try signing out and signing back in.');
        setDeletingId(null);
        return;
      }

      const res = await fetch(`/api/guestbook/${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessages(messages.filter((msg) => msg.id !== msgId));
        setError('');
      } else {
        const data = await res.json();
        if ((res.status === 403 || res.status === 401) && !data.error?.includes('token')) {
          setError(data.error || 'You do not have permission to delete this message.');
        } else if (res.status !== 403 && res.status !== 401) {
          setError(data.error || 'Failed to delete message. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      if (!err.message?.includes('token')) setError('Failed to delete message. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (userLoading || loading) {
    return (
      <main className="page">
        <PageHeader title="Guest Book" subtitle={`Leave a sweet message for ${config.name}`} />
        <div className="card">
          <p className="muted">Loading messages...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <PageHeader title="Guest Book" subtitle={`Leave a sweet message for ${config.name}`} />

      {error && (
        <div className="card" style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid #8b5cf6', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ color: '#4c1d95', margin: 0, fontSize: 14, flex: 1 }}>{error}</p>
            <button type="button" onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: '#4c1d95', cursor: 'pointer', fontWeight: 600 }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {!user ? (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <p>Sign in to leave a message in the guest book!</p>
          <button type="button" onClick={signIn} className="tile tile-purple" style={{ height: 48, border: 'none' }}>
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <h3>Leave a Message</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <label htmlFor="guestbook-name" style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                Your Name (you can use any name you&apos;d like)
              </label>
              <input id="guestbook-name" type="text" placeholder="Enter your name..." value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </div>
            <textarea placeholder={`Write your message for ${config.name}...`} value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', resize: 'vertical', fontFamily: 'inherit' }} />
            {error && <p style={{ color: '#ef4444', margin: 0, fontSize: 14 }}>{error}</p>}
            <button type="submit" disabled={submitting} className="tile tile-purple" style={{ height: 48, border: 'none', fontSize: 16, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? '⏳ Submitting...' : '➕ Submit Message'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ display: 'grid', gap: 16 }}>
        <h3>Messages ({messages.length})</h3>
        {messages.length === 0 ? (
          <p className="muted">No messages yet. Be the first to leave a message!</p>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {messages.map((msg) => {
              const isOwner = isMessageOwner(msg);
              const isEditing = editingId === msg.id;

              return (
                <div key={msg.id} style={{ padding: 16, background: 'rgba(255, 255, 255, 0.5)', borderRadius: 12, border: '1px solid rgba(0, 0, 0, 0.1)', position: 'relative' }}>
                  {isEditing ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <textarea value={editMessage} onChange={(e) => setEditMessage(e.target.value)} rows={4} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', resize: 'vertical', fontFamily: 'inherit' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => handleSaveEdit(msg.id)} disabled={savingEdit} className="tile tile-purple" style={{ height: 40, border: 'none', flex: 1, fontSize: 14, fontWeight: 600, opacity: savingEdit ? 0.6 : 1, cursor: savingEdit ? 'not-allowed' : 'pointer' }}>
                          {savingEdit ? '⏳ Saving...' : '💾 Save Changes'}
                        </button>
                        <button type="button" onClick={handleCancelEdit} disabled={savingEdit} style={{ height: 40, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', flex: 1, fontSize: 14, fontWeight: 500, cursor: savingEdit ? 'not-allowed' : 'pointer', opacity: savingEdit ? 0.6 : 1 }}>
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, color: '#4338ca', fontSize: 16 }}>{getAuthorName(msg)}</div>
                        {isOwner && user && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(msg)}
                              disabled={deletingId === msg.id || editingId === msg.id || savingEdit}
                              style={{ background: config.secondaryColor || '#8B5CF6', border: `1px solid ${config.secondaryColor || '#8B5CF6'}`, color: 'white', cursor: 'pointer', fontSize: 14, padding: '6px 12px', borderRadius: 6, fontWeight: 500 }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(msg.id)}
                              disabled={deletingId === msg.id || editingId === msg.id || savingEdit}
                              style={{ background: config.accentColor || '#F59E0B', border: `1px solid ${config.accentColor || '#F59E0B'}`, color: 'white', cursor: 'pointer', fontSize: 14, padding: '6px 12px', borderRadius: 6, fontWeight: 500 }}
                            >
                              {deletingId === msg.id ? '⏳ Deleting...' : '🗑️ Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.message || msg.content}</div>
                      {msg.created_at && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                          {new Date(msg.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
