import React, { useState, useEffect } from 'react';
import {
  Ticket, ChevronDown, ChevronRight, PlusCircle, Inbox,
  CheckCircle2, Circle, ArrowLeft, Clock, LogOut, Search, Users
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
function Sidebar({ view, setView, filter, setFilter, userRole }) {
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

          {/* Csak ADMIN láthatja az adminisztrációs menüt */}
          {userRole === 'ADMIN' && (
              <button
                  onClick={() => setView('admin')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition mt-2"
                  style={{
                    color: view === 'admin' ? '#FFFFFF' : colors.inkSoft,
                    background: view === 'admin' ? colors.primarySoft : 'transparent',
                    fontWeight: 700,
                  }}
              >
                <Users size={18} />
                Felhasználók (Admin)
              </button>
          )}
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
          className="w-full flex items-stretch text-left rounded-xl overflow-hidden transition hover:-translate-y-0.5 mb-3"
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

// --- Detail page (Combined Action Bar) -----------------------------------
function TicketDetail({ ticket, onBack, userRole, username, onUpdate }) {
  const meta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const prio = PRIORITY_META[ticket.priority];

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Státusz és Kiosztás állapotok
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);

  // Autocomplete (Debounced Search) állapotok
  const [assigneeSearchText, setAssigneeSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const canManage = userRole === 'ADMIN' || userRole === 'SUPPORT';

  // 1. Kommentek lekérése
  useEffect(() => {
    // JAVÍTÁS: Backtick (`) használata a string interpolációhoz!
    apiFetch(`/api/tickets/${ticket.id}/comments`)
        .then(setComments)
        .catch(err => console.error("Kommentek hiba:", err));
  }, [ticket.id]);

  // 2. Debouncing effekt: Várakozás gépelés közben (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(assigneeSearchText);
    }, 300);
    return () => clearTimeout(handler);
  }, [assigneeSearchText]);

  // 3. Keresés effekt: Ha a debounced text változik, lekérjük a szervertől
  useEffect(() => {
    if (canManage && debouncedSearch.length >= 2 && !selectedAssigneeId) {
      // JAVÍTÁS: Backtick (`) használata
      apiFetch(`/api/users/search-staff?query=${debouncedSearch}`)
          .then(setSearchResults)
          .catch(err => console.error("Keresés hiba:", err));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, canManage, selectedAssigneeId]);

  // Validáció
  const statusChanged = selectedStatus !== ticket.status;
  const assigneeChanged = selectedAssigneeId !== null;
  const needsActionComment = statusChanged || assigneeChanged;
  const isCommentEmpty = newComment.trim() === '';

  const isSubmitDisabled = isSubmitting || (needsActionComment && isCommentEmpty) || (!needsActionComment && isCommentEmpty);

  const handleActionSubmit = async () => {
    setIsSubmitting(true);
    let systemMsgs = [];
    let shouldReload = false;

    try {
      // 1. Státusz frissítés
      if (statusChanged) {
        // JAVÍTÁS: Backtick (`) használata a string interpolációhoz!
        await apiFetch(`/api/tickets/${ticket.id}/status?status=${selectedStatus}`, { method: 'PUT' });
        systemMsgs.push(`Státusz módosítva: ${STATUS_META[selectedStatus].label}`);
        shouldReload = true;
      }

      // 2. Felelős frissítés
      if (assigneeChanged) {
        // JAVÍTÁS: Backtick (`) használata a string interpolációhoz!
        await apiFetch(`/api/tickets/${ticket.id}/assign?assigneeId=${selectedAssigneeId}`, { method: 'PUT' });
        systemMsgs.push(`Új felelős: ${selectedAssigneeName}`);
        shouldReload = true;
      }

      // 3. Komment összeállítása
      let finalComment = newComment.trim();
      if (systemMsgs.length > 0) {
        const sysText = `[Rendszerüzenet: ${systemMsgs.join(' | ')}]`;
        finalComment = `${sysText}\n\n${finalComment}`;
      }

      // 4. Komment beküldése
      if (finalComment) {
        // JAVÍTÁS: Backtick (`) használata a string interpolációhoz!
        await apiFetch(`/api/tickets/${ticket.id}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content: finalComment })
        });
        shouldReload = true;
      }

      // Tiszta lap és frissítés
      setNewComment('');
      setSelectedAssigneeId(null);
      setAssigneeSearchText('');
      if (shouldReload) onUpdate(); // Szól a szülőnek (az App komponensnek), hogy töltse újra a jegyeket!
    } catch (err) {
      alert("Hiba történt: " + (err.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {ticket.assigneeUsername && <> · Felelős: <strong style={{color: colors.primary}}>{ticket.assigneeUsername}</strong></>}
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1 flex-shrink-0" style={{ color: meta.color, background: colors.bg, fontWeight: 700 }}>
            <meta.icon size={13} /> {meta.label}
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

        <div className="rounded-2xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg mb-4" style={{ color: colors.ink, fontWeight: 800 }}>Hozzászólások és Előzmények</h3>

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

          {/* ACTION BAR: Státusz, Kiosztás és Komment egyben */}
          <div className="pt-5 border-t" style={{ borderColor: colors.border }}>

            {canManage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  {/* Státusz dropdown */}
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: colors.inkSoft }}>Státusz módosítása</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full p-2.5 rounded-lg text-sm outline-none transition"
                        style={{ border: `1px solid ${colors.border}`, background: statusChanged ? '#EAF3EC' : colors.bg }}
                    >
                      {Object.keys(STATUS_META).map(key => (
                          <option key={key} value={key}>{STATUS_META[key].label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kiosztás Autocomplete (Debounced) */}
                  <div className="relative">
                    <label className="text-xs font-bold block mb-1.5" style={{ color: colors.inkSoft }}>Felelős hozzárendelése</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5" size={16} color={colors.inkSoft} />
                      <input
                          type="text"
                          value={selectedAssigneeName || assigneeSearchText}
                          onChange={(e) => {
                            setAssigneeSearchText(e.target.value);
                            setSelectedAssigneeId(null);
                            setSelectedAssigneeName('');
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // JAVÍTÁS: Kis késleltetés bezárás előtt
                          placeholder="Kezdj gépelni (min 2 betű)..."
                          className="w-full pl-10 pr-8 py-2.5 rounded-lg text-sm outline-none transition"
                          style={{ border: `1px solid ${colors.border}`, background: assigneeChanged ? '#EAF3EC' : colors.bg }}
                      />

                      {selectedAssigneeId && (
                          <button
                              onClick={() => { setSelectedAssigneeId(null); setSelectedAssigneeName(''); setAssigneeSearchText(''); }}
                              className="absolute right-3 top-2.5 text-xs text-gray-500 hover:text-red-500 font-bold"
                          >
                            X
                          </button>
                      )}

                      {/* Dropdown lista a találatokkal */}
                      {showDropdown && assigneeSearchText.length >= 2 && !selectedAssigneeId && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-48 overflow-y-auto" style={{ borderColor: colors.border }}>
                            {searchResults.length > 0 ? (
                                searchResults.map(u => (
                                    <div
                                        key={u.id}
                                        // JAVÍTÁS: onClick helyett onMouseDown, mert ez lefut az onBlur ELŐTT!
                                        onMouseDown={() => {
                                          setSelectedAssigneeName(u.username);
                                          setSelectedAssigneeId(u.id);
                                          setShowDropdown(false);
                                        }}
                                        className="p-3 text-sm hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                    >
                                      <span style={{ fontWeight: 600 }}>{u.username}</span>
                                      <span className="text-[10px] uppercase bg-gray-100 px-2 py-0.5 rounded">{u.role}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-sm italic" style={{ color: colors.inkSoft }}>Nincs találat erre: "{assigneeSearchText}"</div>
                            )}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
            )}

            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: colors.inkSoft }}>
                {needsActionComment ? <span style={{ color: colors.red }}>Indoklás (Kötelező a módosításhoz)</span> : 'Hozzászólás'}
              </label>
              <textarea
                  rows={4}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full p-3 rounded-lg text-sm outline-none resize-none mb-3 transition focus:ring-2"
                  style={{ border: `1px solid ${colors.border}`, background: colors.bg, ringColor: colors.primarySoft }}
                  placeholder={needsActionComment ? "Kérlek, írd le miért történt a változtatás..." : "Írj egy hozzászólást (Enterek és formázások megmaradnak)..."}
              />

              <button
                  onClick={handleActionSubmit}
                  disabled={isSubmitDisabled}
                  className="px-5 py-2.5 rounded-lg text-sm transition w-full sm:w-auto"
                  style={{ background: colors.primary, color: '#fff', fontWeight: 700, opacity: isSubmitDisabled ? 0.5 : 1 }}
              >
                {isSubmitting ? 'Feldolgozás...' : (needsActionComment ? 'Módosítás és Hozzászólás' : 'Hozzászólás elküldése')}
              </button>
            </div>
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

// --- Admin Panel ---------------------------------------------------------
function AdminPanel({ onBack, currentUsername }) { // <-- JAVÍTÁS: Bekérjük az aktuális bejelentkezett nevet
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRoles, setPendingRoles] = useState({});
  const [savingId, setSavingId] = useState(null);

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/api/admin/users');
      setUsers(data);
    } catch (err) {
      setLoadError('Nem sikerült betölteni a felhasználókat: ' + err.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSaveRole = async (userId) => {
    setSavingId(userId);
    try {
      await apiFetch(`/api/admin/users/${userId}/role?role=${pendingRoles[userId]}`, { method: 'PUT' });
      // Sikeres mentés után töröljük a függőben lévő állapotot
      setPendingRoles(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      loadUsers(); // Lista frissítése
    } catch (err) {
      alert('Hiba a jogosultság módosításakor: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const cancelRoleChange = (userId) => {
    setPendingRoles(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const filteredUsers = users.filter(u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
      <div className="max-w-4xl pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl" style={{ color: colors.ink, fontWeight: 800 }}>Felhasználók kezelése</h2>

          {/* Keresőmező */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5" size={16} color={colors.inkSoft} />
            <input
                type="text"
                placeholder="Keresés (név, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg text-sm outline-none transition"
                style={{ border: `1px solid ${colors.border}`, background: colors.surface }}
            />
          </div>
        </div>

        {loadError && <p className="text-sm mb-4" style={{ color: colors.red }}>{loadError}</p>}

        <div className="rounded-2xl overflow-x-auto" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
            <tr style={{ background: colors.bg, color: colors.inkSoft, borderBottom: `1px solid ${colors.border}` }}>
              <th className="p-4 font-bold">ID</th>
              <th className="p-4 font-bold">Felhasználónév</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Szerepkör (Role)</th>
              <th className="p-4 font-bold">Műveletek</th>
            </tr>
            </thead>
            <tbody>
            {filteredUsers.map(u => {
              const currentDisplayRole = pendingRoles[u.id] || u.role;
              const isChanged = pendingRoles[u.id] && pendingRoles[u.id] !== u.role;
              const isSaving = savingId === u.id;
              const isCurrentUser = u.username === currentUsername; // <-- ÚJ: Ellenőrizzük, hogy ő-e az aktuális felhasználó

              return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td className="p-4" style={{ color: colors.inkSoft }}>#{u.id}</td>
                    <td className="p-4" style={{ color: colors.ink, fontWeight: 600 }}>
                      {u.username}
                      {isCurrentUser && <span className="ml-2 text-[10px] uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Te</span>}
                    </td>
                    <td className="p-4" style={{ color: colors.inkSoft }}>{u.email}</td>
                    <td className="p-4">
                      <select
                          value={currentDisplayRole}
                          onChange={(e) => setPendingRoles(prev => ({ ...prev, [u.id]: e.target.value }))}
                          disabled={isSaving || isCurrentUser} // <-- ÚJ: Blokkoljuk, ha saját magát akarja módosítani
                          className="p-2 rounded border outline-none text-xs font-bold transition-colors"
                          style={{
                            borderColor: isChanged ? colors.amber : colors.border,
                            background: currentDisplayRole === 'ADMIN' ? '#FEE2E2' : currentDisplayRole === 'SUPPORT' ? '#E0F2FE' : colors.bg,
                            color: currentDisplayRole === 'ADMIN' ? colors.red : currentDisplayRole === 'SUPPORT' ? colors.amber : colors.ink,
                            opacity: isCurrentUser ? 0.6 : 1, // Kiszürkítjük egy picit
                            cursor: isCurrentUser ? 'not-allowed' : 'pointer'
                          }}
                      >
                        <option value="USER">USER (Alap)</option>
                        <option value="SUPPORT">SUPPORT (Támogató)</option>
                        <option value="ADMIN">ADMIN (Rendszergazda)</option>
                      </select>
                    </td>
                    <td className="p-4" style={{ minWidth: '140px' }}>
                      {/* Mentés és Mégse gombok csak módosítás esetén jelennek meg */}
                      {isChanged ? (
                          <div className="flex gap-2">
                            <button
                                onClick={() => handleSaveRole(u.id)}
                                disabled={isSaving}
                                className="px-3 py-1.5 rounded text-xs font-bold text-white transition-opacity"
                                style={{ background: colors.primary, opacity: isSaving ? 0.5 : 1 }}
                            >
                              {isSaving ? '...' : 'Mentés'}
                            </button>
                            <button
                                onClick={() => cancelRoleChange(u.id)}
                                disabled={isSaving}
                                className="px-3 py-1.5 rounded text-xs font-bold transition-opacity"
                                style={{ background: '#FEE2E2', color: colors.red, opacity: isSaving ? 0.5 : 1 }}
                            >
                              X
                            </button>
                          </div>
                      ) : (
                          <span className="text-xs italic" style={{ color: colors.border }}>-</span>
                      )}
                    </td>
                  </tr>
              );
            })}
            {filteredUsers.length === 0 && !loadError && (
                <tr><td colSpan="5" className="p-4 text-center italic text-gray-500">Nincs találat erre a keresésre.</td></tr>
            )}
            </tbody>
          </table>
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

  const loadTickets = async () => {
    try {
      const data = await apiFetch('/api/tickets');
      setTickets(data);
      if (selected) {
        const updatedSelected = data.find(t => t.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') setToken(null);
      else setLoadError('Nem sikerült betölteni a jegyeket.');
    }
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
            <Sidebar view={view} setView={setView} filter={filter} setFilter={setFilter} userRole={userRole} />

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
                  <TicketDetail
                      ticket={selected}
                      onBack={() => { setView('list'); loadTickets(); }}
                      userRole={userRole}
                      username={username}
                      onUpdate={loadTickets}
                  />
              )}

              {view === 'new' && (
                  <NewTicket onBack={() => setView('list')} onCreated={() => { loadTickets(); setView('list'); }} />
              )}

              {}
              {view === 'admin' && userRole === 'ADMIN' && (
                  <AdminPanel onBack={() => setView('list')} currentUsername={username} />
                  // <-- JAVÍTÁS: Átadjuk az AdminPanel-nek, hogy ki van épp belépve (currentUsername={username})
              )}
            </main>
          </div>
        </div>
      </div>
  );
}