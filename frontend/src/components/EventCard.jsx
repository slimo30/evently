import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { getImageUrl } from '../api';

const EventCard = ({ event }) => {
  return (
    <div className="card event-card">
      <div className="card-image">
        <img
          src={getImageUrl(event.image_url) || `https://source.unsplash.com/featured/?${event.category},event`}
          alt={event.title}
        />
        <div className="category-badge">{event.category}</div>
      </div>

      <div className="card-body">
        <h3>{event.title}</h3>
        <p className="event-meta">
          <Calendar size={14} />
          {format(new Date(event.date_start), 'MMM d, yyyy • HH:mm')}
        </p>
        <p className="event-meta">
          <MapPin size={14} />
          {event.location}
        </p>

        <div className="card-footer">
          <div className="participants">
            <Users size={14} />
            <span>{event.participants_count || 0} / {event.max_participants}</span>
          </div>
          <Link to={`/event/${event.id}`} className="btn btn-primary btn-sm">
            Details
          </Link>
        </div>
      </div>

      <style jsx>{`
        .event-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .card-image {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 1;
          overflow: hidden;
          background: var(--bg-main);
        }
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .event-card:hover .card-image img {
          transform: scale(1.1);
        }
        .category-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--glass);
          backdrop-filter: blur(8px);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--primary);
        }
        .card-body {
          padding: 1.5rem;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .card-body h3 {
          margin-bottom: 0.75rem;
          font-size: 1.25rem;
        }
        .event-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .participants {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default EventCard;
