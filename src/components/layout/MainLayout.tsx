import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useAccessibility } from '../../context/AccessibilityContext';

// Map routes to page tokens for CSS theming
const PAGE_TOKEN_MAP: Record<string, string> = {
  '/': 'home',
  '/live': 'live-monitor',
  '/zones': 'zones',
  '/maintenance': 'maintenance',
  '/reports': 'reports',
  '/ai-insights': 'ai-insights',
  '/admin/users': 'admin',
  '/settings': 'settings',
  '/alerts': 'alerts',
  '/search': 'search',
};

function getPageToken(pathname: string): string {
  if (PAGE_TOKEN_MAP[pathname]) return PAGE_TOKEN_MAP[pathname];
  const prefix = Object.keys(PAGE_TOKEN_MAP)
    .filter(k => k !== '/')
    .find(k => pathname.startsWith(k));
  return prefix ? PAGE_TOKEN_MAP[prefix] : 'default';
}

export default function MainLayout() {
  const location = useLocation();
  const pageToken = getPageToken(location.pathname);
  const { settings } = useAccessibility();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });

  const handleToggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* Backdrop overlay behind sidebar on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 99,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      {/* Sidebar - responsive display controlled by CSS and isOpen prop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleCollapse} />

      {/* Main content column */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        height: '100vh',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* Top navigation (static) */}
        <div style={{ flexShrink: 0 }}>
          <TopNav onToggleSidebar={() => setSidebarOpen(true)} />
        </div>

        {/* Scrollable area – data-page drives CSS vars */}
        <div
          id="main-scroll-area"
          data-page={pageToken}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'var(--page-bg)',
            boxSizing: 'border-box'
          }}>
          <div className="main-content-container">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}


