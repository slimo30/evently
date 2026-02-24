import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getImageUrl } from '../../api';
import {
    ChevronLeft, Loader2, Users, Calendar, MapPin,
    RefreshCw, Search, Clock, UserCheck, UserX,
    History as HistoryIcon, Download, ChevronDown, Activity, Settings
} from 'lucide-react';

// ── Status metadata ────────────────────────────────────────────────────────
const STATUS_META = {
    REGISTERED: { label: 'Registered', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
    CHECKED_IN: { label: 'Checked In', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
    CHECKED_OUT: { label: 'Checked Out', color: '#6366f1', bg: '#e0e7ff', border: '#a5b4fc' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
    NO_SHOW: { label: 'No Show', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
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
        h.registered_at ? fmtTime(h.registered_at) : '',
        h.checked_in_at ? fmtTime(h.checked_in_at) : '',
        h.checked_out_at ? fmtTime(h.checked_out_at) : '',
        h.cancelled_at ? fmtTime(h.cancelled_at) : '',
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
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(autoOpen);
    const [search, setSearch] = useState('');
    const [activeFilter, setFilter] = useState('ALL');
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.getEventHistory(event.id)
            .then(d => { setHistory(d || []); setLoaded(true); })
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [event.id]);

    useEffect(() => {
        if (autoOpen && !loaded) load();
    }, [autoOpen, loaded, load]);

    const toggle = () => {
        if (!expanded && !loaded) load();
        setExpanded(v => !v);
    };

    const filtered = history
        .filter(h => activeFilter === 'ALL' || h.status === activeFilter)
        .filter(h =>
            (h.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (h.user_email || '').toLowerCase().includes(search.toLowerCase())
        );

    const checkins = history.filter(h => h.checked_in_at).length;
    const checkouts = history.filter(h => h.checked_out_at).length;
    const insideNow = history.filter(h => h.checked_in_at && !h.checked_out_at).length;
    const cancelled = history.filter(h => h.status === 'CANCELLED').length;
    const noShow = history.filter(h => h.status === 'NO_SHOW').length;

    return (
        <div className={`premium-panel ${expanded ? 'is-expanded' : ''}`}>
            {/* Header */}
            <button className="panel-header" onClick={toggle}>
                <div className="header-left">
                    <div className="thumb-wrap">
                        {event.image_url ? (
                            <img src={getImageUrl(event.image_url)} alt={event.title} className="event-thumb" />
                        ) : (
                            <div className="thumb-placeholder"><Calendar size={20} /></div>
                        )}
                        <div className="status-dot"></div>
                    </div>

                    <div className="header-info">
                        <h3 className="event-title">{event.title}</h3>
                        <div className="event-meta">
                            <span className="meta-item"><Calendar size={12} /> {fmt(event.date_start)}</span>
                            <span className="meta-dot">•</span>
                            <span className="meta-item"><MapPin size={12} /> {event.location}</span>
                            <span className="meta-dot">•</span>
                            <span className="meta-item"><Users size={12} /> {event.participants_count ?? 0} Registered</span>
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    {loaded && !loading && (
                        <div className="quick-stats fade-in">
                            <div className="q-stat checkins">
                                <UserCheck size={14} /> <span>{checkins} In</span>
                            </div>
                            <div className="q-stat inside pulse">
                                <Activity size={14} /> <span>{insideNow} Live</span>
                            </div>
                        </div>
                    )}
                    <div className={`chevron-wrap ${expanded ? 'rotated' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </div>
            </button>

            {/* Expandable Body */}
            <div className="panel-body-wrapper" style={{ height: expanded ? 'auto' : 0 }}>
                <div className="panel-body">
                    {loading && (
                        <div className="loading-state">
                            <Loader2 size={24} className="spin" />
                            <p>Loading real-time data...</p>
                        </div>
                    )}

                    {!loading && loaded && (
                        <div className="content-fade-in">
                            {/* Stat Cards */}
                            <div className="metrics-grid">
                                {[
                                    { label: 'Total In', val: checkins, icon: <UserCheck size={18} />, grad: 'from-emerald-400 to-teal-500' },
                                    { label: 'Departed', val: checkouts, icon: <UserX size={18} />, grad: 'from-indigo-400 to-blue-500' },
                                    { label: 'Live Inside', val: insideNow, icon: <Activity size={18} />, grad: 'from-amber-400 to-orange-500', pulse: true },
                                    { label: 'Cancelled', val: cancelled, icon: <Settings size={18} />, grad: 'from-rose-400 to-red-500' },
                                ].map((m, idx) => (
                                    <div key={m.label} className="metric-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className={`metric-icon-box bg-gradient-${m.grad} ${m.pulse ? 'pulse-shadow' : ''}`}>
                                            {m.icon}
                                        </div>
                                        <div className="metric-data">
                                            <h4>{m.val}</h4>
                                            <p>{m.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Toolbar (Filters + Actions) */}
                            <div className="premium-toolbar">
                                <div className="filter-group">
                                    {ALL_FILTERS.map((f, idx) => {
                                        const meta = STATUS_META[f];
                                        const count = f === 'ALL' ? history.length : history.filter(h => h.status === f).length;
                                        const isActive = activeFilter === f;
                                        return (
                                            <button
                                                key={f}
                                                className={`filter-btn ${isActive ? 'active' : ''}`}
                                                style={isActive && meta ? {
                                                    backgroundColor: meta.bg,
                                                    borderColor: meta.border,
                                                    color: meta.color
                                                } : {}}
                                                onClick={() => setFilter(f)}
                                            >
                                                {meta ? meta.label : 'Overview'}
                                                <span className="f-count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="action-group">
                                    <div className="search-pill">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search attendees..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <button className="icon-btn tooltip" data-tip="Export CSV" onClick={() => exportCSV(filtered, event.title)}>
                                        <Download size={16} />
                                    </button>
                                    <button className="icon-btn tooltip" data-tip="Refresh Data" onClick={load}>
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* History Feed */}
                            <div className="feed-container">
                                {filtered.length === 0 ? (
                                    <div className="empty-feed">
                                        <div className="empty-icon"><Users size={32} /></div>
                                        <p>No attendees found matching these filters.</p>
                                    </div>
                                ) : (
                                    <div className="feed-list">
                                        {filtered.map((h, i) => {
                                            const sm = STATUS_META[h.status] || STATUS_META.REGISTERED;
                                            return (
                                                <div
                                                    key={h.id}
                                                    className="feed-card"
                                                    style={{ animationDelay: `${i * 0.03}s` }}
                                                >
                                                    <div className="avatar-col">
                                                        {h.user_profile_image ? (
                                                            <img src={getImageUrl(h.user_profile_image)} alt="" className="user-avatar" />
                                                        ) : (
                                                            <div className="avatar-placeholder-sm bg-gradient-from-indigo-400">
                                                                {(h.user_name || 'U')[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="info-col">
                                                        <div className="user-identity">
                                                            <h5>{h.user_name}</h5>
                                                            <span>{h.user_email}</span>
                                                        </div>
                                                        <div className="events-timeline">
                                                            {h.registered_at && (
                                                                <div className="timeline-dot reg">
                                                                    <span className="dot"></span>
                                                                    <span className="tt">{fmtTime(h.registered_at)}</span>
                                                                </div>
                                                            )}
                                                            {h.checked_in_at && (
                                                                <div className="timeline-dot in">
                                                                    <div className="line"></div>
                                                                    <span className="dot"></span>
                                                                    <span className="tt">{fmtTime(h.checked_in_at)}</span>
                                                                </div>
                                                            )}
                                                            {h.checked_out_at && (
                                                                <div className="timeline-dot out">
                                                                    <div className="line"></div>
                                                                    <span className="dot"></span>
                                                                    <span className="tt">{fmtTime(h.checked_out_at)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="status-col">
                                                        <div
                                                            className="premium-badge"
                                                            style={{ color: sm.color, backgroundColor: sm.bg, border: `1px solid ${sm.border}` }}
                                                        >
                                                            <div className="badge-dot" style={{ backgroundColor: sm.color }}></div>
                                                            {sm.label}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────
const History = () => {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.getMyEvents()
            .then(data => setEvents(data || []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (eventId && !loading) {
            setTimeout(() => {
                const el = document.getElementById(`panel-${eventId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [eventId, loading]);

    const filtered = events.filter(e =>
        (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="premium-history-page">
            <header className="page-hero">
                <button className="nav-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={18} /> <span>Back</span>
                </button>
                <div className="hero-content">
                    <div className="hero-titles">
                        <div className="hero-icon-box"><HistoryIcon size={28} /></div>
                        <div>
                            <h1>Live Operations Log</h1>
                            <p>Monitor real-time check-ins, departures, and active attendees.</p>
                        </div>
                    </div>
                    <div className="global-search glass-pill">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Find an event..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="panels-container">
                {loading ? (
                    <div className="global-loader">
                        <Loader2 size={32} className="spin" />
                        <p>Syncing operations data...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="global-empty">
                        <div className="hero-icon-box lg"><Calendar size={48} /></div>
                        <h2>No Events Found</h2>
                        <p>We couldn't find any events matching your search.</p>
                    </div>
                ) : (
                    <div className="staggered-list">
                        {filtered.map((ev, i) => (
                            <div
                                key={ev.id}
                                id={`panel-${ev.id}`}
                                className="stagger-item"
                                style={{ animationDelay: `${i * 0.08}s` }}
                            >
                                <EventHistoryPanel event={ev} autoOpen={ev.id === eventId} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                /* ── Design Tokens & Base ── */
                :root {
                    --bg-gradient: linear-gradient(140deg, #f8fafc 0%, #f1f5f9 100%);
                    --panel-bg: rgba(255, 255, 255, 0.7);
                    --glass-border: rgba(255, 255, 255, 0.5);
                    --primary-teal: #0d9488;
                    --primary-indigo: #4f46e5;
                    --shadow-soft: 0 10px 40px -10px rgba(0,0,0,0.05);
                    --shadow-hover: 0 20px 40px -15px rgba(79, 70, 229, 0.15);
                    --radius-xl: 20px;
                    --radius-lg: 16px;
                }

                .premium-history-page {
                    min-height: 100vh;
                    background: var(--bg-gradient);
                    padding: 2rem;
                    font-family: 'Inter', sans-serif;
                }

                /* ── Animations ── */
                @keyframes slideDownFader {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUpFader {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                .fade-in { animation: slideDownFader 0.4s ease forwards; }
                .content-fade-in { animation: slideDownFader 0.5s ease forwards; }
                .stagger-item { opacity: 0; animation: slideUpFader 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .pulse-shadow { animation: pulse-ring 2s infinite; }

                /* ── Gradients ── */
                .bg-gradient-from-emerald-400 { background: linear-gradient(135deg, #34d399, #14b8a6); color: white; }
                .bg-gradient-from-indigo-400 { background: linear-gradient(135deg, #818cf8, #3b82f6); color: white; }
                .bg-gradient-from-amber-400 { background: linear-gradient(135deg, #fbbf24, #f97316); color: white; }
                .bg-gradient-from-rose-400 { background: linear-gradient(135deg, #fb7185, #ef4444); color: white; }

                /* ── Hero Header ── */
                .page-hero { max-width: 1080px; margin: 0 auto 3rem; }
                .nav-back { display: inline-flex; align-items: center; gap: 0.5rem; background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; padding: 0.5rem 0; margin-bottom: 1rem; transition: color 0.2s; }
                .nav-back:hover { color: var(--primary-indigo); }
                
                .hero-content { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; }
                .hero-titles { display: flex; align-items: center; gap: 1.25rem; }
                .hero-icon-box { width: 56px; height: 56px; border-radius: 16px; background: white; display: flex; align-items: center; justify-content: center; color: var(--primary-indigo); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .hero-icon-box.lg { width: 80px; height: 80px; margin: 0 auto 1.5rem; color: #94a3b8; }
                .hero-titles h1 { font-family: 'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem 0; letter-spacing: -0.02em; }
                .hero-titles p { color: #64748b; margin: 0; font-size: 1rem; }

                .glass-pill { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); padding: 0.75rem 1.25rem; border-radius: 30px; box-shadow: var(--shadow-soft); transition: all 0.3s; }
                .glass-pill:focus-within { background: white; border-color: var(--primary-indigo); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
                .glass-pill input { border: none; background: transparent; outline: none; width: 220px; font-size: 0.95rem; color: #334155; }
                .glass-pill input::placeholder { color: #94a3b8; }

                /* ── Layout ── */
                .panels-container { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
                
                /* ── Premium Panel ── */
                .premium-panel { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: var(--radius-xl); box-shadow: var(--shadow-soft); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; position: relative; }
                .premium-panel:hover { box-shadow: var(--shadow-hover); transform: translateY(-2px); border-color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.85); }
                .premium-panel.is-expanded { border-color: var(--primary-indigo); box-shadow: var(--shadow-hover); background: white; transform: translateY(0); }

                /* Header */
                .panel-header { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background: transparent; border: none; cursor: pointer; text-align: left; transition: background 0.3s; }
                .header-left { display: flex; align-items: center; gap: 1.25rem; flex: 1; min-width: 0; }
                
                .thumb-wrap { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
                .event-thumb, .thumb-placeholder { width: 100%; height: 100%; border-radius: 14px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
                .thumb-placeholder { background: linear-gradient(135deg, #e2e8f0, #cbd5e1); display: flex; align-items: center; justify-content: center; color: #64748b; }
                .status-dot { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%; background: #10b981; border: 2.5px solid white; }

                .header-info { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
                .event-title { font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #1e293b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .event-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; color: #64748b; font-size: 0.85rem; font-weight: 500; }
                .meta-item { display: flex; align-items: center; gap: 0.25rem; }
                .meta-dot { font-size: 0.5rem; opacity: 0.6; }

                .header-right { display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0; }
                .quick-stats { display: flex; gap: 1rem; }
                .q-stat { display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 20px; }
                .q-stat.checkins { background: #d1fae5; color: #059669; }
                .q-stat.inside { background: #fef3c7; color: #d97706; }
                
                .chevron-wrap { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; color: #64748b; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                .premium-panel:hover .chevron-wrap { background: #e2e8f0; color: #1e293b; }
                .chevron-wrap.rotated { transform: rotate(-180deg); background: var(--primary-indigo); color: white; }

                /* Body */
                .panel-body-wrapper { overflow: hidden; transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .panel-body { padding: 0 1.5rem 1.5rem 1.5rem; border-top: 1px solid #f1f5f9; margin-top: 0.5rem; padding-top: 1.5rem; }

                /* Metrics Grid */
                .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
                .metric-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-lg); opacity: 0; animation: slideUpFader 0.5s ease forwards; transition: transform 0.2s; }
                .metric-card:hover { transform: translateY(-2px); border-color: #cbd5e1; }
                .metric-icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .metric-data h4 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.15rem 0; line-height: 1; }
                .metric-data p { margin: 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }

                /* Toolbar */
                .premium-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
                .filter-group { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
                .filter-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 20px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
                .filter-btn:hover { border-color: #cbd5e1; color: #1e293b; background: #f8fafc; }
                .filter-btn.active { box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .f-count { padding: 0.1rem 0.4rem; background: rgba(0,0,0,0.06); border-radius: 10px; font-size: 0.7rem; }

                .action-group { display: flex; align-items: center; gap: 0.75rem; }
                .search-pill { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 1rem; border-radius: 20px; background: #f1f5f9; border: 1px solid transparent; transition: all 0.2s; }
                .search-pill:focus-within { background: white; border-color: var(--primary-indigo); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
                .search-pill input { border: none; background: transparent; outline: none; font-size: 0.85rem; width: 180px; }
                
                .icon-btn { width: 34px; height: 34px; border-radius: 10px; background: white; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
                .icon-btn:hover { background: #f8fafc; color: var(--primary-indigo); border-color: #cbd5e1; }

                /* Feed List */
                .feed-container { border: 1px solid #e2e8f0; border-radius: var(--radius-lg); overflow: hidden; background: white; max-height: 480px; overflow-y: auto; }
                .feed-list { display: flex; flex-direction: column; }
                .feed-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; opacity: 0; animation: slideUpFader 0.4s forwards; }
                .feed-card:hover { background: #f8fafc; }
                .feed-card:last-child { border-bottom: none; }

                .avatar-col { flex-shrink: 0; }
                .user-avatar, .avatar-placeholder-sm { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
                .avatar-placeholder-sm { display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700; font-family: 'Outfit'; }

                .info-col { flex: 1; min-width: 0; display: flex; justify-content: space-between; align-items: center; gap: 2rem; }
                .user-identity h5 { margin: 0 0 0.25rem 0; font-weight: 700; font-size: 1rem; color: #0f172a; }
                .user-identity span { color: #64748b; font-size: 0.85rem; }

                .events-timeline { display: flex; align-items: center; gap: 1rem; }
                .timeline-dot { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; color: #64748b; position: relative; }
                .timeline-dot .dot { width: 8px; height: 8px; border-radius: 50%; z-index: 2; }
                .timeline-dot .tt { background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 6px; }
                .timeline-dot.reg .dot { background: #94a3b8; }
                .timeline-dot.in .dot { background: #10b981; }
                .timeline-dot.out .dot { background: #6366f1; }
                
                .status-col { flex-shrink: 0; }
                .premium-badge { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .badge-dot { width: 6px; height: 6px; border-radius: 50%; }

                /* Generic States */
                .loading-state { padding: 4rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #64748b; }
                .global-loader { padding: 6rem; text-align: center; color: var(--primary-indigo); display: flex; flex-direction: column; align-items: center; gap: 1rem; font-size: 1.1rem; font-weight: 500; }
                .empty-feed { padding: 4rem 2rem; text-align: center; color: #64748b; }
                .empty-icon { width: 64px; height: 64px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #94a3b8; }
                .global-empty { text-align: center; padding: 6rem 2rem; }
                .global-empty h2 { font-family: 'Outfit'; color: #0f172a; margin-bottom: 0.5rem; }
                .global-empty p { color: #64748b; }

                /* ── Responsive breakpoints ── */
                @media (max-width: 1024px) {
                    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .premium-history-page { padding: 1rem; }
                    .hero-content { flex-direction: column; align-items: flex-start; }
                    .glass-pill { width: 100%; }
                    .glass-pill input { width: 100%; }
                    .header-left { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
                    .header-right { display: none; }
                    .info-col { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
                    .premium-toolbar { flex-direction: column; align-items: stretch; }
                    .action-group { justify-content: space-between; }
                    .search-pill { flex: 1; }
                }
            `}</style>
        </div>
    );
};

export default History;
