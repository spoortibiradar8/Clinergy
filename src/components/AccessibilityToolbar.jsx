import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAccessibility } from '../context/AccessibilityContext'
import { 
  X, RotateCcw, Monitor, Type, MousePointer2, Volume2, 
  Eye, Move, Baseline, Focus, MousePointer, Mic, Bell, Info
} from 'lucide-react'
import { useVoiceCommands } from '../hooks/useVoiceCommands'

export default function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('display')
  const { settings, updateSetting, resetAll, speak } = useAccessibility()
  const { startVoice, stopVoice } = useVoiceCommands()

  const location = useLocation()
  const panelRef = useRef(null)

  useEffect(() => {
    const handleToggle = () => setIsOpen(o => !o);
    document.addEventListener('toggleA11yToolbar', handleToggle);
    return () => document.removeEventListener('toggleA11yToolbar', handleToggle);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (location.pathname === '/login') return null;

  const tabs = [
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'text',    label: 'Text',    icon: Type },
    { id: 'motor',   label: 'Motor',   icon: MousePointer2 },
    { id: 'audio',   label: 'Audio',   icon: Volume2 },
  ];

  return (
    <>
      <style>{`
        .a11y-panel {
          background: #FDFAF4 !important; /* Warm Ivory */
          border: 1px solid rgba(220, 180, 140, 0.4) !important;
          color: #3a2010 !important;
        }
        .a11y-header {
          background: #4A9B7F !important;
          color: white !important;
        }
        .a11y-tab-active {
          background: rgba(74, 155, 127, 0.1) !important;
          border-bottom: 2px solid #4A9B7F !important;
          color: #4A9B7F !important;
        }
        .a11y-tab-inactive {
          color: #7a6050 !important;
        }
        .a11y-section-title {
          color: #3a2010 !important;
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .a11y-description {
          color: #7a6050 !important;
          font-size: 11px;
        }
        .a11y-toggle-bg {
          background: #dcb48c !important; /* Warm tan */
        }
        .a11y-toggle-active {
          background: #4A9B7F !important;
        }
        .a11y-select {
          background: white !important;
          border: 1px solid rgba(220, 180, 140, 0.4) !important;
          color: #3a2010 !important;
        }
        .a11y-button-opt {
          background: white !important;
          border: 2px solid rgba(220, 180, 140, 0.2) !important;
          color: #7a6050 !important;
        }
        .a11y-button-active {
          border-color: #4A9B7F !important;
          background: rgba(74, 155, 127, 0.05) !important;
          color: #4A9B7F !important;
        }
        .a11y-info-box {
          background: rgba(74, 155, 127, 0.05) !important;
          border: 1px solid rgba(74, 155, 127, 0.2) !important;
          color: #2a6b62 !important;
        }
      `}</style>

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open accessibility options"
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '104px',
          zIndex: 9998,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#4A9B7F',
          color: 'white',
          border: '3px solid white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Eye className="w-6 h-6" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility Options"
          aria-modal="true"
          className="a11y-panel"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '104px',
            zIndex: 9999,
            borderRadius: '16px',
            width: '340px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(58, 32, 16, 0.15)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div className="a11y-header" style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
                Accessibility
              </div>
              <div style={{ opacity: 0.8, fontSize: '11px', fontWeight: 500, marginTop: '2px' }}>
                Refine your visual experience
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab navigation */}
          <div style={{
            display: 'flex',
            background: 'rgba(220, 180, 140, 0.05)',
            borderBottom: '1px solid rgba(220, 180, 140, 0.1)',
          }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={isActive ? 'a11y-tab-active' : 'a11y-tab-inactive'}
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: '24px 20px', flex: 1 }}>

            {/* DISPLAY TAB */}
            {activeTab === 'display' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ToggleRow
                  label="High Contrast"
                  description="Optimized for clarity"
                  icon={Eye}
                  value={settings.highContrast}
                  onChange={v => updateSetting('highContrast', v)}
                />

                <ToggleRow
                  label="Simple View"
                  description="Focus on essential content"
                  icon={Monitor}
                  value={settings.simpleView}
                  onChange={v => updateSetting('simpleView', v)}
                />

                <div>
                  <div className="a11y-section-title">
                    <Monitor className="w-4 h-4" /> Color Vision Mode
                  </div>
                  <select
                    value={settings.colorBlindMode}
                    onChange={e => updateSetting('colorBlindMode', e.target.value)}
                    className="a11y-select"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="none">Standard Vision</option>
                    <option value="protanopia">Protanopia</option>
                    <option value="deuteranopia">Deuteranopia</option>
                    <option value="tritanopia">Tritanopia</option>
                  </select>
                </div>

                <ToggleRow
                  label="Reduce Motion"
                  description="Minimize animations"
                  icon={Move}
                  value={settings.reduceMotion}
                  onChange={v => updateSetting('reduceMotion', v)}
                />
              </div>
            )}

            {/* TEXT TAB */}
            {activeTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div className="a11y-section-title">
                    <Type className="w-4 h-4" /> Text Size
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { value: 'small', label: 'Small', size: '12px' },
                      { value: 'normal', label: 'Mid', size: '14px' },
                      { value: 'large', label: 'Large', size: '16px' },
                      { value: 'xlarge', label: 'Max', size: '18px' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateSetting('fontSize', opt.value)}
                        className={`a11y-button-opt ${settings.fontSize === opt.value ? 'a11y-button-active' : ''}`}
                        style={{
                          flex: 1,
                          padding: '12px 0',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <ToggleRow
                  label="Dyslexia Font"
                  description="Easier reading structure"
                  icon={Baseline}
                  value={settings.dyslexiaFont}
                  onChange={v => updateSetting('dyslexiaFont', v)}
                />

                <div>
                  <div className="a11y-section-title">
                    <Baseline className="w-4 h-4" /> Line Spacing
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['normal', 'relaxed', 'loose'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => updateSetting('lineSpacing', opt)}
                        className={`a11y-button-opt ${settings.lineSpacing === opt ? 'a11y-button-active' : ''}`}
                        style={{
                          flex: 1,
                          padding: '10px 0',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <ToggleRow
                  label="Enhanced Focus"
                  description="Clearer element highlights"
                  icon={Focus}
                  value={settings.focusHighlight}
                  onChange={v => updateSetting('focusHighlight', v)}
                />
              </div>
            )}

            {/* MOTOR TAB */}
            {activeTab === 'motor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div className="a11y-section-title">
                    <MousePointer className="w-4 h-4" /> Cursor Size
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['normal', 'large', 'xlarge'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => updateSetting('cursorSize', opt)}
                        className={`a11y-button-opt ${settings.cursorSize === opt ? 'a11y-button-active' : ''}`}
                        style={{
                          flex: 1,
                          padding: '12px 0',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="a11y-info-box" style={{
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info className="w-4 h-4" /> Shortcuts
                  </div>
                  Tab • Navigate elements<br/>
                  Enter • Activate buttons<br/>
                  Esc • Close panels<br/>
                  ⌘K • Quick Search
                </div>
              </div>
            )}

            {/* AUDIO TAB */}
            {activeTab === 'audio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ToggleRow
                  label="Read Aloud"
                  description="Audio assistance on tap"
                  icon={Volume2}
                  value={settings.readAloudMode}
                  onChange={v => updateSetting('readAloudMode', v)}
                />

                {settings.readAloudMode && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      speak("Read aloud is active. Click any element to hear it.");
                    }}
                    className="text-[10px] font-bold text-[#4A9B7F] hover:underline text-left pl-[48px]"
                  >
                    Click to test speech
                  </button>
                )}

                <ToggleRow
                  label="Voice Controls"
                  description="Navigate using speech"
                  icon={Mic}
                  value={settings.voiceCommands}
                  onChange={v => {
                    if (v) startVoice()
                    else stopVoice()
                  }}
                />

                {settings.voiceCommands && (
                  <div className="a11y-info-box" style={{
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '11px',
                    lineHeight: '1.8',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>Available Commands:</div>
                    "Go to Home" • "Go to Reports"<br/>
                    "Read alerts" • "Open search"
                  </div>
                )}

                <ToggleRow
                  label="Sound Alerts"
                  description="Audible critical signals"
                  icon={Bell}
                  value={settings.soundAlerts || false}
                  onChange={v => updateSetting('soundAlerts', v)}
                />
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(220, 180, 140, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(220, 180, 140, 0.05)',
          }}>
            <span style={{ fontSize: '11px', color: '#7a6050', fontWeight: 500 }}>
              WCAG 2.1 AA Certified
            </span>
            <button
              onClick={resetAll}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(220, 180, 140, 0.3)',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#3a2010',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fcf9f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <RotateCcw className="w-3 h-3 inline mr-1.5" />
              Reset
            </button>
          </div>

        </div>
      )}
    </>
  )
}

function ToggleRow({ label, description, icon: Icon, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'white',
          border: '1px solid rgba(220, 180, 140, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4A9B7F',
        }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="a11y-section-title" style={{ marginBottom: 0 }}>
            {label}
          </div>
          <div className="a11y-description">
            {description}
          </div>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          background: value ? '#4A9B7F' : '#dcb48c',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }} />
      </button>
    </div>
  )
}
