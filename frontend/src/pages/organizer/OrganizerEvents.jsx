import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getImageUrl } from '../../api';
import { Search, Plus, MoreVertical, Edit3, Users, Trash2, TrendingUp } from 'lucide-react';

const OrganizerEvents = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const fetchEvents = async () => {
        try {
            const data = await api.getMyEvents();
            setEvents(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        try {
            await api.deleteEvent(id);
            fetchEvents();
        } catch (err) {
            alert(err.message);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [user.id]);

    const filteredEvents = events.filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All Status' || e.status === statusFilter.toUpperCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="organizer-events">
            <header className="page-header">
                <div className="header-info">
                    <h1>My Events</h1>
                    <p>You have created {events.length} events so far.</p>
                </div>
                <Link to="/organizer/create" className="btn btn-primary">
                    <Plus size={20} /> New Event
                </Link>
            </header>

            <div className="table-controls card">
                <div className="search-wrap">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search your events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-wrap">
                    <select
                        className="select-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option>All Status</option>
                        <option>Published</option>
                        <option>Pending</option>
                        <option>Draft</option>
                    </select>
                </div>
            </div>

            <div className="card events-table-wrap">
                <table className="events-table desktop-only">
                    <thead>
                        <tr>
                            <th>Event Title</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Participants</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map(event => (
                                <tr key={event.id}>
                                    <td>
                                        <div className="event-cell">
                                            <img src={getImageUrl(event.image_url) || 'https://via.placeholder.com/40'} alt="" className="event-thumb" />
                                            <div>
                                                <strong>{event.title}</strong>
                                                <span className="event-id">ID: {event.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${event.status.toLowerCase()}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td>{new Date(event.date_start).toLocaleDateString()}</td>
                                    <td>
                                        <div className="participants-stack">
                                            <strong>{event.participants_count}</strong>
                                            <span>/ {event.max_participants}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-cell">
                                            <Link to={`/organizer/analytics/${event.id}`} className="btn-icon" title="Analytics">
                                                <TrendingUp size={18} />
                                            </Link>
                                            <Link to={`/organizer/scan/${event.id}`} className="btn-icon" title="Manage Participants">
                                                <Users size={18} />
                                            </Link>
                                            <Link to={`/organizer/edit/${event.id}`} className="btn-icon" title="Edit">
                                                <Edit3 size={18} />
                                            </Link>
                                            <button onClick={() => handleDelete(event.id)} className="btn-icon danger" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="empty-row">No events found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Mobile Card List */}
                <div className="events-mobile-list mobile-only">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <div key={event.id} className="event-mobile-card">
                                <div className="event-card-header">
                                    <img src={getImageUrl(event.image_url) || 'https://via.placeholder.com/60'} alt="" className="event-thumb" />
                                    <div className="event-card-info">
                                        <h3>{event.title}</h3>
                                        <span className={`badge badge-${event.status.toLowerCase()}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="event-card-details">
                                    <div className="detail-item">
                                        <span className="label">Date:</span>
                                        <span className="value">{new Date(event.date_start).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Participants:</span>
                                        <span className="value">{event.participants_count} / {event.max_participants}</span>
                                    </div>
                                </div>
                                <div className="event-card-actions">
                                    <Link to={`/organizer/analytics/${event.id}`} className="btn-card-action">
                                        <TrendingUp size={16} /> Analytics
                                    </Link>
                                    <Link to={`/organizer/scan/${event.id}`} className="btn-card-action">
                                        <Users size={16} /> Scan
                                    </Link>
                                    <Link to={`/organizer/edit/${event.id}`} className="btn-card-action">
                                        <Edit3 size={16} /> Edit
                                    </Link>
                                    <button onClick={() => handleDelete(event.id)} className="btn-card-action danger">
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-row">No events found matching your criteria.</div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .page-header h1 { font-size: 2rem; }
        .page-header p { color: var(--text-muted); }

        .table-controls { padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border: none; }
        .search-wrap { display: flex; align-items: center; gap: 0.75rem; flex-grow: 1; max-width: 400px; }
        .search-wrap input { border: none; outline: none; width: 100%; font-size: 1rem; background: transparent; }
        .search-icon { color: var(--text-muted); }
        .select-input { border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: var(--radius-sm); color: var(--text-muted); outline: none; background: white; }

        .events-table-wrap { border: none; background: transparent; box-shadow: none; }
        .events-table { width: 100%; border-collapse: collapse; text-align: left; background: white; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
        th { padding: 1.25rem 2rem; background: var(--bg-main); font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em; }
        td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); vertical-align: middle; }

        .event-cell { display: flex; align-items: center; gap: 1rem; }
        .event-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
        .event-id { display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }

        .badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .badge-published { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef9c3; color: #854d0e; }
        .badge-draft { background: #f1f5f9; color: #475569; }

        .participants-stack strong { font-size: 1.1rem; }
        .participants-stack span { font-size: 0.85rem; color: var(--text-muted); margin-left: 0.2rem; }

        .action-cell { display: flex; gap: 0.5rem; }
        .btn-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 8px; color: var(--text-muted); transition: all 0.2s; }
        .btn-icon:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
        .btn-icon.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

        .empty-row { text-align: center; padding: 5rem; color: var(--text-muted); font-size: 1rem; }

        .mobile-only { display: none; }

        @media (max-width: 992px) {
          .table-controls { flex-direction: column; gap: 1rem; align-items: stretch; padding: 1.5rem; }
          .search-wrap { max-width: none; }
          .desktop-only { display: none; }
          .mobile-only { display: block; }
          
          .events-mobile-list { display: flex; flex-direction: column; gap: 1rem; }
          .event-mobile-card { background: white; border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-sm); }
          .event-card-header { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
          .event-card-header .event-thumb { width: 60px; height: 60px; }
          .event-card-info h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
          
          .event-card-details { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; padding: 1rem; background: var(--bg-main); border-radius: var(--radius-sm); }
          .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
          .detail-item .label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
          .detail-item .value { font-size: 0.9rem; font-weight: 600; }

          .event-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
          .btn-card-action { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
          .btn-card-action:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
          .btn-card-action.danger { color: #ef4444; }
          .btn-card-action.danger:hover { background: #fee2e2; border-color: #fca5a5; }

          .page-header { flex-direction: column; gap: 1.5rem; align-items: flex-start; }
          .page-header .btn { width: 100%; justify-content: center; }
        }

        @media (max-width: 480px) {
          .event-card-actions { grid-template-columns: 1fr; }
          .event-card-details { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
};

export default OrganizerEvents;
