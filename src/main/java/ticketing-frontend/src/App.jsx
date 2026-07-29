import React, { useState, useEffect } from 'react';
import {
  Ticket, ChevronDown, ChevronRight, PlusCircle, Inbox,
  CheckCircle2, Circle, ArrowLeft, Clock, LogOut
} from 'lucide-react';

// --- API ---------------------------------------------------------
const API_BASE = 'http://localhost:8080';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Hiba (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

function getUsernameFromToken(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.sub || null;
  } catch {
    return null;
  }
}

function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.role || 'USER';
  } catch {
    return 'USER';
  }
}

// --- Design tokens -----------------------------------------------------
const colors = {
  bg: '#F4F8F5',
  surface: '#FFFFFF',
  ink: '#16241C',
  inkSoft: '#5B6B62',
  primary: '#173A2E',
  primarySoft: '#2F6B4F',
  accent: '#5FA37A',
  border: '#DCE6DE',
  amber: '#B9822E',
  red: '#B5473B',
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

// Ticketing_system.model.Status / Priority pontos értékei alapján
const STATUS_META = {
  OPEN: { label: 'Nyitott', icon: Circle, color: colors.accent },
  IN_PROGRESS: { label: 'Folyamatban', icon: Clock, color: colors.amber },
  RESOLVED: { label: 'Megoldva', icon: CheckCircle2, color: colors.primarySoft },
  CLOSED: { label: 'Lezárva', icon: CheckCircle2, color: colors.inkSoft },
};

const PRIORITY_META = {
  LOW: { label: 'Alacsony', color: colors.inkSoft },
  MEDIUM: { label: 'Közepes', color: colors.amber },
  HIGH: { label: 'Magas', color: colors.red },
  URGENT: { label: 'Sürgős', color: colors.red },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- Login ---------------------------------------------------------
function LoginForm({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
          ? { username, password }
          : { username, email, password, role: 'USER' };

      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(mode === 'login' ? 'Hibás felhasználónév vagy jelszó' : 'Nem sikerült a regisztráció');
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      onLogin();
    } catch (err) {
      setError(err.message || 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg, fontFamily: "'Manrope', sans-serif" }}>
        <style>{FONT_IMPORT}</style>
        <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 rounded-2xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: colors.accent }}>
              <Ticket size={18} color={colors.primary} />
            </div>
            <div className="leading-tight">
              <span className="text-lg" style={{ fontWeight: 800, color: colors.ink }}>TS</span>
              <span className="text-xs block" style={{ color: colors.inkSoft }}>Ticket System</span>
            </div>
          </div>

          <label className="text-xs" style={{ color: colors.inkSoft }}>Felhasználónév</label>
          <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 mb-4 p-3 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
          />

          {mode === 'register' && (
              <>
                <label className="text-xs" style={{ color: colors.inkSoft }}>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 mb-4 p-3 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
                />
              </>
          )}

          <label className="text-xs" style={{ color: colors.inkSoft }}>Jelszó</label>
          <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 mb-4 p-3 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
          />

          {error && <p className="text-xs mb-4" style={{ color: colors.red }}>{error}</p>}

          <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm"
              style={{ background: colors.primary, color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (mode === 'login' ? 'Belépés...' : 'Regisztráció...') : (mode === 'login' ? 'Bejelentkezés' : 'Regisztráció')}
          </button>

          <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="w-full mt-3 py-2 rounded-lg text-sm"
              style={{ color: colors.primarySoft, fontWeight: 600 }}
          >
            {mode === 'login' ? 'Nincs még fiókod? Regisztrálj' : 'Van már fiókod? Jelentkezz be'}
          </button>
        </form>
      </div>
  );
}

