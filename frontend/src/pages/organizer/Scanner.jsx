import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api, getImageUrl } from '../../api';
import {
    ChevronLeft, CheckCircle, XCircle, Loader2, Users,
    UserCheck, UserX, Calendar, MapPin, ArrowRight,
    RefreshCw, Search, Camera, CameraOff, QrCode
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

// ─── Camera QR Scanner Component ───────────────────────────────────────────
const CameraScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const qrRef = useRef(null);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        const scannerId = 'qr-reader-cam';
        const html5Qr = new Html5Qrcode(scannerId);
        qrRef.current = html5Qr;

        const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
        };

        html5Qr.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
                // QR decoded — pass it up and stop
                onScan(decodedText.trim());
                html5Qr.stop().catch(() => { });
            },
            () => { } // ignore per-frame errors
        ).then(() => setScanning(true))
            .catch((err) => setError(`Camera error: ${err}`));

        return () => {
            if (qrRef.current) {
                qrRef.current.stop().catch(() => { });
            }
        };
    }, []);

    return (
        <div className="cam-overlay">
            <div className="cam-modal">
                <div className="cam-header">
                    <QrCode size={20} />
                    <h3>Scan Participant QR Code</h3>
                    <button className="cam-close" onClick={onClose}><XCircle size={22} /></button>
                </div>
                <p className="cam-hint">Point the camera at the QR code on the participant's ticket.</p>

                {error ? (
                    <div className="cam-error">
                        <XCircle size={28} />
                        <p>{error}</p>
                        <p className="cam-error-sub">Make sure you allow camera access in your browser.</p>
                    </div>
                ) : (
                    <div id="qr-reader-cam" className="cam-viewport" ref={scannerRef} />
                )}

                {!error && !scanning && (
                    <div className="cam-loading"><Loader2 size={20} className="spin" /> Starting camera…</div>
                )}

                <button className="btn btn-secondary cam-cancel-btn" onClick={onClose}>
                    <CameraOff size={16} /> Close Camera
                </button>
            </div>
        </div>
    );
};

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
                <h2>Select Event to Scan</h2>
                <p>Choose which event you want to manage check-ins for.</p>
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
                                <span className="epc-go"><ArrowRight size={16} /> Start Scanning</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── Step 2: Scanner ───────────────────────────────────────────────────────
