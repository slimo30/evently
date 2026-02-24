import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Link } from 'react-router-dom';
import { BarChart3, Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const OrganizerDashboard = ({ user }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.getMyDashboard();
                setAnalytics(data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
    }, [user.id]);

    const events = analytics?.events || [];
    const avgFillRate = events.length > 0
        ? Math.round(events.reduce((acc, current) => acc + current.fill_rate, 0) / events.length)
        : 0;

    const countByStatus = (status) => events.filter(e => e.status === status).length;
    const getStatusPercent = (status) => events.length > 0 ? (countByStatus(status) / events.length) * 100 : 0;

    if (loading) return <div className="loading-state">Loading metrics...</div>;

    return (
        <div className="organizer-dashboard">
            <header className="dash-header">
                <h1>Welcome, {user.name}</h1>
                <p>Here's how your events are performing today.</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-icon-wrap blue">
                        <Calendar size={28} />
                    </div>
                    <div className="stat-detail">
                        <h3>{analytics?.total_events || 0}</h3>
                        <span>Total Events</span>
                    </div>
                    <TrendingUp className="trend-pos" size={16} />
                </div>

                <div className="stat-card card">
                    <div className="stat-icon-wrap purple">
                        <Users size={28} />
                    </div>
                    <div className="stat-detail">
                        <h3>{analytics?.total_registrations || 0}</h3>
                        <span>Registrations</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon-wrap pink">
                        <BarChart3 size={28} />
                    </div>
                    <div className="stat-detail">
                        <h3>{avgFillRate}%</h3>
                        <span>Avg. Fill Rate</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections">
                <section className="card section-recent">
                    <div className="section-header">
                        <h3>Performance Breakdown</h3>
                    </div>
                    <div className="breakdown-grid">
                        <div className="breakdown-item">
                            <span className="label">Published</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${getStatusPercent('PUBLISHED')}%` }}></div>
                            </div>
                            <span className="count">{countByStatus('PUBLISHED')}</span>
                        </div>
                        <div className="breakdown-item">
                            <span className="label">Pending</span>
                            <div className="progress-bar">
                                <div className="progress-fill orange" style={{ width: `${getStatusPercent('PENDING')}%` }}></div>
                            </div>
                            <span className="count">{countByStatus('PENDING')}</span>
                        </div>
                        <div className="breakdown-item">
                            <span className="label">Draft</span>
                            <div className="progress-bar">
                                <div className="progress-fill grey" style={{ width: `${getStatusPercent('DRAFT')}%` }}></div>
                            </div>
                            <span className="count">{countByStatus('DRAFT')}</span>
                        </div>
                    </div>
                </section>

                <section className="card section-guide">
                    <AlertCircle className="icon-info" />
                    <div>
                        <h3>Grow your audience</h3>
                        <p>Complete your event descriptions and add high-quality images to increase registration rates.</p>
                        <Link to="/organizer/create" className="btn-link">Create another event →</Link>
                    </div>
                </section>
            </div>

            <style jsx>{`
        .dash-header { margin-bottom: 3rem; }
        .dash-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .dash-header p { color: var(--text-muted); font-size: 1.1rem; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem; }
        .stat-card { padding: 2rem; display: flex; align-items: center; gap: 1.5rem; position: relative; }
        .stat-icon-wrap { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; }
        .stat-icon-wrap.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .stat-icon-wrap.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .stat-icon-wrap.pink { background: linear-gradient(135deg, #ec4899, #db2777); }
        
        .stat-detail h3 { font-size: 2rem; margin-bottom: 0.25rem; }
        .stat-detail span { color: var(--text-muted); font-weight: 500; font-size: 0.9rem; }
        .trend-pos { position: absolute; top: 1.5rem; right: 1.5rem; color: #10b981; }

        .dashboard-sections { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        .section-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); }
        
        .breakdown-grid { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .breakdown-item { display: flex; align-items: center; gap: 2rem; }
        .breakdown-item .label { width: 100px; font-weight: 600; font-size: 0.9rem; color: var(--text-muted); }
        .progress-bar { flex-grow: 1; height: 8px; background: var(--bg-main); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); border-radius: 4px; }
        .progress-fill.orange { background: #f59e0b; }
        .progress-fill.red { background: #ef4444; }

        .section-guide { padding: 2rem; display: flex; gap: 1.5rem; background: var(--primary-light); border: none; align-items: flex-start; }
        .icon-info { color: var(--primary); flex-shrink: 0; margin-top: 0.2rem; }
        .section-guide h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--primary); }
        .section-guide p { font-size: 0.95rem; line-height: 1.6; color: var(--text-muted); margin-bottom: 1rem; }
        .btn-link { color: var(--primary); font-weight: 700; border: none; background: none; padding: 0; }
      `}</style>
        </div>
    );
};

export default OrganizerDashboard;