// --- Sidebar ---------------------------------------------------------
function Sidebar({ view, setView, filter, setFilter }) {
  const [ticketsOpen, setTicketsOpen] = useState(true);

  const subItem = (key, label) => (
      <button
          onClick={() => { setFilter(key); setView('list'); }}
          className="w-full text-left text-sm py-2 pl-10 pr-3 rounded-lg transition"
          style={{
            color: filter === key && view === 'list' ? colors.primary : colors.inkSoft,
            background: filter === key && view === 'list' ? '#EAF3EC' : 'transparent',
            fontWeight: filter === key && view === 'list' ? 600 : 500,
          }}
      >
        {label}
      </button>
  );

  return (
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: colors.surface, borderRight: `1px solid ${colors.border}` }}>
        <nav className="flex-grow p-3 space-y-1 mt-2">
          <button
              onClick={() => setTicketsOpen(o => !o)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-lg transition"
              style={{ color: colors.ink, fontWeight: 700 }}
          >
          <span className="flex items-center gap-3">
            <Inbox size={18} style={{ color: colors.primarySoft }} />
            Jegyeim
          </span>
            {ticketsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {ticketsOpen && (
              <div className="space-y-0.5 pb-2">
                {subItem('all', 'Összes')}
                {subItem('OPEN', 'Nyitott')}
                {subItem('IN_PROGRESS', 'Folyamatban')}
                {subItem('RESOLVED', 'Megoldva')}
                {subItem('CLOSED', 'Lezárt')}
              </div>
          )}

          <button
              onClick={() => setView('new')}
              className="w-full flex items-center gap-3 p-3 rounded-lg transition mt-2"
              style={{
                color: view === 'new' ? '#FFFFFF' : colors.primary,
                background: view === 'new' ? colors.primary : '#EAF3EC',
                fontWeight: 700,
              }}
          >
            <PlusCircle size={18} />
            Jegy feladása
          </button>
        </nav>

        <div className="p-4 text-xs" style={{ color: colors.inkSoft, borderTop: `1px solid ${colors.border}` }}>
          Belső ügyfélszolgálati rendszer
        </div>
      </aside>
  );
}

// --- Ticket row ---------------------------------------------------------
function TicketRow({ ticket, onOpen }) {
  const meta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const StatusIcon = meta.icon;

  return (
      <button
          onClick={() => onOpen(ticket)}
          className="w-full flex items-stretch text-left rounded-xl overflow-hidden transition hover:-translate-y-0.5"
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 1px 2px rgba(23,58,46,0.04)' }}
      >
        <div className="flex flex-col items-center justify-center py-4 px-4 flex-shrink-0" style={{ background: colors.primary, minWidth: '92px' }}>
          <span className="text-[11px] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#BFE0CC' }}>TICKET</span>
          <span className="text-lg" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF', fontWeight: 600 }}>#{ticket.id}</span>
        </div>

        <div className="relative flex-shrink-0" style={{ width: '1px', borderLeft: `2px dashed ${colors.border}` }}>
          <span className="absolute rounded-full" style={{ top: '-9px', left: '-9px', width: '18px', height: '18px', background: colors.bg }} />
          <span className="absolute rounded-full" style={{ bottom: '-9px', left: '-9px', width: '18px', height: '18px', background: colors.bg }} />
        </div>

        <div className="flex-grow p-4 flex items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h3 className="text-sm truncate" style={{ color: colors.ink, fontWeight: 600 }}>{ticket.title}</h3>
            <p className="text-xs mt-1" style={{ color: colors.inkSoft }}>{ticket.authorUsername} · {formatDate(ticket.createdAt)}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded-full flex items-center gap-1" style={{ color: meta.color, background: colors.bg, fontWeight: 700 }}>
            <StatusIcon size={12} /> {meta.label}
          </span>
          </div>
        </div>
      </button>
  );
}

