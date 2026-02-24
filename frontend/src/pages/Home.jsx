import React, { useState, useEffect } from 'react';
import { api } from '../api';
import EventCard from '../components/EventCard';
import { Search, SlidersHorizontal } from 'lucide-react';

const Home = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents({ search, category });
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    if (user) {
      api.getRecommendations().then(setRecs).catch(console.error);
    }
  }, [category, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="home">
      <section className="hero animated-gradient">
        <div className="container hero-content">
          <h1>Discover Amazing Events</h1>
          <p>Find and join the best workshops, concerts, and tech meetups in your area.</p>

          <form className="search-box glass" onSubmit={handleSearch}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search events, tags, or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </section>

      <div className="container main-content">
        <div className="filters-bar">
          <div className="filter-group">
            <button
              className={`filter-chip ${category === '' ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              All
            </button>
            {['Tech', 'Music', 'Art', 'Sports', 'Food'].map(cat => (
              <button
                key={cat}
                className={`filter-chip ${category === cat.toLowerCase() ? 'active' : ''}`}
                onClick={() => setCategory(cat.toLowerCase())}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="btn-icon">
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {user && (
          <RecommendationsSection recs={recs} />
        )}

        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : (
          <div className="event-grid">
            {events.length > 0 ? (
              events.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="no-results">
                <h3>No events found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .hero {
          padding: 8rem 0;
          text-align: center;
          color: white;
          margin-bottom: -4rem;
        }
        .hero-content h1 {
          font-size: 3.5rem;
          color: white;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }
        .hero-content p {
          font-size: 1.25rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto 3rem;
        }
        .search-box {
          max-width: 700px;
          margin: 0 auto;
          display: flex;
          padding: 0.75rem;
          border-radius: 50px;
          align-items: center;
          gap: 1rem;
        }
        .search-icon {
          margin-left: 1rem;
          color: var(--text-muted);
        }
        .search-box input {
          flex-grow: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1.1rem;
          color: var(--text-main);
        }
        .main-content {
          padding-top: 2rem;
        }
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-top: 6rem;
        }
        .filter-group {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .filter-group::-webkit-scrollbar {
          display: none;
        }
        .filter-chip {
          padding: 0.5rem 1.25rem;
          border-radius: 30px;
          background: white;
          border: 1px solid var(--border);
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .filter-chip:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .filter-chip.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .event-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }
        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 5rem 0;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .hero {
            padding: 6rem 0;
          }
          .hero-content h1 {
            font-size: 2.25rem;
          }
          .hero-content p {
            font-size: 1rem;
            padding: 0 1rem;
          }
          .search-box {
            margin: 0 1rem;
            flex-direction: column;
            border-radius: var(--radius-md);
            gap: 0.5rem;
            padding: 1rem;
          }
          .search-box input {
            width: 100%;
            text-align: center;
          }
          .search-box .btn {
            width: 100%;
            justify-content: center;
          }
          .search-icon {
            display: none;
          }
          .filters-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            padding-top: 4rem;
          }
          .filter-group {
            width: 100%;
          }
          .btn-icon {
            display: none;
          }
          .event-grid {
            grid-template-columns: 1fr;
          }
        }

        .skeleton-card {
          height: 400px;
          background: #eee;
          border-radius: var(--radius-md);
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const RecommendationsSection = ({ recs }) => {
  if (!recs || recs.length === 0) return null;
  return (
    <section className="recommendations-section">
      <div className="section-header">
        <div className="title-wrap">
          <h2>Recommended for You</h2>
          <p>Based on your interests and past registrations</p>
        </div>
      </div>
      <div className="recs-scroll-wrap">
        <div className="recs-grid">
          {recs.map(event => (
            <div key={event.id} className="rec-item">
              <EventCard event={event} compact={true} />
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .recommendations-section { margin-bottom: 4rem; }
        .section-header { margin-bottom: 1.5rem; }
        .section-header h2 { font-size: 1.75rem; font-family: 'Outfit'; }
        .section-header p { color: var(--text-muted); font-size: 0.95rem; }
        .recs-scroll-wrap { overflow-x: auto; padding-bottom: 0.5rem; }
        .recs-grid { display: flex; gap: 1.5rem; width: max-content; }
        .rec-item { width: 300px; }
      `}</style>
    </section>
  );
};

export default Home;
