import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Users, Calendar, CheckCircle, BarChart3, PieChart, Activity } from 'lucide-react';

const AdminAnalytics = ({ user }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.getGlobalAnalytics();
                setData(result);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="loading-state">Gathering platform insights...</div>;

    return (
        <div className="admin-analytics">
            <header className="page-header">
                <h1>Global Analytics</h1>
                <p>Overview of Evently platform performance and growth.</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card card">
                    <Users className="stat-icon" />
                    <div className="stat-info">
                        <h3>{data?.total_users || 0}</h3>
                        <span>Platform Users</span>
                    </div>
                </div>
                <div className="stat-card card">
                    <Calendar className="stat-icon" />
                    <div className="stat-info">
                        <h3>{data?.total_events || 0}</h3>
                        <span>Total Events</span>
                    </div>
                </div>
                <div className="stat-card card">
                    <CheckCircle className="stat-icon" />
                    <div className="stat-info">
                        <h3>{data?.total_registrations || 0}</h3>
                        <span>Registrations</span>
                    </div>
                </div>
            </div>

            <div className="analytics-details">
                <div className="card breakdown-card">
                    <div className="card-header">
                        <PieChart size={18} />
                        <h3>Event Status Distribution</h3>
                    </div>
                    <div className="status-bars">
                        {data?.events_by_status && Object.entries(data.events_by_status).map(([status, count]) => (
                            <div key={status} className="status-bar-item">
                                <div className="status-label">
                                    <span>{status}</span>
                                    <strong>{count}</strong>
                                </div>
                                <div className="progress-bg">
                                    <div
                                        className={`progress-fill status-${status.toLowerCase()}`}
                                        style={{ width: data.total_events > 0 ? `${(count / data.total_events) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card activity-card">
                    <div className="card-header">
                        <Activity size={18} />
                        <h3>Recent System Logs</h3>
                    </div>
                    <div className="logs-list">
                        <div className="log-item">
                            <span className="log-time">2 mins ago</span>
                            <p>New event <strong>"AI Workshop"</strong> submitted for approval.</p>
                        </div>
                        <div className="log-item">
                            <span className="log-time">15 mins ago</span>
                            <p>User <strong>john@example.com</strong> upgraded to Organizer.</p>
                        </div>
                        <div className="log-item">
                            <span className="log-time">1 hour ago</span>
                            <p>System backup completed successfully.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .page-header { margin-bottom: 2.5rem; }
        .page-header h1 { font-size: 2.25rem; font-family: 'Outfit'; margin-bottom: 0.5rem; }
        .page-header p { color: var(--text-muted); }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem; }
        .stat-card { padding: 2rem; display: flex; align-items: center; gap: 1.5rem; border: none; }
        .stat-icon { width: 48px; height: 48px; color: var(--accent); opacity: 0.8; }
        .stat-info h3 { font-size: 2rem; margin-bottom: 0.2rem; }
        .stat-info span { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }

        .analytics-details { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
        .card-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; color: var(--accent); }
        .card-header h3 { font-size: 1.1rem; color: var(--text-main); }
        
        .status-bars { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .status-bar-item { width: 100%; }
        .status-label { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
        .progress-bg { height: 8px; background: var(--bg-main); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; background: var(--accent); }
        .progress-fill.status-published { background: #10b981; }
        .progress-fill.status-pending { background: #f59e0b; }
        .progress-fill.status-rejected { background: #ef4444; }
        .progress-fill.status-draft { background: #64748b; }

        .logs-list { padding: 1.5rem 2rem; }
        .log-item { padding: 1rem 0; border-bottom: 1px solid var(--border); }
        .log-item:last-child { border-bottom: none; }
        .log-time { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 0.25rem; }
        .log-item p { font-size: 0.95rem; line-height: 1.4; }
      `}</style>
        </div>
    );
};

export default AdminAnalytics;
