import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../api';
import { Calendar, MapPin, Users, Heart, Share2, ArrowLeft, CheckCircle, QrCode } from 'lucide-react';
import { format } from 'date-fns';

const EventDetails = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [registration, setRegistration] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [similarEvents, setSimilarEvents] = useState([]);

    const fetchData = async () => {
        try {
            const data = await api.getEvent(id);
            setEvent(data);

            const similar = await api.getSimilarEvents(id);
            setSimilarEvents(similar);

            if (user) {
                const registrations = await api.getMyRegistrations();
                const myReg = registrations.find(r => r.event_id === id && r.status !== 'CANCELLED');
                setIsRegistered(!!myReg);
                setRegistration(myReg);

                const { is_favorite } = await api.getIsFavorite(id);
                setIsFavorite(is_favorite);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (registration) {
            const fetchQr = async () => {
                try {
                    const blob = await api.getRegistrationQrCode(registration.id);
                    setQrCodeUrl(URL.createObjectURL(blob));
                } catch (err) {
                    console.error('Failed to fetch QR code:', err);
                }
            };
            fetchQr();
        }
    }, [registration]);

    useEffect(() => {
        fetchData();
    }, [id, user]);

    const handleRegister = async () => {
        if (!user) return navigate('/login');
        try {
            const newReg = await api.registerForEvent(id);
            setIsRegistered(true);
            setRegistration(newReg);
            setMsg({ type: 'success', text: 'You are successfully registered!' });
            fetchData();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        }
    };

    const handleToggleFavorite = async () => {
        if (!user) return navigate('/login');
        try {
            await api.toggleFavorite(id, isFavorite);
            setIsFavorite(!isFavorite);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="container py-5 text-center"><div className="loader"></div><p>Loading event details...</p></div>;
    if (!event) return <div className="container py-5 text-center"><h2>Event not found</h2><button onClick={() => navigate('/')} className="btn btn-primary mt-3">Back to Home</button></div>;

    return (
        <div className="event-details">
            <div className="event-hero" style={{ backgroundImage: `url(${getImageUrl(event.image_url) || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1600'})` }}>
                <div className="hero-overlay">
                    <div className="container">
                        <button onClick={() => navigate(-1)} className="btn-back">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="hero-content">
                            <div className="category-tag">{event.category}</div>
                            <h1>{event.title}</h1>
                            <div className="hero-meta">
                                <span><Calendar size={18} /> {format(new Date(event.date_start), 'MMMM d, yyyy • HH:mm')}</span>
                                <span><MapPin size={18} /> {event.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container content-grid">
                <div className="main-info">
                    <section className="info-section">
                        <h2>About this event</h2>
                        <p className="description">{event.description}</p>
                        <div className="tags">
                            {event.tags.map(tag => (
                                <span key={tag} className="tag">#{tag}</span>
                            ))}
                        </div>
                    </section>

                    {isRegistered && (
                        <section className="qr-section glass">
                            <div className="qr-info">
                                <h3><QrCode size={24} /> Your Entry Ticket</h3>
                                <p>Present this QR code at the entrance for check-in.</p>
                                <div className="qr-display">
                                    {qrCodeUrl ? (
                                        <div className="qr-box">
                                            <img src={qrCodeUrl} alt="Entry QR Code" />
                                            <span className="reg-id">ID: {registration.id.slice(0, 8)}</span>
                                        </div>
                                    ) : (
                                        <div className="qr-loader">Generating ticket...</div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {similarEvents.length > 0 && (
                        <section className="similar-events-section mt-5">
                            <h2>Similar Events</h2>
                            <div className="similar-grid">
                                {similarEvents.map(e => (
                                    <div key={e.id} className="similar-card card" onClick={() => navigate(`/event/${e.id}`)}>
                                        <img src={e.image_url || 'https://via.placeholder.com/150'} alt={e.title} />
                                        <div className="similar-info">
                                            <h4>{e.title}</h4>
                                            <p>{e.location} • {format(new Date(e.date_start), 'MMM d')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="sidebar">
                    <div className="action-card card">
                        <div className="price-info">
                            <span className="label">Registration</span>
                            <span className="value">Free</span>
                        </div>

                        <div className="stats">
                            <div className="stat">
                                <Users size={20} />
                                <div>
                                    <strong>{event.participants_count}</strong>
                                    <span>Joined</span>
                                </div>
                            </div>
                            <div className="stat">
                                <CheckCircle size={20} />
                                <div>
                                    <strong>{event.max_participants - event.participants_count}</strong>
                                    <span>Left</span>
                                </div>
                            </div>
                        </div>

                        {msg.text && (
                            <div className={`alert alert-${msg.type}`}>
                                {msg.text}
                            </div>
                        )}

                        {!isRegistered ? (
                            <button
                                className="btn btn-primary btn-full"
                                onClick={handleRegister}
                                disabled={event.participants_count >= event.max_participants}
                            >
                                {event.participants_count >= event.max_participants ? 'Event Full' : 'Register Now'}
                            </button>
                        ) : (
                            <div className="registered-status">
                                <CheckCircle className="icon-success" />
                                <span>You're going!</span>
                            </div>
                        )}

                        <div className="secondary-actions">
                            <button className={`btn-action ${isFavorite ? 'active' : ''}`} onClick={handleToggleFavorite}>
                                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                                {isFavorite ? 'Saved' : 'Save'}
                            </button>
                            <button className="btn-action">
                                <Share2 size={20} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .event-hero {
          height: 50vh;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .hero-overlay {
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%);
          height: 100%;
          display: flex;
          align-items: flex-end;
          padding-bottom: 4rem;
        }
        .btn-back {
          position: absolute;
          top: 2rem;
          left: 2rem;
          background: var(--glass);
          color: white;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .hero-content { color: white; }
        .hero-content h1 { font-size: 3rem; color: white; margin: 1rem 0; line-height: 1.2; }
        .hero-meta { display: flex; gap: 2rem; opacity: 0.9; flex-wrap: wrap; }
        .hero-meta span { display: flex; align-items: center; gap: 0.5rem; }
        .category-tag { background: var(--primary); padding: 0.3rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.8rem; display: inline-block; }
        
        .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 4rem; padding-top: 4rem; padding-bottom: 4rem; }
        h2 { margin-bottom: 1.5rem; }
        .description { font-size: 1.1rem; line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem; }
        .tags { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .tag { background: var(--primary-light); color: var(--primary); padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; }
        
        .qr-section { margin-top: 4rem; padding: 2rem; border-radius: var(--radius-lg); text-align: center; }
        .qr-display { margin-top: 2rem; display: flex; justify-content: center; }
        .qr-box { background: white; padding: 1.5rem; border-radius: var(--radius-md); box-shadow: var(--shadow-md); color: black; display: flex; flex-direction: column; align-items: center; }
        .reg-id { margin-top: 1rem; font-family: monospace; font-weight: 600; color: var(--text-muted); }
        
        .action-card { padding: 2rem; position: sticky; top: 100px; }
        .price-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .price-info .label { color: var(--text-muted); font-weight: 500; }
        .price-info .value { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
        .stats { display: flex; gap: 2rem; margin-bottom: 2.5rem; }
        .stat { display: flex; align-items: center; gap: 0.75rem; }
        .stat strong { display: block; font-size: 1.1rem; }
        .stat span { font-size: 0.85rem; color: var(--text-muted); }
        
        .btn-full { width: 100%; justify-content: center; padding: 1rem; font-size: 1.1rem; }
        .registered-status { display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: #ecfdf5; color: #059669; padding: 1rem; border-radius: var(--radius-sm); font-weight: 600; }
        .icon-success { color: #059669; }
        
        .secondary-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
        .btn-action { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-weight: 500; color: var(--text-muted); }
        .btn-action:hover { border-color: var(--primary); color: var(--primary); }
        .btn-action.active { color: #ef4444; border-color: #fecaca; background: #fef2f2; }
        
        .alert { padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; font-size: 0.9rem; }
        .alert-success { background: #ecfdf5; color: #059669; }
        .alert-error { background: #fef2f2; color: #ef4444; }

        .similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
        .similar-card { cursor: pointer; }
        .similar-card img { width: 100%; height: 120px; object-fit: cover; }
        .similar-info { padding: 1rem; }
        .similar-info h4 { font-size: 1rem; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .similar-info p { font-size: 0.8rem; color: var(--text-muted); }

        @media (max-width: 992px) {
          .content-grid { grid-template-columns: 1fr; gap: 2rem; }
          .sidebar { order: -1; }
          .action-card { position: static; }
          .hero-content h1 { font-size: 2.25rem; }
          .event-hero { height: 40vh; }
        }

        @media (max-width: 480px) {
          .hero-meta { gap: 1rem; }
          .hero-meta span { font-size: 0.85rem; }
          .qr-section { padding: 1.5rem; }
          .qr-box img { width: 100%; max-width: 200px; }
        }
      `}</style>
        </div>
    );
};

export default EventDetails;
