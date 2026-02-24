import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import Navbar from './components/Navbar';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import History from './pages/History';

// Layouts
import OrganizerLayout from './layouts/OrganizerLayout';
import AdminLayout from './layouts/AdminLayout';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerEvents from './pages/organizer/OrganizerEvents';
import EventCreate from './pages/organizer/EventCreate';
import EventEdit from './pages/organizer/EventEdit';
import ParticipantManager from './pages/organizer/ParticipantManager';
import Scanner from './pages/organizer/Scanner';
import EventAnalytics from './pages/organizer/EventAnalytics';

// Admin Pages
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminModeration from './pages/admin/AdminModeration';
import AdminUserManagement from './pages/admin/AdminUserManagement';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <Router>
      <div className="app">
        <Navbar user={user} setUser={setUser} />
        <main>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
            <Route path="/event/:id" element={<EventDetails user={user} />} />

            <Route
              path="/profile"
              element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />}
            />

            <Route
              path="/history"
              element={user ? <History user={user} /> : <Navigate to="/login" />}
            />

            {/* Organizer Hub */}
            <Route
              path="/organizer"
              element={user && (user.role === 'EVENT_OWNER' || user.role === 'ADMIN') ? <OrganizerLayout user={user} /> : <Navigate to="/" />}
            >
              <Route index element={<OrganizerDashboard user={user} />} />
              <Route path="events" element={<OrganizerEvents user={user} />} />
              <Route path="create" element={<EventCreate user={user} />} />
              <Route path="edit/:id" element={<EventEdit user={user} />} />
              <Route path="scan/:id" element={<ParticipantManager user={user} />} />
              <Route path="scanner" element={<Scanner user={user} />} />
              <Route path="analytics/:id" element={<EventAnalytics user={user} />} />
            </Route>

            {/* Admin Hub */}
            <Route
              path="/admin"
              element={user && user.role === 'ADMIN' ? <AdminLayout user={user} /> : <Navigate to="/" />}
            >
              <Route index element={<AdminAnalytics user={user} />} />
              <Route path="moderation" element={<AdminModeration user={user} />} />
              <Route path="users" element={<AdminUserManagement user={user} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
