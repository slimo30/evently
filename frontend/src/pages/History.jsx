import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getImageUrl } from '../api';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle, Edit, UserCheck } from 'lucide-react';
import './History.css';

const History = ({ user }) => {
  const [publishedEvents, setPublishedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, draft, past

  useEffect(() => {
    const fetchPublishedEvents = async () => {
      try {
        const events = await api.getMyEvents();
        
        // Sort by date (most recent first)
        events.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

        setPublishedEvents(events);
      } catch (err) {
        console.error('Failed to fetch published events:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPublishedEvents();
    }
  }, [user]);

  const filteredEvents = publishedEvents.filter(event => {
    const isPast = new Date(event.date) < new Date();
    if (filter === 'published') return ['APPROVED', 'PUBLISHED', 'approved', 'published'].includes(event.status);
    if (filter === 'draft') return ['PENDING', 'pending', 'draft', 'DRAFT'].includes(event.status);
    if (filter === 'past') return isPast;
    return true;
  });

  if (loading) {
    return <div className="history-loading">Loading your published events...</div>;
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>My Published Events</h1>
        <p>View all events you created and published</p>
      </div>

      {publishedEvents.length === 0 ? (
        <div className="no-history">
          <Calendar size={64} />
          <h2>No Published Events</h2>
          <p>You haven't created any events yet. Start by creating your first event!</p>
        </div>
      ) : (
        <>
          <div className="history-filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({publishedEvents.length})
            </button>
            <button
              className={filter === 'published' ? 'active' : ''}
              onClick={() => setFilter('published')}
            >
              <CheckCircle size={16} /> Published ({publishedEvents.filter(e => ['APPROVED', 'PUBLISHED', 'approved', 'published'].includes(e.status)).length})
            </button>
            <button
              className={filter === 'draft' ? 'active' : ''}
              onClick={() => setFilter('draft')}
            >
              <Edit size={16} /> Pending ({publishedEvents.filter(e => ['PENDING', 'pending', 'draft', 'DRAFT'].includes(e.status)).length})
            </button>
            <button
              className={filter === 'past' ? 'active' : ''}
              onClick={() => setFilter('past')}
            >
              <XCircle size={16} /> Past ({publishedEvents.filter(e => new Date(e.date) < new Date()).length})
            </button>
          </div>

          <div className="history-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Calendar />
              </div>
              <div className="stat-info">
                <h3>{publishedEvents.length}</h3>
                <p>Total Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <CheckCircle />
              </div>
              <div className="stat-info">
                <h3>{publishedEvents.filter(e => ['APPROVED', 'PUBLISHED', 'approved', 'published'].includes(e.status)).length}</h3>
                <p>Published</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon registered">
                <Users />
              </div>
              <div className="stat-info">
                <h3>{publishedEvents.reduce((sum, e) => sum + (e.registrations?.length || 0), 0)}</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon missed">
                <XCircle />
              </div>
              <div className="stat-info">
                <h3>{publishedEvents.filter(e => new Date(e.date) < new Date()).length}</h3>
                <p>Past Events</p>
              </div>
            </div>
          </div>

          <div className="history-events">
            {filteredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isPastEvent = eventDate < new Date();
              let statusLabel = 'Published';
              let statusClass = 'attended';

              if (['PENDING', 'pending', 'draft', 'DRAFT'].includes(event.status)) {
                statusLabel = 'Pending Approval';
                statusClass = 'registered';
              } else if (isPastEvent) {
                statusLabel = 'Completed';
                statusClass = 'missed';
              }

              return (
                <div key={event.id} className="history-event-card">
                  <div className={`attendance-badge ${statusClass}`}>
                    {statusClass === 'attended' && <CheckCircle size={16} />}
                    {statusClass === 'missed' && <XCircle size={16} />}
                    {statusClass === 'registered' && <Edit size={16} />}
                    <span>{statusLabel}</span>
                  </div>

                  {/* Inline event summary (no EventCard so we control the actions) */}
                  <div className="hec-body">
                    {event.image_url && (
                      <img src={getImageUrl(event.image_url)} alt={event.title} className="hec-thumb" />
                    )}
                    <div className="hec-info">
                      <h3 className="hec-title">{event.title}</h3>
                      <div className="hec-meta">
                        <span><Calendar size={13} /> {format(new Date(event.date_start || event.date), 'MMM dd, yyyy')}</span>
                        {event.location && <span><MapPin size={13} /> {event.location}</span>}
                        <span><Users size={13} /> {event.participants_count ?? 0} / {event.max_participants} registered</span>
                      </div>
                    </div>
                  </div>

                  <div className="registration-details">
                    <p className="registration-date">
                      <Clock size={14} />
                      Created: {format(new Date(event.created_at || event.date_start || event.date), 'MMM dd, yyyy')}
                    </p>
                    <Link
                      to={`/organizer/history/${event.id}`}
                      className="btn-view-history"
                    >
                      <UserCheck size={15} /> View Check-in History
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
