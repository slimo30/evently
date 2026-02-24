import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getImageUrl } from '../api';
import { User, Mail, Shield, CheckCircle, Clock, MapPin, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import EventCard from '../components/EventCard';
import ImageCropper from '../components/ImageCropper';

const Profile = ({ user, setUser }) => {
    if (!user) return null;
    const [registrations, setRegistrations] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [activeTab, setActiveTab] = useState('registrations');
    const [name, setName] = useState(user.name);
    const [isUpdating, setIsUpdating] = useState(false);
    const [msg, setMsg] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    const fetchData = async () => {
        try {
            const regs = await api.getMyRegistrations();
            setRegistrations(regs.filter(r => r.status !== 'CANCELLED'));
            const favs = await api.getFavorites();
            setFavorites(favs);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const updated = await api.updateProfile({ name });
            setUser(updated);
            setMsg('Profile updated successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            console.error(err);
        }
        setIsUpdating(false);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob) => {
        setShowCropper(false);
        try {
            const updated = await api.uploadProfileImage(croppedBlob);
            setUser(updated);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCancelRegistration = async (eventId) => {
        if (!window.confirm('Are you sure you want to cancel your registration for this event?')) return;
        try {
            await api.cancelRegistration(eventId);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="container py-5">
            <div className="profile-layout">
                <aside className="profile-sidebar">
                    <div className="card profile-header-card">
                        <div className="user-avatar-wrap">
                            <div className="user-avatar">
                                {user.profile_image ? (
                                    <img src={`http://localhost:8000/${user.profile_image}`} alt={user.name} />
                                ) : (
                                    <div className="avatar-placeholder">{user.name[0]}</div>
                                )}
                            </div>
                            <label className="avatar-edit">
                                <Edit3 size={14} />
                                <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
                            </label>
                        </div>
                        <h2>{user.name}</h2>
                        <div className="role-badge">{user.role}</div>

                        <form onSubmit={handleUpdateProfile} className="profile-form">
                            <div className="input-group">
                                <label>Display Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={isUpdating}>
                                {isUpdating ? 'Saving...' : 'Update Profile'}
                            </button>
                            {msg && <p className="success-msg">{msg}</p>}
                        </form>

                        <div className="info-list">
                            <div className="info-item">
                                <Mail size={16} />
                                <span>{user.email}</span>
                            </div>
                            <div className="info-item">
                                <Shield size={16} />
                                <span>Member since {new Date(user.created_at).getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="profile-main">
                    <div className="tabs">
                        <button className={`tab ${activeTab === 'registrations' ? 'active' : ''}`} onClick={() => setActiveTab('registrations')}>
                            My Registrations ({registrations.length})
                        </button>
                        <button className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
                            Favorites ({favorites.length})
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'registrations' && (
                            <div className="registrations-list">
                                {registrations.length > 0 ? (
                                    registrations.map(reg => (
                                        <div key={reg.id} className="registration-item card">
                                            <div className="reg-event-meta">
                                                <img src={getImageUrl(reg.event?.image_url) || 'https://via.placeholder.com/60'} alt="" className="reg-thumb" />
                                                <div className="reg-info">
                                                    <h3>{reg.event?.title || 'Loading Event...'}</h3>
                                                    <div className="reg-meta">
                                                        <Clock size={14} /> Registered on {format(new Date(reg.registered_at), 'MMM d, yyyy')}
                                                    </div>
                                                    <div className="reg-location">
                                                        <MapPin size={12} /> {reg.event?.location}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="reg-action-wrap">
                                                <Link to={`/event/${reg.event_id}`} className="btn-ticket">View Ticket</Link>
                                                <button
                                                    onClick={() => handleCancelRegistration(reg.event_id)}
                                                    className="btn-link danger"
                                                    style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                                                >
                                                    Cancel Registration
                                                </button>
                                                <div className={`reg-status status-${reg.status.toLowerCase()}`}>
                                                    {reg.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <p>No registrations yet. Explore events to get started!</p>
                                        <Link to="/" className="btn btn-primary">Discover Events</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div className="favorites-grid">
                                {favorites.length > 0 ? (
                                    favorites.map(fav => (
                                        <EventCard key={fav.id} event={fav.event} />
                                    ))
                                ) : (
                                    <p className="empty-state">No favorite events yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {showCropper && (
                        <ImageCropper
                            image={selectedImage}
                            circular={true}
                            aspect={1}
                            onCropComplete={handleCropComplete}
                            onCancel={() => setShowCropper(false)}
                        />
                    )}
                </main>
            </div>

            <style jsx>{`
        .profile-layout { display: grid; grid-template-columns: 350px 1fr; gap: 3rem; }
        .profile-header-card { padding: 2.5rem; text-align: center; }
        .user-avatar { width: 100px; height: 100px; margin: 0 auto 1.5rem; border-radius: 50%; overflow: hidden; background: var(--primary-light); position: relative; }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--primary); font-family: 'Outfit'; font-weight: 700; }
        
        .user-avatar-wrap { position: relative; margin: 0 auto 1.5rem; width: fit-content; }
        .avatar-edit { position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid white; transition: transform 0.2s; }
        .avatar-edit:hover { transform: scale(1.1); }

        .role-badge { display: inline-block; padding: 0.2rem 0.75rem; background: var(--primary-light); color: var(--primary); border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-bottom: 2rem; }
        
        .profile-form { margin-bottom: 2rem; text-align: left; }
        .success-msg { color: #059669; font-size: 0.85rem; margin-top: 0.5rem; text-align: center; }
        
        .info-list { border-top: 1px solid var(--border); padding-top: 1.5rem; text-align: left; }
        .info-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--text-muted); font-size: 0.9rem; }
        
        .tabs { display: flex; gap: 2rem; border-bottom: 1px solid var(--border); margin-bottom: 2.5rem; overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
        .tabs::-webkit-scrollbar { display: none; }
        .tab { padding: 1rem 0.5rem; font-weight: 600; color: var(--text-muted); border-bottom: 3px solid transparent; white-space: nowrap; }
        .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        
        .registrations-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .registration-item { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border: none; }
        .reg-event-meta { display: flex; gap: 1.5rem; align-items: center; }
        .reg-thumb { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
        .reg-info h3 { font-size: 1.1rem; margin-bottom: 0.25rem; font-family: 'Outfit'; }
        .reg-meta, .reg-location { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--text-muted); }
        .reg-location { margin-top: 0.25rem; }
        
        .reg-action-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; }
        .btn-ticket { font-size: 0.85rem; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 0.5rem 1rem; border-radius: 6px; }
        .reg-status { font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; text-transform: uppercase; }
        .status-registered { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        
        .favorites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .empty-state { text-align: center; padding: 4rem; color: var(--text-muted); grid-column: 1 / -1; }

        @media (max-width: 992px) {
          .profile-layout { grid-template-columns: 1fr; gap: 2rem; }
          .profile-sidebar { max-width: 500px; margin: 0 auto; width: 100%; }
        }

        @media (max-width: 600px) {
          .registration-item { flex-direction: column; align-items: flex-start; gap: 1.5rem; padding: 1.25rem; }
          .reg-event-meta { width: 100%; }
          .reg-info h3 { font-size: 1rem; }
          .reg-action-wrap { width: 100%; flex-direction: column; align-items: stretch; border-top: 1px solid var(--border); padding-top: 1.25rem; gap: 1rem; }
          .btn-ticket { text-align: center; width: 100%; padding: 0.75rem; }
          .btn-link.danger { text-align: center; width: 100%; margin-top: 0; padding: 0.5rem; border: 1px solid #fee2e2; border-radius: 6px; }
          .reg-status { align-self: center; order: -1; margin-bottom: 0.5rem; }
        }

        @media (max-width: 400px) {
          .reg-event-meta { flex-direction: column; text-align: center; }
          .reg-thumb { width: 100px; height: 100px; margin: 0 auto; }
          .reg-meta, .reg-location { justify-content: center; }
        }
      `}</style>
        </div>
    );
};

export default Profile;
