import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../../api';
import {
    ChevronLeft, Loader2, Users, Calendar, MapPin, ArrowRight,
    RefreshCw, Search, Clock, UserCheck, UserX, History as HistoryIcon
} from 'lucide-react';

const STATUS_META = {
    registered: { label: 'Registered', color: '#f59e0b', bg: '#fffbeb' },
    checked_in: { label: 'Checked In', color: '#059669', bg: '#f0fdf4' },
    checked_out: { label: 'Checked Out', color: '#6366f1', bg: '#eef2ff' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
    no_show: { label: 'No Show', color: '#9ca3af', bg: '#f9fafb' },
};

const fmt = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : '—';

// ─── Step 1: Pick an event ─────────────────────────────────────────────────
const StepSelectEvent = ({ onSelect }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getMyEvents()
            .then(data => setEvents((data || []).filter(e =>
                ['approved', 'APPROVED', 'published', 'PUBLISHED'].includes(e.status)
            )))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="center-loader"><Loader2 size={28} className="spin" /> Loading events…</div>;

    return (
        <div className="step-content">
            <div className="step-heading">
                <div className="step-badge">Step 1 of 2</div>
                <h2>Select Event to View History</h2>
                <p>Choose which event's check-in/check-out history you want to view.</p>
            </div>

            {events.length === 0 && (
                <div className="empty-box">
                    <Calendar size={40} />
                    <p>No approved events found. Ask an admin to approve your events first.</p>
                </div>
            )}

            <div className="event-picker-grid">
                {events.map(ev => (
                    <button key={ev.id} className="event-pick-card" onClick={() => onSelect(ev)}>
                        {ev.image_url
                            ? <img src={getImageUrl(ev.image_url)} alt={ev.title} className="epc-img" />
                            : <div className="epc-img-placeholder"><Calendar size={32} /></div>
                        }
                        <div className="epc-body">
                            <h3>{ev.title}</h3>
                            <p className="epc-meta"><Calendar size={12} /> {fmt(ev.date_start)}</p>
                            <p className="epc-meta"><MapPin size={12} /> {ev.location}</p>
                            <div className="epc-footer">
                                <span className="epc-reg"><Users size={12} /> {ev.participants_count ?? 0} registered</span>
                                <span className="epc-go"><ArrowRight size={16} /> View History</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── Step 2: History View ───────────────────────────────────────────────────
const StepHistory = ({ event, onBack }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        api.getEventHistory(event.id)
            .then(d => setHistory(d || []))
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [event.id]);

    useEffect(() => { load(); }, [load]);

    const filtered = history.filter(h =>
        (h.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.user_email || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalCheckIns = history.filter(h => h.checked_in_at).length;
    const totalCheckOuts = history.filter(h => h.checked_out_at).length;
    const currentlyInside = history.filter(h => h.checked_in_at && !h.checked_out_at).length;

    return (
        <div className="step-content">
            {/* Event banner */}
            <div className="event-banner">
                <button className="btn-change" onClick={onBack}>
                    <ChevronLeft size={16} /> Change Event
                </button>
                <div className="banner-info">
                    <h2>{event.title}</h2>
                    <div className="banner-meta">
                        <span><Calendar size={12} /> {fmt(event.date_start)}</span>
                        <span><MapPin size={12} /> {event.location}</span>
                        <span><Users size={12} /> {history.length} total participants</span>
                    </div>
                </div>
                <div className="banner-actions">
                    <button className="btn-refresh" onClick={load} title="Refresh history">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                {[
                    { label: 'Total Check-ins', val: totalCheckIns, color: '#059669', icon: <UserCheck size={16} /> },
                    { label: 'Total Check-outs', val: totalCheckOuts, color: '#6366f1', icon: <UserX size={16} /> },
                    { label: 'Currently Inside', val: currentlyInside, color: '#f59e0b', icon: <Users size={16} /> },
                ].map(s => (
                    <div key={s.label} className="stat-pill" style={{ borderColor: s.color }}>
                        <div style={{ color: s.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {s.icon}
                            <span className="stat-val">{s.val}</span>
                        </div>
                        <span className="stat-lbl">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* History list */}
            <div className="participant-panel card">
                <div className="panel-head">
                    <Search size={16} className="panel-icon" />
                    <input
                        type="text"
                        className="panel-search"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                    <span className="panel-count">{filtered.length} shown</span>
                </div>

                {loading
                    ? <div className="center-loader"><Loader2 size={20} className="spin" /> Loading history…</div>
                    : (
                        <div className="history-list">
                            {filtered.length === 0 && <p className="empty-hint">No history found.</p>}
                            {filtered.map(h => {
                                const sm = STATUS_META[h.status] || STATUS_META.registered;
                                return (
                                    <div key={h.id} className="history-row">
                                        <div className="p-avatar">{(h.user_name || '?')[0].toUpperCase()}</div>
                                        <div className="history-info">
                                            <div className="p-name">{h.user_name}</div>
                                            <div className="p-email">{h.user_email}</div>
                                            <div className="history-timeline">
                                                {h.registered_at && (
                                                    <div className="timeline-item">
                                                        <Clock size={12} />
                                                        <span className="timeline-label">Registered:</span>
                                                        <span className="timeline-time">{fmtTime(h.registered_at)}</span>
                                                    </div>
                                                )}
                                                {h.checked_in_at && (
                                                    <div className="timeline-item checkin">
                                                        <UserCheck size={12} />
                                                        <span className="timeline-label">Checked In:</span>
                                                        <span className="timeline-time">{fmtTime(h.checked_in_at)}</span>
                                                    </div>
                                                )}
                                                {h.checked_out_at && (
                                                    <div className="timeline-item checkout">
                                                        <UserX size={12} />
                                                        <span className="timeline-label">Checked Out:</span>
                                                        <span className="timeline-time">{fmtTime(h.checked_out_at)}</span>
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
                    )
                }
            </div>
        </div>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────
const History = () => {
    const navigate = useNavigate();
    const [selectedEvent, setSelectedEvent] = useState(null);

    return (
        <div className="scanner-page">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
                <h1><HistoryIcon size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Check-In/Check-Out History</h1>
                <p className="page-sub">
                    View the complete check-in and check-out history for each participant in your events.
                </p>
            </header>

            {selectedEvent
                ? <StepHistory event={selectedEvent} onBack={() => setSelectedEvent(null)} />
                : <StepSelectEvent onSelect={setSelectedEvent} />
            }

            <style jsx>{`
                /* ── Page ── */
                .scanner-page { max-width:960px; margin:0 auto; padding: 1rem; }
                .btn-back { display:flex; align-items:center; gap:0.4rem; background:none; border:none; color:var(--text-muted); font-weight:600; cursor:pointer; margin-bottom:0.5rem; transition: color 0.2s; }
                .btn-back:hover { color:var(--primary); }
                .page-header { margin-bottom:2rem; }
                .page-header h1 { font-family:'Outfit'; font-size:2rem; display:flex; align-items:center; }
                .page-sub { color:var(--text-muted); font-size:0.9rem; margin-top:0.25rem; }

                /* ── Step ── */
                .step-content { }
                .step-heading { text-align:center; margin-bottom:2rem; }
                .step-badge { display:inline-block; background:var(--primary-light); color:var(--primary); font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:0.3rem 0.85rem; border-radius:20px; margin-bottom:0.75rem; }
                .step-heading h2 { font-family:'Outfit'; font-size:1.6rem; }
                .step-heading p { color:var(--text-muted); margin-top:0.3rem; font-size:0.9rem; }

                /* ── Event picker ── */
                .event-picker-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1.25rem; }
                .event-pick-card { background:var(--bg-card); border:1.5px solid var(--border); border-radius:var(--radius-md); overflow:hidden; cursor:pointer; text-align:left; padding:0; transition:all 0.2s; }
                .event-pick-card:hover { border-color:var(--primary); transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,0,0,0.09); }
                .epc-img { width:100%; aspect-ratio:2/1; object-fit:cover; }
                .epc-img-placeholder { width:100%; aspect-ratio:2/1; background:var(--primary-light); display:flex; align-items:center; justify-content:center; color:var(--primary); }
                .epc-body { padding:1rem 1.25rem 1.25rem; }
                .epc-body h3 { font-family:'Outfit'; font-weight:700; font-size:0.95rem; margin-bottom:0.4rem; }
                .epc-meta { display:flex; align-items:center; gap:0.35rem; font-size:0.8rem; color:var(--text-muted); margin-bottom:0.2rem; }
                .epc-footer { display:flex; align-items:center; justify-content:space-between; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--border); }
                .epc-reg { display:flex; align-items:center; gap:0.35rem; font-size:0.8rem; font-weight:600; color:var(--primary); }
                .epc-go { display:flex; align-items:center; gap:0.2rem; font-size:0.8rem; font-weight:700; color:var(--primary); }

                /* ── Banner ── */
                .event-banner { display:flex; align-items:center; gap:1rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:0.9rem 1.25rem; margin-bottom:1.5rem; }
                .btn-change { display:flex; align-items:center; gap:0.3rem; background:none; border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.4rem 0.75rem; font-size:0.82rem; font-weight:600; color:var(--text-muted); cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0; }
                .btn-change:hover { border-color:var(--primary); color:var(--primary); }
                .banner-info { flex:1; min-width:0; }
                .banner-info h2 { font-family:'Outfit'; font-size:1.05rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .banner-meta { display:flex; flex-wrap:wrap; gap:0.6rem; margin-top:0.25rem; }
                .banner-meta span { display:flex; align-items:center; gap:0.3rem; font-size:0.8rem; color:var(--text-muted); }
                .banner-actions { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; }
                .btn-refresh { background:none; border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.4rem; cursor:pointer; color:var(--text-muted); transition:all 0.2s; }
                .btn-refresh:hover { border-color:var(--primary); color:var(--primary); }

                /* ── Stats ── */
                .stats-row { display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
                .stat-pill { flex:1; min-width:140px; background:var(--bg-card); border:2px solid; border-radius:var(--radius-md); padding:0.9rem 1rem; text-align:center; }
                .stat-val { display:block; font-size:1.8rem; font-weight:800; font-family:'Outfit'; margin-bottom:0.2rem; }
                .stat-lbl { display:block; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:600; }

                /* ── Panel ── */
                .participant-panel { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; }
                .panel-head { display:flex; align-items:center; gap:0.75rem; padding:1rem 1.25rem; border-bottom:1px solid var(--border); background:var(--bg-page); }
                .panel-icon { color:var(--text-muted); }
                .panel-search { flex:1; border:none; background:none; font-size:0.9rem; outline:none; }
                .panel-count { font-size:0.8rem; font-weight:600; color:var(--text-muted); padding:0.3rem 0.75rem; background:var(--bg-card); border-radius:20px; }

                .center-loader { display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:3rem; color:var(--text-muted); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform:rotate(360deg); } }

                .empty-hint { text-align:center; padding:2rem; color:var(--text-muted); font-size:0.9rem; }
                .empty-box { text-align:center; padding:3rem 2rem; color:var(--text-muted); background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); }
                .empty-box svg { margin-bottom:1rem; opacity:0.5; }

                /* ── History List ── */
                .history-list { max-height:600px; overflow-y:auto; }
                .history-row { display:flex; align-items:flex-start; gap:1rem; padding:1.25rem; border-bottom:1px solid var(--border); transition:background 0.2s; }
                .history-row:last-child { border-bottom:none; }
                .history-row:hover { background:var(--bg-page); }
                
                .p-avatar { width:46px; height:46px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.05rem; flex-shrink:0; }
                
                .history-info { flex:1; min-width:0; }
                .p-name { font-weight:700; font-size:0.95rem; margin-bottom:0.15rem; }
                .p-email { font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem; }
                
                .history-timeline { display:flex; flex-direction:column; gap:0.5rem; }
                .timeline-item { display:flex; align-items:center; gap:0.4rem; font-size:0.82rem; color:var(--text-muted); }
                .timeline-item.checkin { color:#059669; }
                .timeline-item.checkout { color:#6366f1; }
                .timeline-label { font-weight:600; min-width:100px; }
                .timeline-time { color:var(--text); font-weight:500; }
                
                .p-status-pill { padding:0.4rem 0.9rem; border-radius:20px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; flex-shrink:0; align-self:flex-start; }

                /* Responsive */
                @media (max-width: 768px) {
                    .scanner-page { padding:0.5rem; }
                    .event-picker-grid { grid-template-columns:1fr; }
                    .stats-row { flex-direction:column; }
                    .stat-pill { min-width:100%; }
                    .history-row { flex-direction:column; }
                    .p-status-pill { align-self:flex-start; }
                    .event-banner { flex-direction:column; align-items:flex-start; }
                    .banner-actions { width:100%; justify-content:flex-end; }
                }
            `}</style>
        </div>
    );
};

export default History;