// --- Detail page ---------------------------------------------------------
function TicketDetail({ ticket, onBack, userRole, username }) {
  const meta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const prio = PRIORITY_META[ticket.priority];

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ticket.status); // Új állapot a dropdownhoz
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    apiFetch(`/api/tickets/${ticket.id}/comments`)
        .then(setComments)
        .catch(err => console.error("Kommentek hiba:", err));
  }, [ticket.id]);

  const handleAddComment = async () => {
    if (!newComment.trim() && currentStatus === selectedStatus) return; // Ne küldjön üres kérést

    setCommenting(true);
    try {
      let commentText = newComment;

      // 1. Állapot módosítás (Ha volt változás és a user Support/Admin)
      if (currentStatus !== selectedStatus && canChangeStatus) {
        setUpdatingStatus(true);
        try {
          await apiFetch(`/api/tickets/${ticket.id}/status?status=${selectedStatus}`, { method: 'PUT' });
          setCurrentStatus(selectedStatus);
          ticket.status = selectedStatus; // Update local ticket prop temporarily

          // Rendszerüzenet hozzáfűzése a kommenthez
          const systemMessage = `[Rendszerüzenet: Állapot módosítva erre: ${STATUS_META[selectedStatus].label}]`;
          commentText = commentText ? `${commentText}\n\n${systemMessage}` : systemMessage;
        } catch (err) {
          alert("Hiba a státusz módosításakor: " + (err.error || err.message));
          setUpdatingStatus(false);
          setCommenting(false);
          return; // Álljunk meg, ha a státuszváltás hiba volt
        }
        setUpdatingStatus(false);
      }

      // 2. Komment beküldése
      if (commentText.trim()) {
        const res = await apiFetch(`/api/tickets/${ticket.id}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content: commentText })
        });
        setComments([...comments, res]);
      }
      setNewComment('');
    } catch (err) {
      alert("Hiba a komment elküldésekor: " + err.message);
    } finally {
      setCommenting(false);
    }
  };


  const handleAssign = async () => {
    setAssigning(true);
    try {
      const updatedTicket = await apiFetch(`/api/tickets/${ticket.id}/assign`, { method: 'PUT' });
      ticket.assigneeUsername = updatedTicket.assigneeUsername;
      ticket.status = updatedTicket.status;
      setCurrentStatus(updatedTicket.status);
      setSelectedStatus(updatedTicket.status); // Frissítsük a dropdown-t is

      // Adjunk hozzá egy rendszerkommentet a kiosztásról is (Opcionális, de hasznos)
      const res = await apiFetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: `[Rendszerüzenet: ${username} magára osztotta a jegyet.]` })
      });
      setComments(prev => [...prev, res]);

    } catch (err) {
      alert("Hiba a kiosztáskor: " + (err.error || err.message));
    } finally {
      setAssigning(false);
    }
  };

  const canChangeStatus = userRole === 'ADMIN' || userRole === 'SUPPORT';
  const displayMeta = STATUS_META[currentStatus] || STATUS_META.OPEN;

  return (
      <div className="max-w-3xl pb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-sm mb-6 transition" style={{ color: colors.primarySoft, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Vissza a listához
        </button>

        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="p-6 flex items-start justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div>
              <span className="text-xs tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.primarySoft, fontWeight: 600 }}>#{ticket.id}</span>
              <h2 className="text-2xl mt-1" style={{ color: colors.ink, fontWeight: 800 }}>{ticket.title}</h2>
              <p className="text-sm mt-2 flex items-center gap-2" style={{ color: colors.inkSoft }}>
                Beküldte: {ticket.authorUsername} · {formatDate(ticket.createdAt)}

                {ticket.assigneeUsername ? (
                    <> · Felelős: <strong style={{color: colors.primary}}>{ticket.assigneeUsername}</strong></>
                ) : (
                    canChangeStatus && (
                        <button
                            onClick={handleAssign}
                            disabled={assigning}
                            className="ml-2 px-2 py-0.5 rounded text-xs font-bold transition"
                            style={{ background: colors.accent, color: '#fff', opacity: assigning ? 0.5 : 1 }}
                        >
                          {assigning ? 'Kiosztás...' : 'Magamra osztom'}
                        </button>
                    )
                )}
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1 flex-shrink-0" style={{ color: displayMeta.color, background: colors.bg, fontWeight: 700 }}>
            <displayMeta.icon size={13} /> {displayMeta.label}
          </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex gap-8 text-sm">
              <div>
                <p style={{ color: colors.inkSoft }} className="text-sm">Prioritás</p>
                <p className="mt-1" style={{ color: prio ? prio.color : colors.ink, fontWeight: 700 }}>
                  {prio ? prio.label : '—'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm mb-1" style={{ color: colors.inkSoft }}>Leírás</p>
              {/* FONTOS: A white-space: pre-wrap miatt a sortörések megmaradnak */}
              <p className="text-sm leading-relaxed" style={{ color: colors.ink, whiteSpace: 'pre-wrap' }}>{ticket.description || '—'}</p>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="rounded-2xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg mb-4" style={{ color: colors.ink, fontWeight: 800 }}>Hozzászólások ({comments.length})</h3>

          <div className="space-y-4 mb-6">
            {comments.map(c => (
                <div key={c.id} className="p-4 rounded-lg" style={{ background: colors.bg }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold" style={{ color: colors.primary }}>{c.authorUsername}</span>
                    <span className="text-xs" style={{ color: colors.inkSoft }}>{formatDate(c.createdAt)}</span>
                  </div>
                  {/* FONTOS: whiteSpace: 'pre-wrap' a formázások (sortörés, behúzás) megőrzéséhez */}
                  <p className="text-sm" style={{ color: colors.ink, whiteSpace: 'pre-wrap' }}>{c.content}</p>
                </div>
            ))}
            {comments.length === 0 && <p className="text-sm italic" style={{ color: colors.inkSoft }}>Még nincsenek hozzászólások.</p>}
          </div>

          <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
            {/* Státuszválasztó Dropdown (Csak ha módosíthatja) */}
            {canChangeStatus && (
                <div className="mb-4">
                  <label className="text-xs font-bold block mb-1" style={{ color: colors.inkSoft }}>Jegy státusza:</label>
                  <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="p-2 rounded text-sm outline-none w-full md:w-auto"
                      style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
                  >
                    {Object.keys(STATUS_META).map(key => (
                        <option key={key} value={key}>{STATUS_META[key].label}</option>
                    ))}
                  </select>
                </div>
            )}

            <textarea
                rows={4}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full p-3 rounded-lg text-sm outline-none resize-none mb-2"
                style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
                placeholder={canChangeStatus && currentStatus !== selectedStatus ? "Írj egy hozzászólást a státuszváltáshoz (opcionális)..." : "Írj egy hozzászólást..."}
            />

            <button
                onClick={handleAddComment}
                disabled={commenting || (!newComment.trim() && currentStatus === selectedStatus)}
                className="px-4 py-2 rounded-lg text-sm transition"
                style={{ background: colors.primary, color: '#fff', fontWeight: 700, opacity: (commenting || (!newComment.trim() && currentStatus === selectedStatus)) ? 0.6 : 1 }}
            >
              {commenting || updatingStatus ? 'Küldés...' : (currentStatus !== selectedStatus ? 'Módosítás és Küldés' : 'Hozzászólás küldése')}
            </button>
          </div>
        </div>
      </div>
  );
}

// --- New ticket page ---------------------------------------------------------
function NewTicket({ onBack, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      await apiFetch('/api/tickets', {
        method: 'POST',
        // FONTOS: a backendből kiszedtük az authorId-t, mert a tokenből olvassa ki!
        body: JSON.stringify({ title, description, priority }),
      });
      onCreated();
    } catch (err) {
      setError(err.message || 'Nem sikerült létrehozni a jegyet');
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-2 text-sm mb-6 transition" style={{ color: colors.primarySoft, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Vissza a listához
        </button>
        <div className="rounded-2xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <h2 className="text-xl mb-5" style={{ color: colors.ink, fontWeight: 800 }}>Új jegy feladása</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs" style={{ color: colors.inkSoft }}>Tárgy</label>
              <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-3 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
                  placeholder="Röviden, mi a probléma?"
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: colors.inkSoft }}>Leírás</label>
              <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 p-3 rounded-lg text-sm outline-none resize-none"
                  style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
                  placeholder="Írd le részletesen, mit tapasztaltál..."
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: colors.inkSoft }}>Prioritás</label>
              <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full mt-1 p-3 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
              >
                {Object.entries(PRIORITY_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-xs" style={{ color: colors.red }}>{error}</p>}
            <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm"
                style={{ background: colors.primary, color: '#fff', fontWeight: 700, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Küldés...' : 'Jegy beküldése'}
            </button>
          </div>
        </div>
      </div>
  );
}

// --- App ---------------------------------------------------------
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('list');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadError, setLoadError] = useState('');

  const loadTickets = () => {
    apiFetch('/api/tickets')
        .then(setTickets)
        .catch((err) => {
          if (err.message === 'UNAUTHORIZED') {
            setToken(null);
          } else {
            setLoadError('Nem sikerült betölteni a jegyeket.');
          }
        });
  };

  useEffect(() => {
    if (token) loadTickets();
  }, [token]);

  if (!token) {
    return <LoginForm onLogin={() => setToken(localStorage.getItem('token'))} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const username = getUsernameFromToken(token);
  const userRole = getRoleFromToken(token);
  const avatarInitials = username ? username.slice(0, 2).toUpperCase() : '?';

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const filterLabel = {
    all: 'Összes jegy',
    OPEN: 'Nyitott jegyek',
    IN_PROGRESS: 'Folyamatban lévő jegyek',
    RESOLVED: 'Megoldott jegyek',
    CLOSED: 'Lezárt jegyek',
  }[filter];

  return (
      <div className="min-h-screen flex flex-col" style={{ background: colors.bg }}>
        <style>{FONT_IMPORT}</style>
        <div style={{ fontFamily: "'Manrope', sans-serif" }} className="flex flex-col min-h-screen">

          <header className="w-full flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ background: colors.primary }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: colors.accent }}>
                <Ticket size={18} color={colors.primary} />
              </div>
              <div className="leading-tight">
                <span className="text-white text-lg" style={{ fontWeight: 800, letterSpacing: '0.02em' }}>TS</span>
                <span className="text-xs block" style={{ color: '#BFE0CC' }}>Ticket System</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: '#BFE0CC', color: colors.primary, fontWeight: 700 }}
                  title={`${username || ''} (${userRole})`}
              >
                {avatarInitials}
              </div>
              <button onClick={handleLogout} title="Kijelentkezés" style={{ color: '#BFE0CC' }}>
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <div className="flex flex-grow min-h-0">
            <Sidebar view={view} setView={setView} filter={filter} setFilter={setFilter} />

            <main className="flex-grow p-8 overflow-auto">
              {view === 'list' && (
                  <>
                    <h1 className="text-2xl mb-6" style={{ color: colors.ink, fontWeight: 800 }}>{filterLabel}</h1>
                    {loadError && <p className="text-sm mb-4" style={{ color: colors.red }}>{loadError}</p>}
                    <div className="space-y-3 max-w-4xl">
                      {filtered.map(t => (
                          <TicketRow key={t.id} ticket={t} onOpen={(t) => { setSelected(t); setView('detail'); }} />
                      ))}
                      {filtered.length === 0 && !loadError && (
                          <p className="text-sm" style={{ color: colors.inkSoft }}>Nincs ilyen státuszú jegy.</p>
                      )}
                    </div>
                  </>
              )}

              {view === 'detail' && selected && (
                  <TicketDetail ticket={selected} onBack={() => { setView('list'); loadTickets(); }} userRole={userRole} username={username} token={token} />
              )}

              {view === 'new' && (
                  <NewTicket onBack={() => setView('list')} onCreated={() => { loadTickets(); setView('list'); }} />
              )}
            </main>
          </div>
        </div>
      </div>
  );
}