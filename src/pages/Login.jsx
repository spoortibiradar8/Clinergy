import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  
  const { signIn, requireAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!requireAuth) {
      navigate('/', { replace: true })
    }
  }, [requireAuth, navigate])

  useEffect(() => {
    // Inject global styles specific to the login page to meet requirements
    const style = document.createElement('style')
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700;800&display=swap');
      
      .login-container {
        font-family: 'Inter', sans-serif;
        user-select: none;
        -webkit-user-select: none;
      }
      .login-container ::selection {
        background: transparent;
      }
      /* Allow selection inside inputs */
      .login-container input {
        user-select: text;
        -webkit-user-select: text;
      }
      .login-container input::selection {
        background: rgba(74, 155, 127, 0.3);
      }
      .sora-font {
        font-family: 'Sora', sans-serif;
      }
      /* Hide accessibility widget globally while on this page */
      .accessibility-widget {
        display: none !important;
      }
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // Wiring to Google OAuth could be done here.
    setError('Google OAuth is not configured in this environment.')
  }

  return (
    <div className="login-container" style={{ display: 'flex', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      
      {/* ── LEFT PANEL ────────────────────────────────────────────── */}
      <div style={{
        width: '52%',
        background: '#2e7d32',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 64px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Radial gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Top-left Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '40px', height: '40px',
            background: '#F59E0B',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}>
            ⚡
          </div>
          <span className="sora-font" style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '0.15em'
          }}>
            CLINERGY
          </span>
        </div>

        {/* Center Copy */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', marginTop: '-40px' }}>
          <h1 className="sora-font" style={{
            fontSize: '56px',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.1,
            margin: '0 0 24px 0'
          }}>
            Intelligent energy,<br/>effortlessly managed.
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 400
          }}>
            Transform your hospital's operational efficiency with real-time monitoring, AI-driven insights, and predictive maintenance.
          </p>
        </div>

        {/* Bottom Stat Cards */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {/* Card 1 */}
            <div style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>94%</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Avg efficiency</div>
            </div>
            {/* Card 2 */}
            <div style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>12</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Active zones</div>
            </div>
            {/* Card 3 */}
            <div style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>0</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Alerts today</div>
            </div>
          </div>
          
          {/* Pagination dots */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '24px', height: '6px', borderRadius: '3px', background: 'white' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.3)' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────── */}
      <div style={{
        width: '48%',
        background: '#f6f8f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        boxSizing: 'border-box'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          <h2 className="sora-font" style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}>
            Welcome back
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
            margin: '0 0 32px 0'
          }}>
            Sign in to your Clinergy account
          </p>

          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#B91C1C',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#1e2a2e',
                  border: '2px solid transparent',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#2e7d32';
                  e.target.style.boxShadow = '0 0 0 4px rgba(46, 125, 50, 0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: '14px', fontWeight: 500, color: '#2e7d32', textDecoration: 'none' }}
                   onMouseOver={e => e.target.style.textDecoration = 'underline'}
                   onMouseOut={e => e.target.style.textDecoration = 'none'}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
                    background: '#1e2a2e',
                    border: '2px solid transparent',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#2e7d32';
                    e.target.style.boxShadow = '0 0 0 4px rgba(46, 125, 50, 0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                onClick={() => setKeepSignedIn(!keepSignedIn)}
                style={{
                  width: '18px', height: '18px',
                  border: keepSignedIn ? '2px solid #2e7d32' : '2px solid #d1d5db',
                  borderRadius: '4px',
                  background: keepSignedIn ? '#2e7d32' : 'white',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {keepSignedIn && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4.5L3.5 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span 
                onClick={() => setKeepSignedIn(!keepSignedIn)}
                style={{ fontSize: '14px', color: '#4b5563', cursor: 'pointer' }}
              >
                Keep me signed in for 30 days
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'background 0.2s, transform 0.1s',
                opacity: loading ? 0.8 : 1
              }}
              onMouseOver={e => { if (!loading) e.target.style.background = '#276b2a' }}
              onMouseOut={e => { if (!loading) e.target.style.background = '#2e7d32' }}
              onMouseDown={e => { if (!loading) e.target.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { if (!loading) e.target.style.transform = 'scale(1)' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'background 0.2s, transform 0.1s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={e => e.target.style.background = '#f9fafb'}
            onMouseOut={e => e.target.style.background = 'white'}
            onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.target.style.transform = 'scale(1)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          {/* Footer Request Access */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Don't have an account?{' '}
              <a href="#" style={{ color: '#2e7d32', fontWeight: 600, textDecoration: 'none' }}
                 onMouseOver={e => e.target.style.textDecoration = 'underline'}
                 onMouseOut={e => e.target.style.textDecoration = 'none'}>
                Request access
              </a>
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
