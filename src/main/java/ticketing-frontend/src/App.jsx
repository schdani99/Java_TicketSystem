import React, { useState } from 'react';
import {
  Ticket, ChevronDown, ChevronRight, PlusCircle, Inbox,
  CheckCircle2, Circle, ArrowLeft, MessageSquare, Clock, AlertTriangle
} from 'lucide-react';

// --- Design tokens -----------------------------------------------------
const colors = {
  bg: '#F4F8F5',        // pale mint-white page background
  surface: '#FFFFFF',
  ink: '#16241C',        // near-black, green-tinted
  inkSoft: '#5B6B62',
  primary: '#173A2E',    // deep forest green
  primarySoft: '#2F6B4F',
  accent: '#5FA37A',     // sap green accent
  border: '#DCE6DE',
  amber: '#B9822E',
  red: '#B5473B',
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

// --- Sample data ---------------------------------------------------------
const [tickets, setTickets] = useState([]);

useEffect(() => {
  fetch('http://localhost:8080/api/tickets', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}` // A belépésnél elmentett token
    }
  })
      .then(res => res.json())
      .then(data => setTickets(data))
      .catch(err => console.error("Hiba az adatok betöltésekor:", err));
}, []);

const STATUS_META = {
  open: { label: 'Nyitott', icon: Circle, color: colors.accent },
  progress: { label: 'Folyamatban', icon: Clock, color: colors.amber },
  closed: { label: 'Lezárva', icon: CheckCircle2, color: colors.inkSoft },
};

const PRIORITY_META = {
  magas: colors.red,
  közepes: colors.amber,
  alacsony: colors.inkSoft,
};

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
      <aside
          className="w-64 flex-shrink-0 flex flex-col"
          style={{ background: colors.surface, borderRight: `1px solid ${colors.border}` }}
      >
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
                {subItem('open', 'Nyitott')}
                {subItem('progress', 'Folyamatban')}
                {subItem('closed', 'Lezárt')}
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

// --- Ticket row, styled like a stub with a torn perforation ---------------
function TicketRow({ ticket, onOpen }) {
  const meta = STATUS_META[ticket.status];
  const StatusIcon = meta.icon;

  return (
      <button
          onClick={() => onOpen(ticket)}
          className="w-full flex items-stretch text-left rounded-xl overflow-hidden transition hover:-translate-y-0.5"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 1px 2px rgba(23,58,46,0.04)',
          }}
      >
        {/* stub */}
        <div
            className="flex flex-col items-center justify-center py-4 px-4 flex-shrink-0"
            style={{ background: colors.primary, minWidth: '92px' }}
        >
        <span
            className="text-[11px] tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: '#BFE0CC' }}
        >
          TICKET
        </span>
          <span
              className="text-lg"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF', fontWeight: 600 }}
          >
          {ticket.id}
        </span>
        </div>

        {/* perforation */}
        <div className="relative flex-shrink-0" style={{ width: '1px', borderLeft: `2px dashed ${colors.border}` }}>
          <span className="absolute rounded-full" style={{ top: '-9px', left: '-9px', width: '18px', height: '18px', background: colors.bg }} />
          <span className="absolute rounded-full" style={{ bottom: '-9px', left: '-9px', width: '18px', height: '18px', background: colors.bg }} />
        </div>

        {/* body */}
        <div className="flex-grow p-4 flex items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h3 className="text-sm truncate" style={{ color: colors.ink, fontWeight: 600 }}>{ticket.title}</h3>
            <p className="text-xs mt-1" style={{ color: colors.inkSoft }}>
              {ticket.requester} · {ticket.created}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: colors.inkSoft }}>
            <MessageSquare size={14} /> {ticket.comments}
          </span>
            <span
                className="text-[11px] uppercase tracking-wide px-2 py-1 rounded-full flex items-center gap-1"
                style={{ color: meta.color, background: colors.bg, fontWeight: 700 }}
            >
            <StatusIcon size={12} /> {meta.label}
          </span>
          </div>
        </div>
      </button>
  );
}

// --- Detail "page" ---------------------------------------------------------
function TicketDetail({ ticket, onBack }) {
  const meta = STATUS_META[ticket.status];
  return (
      <div className="max-w-3xl">
        <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm mb-6 transition"
            style={{ color: colors.primarySoft, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Vissza a listához
        </button>

        <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="p-6 flex items-start justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div>
            <span
                className="text-xs tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.primarySoft, fontWeight: 600 }}
            >
              {ticket.id}
            </span>
              <h2 className="text-2xl mt-1" style={{ color: colors.ink, fontWeight: 800 }}>{ticket.title}</h2>
              <p className="text-sm mt-2" style={{ color: colors.inkSoft }}>
                Beküldte: {ticket.requester} · {ticket.created}
              </p>
            </div>
            <span
                className="text-xs uppercase tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1 flex-shrink-0"
                style={{ color: meta.color, background: colors.bg, fontWeight: 700 }}
            >
            <meta.icon size={13} /> {meta.label}
          </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-8 text-sm">
              <div>
                <p style={{ color: colors.inkSoft }}>Prioritás</p>
                <p className="mt-1" style={{ color: PRIORITY_META[ticket.priority], fontWeight: 700 }}>
                  {ticket.priority[0].toUpperCase() + ticket.priority.slice(1)}
                </p>
              </div>
              <div>
                <p style={{ color: colors.inkSoft }}>Hozzászólások</p>
                <p className="mt-1" style={{ color: colors.ink, fontWeight: 700 }}>{ticket.comments}</p>
              </div>
            </div>

            <div>
              <p className="text-sm mb-1" style={{ color: colors.inkSoft }}>Leírás</p>
              <p className="text-sm leading-relaxed" style={{ color: colors.ink }}>
                Ide kerülne a jegy teljes leírása, amit az API-ból töltünk be a részletek megnyitásakor.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="px-4 py-2 rounded-lg text-sm" style={{ background: colors.primary, color: '#fff', fontWeight: 700 }}>
                Állapot módosítása
              </button>
              <button className="px-4 py-2 rounded-lg text-sm" style={{ background: colors.bg, color: colors.ink, fontWeight: 600 }}>
                Hozzászólás írása
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

// --- New ticket "page" ---------------------------------------------------------
function NewTicket({ onBack }) {
  return (
      <div className="max-w-2xl">
        <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm mb-6 transition"
            style={{ color: colors.primarySoft, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Vissza a listához
        </button>
        <div className="rounded-2xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <h2 className="text-xl mb-5" style={{ color: colors.ink, fontWeight: 800 }}>Új jegy feladása</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs" style={{ color: colors.inkSoft }}>Tárgy</label>
              <input
                  className="w-full mt-1 p-3 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
                  placeholder="Röviden, mi a probléma?"
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: colors.inkSoft }}>Leírás</label>
              <textarea
                  rows={5}
                  className="w-full mt-1 p-3 rounded-lg text-sm outline-none resize-none"
                  style={{ border: `1px solid ${colors.border}`, background: colors.bg }}
                  placeholder="Írd le részletesen, mit tapasztaltál..."
              />
            </div>
            <button className="px-5 py-2.5 rounded-lg text-sm" style={{ background: colors.primary, color: '#fff', fontWeight: 700 }}>
              Jegy beküldése
            </button>
          </div>
        </div>
      </div>
  );
}

// --- App ---------------------------------------------------------
export default function App() {
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'new'
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = filter === 'all' ? TICKETS : TICKETS.filter(t => t.status === filter);
  const filterLabel = { all: 'Összes jegy', open: 'Nyitott jegyek', progress: 'Folyamatban lévő jegyek', closed: 'Lezárt jegyek' }[filter];

  return (
      <div className="min-h-screen flex flex-col" style={{ background: colors.bg }}>
        <style>{FONT_IMPORT}</style>
        <div style={{ fontFamily: "'Manrope', sans-serif" }} className="flex flex-col min-h-screen">

          {/* Top bar */}
          <header
              className="w-full flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: colors.primary }}
          >
            <div className="flex items-center gap-3">
              <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: colors.accent }}
              >
                <Ticket size={18} color={colors.primary} />
              </div>
              <div className="leading-tight">
                <span className="text-white text-lg" style={{ fontWeight: 800, letterSpacing: '0.02em' }}>TS</span>
                <span className="text-xs block" style={{ color: '#BFE0CC' }}>Ticket System</span>
              </div>
            </div>
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: '#BFE0CC', color: colors.primary, fontWeight: 700 }}
            >
              SD
            </div>
          </header>

          <div className="flex flex-grow min-h-0">
            <Sidebar view={view} setView={setView} filter={filter} setFilter={setFilter} />

            <main className="flex-grow p-8 overflow-auto">
              {view === 'list' && (
                  <>
                    <h1 className="text-2xl mb-6" style={{ color: colors.ink, fontWeight: 800 }}>{filterLabel}</h1>
                    <div className="space-y-3 max-w-4xl">
                      {filtered.map(t => (
                          <TicketRow key={t.id} ticket={t} onOpen={(t) => { setSelected(t); setView('detail'); }} />
                      ))}
                      {filtered.length === 0 && (
                          <p className="text-sm" style={{ color: colors.inkSoft }}>Nincs ilyen státuszú jegy.</p>
                      )}
                    </div>
                  </>
              )}

              {view === 'detail' && selected && (
                  <TicketDetail ticket={selected} onBack={() => setView('list')} />
              )}

              {view === 'new' && (
                  <NewTicket onBack={() => setView('list')} />
              )}
            </main>
          </div>
        </div>
      </div>
  );
}