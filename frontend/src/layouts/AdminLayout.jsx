import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, ShieldCheck, Users, Menu, X, ChevronRight } from 'lucide-react';

const AdminLayout = ({ user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="layout-with-sidebar">
      {/* Mobile Toggle Button */}
      <button className="sidebar-mobile-toggle" onClick={toggleSidebar}>
        {isSidebarOpen ? <X size={20} /> : <ChevronRight size={20} />}
        <span>Admin Menu</span>
      </button>

      <aside className={`sidebar-nav card ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Admin Panel</h3>
        </div>
        <nav className="sidebar-links">
          <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <BarChart3 size={20} />
            <span>Global Analytics</span>
          </NavLink>
          <NavLink to="/admin/moderation" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <ShieldCheck size={20} />
            <span>Event Moderation</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Users size={20} />
            <span>User Insights</span>
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
          background: var(--accent);
          color: white;
          opacity: 0.8;
        }
        .sidebar-link.active {
          background: var(--accent);
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
            color: var(--accent);
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

export default AdminLayout;
