import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getImageUrl } from '../../api';
import {
    ChevronLeft, Loader2, Users, Calendar, MapPin,
    RefreshCw, Search, Clock, UserCheck, UserX,
    History as HistoryIcon, Download, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Status metadata ────────────────────────────────────────────────────────
const STATUS_META = {
    REGISTERED:  { label: 'Registered',  color: '#f59e0b', bg: '#fffbeb' },
    CHECKED_IN:  { label: 'Checked In',  color: '#059669', bg: '#f0fdf4' },
    CHECKED_OUT: { label: 'Checked Out', color: '#6366f1', bg: '#eef2ff' },
    CANCELLED:   { label: 'Cancelled',   color: '#ef4444', bg: '#fef2f2' },
    NO_SHOW:     { label: 'No Show',     color: '#9ca3af', bg: '#f9fafb' },
};

const ALL_FILTERS = ['ALL', 'REGISTERED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'];

const fmt = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : '—';

// ── CSV export ─────────────────────────────────────────────────────────────
const exportCSV = (history, eventTitle) => {
    const header = ['Name', 'Email', 'Status', 'Registered At', 'Checked In At', 'Checked Out At', 'Cancelled At'];
    const rows = history.map(h => [
        `"${h.user_name || ''}"`,
        `"${h.user_email || ''}"`,
        h.status,
        h.registered_at  ? fmtTime(h.registered_at)  : '',
        h.checked_in_at  ? fmtTime(h.checked_in_at)  : '',
        h.checked_out_at ? fmtTime(h.checked_out_at) : '',
        h.cancelled_at   ? fmtTime(h.cancelled_at)   : '',
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${(eventTitle || 'event').replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ── Single event history panel ─────────────────────────────────────────────
const EventHistoryPanel = ({ event, autoOpen = false }) => {
    const [history, setHistory]       = useState([]);
    const [loading, setLoading]       = useState(false);
    const [expanded, setExpanded]     = useState(autoOpen);
    const [search, setSearch]         = useState('');
    const [activeFilter, setFilter]   = useState('ALL');
    const [loaded, setLoaded]         = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.getEventHistory(event.id)
            .then(d => { setHistory(d || []); setLoaded(true); })
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [event.id]);

    // Auto-load when opened via direct URL
    useEffect(() => {
        if (autoOpen && !loaded) load();
    }, [autoOpen, loaded, load]);

    const toggle = () => {
        if (!expanded && !loaded) load();   // lazy-load on first open
        setExpanded(v => !v);
    };

    const filtered = history
        .filter(h => activeFilter === 'ALL' || h.status === activeFilter)
        .filter(h =>
            (h.user_name  || '').toLowerCase().includes(search.toLowerCase()) ||
            (h.user_email || '').toLowerCase().includes(search.toLowerCase())
        );

    const checkins       = history.filter(h => h.checked_in_at).length;
    const checkouts      = history.filter(h => h.checked_out_at).length;
    const insideNow      = history.filter(h => h.checked_in_at && !h.checked_out_at).length;
    const cancelled      = history.filter(h => h.status === 'CANCELLED').length;
    const noShow         = history.filter(h => h.status === 'NO_SHOW').length;

    return (
        <div className={`event-panel ${expanded ? 'event-panel--open' : ''}`}>
            {/* ── Header row (always visible) ── */}
            <button className="event-panel-header" onClick={toggle}>
                <div className="eph-left">
                    {event.image_url
                        ? <img src={getImageUrl(event.image_url)} alt={event.title} className="eph-thumb" />
                        : <div className="eph-thumb-placeholder"><Calendar size={20} /></div>
                    }
                    <div className="eph-info">
                        <span className="eph-title">{event.title}</span>
                        <span className="eph-meta">
                            <Calendar size={11} /> {fmt(event.date_start)}
                            &nbsp;·&nbsp;
                            <MapPin size={11} /> {event.location}
                            &nbsp;·&nbsp;
                            <Users size={11} /> {event.participants_count ?? 0} registered
                        </span>
                    </div>
                </div>
                <div className="eph-right">
                    {loaded && (
                        <div className="eph-mini-stats">
                            <span style={{ color: '#059669' }}><UserCheck size={13} /> {checkins} in</span>
                            <span style={{ color: '#6366f1' }}><UserX size={13} /> {checkouts} out</span>
                            <span style={{ color: '#f59e0b' }}><Users size={13} /> {insideNow} inside</span>
                        </div>
                    )}
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>

            {/* ── Expanded body ── */}
            {expanded && (
                <div className="event-panel-body">
                    {loading && (
                        <div className="center-loader">
                            <Loader2 size={20} className="spin" /> Loading history…
                        </div>
                    )}

                    {!loading && loaded && (
                        <>
                            {/* Stats bar */}
                            <div className="stats-row">
                                {[
                                    { label: 'Check-ins',       val: checkins,  color: '#059669', icon: <UserCheck size={14} /> },
                                    { label: 'Check-outs',      val: checkouts, color: '#6366f1', icon: <UserX size={14} /> },
                                    { label: 'Inside Now',      val: insideNow, color: '#f59e0b', icon: <Users size={14} /> },
                                    { label: 'Cancelled',       val: cancelled, color: '#ef4444', icon: <UserX size={13} /> },
                                    { label: 'No Show',         val: noShow,    color: '#9ca3af', icon: <Clock size={13} /> },
                                ].map(s => (
                                    <div key={s.label} className="stat-pill" style={{ borderColor: s.color }}>
                                        <div style={{ color: s.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {s.icon} <span className="stat-val">{s.val}</span>
                                        </div>
                                        <span className="stat-lbl">{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Filter chips + search + export */}
                            <div className="toolbar">
                                <div className="filter-chips">
                                    {ALL_FILTERS.map(f => {
                                        const meta = STATUS_META[f];
                                        const count = f === 'ALL' ? history.length : history.filter(h => h.status === f).length;
                                        return (
                                            <button
                                                key={f}
                                                className={`chip ${activeFilter === f ? 'chip-active' : ''}`}
                                                style={activeFilter === f && meta
                                                    ? { background: meta.bg, color: meta.color, borderColor: meta.color }
                                                    : {}}
                                                onClick={() => setFilter(f)}
                                            >
                                                {meta ? meta.label : 'All'} <span className="chip-count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="toolbar-right">
                                    <div className="search-box">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search name or email…"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="btn-export"
                                        onClick={() => exportCSV(filtered, event.title)}
                                        title="Export to CSV"
                                    >
                                        <Download size={14} /> Export
                                    </button>
                                    <button
                                        className="btn-refresh"
                                        onClick={load}
                                        title="Refresh"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Participant rows */}
                            <div className="history-list">
                                {filtered.length === 0 && (
                                    <p className="empty-hint">No participants match the current filter.</p>
                                )}
                                {filtered.map(h => {
                                    const sm = STATUS_META[h.status] || STATUS_META.REGISTERED;
                                    const avatarSrc = h.user_profile_image ? getImageUrl(h.user_profile_image) : null;
                                    return (
                                        <div key={h.id} className="history-row">
                                            <div className="p-avatar">
                                                {avatarSrc
                                                    ? <img src={avatarSrc} alt={h.user_name} className="avatar-img" />
                                                    : (h.user_name || '?')[0].toUpperCase()
                                                }
                                            </div>
                                            <div className="history-info">
                                                <div className="p-name">{h.user_name}</div>
                                                <div className="p-email">{h.user_email}</div>
                                                <div className="history-timeline">
                                                    {h.registered_at && (
                                                        <div className="timeline-item">
                                                            <Clock size={11} />
                                                            <span className="timeline-label">Registered:</span>
                                                            <span className="timeline-time">{fmtTime(h.registered_at)}</span>
                                                        </div>
                                                    )}
                                                    {h.checked_in_at && (
                                                        <div className="timeline-item checkin">
                                                            <UserCheck size={11} />
                                                            <span className="timeline-label">Checked In:</span>
                                                            <span className="timeline-time">{fmtTime(h.checked_in_at)}</span>
                                                        </div>
                                                    )}
                                                    {h.checked_out_at && (
                                                        <div className="timeline-item checkout">
                                                            <UserX size={11} />
                                                            <span className="timeline-label">Checked Out:</span>
                                                            <span className="timeline-time">{fmtTime(h.checked_out_at)}</span>
                                                        </div>
                                                    )}
                                                    {h.cancelled_at && (
                                                        <div className="timeline-item cancelled">
                                                            <UserX size={11} />
                                                            <span className="timeline-label">Cancelled:</span>
                                                            <span className="timeline-time">{fmtTime(h.cancelled_at)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-status-pill" style={{ color: sm.color, background: sm.bg }}>
                                                {sm.label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────
const History = () => {
    const navigate = useNavigate();
    const { eventId } = useParams();          // set when arriving from /organizer/history/:eventId
    const [events, setEvents]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');

    useEffect(() => {
        api.getMyEvents()
            .then(data => setEvents(data || []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    // Scroll the auto-opened panel into view after events load
    useEffect(() => {
        if (eventId && !loading) {
            setTimeout(() => {
                const el = document.getElementById(`panel-${eventId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        }
    }, [eventId, loading]);

    const filtered = events.filter(e =>
        (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="history-page">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
                <div className="header-title-row">
                    <h1><HistoryIcon size={26} /> Check-In / Check-Out History</h1>
                    <div className="header-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Filter events…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <p className="page-sub">
                    All your events are listed below. Click an event to expand its full participant check-in / check-out history.
                </p>
            </header>

            {loading && (
                <div className="center-loader">
                    <Loader2 size={28} className="spin" /> Loading your events…
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="empty-box">
                    <Calendar size={40} />
                    <p>No events found.</p>
                </div>
            )}

            <div className="panels-list">
                {filtered.map(ev => (
                    <div key={ev.id} id={`panel-${ev.id}`}>
                        <EventHistoryPanel event={ev} autoOpen={ev.id === eventId} />
                    </div>
                ))}
            </div>

            <style jsx>{`
                /* ── Page ── */
                .history-page { max-width: 980px; margin: 0 auto; padding: 1rem 1rem 3rem; }

                .btn-back { display:flex; align-items:center; gap:0.4rem; background:none; border:none; color:var(--text-muted); font-weight:600; cursor:pointer; margin-bottom:0.75rem; transition:color 0.2s; }
                .btn-back:hover { color:var(--primary); }

                .page-header { margin-bottom: 1.75rem; }
                .header-title-row { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
                .page-header h1 { font-family:'Outfit'; font-size:1.9rem; display:flex; align-items:center; gap:0.5rem; flex:1; }
                .header-search { display:flex; align-items:center; gap:0.5rem; background:var(--bg-card); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.4rem 0.85rem; min-width:200px; }
                .header-search input { border:none; background:none; outline:none; font-size:0.88rem; width:100%; }
                .page-sub { color:var(--text-muted); font-size:0.88rem; margin-top:0.4rem; }

                /* ── Panels list ── */
                .panels-list { display:flex; flex-direction:column; gap:0.85rem; }

                /* ── Event panel ── */
                .event-panel { background:var(--bg-card); border:1.5px solid var(--border); border-radius:var(--radius-md); overflow:hidden; transition:box-shadow 0.2s; }
                .event-panel--open { border-color:var(--primary); box-shadow:0 6px 24px rgba(0,0,0,0.07); }

                .event-panel-header { width:100%; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.9rem 1.25rem; background:none; border:none; cursor:pointer; text-align:left; transition:background 0.15s; }
                .event-panel-header:hover { background:var(--bg-page); }

                .eph-left { display:flex; align-items:center; gap:0.85rem; flex:1; min-width:0; }
                .eph-thumb { width:56px; height:40px; object-fit:cover; border-radius:6px; flex-shrink:0; }
                .eph-thumb-placeholder { width:56px; height:40px; background:var(--primary-light); border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--primary); flex-shrink:0; }
                .eph-info { display:flex; flex-direction:column; min-width:0; }
                .eph-title { font-family:'Outfit'; font-weight:700; font-size:0.97rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .eph-meta { display:flex; align-items:center; gap:0.35rem; font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem; flex-wrap:wrap; }

                .eph-right { display:flex; align-items:center; gap:1rem; flex-shrink:0; color:var(--text-muted); }
                .eph-mini-stats { display:flex; gap:0.75rem; }
                .eph-mini-stats span { display:flex; align-items:center; gap:0.25rem; font-size:0.8rem; font-weight:600; }

                /* ── Expanded body ── */
                .event-panel-body { padding:0 1.25rem 1.25rem; border-top:1px solid var(--border); }

                /* ── Stats ── */
                .stats-row { display:flex; gap:0.65rem; margin: 1rem 0; flex-wrap:wrap; }
                .stat-pill { flex:1; min-width:100px; background:var(--bg-page); border:2px solid; border-radius:var(--radius-md); padding:0.6rem 0.75rem; text-align:center; }
                .stat-val { font-size:1.5rem; font-weight:800; font-family:'Outfit'; }
                .stat-lbl { display:block; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:600; margin-top:0.1rem; }

                /* ── Toolbar ── */
                .toolbar { display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; margin-bottom:1rem; }
                .filter-chips { display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; flex:1; }
                .chip { background:var(--bg-card); border:1.5px solid var(--border); border-radius:20px; padding:0.25rem 0.75rem; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:0.3rem; color:var(--text); }
                .chip:hover { border-color:var(--primary); color:var(--primary); }
                .chip-active { font-weight:700; }
                .chip-count { background:rgba(0,0,0,0.08); border-radius:10px; padding:0.05rem 0.4rem; font-size:0.7rem; }

                .toolbar-right { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; }
                .search-box { display:flex; align-items:center; gap:0.4rem; background:var(--bg-page); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.3rem 0.75rem; }
                .search-box input { border:none; background:none; outline:none; font-size:0.85rem; width:160px; }

                .btn-export { display:flex; align-items:center; gap:0.3rem; background:none; border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.3rem 0.7rem; font-size:0.82rem; font-weight:600; color:var(--text-muted); cursor:pointer; transition:all 0.2s; }
                .btn-export:hover { border-color:#059669; color:#059669; }
                .btn-refresh { background:none; border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.3rem 0.5rem; cursor:pointer; color:var(--text-muted); transition:all 0.2s; display:flex; }
                .btn-refresh:hover { border-color:var(--primary); color:var(--primary); }

                /* ── History rows ── */
                .history-list { max-height:520px; overflow-y:auto; border:1px solid var(--border); border-radius:var(--radius-sm); }
                .history-row { display:flex; align-items:flex-start; gap:1rem; padding:1rem 1.1rem; border-bottom:1px solid var(--border); transition:background 0.15s; }
                .history-row:last-child { border-bottom:none; }
                .history-row:hover { background:var(--bg-page); }

                .p-avatar { width:42px; height:42px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem; flex-shrink:0; overflow:hidden; }
                .avatar-img { width:100%; height:100%; object-fit:cover; }

                .history-info { flex:1; min-width:0; }
                .p-name { font-weight:700; font-size:0.92rem; margin-bottom:0.1rem; }
                .p-email { font-size:0.8rem; color:var(--text-muted); margin-bottom:0.6rem; }

                .history-timeline { display:flex; flex-direction:column; gap:0.35rem; }
                .timeline-item { display:flex; align-items:center; gap:0.35rem; font-size:0.8rem; color:var(--text-muted); }
                .timeline-item.checkin   { color:#059669; }
                .timeline-item.checkout  { color:#6366f1; }
                .timeline-item.cancelled { color:#ef4444; }
                .timeline-label { font-weight:600; min-width:90px; }
                .timeline-time { color:var(--text); font-weight:500; }

                .p-status-pill { padding:0.35rem 0.8rem; border-radius:20px; font-size:0.73rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; flex-shrink:0; align-self:flex-start; }

                /* ── Misc ── */
                .center-loader { display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:3rem; color:var(--text-muted); }
                .spin { animation:spin 1s linear infinite; }
                @keyframes spin { to { transform:rotate(360deg); } }
                .empty-hint { text-align:center; padding:2rem; color:var(--text-muted); font-size:0.88rem; }
                .empty-box { text-align:center; padding:3rem 2rem; color:var(--text-muted); background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); }
                .empty-box svg { margin-bottom:1rem; opacity:0.5; }

                /* ── Responsive ── */
                @media (max-width:768px) {
                    .history-page { padding:0.5rem; }
                    .stats-row { flex-direction:column; }
                    .stat-pill { min-width:100%; }
                    .history-row { flex-direction:column; }
                    .p-status-pill { align-self:flex-start; }
                    .eph-mini-stats { display:none; }
                    .toolbar { flex-direction:column; align-items:flex-start; }
                    .toolbar-right { width:100%; }
                    .search-box input { width:100%; }
                    .header-title-row { flex-direction:column; align-items:flex-start; }
                }
            `}</style>
        </div>
    );
};

export default History;
