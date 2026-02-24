import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../api';
import { Calendar, MapPin, Users, Clock, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const MyEvents = ({ user }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchMyEvents();
    }, [user]);

    const fetchMyEvents = async () => {
        try {
            const data = await api.getMyEvents();
            setEvents(data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        }
        setLoading(false);
    };

    const fetchEventHistory = async (eventId) => {
        setLoadingHistory(true);
        try {
            const data = await api.getEventHistory(eventId);
            setHistory(data);
        } catch (err) {
            console.error('Failed to fetch history:', err);
            setHistory([]);
        }
        setLoadingHistory(false);
    };

    const handleViewHistory = (event) => {
        setSelectedEvent(event);
        fetchEventHistory(event.id);
    };

    const closeHistory = () => {
        setSelectedEvent(null);
        setHistory([]);
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="loader"></div>
                <p>Loading your events...</p>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="mb-4">
                <h1 className="mb-2">My Events</h1>
                <p className="text-muted">Manage and monitor your organized events</p>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-5">
                    <p className="text-muted mb-3">You haven't created any events yet.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
                        Create Your First Event
                    </button>
                </div>
            ) : (
                <div className="row g-4">
                    {events.map((event) => (
                        <div key={event.id} className="col-md-6 col-lg-4">
                            <div className="card event-card h-100">
                                <div 
                                    className="event-card-image"
                                    style={{ 
                                        backgroundImage: `url(${getImageUrl(event.image_url) || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'})`,
                                        height: '200px',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        borderRadius: '8px 8px 0 0'
                                    }}
                                />
                                <div className="card-body">
                                    <span className={`badge mb-2 ${event.status === 'APPROVED' ? 'bg-success' : event.status === 'PENDING' ? 'bg-warning' : 'bg-danger'}`}>
                                        {event.status}
                                    </span>
                                    <h5 className="card-title">{event.title}</h5>
                                    <div className="mb-2 text-muted">
                                        <small>
                                            <Calendar size={14} className="me-1" />
                                            {format(new Date(event.date), 'MMM dd, yyyy')}
                                        </small>
                                    </div>
                                    <div className="mb-2 text-muted">
                                        <small>
                                            <MapPin size={14} className="me-1" />
                                            {event.location}
                                        </small>
                                    </div>
                                    <div className="mb-3 text-muted">
                                        <small>
                                            <Users size={14} className="me-1" />
                                            {event.registered_count || 0} registered
                                        </small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-sm btn-outline-primary flex-fill"
                                            onClick={() => navigate(`/events/${event.id}`)}
                                        >
                                            View Details
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-primary flex-fill"
                                            onClick={() => handleViewHistory(event)}
                                        >
                                            View History
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History Modal */}
            {selectedEvent && (
                <div 
                    className="modal show d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={closeHistory}
                >
                    <div 
                        className="modal-dialog modal-lg modal-dialog-scrollable"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title">Check-in/Check-out History</h5>
                                    <p className="text-muted mb-0">{selectedEvent.title}</p>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={closeHistory}
                                />
                            </div>
                            <div className="modal-body">
                                {loadingHistory ? (
                                    <div className="text-center py-4">
                                        <div className="loader"></div>
                                        <p>Loading history...</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No check-in/check-out activity yet.</p>
                                    </div>
                                ) : (
                                    <div className="timeline">
                                        {history.map((record, index) => (
                                            <div key={index} className="timeline-item mb-4">
                                                <div className="d-flex align-items-start">
                                                    <div 
                                                        className={`timeline-icon rounded-circle p-2 me-3 ${
                                                            record.action === 'CHECK_IN' 
                                                                ? 'bg-success bg-opacity-10 text-success' 
                                                                : 'bg-info bg-opacity-10 text-info'
                                                        }`}
                                                        style={{ minWidth: '40px', textAlign: 'center' }}
                                                    >
                                                        {record.action === 'CHECK_IN' ? (
                                                            <ArrowDownRight size={20} />
                                                        ) : (
                                                            <ArrowUpRight size={20} />
                                                        )}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="mb-1">
                                                                    {record.user_name}
                                                                    <span 
                                                                        className={`badge ms-2 ${
                                                                            record.action === 'CHECK_IN' 
                                                                                ? 'bg-success' 
                                                                                : 'bg-info'
                                                                        }`}
                                                                    >
                                                                        {record.action === 'CHECK_IN' ? 'Checked In' : 'Checked Out'}
                                                                    </span>
                                                                </h6>
                                                                <p className="text-muted mb-1">
                                                                    <small>{record.user_email}</small>
                                                                </p>
                                                            </div>
                                                            <small className="text-muted">
                                                                <Clock size={14} className="me-1" />
                                                                {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                                            </small>
                                                        </div>
                                                        {record.notes && (
                                                            <p className="text-muted mb-0 mt-2">
                                                                <small>{record.notes}</small>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {index < history.length - 1 && (
                                                    <hr className="my-3" style={{ marginLeft: '54px' }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={closeHistory}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyEvents;
