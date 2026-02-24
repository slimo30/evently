import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../../api';
import { ShieldCheck, XCircle, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminModeration = () => {
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchPending = async () => {
        try {
            const data = await api.getPendingEvents();
            setPendingEvents(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.approveEvent(id);
            fetchPending();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        try {
            await api.rejectEvent(rejectingId, rejectReason);
            setRejectingId(null);
            setRejectReason('');
            fetchPending();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="loading-state">Loading moderation queue...</div>;

    return (
        <div className="admin-moderation">
            <header className="page-header">
                <h1>Event Moderation</h1>
                <p>Review and approve submitted events to maintain platform quality.</p>
            </header>

            <div className="moderation-queue card">
                {pendingEvents.length > 0 ? (
                    <div className="event-list">
                        {pendingEvents.map(event => (
                            <div key={event.id} className="moderation-row">
                                <div className="event-info">
                                    <img src={getImageUrl(event.image_url) || 'https://via.placeholder.com/100'} alt="" className="event-thumb" />
                                    <div>
                                        <h3>{event.title}</h3>
                                        <p className="event-meta">
                                            <span>{event.category}</span> •
                                            <span>{new Date(event.date_start).toLocaleDateString()}</span> •
                                            <span>{event.location}</span>
                                        </p>
                                        <p className="event-desc">{event.description.substring(0, 120)}...</p>
                                    </div>
                                </div>

                                <div className="moderation-actions">
                                    <Link to={`/event/${event.id}`} className="btn-secondary btn-sm" target="_blank">
                                        <Eye size={16} /> Review
                                    </Link>
                                    <button onClick={() => handleApprove(event.id)} className="btn-approve btn-sm">
                                        <CheckCircle2 size={16} /> Approve
                                    </button>
                                    <button onClick={() => setRejectingId(event.id)} className="btn-reject btn-sm">
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-queue">
                        <CheckCircle2 size={48} className="icon-success" />
                        <h3>Queue is clear!</h3>
                        <p>No events are currently awaiting moderation.</p>
                    </div>
                )}
            </div>

            {rejectingId && (
                <div className="modal-overlay">
                    <div className="card modal-content">
                        <h3>Reject Event</h3>
                        <p>Please provide a reason for rejecting this event. This will be visible to the organizer.</p>
                        <form onSubmit={handleReject}>
                            <textarea
                                required
                                placeholder="Content violates platform guidelines..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows="4"
                            ></textarea>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setRejectingId(null)} className="btn-cancel">Cancel</button>
                                <button type="submit" className="btn-reject">Reject Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-size: 2rem; }
        .page-header p { color: var(--text-muted); }

        .moderation-queue { border: none; padding: 0; }
        .moderation-row { display: flex; justify-content: space-between; align-items: center; padding: 2rem; border-bottom: 1px solid var(--border); }
        .moderation-row:last-child { border-bottom: none; }
        
        .event-info { display: flex; gap: 1.5rem; max-width: 70%; }
        .event-thumb { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; }
        .event-info h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .event-meta { font-size: 0.85rem; color: var(--accent); font-weight: 700; margin-bottom: 0.75rem; text-transform: uppercase; }
        .event-desc { color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; }

        .moderation-actions { display: flex; flex-direction: column; gap: 0.75rem; min-width: 140px; }
        .btn-sm { padding: 0.6rem 1rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        
        .btn-approve { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; font-weight: 700; }
        .btn-reject { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; font-weight: 700; }
        .btn-cancel { background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border); padding: 0.75rem 1.5rem; font-weight: 600; }

        .empty-queue { text-align: center; padding: 5rem; color: var(--text-muted); }
        .icon-success { color: #10b981; margin-bottom: 1.5rem; opacity: 0.5; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { width: 450px; padding: 2.5rem; }
        .modal-content h3 { margin-bottom: 1rem; }
        .modal-content p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
        .modal-content textarea { width: 100%; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; margin-bottom: 1.5rem; outline: none; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
      `}</style>
        </div>
    );
};

export default AdminModeration;
