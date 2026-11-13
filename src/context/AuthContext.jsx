import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const REQUIRE_AUTH = import.meta.env.VITE_REQUIRE_AUTH === 'true';

// Default demo user when authentication is disabled or bypassed
const DEMO_USER = {
  id: 'demo-admin-id',
  email: 'admin@clinergy.app',
  user_metadata: {
    full_name: 'Admin',
    name: 'Admin'
  },
  role: 'admin'
};

const DEMO_SESSION = {
  user: DEMO_USER,
  access_token: 'demo-access-token'
};

// Role mapping based on email
function getRoleFromEmail(email) {
  if (!email) return 'Viewer'
  if (email.includes('admin')) return 'Admin'
  if (email.includes('energy')) return 'Energy Manager'
  if (email.includes('demo')) return 'Admin'
  return 'Viewer'
}

// Role permissions
const ROLE_PERMISSIONS = {
  'Admin': {
    canViewAll: true,
    canEditSettings: true,
    canManageUsers: true,
    canViewReports: true,
    canViewMaintenance: true,
    canAccessAdmin: true,
    label: 'Administrator',
    color: '#7c3aed'
  },
  'Energy Manager': {
    canViewAll: true,
    canEditSettings: true,
    canManageUsers: false,
    canViewReports: true,
    canViewMaintenance: true,
    canAccessAdmin: false,
    label: 'Energy Manager',
    color: '#2563eb'
  },
  'Viewer': {
    canViewAll: true,
    canEditSettings: false,
    canManageUsers: false,
    canViewReports: true,
    canViewMaintenance: false,
    canAccessAdmin: false,
    label: 'Viewer',
    color: '#16a34a'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (REQUIRE_AUTH ? null : DEMO_USER))
  const [session, setSession] = useState(() => (REQUIRE_AUTH ? null : DEMO_SESSION))
  const [loading, setLoading] = useState(REQUIRE_AUTH)
  const [role, setRole] = useState(() => (REQUIRE_AUTH ? 'Viewer' : 'Admin'))
  const [permissions, setPermissions] = useState(
    () => ROLE_PERMISSIONS[REQUIRE_AUTH ? 'Viewer' : 'Admin']
  )

  useEffect(() => {
    // If authentication is disabled, skip Supabase auth checks completely
    if (!REQUIRE_AUTH) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const userRole = getRoleFromEmail(session.user.email)
        setRole(userRole)
        setPermissions(ROLE_PERMISSIONS[userRole])
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const userRole = getRoleFromEmail(session.user.email)
          setRole(userRole)
          setPermissions(ROLE_PERMISSIONS[userRole])
        } else {
          setRole('Viewer')
          setPermissions(ROLE_PERMISSIONS['Viewer'])
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (REQUIRE_AUTH) {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } else {
      // Auth disabled: keep demo admin session
      setUser(DEMO_USER)
      setSession(DEMO_SESSION)
    }
  }

  // Fallback safe user and session
  const effectiveUser = user || (!REQUIRE_AUTH ? DEMO_USER : null)

  // Get display name from user
  const displayName = effectiveUser?.user_metadata?.full_name
    || (effectiveUser?.email
        ? effectiveUser.email.split('@')[0]
            .replace('.', ' ')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : (!REQUIRE_AUTH ? 'Admin' : 'Guest'))

  // Get initials for avatar (always "AD" in demo/unauthenticated fallback)
  const initials = !REQUIRE_AUTH
    ? 'AD'
    : (displayName.includes(' ')
        ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : (displayName.slice(0, 2).toUpperCase() || 'AD'))

  return (
    <AuthContext.Provider value={{
      user: effectiveUser,
      session: session || (!REQUIRE_AUTH ? DEMO_SESSION : null),
      loading,
      role: role || (!REQUIRE_AUTH ? 'Admin' : 'Viewer'),
      permissions: permissions || ROLE_PERMISSIONS['Admin'],
      displayName: displayName || 'Admin',
      initials: initials || 'AD',
      signIn,
      signOut,
      isAuthenticated: !REQUIRE_AUTH || !!effectiveUser,
      requireAuth: REQUIRE_AUTH
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error(
    'useAuth must be used within AuthProvider'
  )
  return ctx
}
