import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, PlusCircle, Menu, X, ChevronRight, History } from 'lucide-react';

const OrganizerLayout = ({ user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="layout-with-sidebar">
      {/* Mobile Toggle Button */}
      <button className="sidebar-mobile-toggle" onClick={toggleSidebar}>
        {isSidebarOpen ? <X size={20} /> : <ChevronRight size={20} />}
        <span>Organizer Menu</span>
      </button>

      <aside className={`sidebar-nav card ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Organizer Hub</h3>
        </div>
        <nav className="sidebar-links">
          <NavLink to="/organizer" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/organizer/events" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Calendar size={20} />
            <span>My Events</span>
          </NavLink>
          <NavLink to="/organizer/create" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <PlusCircle size={20} />
            <span>Create Event</span>
          </NavLink>
          <NavLink to="/organizer/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <History size={20} />
            <span>Check-in History</span>
          </NavLink>
        </nav>
      </aside>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={closeSidebar}></div>

      <main className="layout-content">
        <Outlet />
      </main>

      <style jsx>{`
        .layout-with-sidebar {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: calc(100vh - 70px);
          background: var(--bg-main);
        }
        .sidebar-nav {
          height: calc(100vh - 70px);
          position: sticky;
          top: 70px;
          border-radius: 0;
          border-right: 1px solid var(--border);
          padding: 2rem 1rem;
          z-index: 50;
        }
        .sidebar-header {
          padding: 0 1rem 2rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2rem;
        }
        .sidebar-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 1rem;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-weight: 500;
          transition: all 0.2s;
        }
        .sidebar-link:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
        .sidebar-link.active {
          background: var(--primary);
          color: white;
        }
        .layout-content {
          padding: 2rem 3rem;
        }
        .sidebar-mobile-toggle {
          display: none;
        }
        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 992px) {
          .layout-with-sidebar {
            grid-template-columns: 1fr;
          }
          .sidebar-nav {
            position: fixed;
            left: 0;
            top: 70px;
            bottom: 0;
            width: 280px;
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
            background: white;
            box-shadow: var(--shadow-lg);
          }
          .sidebar-nav.open {
            transform: translateX(0);
          }
          .layout-content {
            padding: 1.5rem;
          }
          .sidebar-mobile-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: white;
            padding: 0.75rem 1.5rem;
            border-bottom: 1px solid var(--border);
            color: var(--primary);
            font-weight: 600;
            position: sticky;
            top: 70px;
            z-index: 40;
          }
          .sidebar-overlay.show {
            display: block;
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.3);
            z-index: 45;
          }
        }
      `}</style>
    </div>
  );
};

export default OrganizerLayout;
