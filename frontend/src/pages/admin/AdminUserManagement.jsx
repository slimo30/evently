import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Users, UserCheck, Shield, Award, Loader2 } from 'lucide-react';

const AdminUserManagement = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    });

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await api.getGlobalAnalytics();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch user stats', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.adminCreateUser(formData);
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', role: 'USER' });
            fetchStats();
            alert('User created successfully!');
        } catch (err) {
            alert(err.message);
        }
        setCreating(false);
    };

    if (loading && !stats) {
        return (
            <div className="flex-center p-20">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="mt-4 text-muted">Loading user insights...</p>
            </div>
        );
    }

    const { role_distribution = {} } = stats || {};

    return (
        <div className="admin-users">
            <header className="page-header flex-between">
                <div className="header-info">
                    <h1>User Insights</h1>
                    <p>Monitor platform community and user role distribution.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Users size={18} />
                    <span>Create New User</span>
                </button>
            </header>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content card slide-up" onClick={e => e.stopPropagation()}>
                        <h2>Create New User</h2>
                        <form onSubmit={handleSubmit} className="mt-4">
                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Password (min 8 chars)</label>
                                <input
                                    type="password"
                                    required
                                    minLength="8"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="USER">Standard User</option>
                                    <option value="EVENT_OWNER">Organizer</option>
                                    <option value="ADMIN">Administrator</option>
                                </select>
                            </div>
                            <div className="modal-actions mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? <Loader2 className="animate-spin" size={18} /> : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="role-distribution grid-3">
                <div className="card role-card">
                    <UserCheck size={32} className="role-icon blue" />
                    <div className="role-details">
                        <h3>Basic Users</h3>
                        <p>{role_distribution.USER || 0} Members</p>
                        <span className="role-trend">Active participants</span>
                    </div>
                </div>
                <div className="card role-card">
                    <Award size={32} className="role-icon purple" />
                    <div className="role-details">
                        <h3>Organizers</h3>
                        <p>{role_distribution.EVENT_OWNER || 0} Creators</p>
                        <span className="role-trend">Event managers</span>
                    </div>
                </div>
                <div className="card role-card">
                    <Shield size={32} className="role-icon accent" />
                    <div className="role-details">
                        <h3>Moderators</h3>
                        <p>{role_distribution.ADMIN || 0} Admins</p>
                        <span className="role-trend">Platform security</span>
                    </div>
                </div>
            </div>

            <div className="user-activity card">
                <div className="card-header">
                    <h3>Top Performing Events</h3>
                </div>
                <div className="activity-table">
                    <div className="table-header">
                        <span>Event Title</span>
                        <span>Registrations</span>
                        <span>Owner</span>
                        <span>Performance</span>
                    </div>
                    {stats?.top_events?.length > 0 ? (
                        stats.top_events.map(event => (
                            <div key={event.id} className="table-row">
                                <div className="user-brief">
                                    <div className="avatar">{event.title[0]}</div>
                                    <div>
                                        <strong>{event.title}</strong>
                                        <span>{event.category}</span>
                                    </div>
                                </div>
                                <span>{event.total_registrations}</span>
                                <span>{event.organizer_name}</span>
                                <span className="rank-badge">
                                    {Math.round((event.total_registrations / event.max_participants) * 100)}% Fill
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-muted">No high-performing events data yet.</div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .admin-users { padding: 1rem; }
        .page-header { margin-bottom: 2.5rem; }
        .role-distribution { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem; }
        .role-card { padding: 2rem; display: flex; gap: 1.5rem; align-items: start; border: none; box-shadow: var(--shadow-sm); }
        .role-icon { padding: 8px; border-radius: 12px; }
        .role-icon.blue { background: #e0f2fe; color: #0369a1; }
        .role-icon.purple { background: #f5f3ff; color: #6d28d9; }
        .role-icon.accent { background: var(--accent-light); color: var(--accent); }
        
        .role-details h3 { font-size: 1.1rem; margin-bottom: 0.25rem; font-weight: 700; }
        .role-details p { font-size: 1.4rem; color: var(--text-main); font-weight: 800; }
        .role-trend { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 0.5rem; display: block; }

        .page-header.flex-between { display: flex; justify-content: space-between; align-items: center; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-content { width: 100%; max-width: 450px; padding: 2.5rem; border: none; }
        .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; }
        
        .slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .user-activity { border: none; padding: 0; box-shadow: var(--shadow-md); overflow: hidden; }
        .card-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); background: #f8fafc; }
        .card-header h3 { font-weight: 700; color: #1e293b; }
        .activity-table { width: 100%; }
        .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 1rem 2rem; background: var(--bg-main); font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); align-items: center; }
        .table-row:last-child { border-bottom: none; }
        
        .user-brief { display: flex; align-items: center; gap: 1rem; }
        .avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; }
        .user-brief strong { display: block; font-size: 1rem; color: #334155; }
        .user-brief span { font-size: 0.8rem; color: var(--text-muted); }
        
        .rank-badge { background: #dcfce7; color: #166534; padding: 0.4rem 0.75rem; border-radius: 20px; font-weight: 700; font-size: 0.8rem; width: fit-content; }
        .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
      `}</style>
        </div>
    );
};

export default AdminUserManagement;
