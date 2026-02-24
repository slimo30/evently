import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ChevronLeft, TrendingUp, Users, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const EventAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const analytics = await api.getEventAnalytics(id);
                setData(analytics);
            } catch (err) {
                console.error(err);
                alert('Failed to load analytics');
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, [id]);

    if (loading) return <div className="loading-state">Analyzing data...</div>;
    if (!data) return <div>No data found</div>;

    const checkInRate = data.total_registrations > 0
        ? Math.round((data.checked_in_count / data.total_registrations) * 100)
        : 0;

    return (
        <div className="event-analytics">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ChevronLeft size={20} /> Back
                </button>
                <div className="header-info">
                    <h1>Performance: {data.event_title}</h1>
                    <p>Post-event insights and real-time tracking</p>
                </div>
            </header>

            <div className="analytics-grid">
                <div className="card stat-card">
                    <div className="stat-icon purple"><Users size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Total Registered</span>
                        <div className="stat-value">{data.total_registrations}</div>
                        <span className="stat-sub">of {data.max_participants} capacity</span>
                    </div>
                    <div className="progress-bar-wrap">
                        <div className="progress-bar" style={{ width: `${(data.total_registrations / data.max_participants) * 100}%` }}></div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Checked-In</span>
                        <div className="stat-value">{data.checked_in_count}</div>
                        <span className="stat-sub">{checkInRate}% attendance rate</span>
                    </div>
                    <div className="progress-bar-wrap">
                        <div className="progress-bar green" style={{ width: `${checkInRate}%` }}></div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon blue"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Waitlist</span>
                        <div className="stat-value">0</div>
                        <span className="stat-sub">No users waiting</span>
                    </div>
                </div>
            </div>

            <div className="details-grid mt-4">
                <div className="card details-card">
                    <h3>Event Summary</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <Calendar size={18} />
                            <div>
                                <strong>Date</strong>
                                <span>{format(new Date(data.date_start), 'MMMM d, yyyy')}</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <Clock size={18} />
                            <div>
                                <strong>Time</strong>
                                <span>{format(new Date(data.date_start), 'HH:mm')} - {format(new Date(data.date_end), 'HH:mm')}</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <MapPin size={18} />
                            <div>
                                <strong>Venue</strong>
                                <span>{data.location}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card registrations-trend">
                    <h3>Engagement Insights</h3>
                    <div className="placeholder-chart">
                        <p>Engagement tracking is active. Real-time metrics are being collected.</p>
                        <div className="engagement-bars">
                            {[60, 85, 45, 90, 70, 55, 80].map((h, i) => (
                                <div key={i} className="engagement-bar" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .analytics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
                .stat-card { padding: 2rem; display: flex; flex-direction: column; gap: 1rem; border: none; }
                .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .stat-icon.purple { background: var(--primary-light); color: var(--primary); }
                .stat-icon.green { background: #dcfce7; color: #059669; }
                .stat-icon.blue { background: #dbeafe; color: #2563eb; }
                
                .stat-label { color: var(--text-muted); font-size: 0.9rem; font-weight: 500; }
                .stat-value { font-size: 2.25rem; font-weight: 800; color: var(--text-main); line-height: 1; }
                .stat-sub { font-size: 0.85rem; color: var(--text-muted); }
                
                .progress-bar-wrap { height: 6px; background: var(--bg-main); border-radius: 3px; overflow: hidden; }
                .progress-bar { height: 100%; background: var(--primary); border-radius: 3px; }
                .progress-bar.green { background: #059669; }
                
                .details-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; }
                .details-card, .registrations-trend { padding: 2rem; border: none; }
                h3 { margin-bottom: 2rem; font-family: 'Outfit'; }
                
                .info-rows { display: flex; flex-direction: column; gap: 1.5rem; }
                .info-row { display: flex; gap: 1rem; color: var(--text-muted); }
                .info-row strong { display: block; color: var(--text-main); font-size: 1rem; }
                .info-row span { font-size: 0.9rem; }
                
                .placeholder-chart { height: 250px; display: flex; flex-direction: column; justify-content: center; gap: 2rem; }
                .engagement-bars { display: flex; align-items: flex-end; gap: 1rem; height: 150px; }
                .engagement-bar { flex: 1; background: var(--primary-light); border-radius: 4px; transition: background 0.3s; }
                .engagement-bar:hover { background: var(--primary); }
            `}</style>
        </div>
    );
};

export default EventAnalytics;
