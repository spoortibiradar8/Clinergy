import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, loading, permissions, requireAuth } = useAuth()

  // When auth is disabled (VITE_REQUIRE_AUTH=false), allow instant access to all routes
  if (!requireAuth) {
    return children
  }

  // Show loading while checking auth status when auth is required
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>⚡</span>
        Loading CLINERGY...
      </div>
    )
  }

  // Not logged in → go to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check specific permission if required
  if (requireRole === 'admin' && !permissions?.canAccessAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: '#64748b'
      }}>
        <span style={{ fontSize: '48px' }}>🔒</span>
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <a href="/" style={{ color: '#2563eb' }}>
          Return to Dashboard
        </a>
      </div>
    )
  }

  return children
}