const StepScanner = ({ event, onBack }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [lastResult, setLastResult] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [showCamera, setShowCamera] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.getEventParticipants(event.id)
            .then(d => setParticipants(d || []))
            .catch(() => setParticipants([]))
            .finally(() => setLoading(false));
    }, [event.id]);

    useEffect(() => { load(); }, [load]);

    // Auto-clear the toast after 4s
    useEffect(() => {
        if (!lastResult) return;
        const t = setTimeout(() => setLastResult(null), 4000);
        return () => clearTimeout(t);
    }, [lastResult]);

    const doScan = async (registrationId) => {
        try {
            const data = await api.scanRegistration(registrationId, event.id);
            const name = participants.find(p => p.id === registrationId)?.user_name || 'Participant';
            setLastResult({ success: true, name, status: data.status });
            load();
        } catch (err) {
            // Try to extract participant name even on error
            const name = participants.find(p => p.id === registrationId)?.user_name;
            setLastResult({ success: false, name, error: err.message });
        }
    };

    const handleCameraScan = async (decoded) => {
        setShowCamera(false);
        let regId = decoded.trim();

        // QR format from backend: "REG:{registration_id}"
        if (regId.startsWith('REG:')) {
            regId = regId.slice(4).trim();
        } else {
            // Fallback: extract UUID from URL or plain string
            const match = regId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (match) regId = match[0];
        }

        await doScan(regId);
    };

    const handleRowAction = async (p) => {
        if (actionLoading[p.id]) return;
        setActionLoading(prev => ({ ...prev, [p.id]: true }));
        await doScan(p.id);
        setActionLoading(prev => ({ ...prev, [p.id]: false }));
    };

    const filtered = participants.filter(p =>
        (p.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.user_email || '').toLowerCase().includes(search.toLowerCase())
    );

    const registeredCount = participants.filter(p => p.status === 'registered').length;
    const checkedInCount = participants.filter(p => p.status === 'checked_in').length;
    const checkedOutCount = participants.filter(p => p.status === 'checked_out').length;
    const cancelledCount = participants.filter(p => p.status === 'cancelled').length;
    const total = participants.filter(p => !['cancelled', 'no_show'].includes(p.status)).length;
    const fillPct = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;

    return (
        <div className="step-content">
            {/* Camera overlay */}
            {showCamera && (
                <CameraScanner
                    onScan={handleCameraScan}
                    onClose={() => setShowCamera(false)}
                />
            )}

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
                        <span><Users size={12} /> {checkedInCount}/{total} checked in</span>
                    </div>
                </div>
                <div className="banner-actions">
                    {/* 📷 SCAN QR button */}
                    <button className="btn-cam" onClick={() => setShowCamera(true)} title="Open camera to scan QR code">
                        <Camera size={16} /> Scan QR
                    </button>
                    <button className="btn-refresh" onClick={load} title="Refresh list">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="prog-wrap">
                <div className="prog-fill" style={{ width: `${fillPct}%` }} />
                <span className="prog-label">{fillPct}% checked in</span>
            </div>

            {/* Toast result */}
            {lastResult && (
                <div className={`toast-result ${lastResult.success ? 'toast-ok' : 'toast-fail'}`}>
                    {lastResult.success
                        ? <><CheckCircle size={18} /> <strong>{lastResult.name}</strong> — {lastResult.status?.replace('_', ' ')}</>
                        : <><XCircle size={18} /> {lastResult.name ? <><strong>{lastResult.name}</strong>: </> : ''}{lastResult.error}</>
                    }
                </div>
            )}

            {/* Stats */}
            <div className="stats-row">
                {[
                    { label: 'Registered', val: registeredCount, color: '#f59e0b' },
                    { label: 'Checked In', val: checkedInCount, color: '#059669' },
                    { label: 'Checked Out', val: checkedOutCount, color: '#6366f1' },
                    { label: 'Cancelled', val: cancelledCount, color: '#ef4444' },
                ].map(s => (
                    <div key={s.label} className="stat-pill" style={{ borderColor: s.color }}>
                        <span className="stat-val" style={{ color: s.color }}>{s.val}</span>
                        <span className="stat-lbl">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Participant list */}
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
                    ? <div className="center-loader"><Loader2 size={20} className="spin" /> Loading participants…</div>
                    : (
                        <div className="p-list">
                            {filtered.length === 0 && <p className="empty-hint">No participants found.</p>}
                            {filtered.map(p => {
                                const sm = STATUS_META[p.status] || STATUS_META.registered;
                                const canScan = p.status === 'registered' || p.status === 'checked_in';
                                const busy = actionLoading[p.id];
                                return (
                                    <div
                                        key={p.id}
                                        className={`p-row ${canScan ? 'p-row-clickable' : ''} ${busy ? 'p-row-busy' : ''}`}
                                        onClick={() => canScan && handleRowAction(p)}
                                        title={canScan ? (p.status === 'registered' ? 'Click to Check In' : 'Click to Check Out') : ''}
                                    >
                                        <div className="p-avatar">{(p.user_name || '?')[0].toUpperCase()}</div>
                                        <div className="p-info">
                                            <div className="p-name">{p.user_name}</div>
                                            <div className="p-email">{p.user_email}</div>
                                        </div>
                                        <div className="p-status-pill" style={{ color: sm.color, background: sm.bg }}>
                                            {sm.label}
                                        </div>
                                        {canScan && (
                                            <div className={`p-action-btn ${p.status === 'registered' ? 'checkin' : 'checkout'}`}>
                                                {busy
                                                    ? <Loader2 size={14} className="spin" />
                                                    : p.status === 'registered'
                                                        ? <><UserCheck size={14} /> Check In</>
                                                        : <><UserX size={14} /> Check Out</>
                                                }
                                            </div>
                                        )}
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
const Scanner = () => {
    const navigate = useNavigate();
    const [selectedEvent, setSelectedEvent] = useState(null);

    return (
        <div className="scanner-page">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
                <h1>Registration Scanner</h1>
                <p className="page-sub">
                    Select your event, then tap a participant <strong>or scan their QR code</strong> to check them in or out.
                </p>
            </header>

            {selectedEvent
                ? <StepScanner event={selectedEvent} onBack={() => setSelectedEvent(null)} />
                : <StepSelectEvent onSelect={setSelectedEvent} />
            }

            <style jsx>{`
                /* ── Page ── */
                .scanner-page { max-width:960px; margin:0 auto; }
                .btn-back { display:flex; align-items:center; gap:0.4rem; background:none; border:none; color:var(--text-muted); font-weight:600; cursor:pointer; margin-bottom:0.5rem; }
                .page-header { margin-bottom:2rem; }
                .page-header h1 { font-family:'Outfit'; font-size:2rem; }
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
                .event-banner { display:flex; align-items:center; gap:1rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:0.9rem 1.25rem; margin-bottom:0.75rem; }
                .btn-change { display:flex; align-items:center; gap:0.3rem; background:none; border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.4rem 0.75rem; font-size:0.82rem; font-weight:600; color:var(--text-muted); cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0; }
                .btn-change:hover { border-color:var(--primary); color:var(--primary); }
                .banner-info { flex:1; min-width:0; }
                .banner-info h2 { font-family:'Outfit'; font-size:1.05rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .banner-meta { display:flex; flex-wrap:wrap; gap:0.6rem; margin-top:0.25rem; }
                .banner-meta span { display:flex; align-items:center; gap:0.3rem; font-size:0.8rem; color:var(--text-muted); }
                .banner-actions { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; }
                .btn-cam { display:flex; align-items:center; gap:0.4rem; background:var(--primary); color:white; border:none; border-radius:var(--radius-sm); padding:0.5rem 1rem; font-size:0.85rem; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
                .btn-cam:hover { opacity:0.88; }
                .btn-refresh { background:none; border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:0.4rem; cursor:pointer; color:var(--text-muted); transition:all 0.2s; }
                .btn-refresh:hover { border-color:var(--primary); color:var(--primary); }

                /* ── Progress ── */
                .prog-wrap { position:relative; height:6px; background:var(--border); border-radius:3px; margin-bottom:0.4rem; overflow:hidden; }
                .prog-fill { height:100%; background:linear-gradient(90deg,var(--primary),#6366f1); border-radius:3px; transition:width 0.5s ease; }
                .prog-label { font-size:0.75rem; color:var(--text-muted); font-weight:600; display:block; text-align:right; margin-bottom:1rem; }

                /* ── Toast ── */
                .toast-result { display:flex; align-items:center; gap:0.6rem; padding:0.75rem 1rem; border-radius:var(--radius-sm); font-size:0.88rem; margin-bottom:1rem; animation:fadeIn 0.2s ease; }
                .toast-ok   { background:#f0fdf4; border-left:4px solid #059669; color:#065f46; }
                .toast-fail { background:#fef2f2; border-left:4px solid #ef4444; color:#991b1b; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }

                /* ── Stats ── */
                .stats-row { display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; }
                .stat-pill { flex:1; min-width:80px; background:var(--bg-card); border:1.5px solid; border-radius:var(--radius-sm); padding:0.6rem 0.75rem; text-align:center; }
                .stat-val { display:block; font-family:'Outfit'; font-size:1.4rem; font-weight:800; }
                .stat-lbl { display:block; font-size:0.72rem; color:var(--text-muted); font-weight:600; margin-top:0.1rem; }

                /* ── Participant panel ── */
                .participant-panel { padding:0; overflow:hidden; border:1px solid var(--border) !important; }
                .panel-head { display:flex; align-items:center; gap:0.6rem; padding:0.85rem 1rem; border-bottom:1px solid var(--border); background:var(--bg-main); }
                .panel-icon { color:var(--text-muted); flex-shrink:0; }
                .panel-search { flex:1; border:none; outline:none; background:transparent; font-size:0.9rem; color:var(--text-main); }
                .panel-count { font-size:0.78rem; color:var(--text-muted); white-space:nowrap; }

                /* ── Participant rows ── */
                .p-list { display:flex; flex-direction:column; max-height:520px; overflow-y:auto; }
                .p-row { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border-bottom:1px solid var(--border); transition:background 0.15s; }
                .p-row:last-child { border-bottom:none; }
                .p-row-clickable { cursor:pointer; }
                .p-row-clickable:hover { background:var(--primary-light); }
                .p-row-busy { opacity:0.6; pointer-events:none; }
                .p-avatar { width:36px; height:36px; border-radius:50%; background:var(--primary-light); color:var(--primary); font-weight:700; font-size:0.85rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
                .p-info { flex:1; min-width:0; }
                .p-name { font-weight:600; font-size:0.88rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .p-email { font-size:0.76rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .p-status-pill { font-size:0.72rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:20px; white-space:nowrap; flex-shrink:0; }
                .p-action-btn { display:flex; align-items:center; gap:0.3rem; font-size:0.78rem; font-weight:700; padding:0.35rem 0.75rem; border-radius:20px; white-space:nowrap; flex-shrink:0; }
                .p-action-btn.checkin  { background:#dcfce7; color:#059669; }
                .p-action-btn.checkout { background:#ede9fe; color:#6366f1; }

                /* ── Camera overlay ── */
                .cam-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.2s ease; }
                .cam-modal { background:var(--bg-card); border-radius:var(--radius-md); width:100%; max-width:500px; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,0.4); }
                .cam-header { display:flex; align-items:center; gap:0.6rem; padding:1rem 1.25rem; border-bottom:1px solid var(--border); }
                .cam-header h3 { font-family:'Outfit'; font-size:1rem; font-weight:700; flex:1; }
                .cam-close { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; transition:color 0.2s; }
                .cam-close:hover { color:var(--danger, #ef4444); }
                .cam-hint { font-size:0.85rem; color:var(--text-muted); text-align:center; padding:0.75rem 1.25rem 0.5rem; }
                .cam-viewport { width:100%; }
                /* Override html5-qrcode default styles */
                #qr-reader-cam { border:none !important; }
                #qr-reader-cam video { width:100% !important; border-radius:0 !important; }
                #qr-reader-cam__scan_region { border:none !important; }
                #qr-reader-cam__dashboard { display:none !important; }  
                .cam-loading { display:flex; align-items:center; justify-content:center; gap:0.5rem; color:var(--text-muted); font-size:0.85rem; padding:2rem 0; }
                .cam-error { text-align:center; padding:2rem 1.25rem; color:#ef4444; }
                .cam-error p { margin-top:0.5rem; font-size:0.9rem; }
                .cam-error-sub { font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem !important; }
                .cam-cancel-btn { width:calc(100% - 2.5rem); margin:0.75rem 1.25rem 1.25rem; display:flex; justify-content:center; gap:0.5rem; }

                /* ── Misc ── */
                .center-loader { display:flex; align-items:center; justify-content:center; gap:0.5rem; color:var(--text-muted); padding:2.5rem 0; }
                .empty-box { text-align:center; padding:3rem 1rem; color:var(--text-muted); }
                .empty-box p { margin-top:1rem; font-size:0.9rem; }
                .empty-hint { color:var(--text-muted); font-size:0.88rem; padding:1.5rem; text-align:center; }
                .spin { animation:spin 1s linear infinite; }
                @keyframes spin { to { transform:rotate(360deg); } }

                @media (max-width:600px) {
                    .event-picker-grid { grid-template-columns:1fr; }
                    .stats-row { gap:0.5rem; }
                    .stat-pill { min-width:60px; }
                    .banner-meta { gap:0.4rem; }
                    .p-email { display:none; }
                    .btn-change span { display:none; }
                }
            `}</style>
        </div>
    );
};

export default Scanner;
