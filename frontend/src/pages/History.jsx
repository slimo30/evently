import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { format, isPast } from 'date-fns';
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import EventCard from '../components/EventCard';
import './History.css';

const History = ({ user }) => {
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, attended, missed

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const registrations = await api.getMyRegistrations();
        
        // Filter past events
        const past = registrations.filter(reg => {
          const eventDate = new Date(reg.event.date);
          return isPast(eventDate);
        });

        // Sort by date (most recent first)
        past.sort((a, b) => new Date(b.event.date) - new Date(a.event.date));

        setPastEvents(past);
      } catch (err) {
        console.error('Failed to fetch past events:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPastEvents();
    }
  }, [user]);

  const filteredEvents = pastEvents.filter(reg => {
    if (filter === 'attended') return reg.status === 'CHECKED_IN';
    if (filter === 'missed') return reg.status !== 'CHECKED_IN';
    return true;
  });

  if (loading) {
    return <div className="history-loading">Loading your history...</div>;
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Event History</h1>
        <p>Review your past events and attendance</p>
      </div>

      {pastEvents.length === 0 ? (
        <div className="no-history">
          <Calendar size={64} />
          <h2>No Past Events</h2>
          <p>You haven't attended any events yet. Browse upcoming events to get started!</p>
        </div>
      ) : (
        <>
          <div className="history-filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({pastEvents.length})
            </button>
            <button
              className={filter === 'attended' ? 'active' : ''}
              onClick={() => setFilter('attended')}
            >
              <CheckCircle size={16} /> Attended ({pastEvents.filter(r => r.status === 'CHECKED_IN').length})
            </button>
            <button
              className={filter === 'missed' ? 'active' : ''}
              onClick={() => setFilter('missed')}
            >
              <XCircle size={16} /> Missed ({pastEvents.filter(r => r.status !== 'CHECKED_IN').length})
            </button>
          </div>

          <div className="history-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Calendar />
              </div>
              <div className="stat-info">
                <h3>{pastEvents.length}</h3>
                <p>Total Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <CheckCircle />
              </div>
              <div className="stat-info">
                <h3>{pastEvents.filter(r => r.status === 'CHECKED_IN').length}</h3>
                <p>Attended</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon missed">
                <XCircle />
              </div>
              <div className="stat-info">
                <h3>{pastEvents.filter(r => r.status !== 'CHECKED_IN').length}</h3>
                <p>Missed</p>
              </div>
            </div>
          </div>

          <div className="history-events">
            {filteredEvents.map((registration) => (
              <div key={registration.id} className="history-event-card">
                <div className={`attendance-badge ${registration.status === 'CHECKED_IN' ? 'attended' : 'missed'}`}>
                  {registration.status === 'CHECKED_IN' ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Attended</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      <span>Missed</span>
                    </>
                  )}
                </div>
                <EventCard
                  event={registration.event}
                  user={user}
                  showActions={false}
                />
                <div className="registration-details">
                  <p className="registration-date">
                    <Clock size={14} />
                    Registered: {format(new Date(registration.created_at), 'MMM dd, yyyy')}
                  </p>
                  {registration.checked_in_at && (
                    <p className="checkin-date">
                      <CheckCircle size={14} />
                      Checked in: {format(new Date(registration.checked_in_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
