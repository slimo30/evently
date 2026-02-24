import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ChevronLeft, Search, CheckCircle2, LogOut, User, Mail, ShieldAlert } from 'lucide-react';

const ParticipantManager = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [participants, setParticipants] = useState([]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        try {
            const eventData = await api.getEvent(id);
            setEvent(eventData);

            const data = await api.getEventParticipants(id);
            setParticipants(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAction = async (regId, action) => {
        try {
            if (action === 'check-in') {
                await api.checkIn(regId);
            } else {
                await api.checkOut(regId);
            }
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredParticipants = participants.filter(p =>
        p.user_name.toLowerCase().includes(search.toLowerCase()) ||
        p.user_email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="loading-state">Syncing participants...</div>;

    return (
        <div className="participant-manager">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ChevronLeft size={20} /> Back
                </button>
                <div className="header-title">
                    <h1>{event?.title}</h1>
                    <p>Manage {participants.length} participants</p>
                </div>
            </header>

            <div className="status-summary card">
                <div className="status-stat">
                    <User size={20} />
                    <div>
                        <strong>{participants.length}</strong>
                        <span>Registered</span>
                    </div>
                </div>
                <div className="status-stat green">
                    <CheckCircle2 size={20} />
                    <div>
                        <strong>{participants.filter(p => p.status === 'CHECKED_IN').length}</strong>
                        <span>Present</span>
                    </div>
                </div>
                <div className="status-stat grey">
                    <LogOut size={20} />
                    <div>
                        <strong>{participants.filter(p => p.status === 'CHECKED_OUT').length}</strong>
                        <span>Left</span>
                    </div>
                </div>
            </div>

            <div className="list-controls card">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card participants-card">
                <div className="participants-list">
                    {filteredParticipants.length > 0 ? (
                        filteredParticipants.map(p => (
                            <div key={p.id} className="participant-row">
                                <div className="p-info">
                                    <div className="p-avatar">{p.user_name[0]}</div>
                                    <div>
                                        <h4>{p.user_name}</h4>
                                        <span className="p-email">{p.user_email}</span>
                                    </div>
                                </div>

                                <div className="p-status">
                                    <span className={`badge-status ${p.status.toLowerCase()}`}>
                                        {p.status}
                                    </span>
                                </div>

                                <div className="p-actions">
                                    {p.status === 'REGISTERED' && (
                                        <button onClick={() => handleAction(p.id, 'check-in')} className="btn-action check-in">
                                            <CheckCircle2 size={16} /> Check-in
                                        </button>
                                    )}
                                    {p.status === 'CHECKED_IN' && (
                                        <button onClick={() => handleAction(p.id, 'check-out')} className="btn-action check-out">
                                            <LogOut size={16} /> Check-out
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-list">No participants matched your search.</div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .page-header { display: flex; align-items: flex-start; gap: 1.5rem; margin-bottom: 2rem; }
        .header-title h1 { font-size: 2rem; color: var(--text-main); }
        .header-title p { color: var(--text-muted); }

        .status-summary { display: grid; grid-template-columns: repeat(3, 1fr); padding: 1.5rem 2rem; border: none; margin-bottom: 2rem; }
        .status-stat { display: flex; align-items: center; gap: 1rem; }
        .status-stat strong { display: block; font-size: 1.5rem; }
        .status-stat span { color: var(--text-muted); font-size: 0.85rem; }
        .status-stat.green { color: #059669; }
        .status-stat.grey { color: #64748b; }

        .list-controls { padding: 1rem 2rem; border: none; margin-bottom: 1.5rem; }
        .search-box { display: flex; align-items: center; gap: 1rem; color: var(--text-muted); }
        .search-box input { flex-grow: 1; border: none; outline: none; font-size: 1rem; background: transparent; }

        .participants-card { border: none; padding: 0.5rem 0; }
        .participant-row { display: grid; grid-template-columns: 2fr 1fr 1fr; align-items: center; padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); transition: background 0.2s; }
        .participant-row:last-child { border-bottom: none; }
        .participant-row:hover { background: var(--bg-main); }

        .p-info { display: flex; align-items: center; gap: 1rem; }
        .p-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .p-info h4 { font-size: 1rem; margin-bottom: 0.1rem; }
        .p-email { font-size: 0.8rem; color: var(--text-muted); }

        .badge-status { font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; text-transform: uppercase; }
        .registered { background: #dcfce7; color: #166534; }
        .checked_in { background: #3b82f6; color: white; }
        .checked_out { background: #f1f5f9; color: #475569; }

        .p-actions { display: flex; justify-content: flex-end; }
        .btn-action { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.85rem; }
        .check-in { background: #3b82f6; color: white; }
        .check-out { border: 1px solid var(--border); color: var(--text-muted); }
        
        .empty-list { text-align: center; padding: 4rem; color: var(--text-muted); }
      `}</style>
        </div>
    );
};

export default ParticipantManager;
