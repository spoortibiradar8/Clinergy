import { useState, useEffect, useMemo } from "react";
import { Volume2, VolumeX, CheckCircle2, Menu, Search, Zap } from "lucide-react";
import { useAccessibility } from "../../context/AccessibilityContext";
import { useLanguage } from "../../context/LanguageContext";
import { SearchBar } from "@/components/SearchBar";
import { NotificationBell } from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { AlertStateBadge } from "@/components/StatusBadges";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../../hooks/useMobile";

export function TopNav({ onToggleSidebar }: { onToggleSidebar?: () => void } = {}) {
  const { settings, updateSetting } = useAccessibility();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const [totalLoad, setTotalLoad] = useState(586.1);
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalLoad(prev => +(prev * (0.98 + Math.random() * 0.04)).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const zones = useMemo(() => [
    { zone_name: 'ICU', status: 'Normal' },
    { zone_name: 'Operation Theatre', status: 'Warning' },
    { zone_name: 'Emergency', status: 'Normal' },
    { zone_name: 'Ward A', status: 'Normal' },
    { zone_name: 'Ward B', status: 'Normal' },
    { zone_name: 'Pharmacy', status: 'Normal' }
  ], []);

  // Health status logic
  const healthStatus = useMemo(() => {
    const criticalZones = zones.filter(z => z.status === 'Critical' || (z as any).alertState === 'CRITICAL');
    const warningZones = zones.filter(z => z.status === 'Warning' || (z as any).alertState === 'WARNING');
    
    if (criticalZones.length > 0) return { status: 'CRITICAL', color: '#C0392B', zones: [...criticalZones, ...warningZones] };
    if (warningZones.length > 0) return { status: 'WARNING', color: '#E67E22', zones: warningZones };
    return { status: 'NORMAL', color: '#10b981', zones: [] }; // Green for normal
  }, [zones]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        height: isMobile ? '56px' : '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E2EEF5',
        width: '100%',
        position: 'relative',
        flexShrink: 0
      }}>
        {/* Left section: breadcrumb / mobile hamburger */}
        {isMobile ? (
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: '#1A6A82',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '48px',
              minHeight: '48px'
            }}
            aria-label="Toggle Sidebar"
          >
            <Menu size={24} />
          </button>
        ) : null}

        {/* Center section: Search bar / centered Logo */}
        {isMobile ? (
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#D6EEF5',
            }}>
              <Zap className="h-3.5 w-3.5 text-[#1A6A82]" fill="#1A6A82" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 950, color: '#1A6A82', letterSpacing: '-0.025em' }}>CLINERGY</span>
          </div>
        ) : (
          <div style={{ flex: 1, maxWidth: '440px', margin: '0 24px 0 0' }}>
            <SearchBar />
          </div>
        )}

        {/* Right section: sound toggle + search toggle on mobile + bell icon + green dot + Total Load pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
          {isMobile && (
            <button
              onClick={() => setShowMobileSearch(prev => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: showMobileSearch ? '#1A6A82' : '#9DBFD3',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                minHeight: '48px'
              }}
              aria-label="Toggle Search"
            >
              <Search size={20} />
            </button>
          )}

          {/* Sound toggle */}
          {!isMobile && (
            <button
              onClick={() => updateSetting('readAloudMode', !settings.readAloudMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: settings.readAloudMode ? '#1A6A82' : '#9DBFD3',
                padding: 0
              }}
              title="Toggle Mute"
            >
              {settings.readAloudMode ? (
                <Volume2 size={18} />
              ) : (
                <VolumeX size={18} />
              )}
              <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {settings.readAloudMode ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Bell Icon */}
          <NotificationBell />

          {/* Green/Health dot */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowHealthMenu(!showHealthMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <motion.div 
                animate={healthStatus.status !== 'NORMAL' ? { scale: [1, 1.25, 1], opacity: [1, 0.7, 1] } : {}}
                transition={healthStatus.status !== 'NORMAL' ? { repeat: Infinity, duration: 2 } : {}}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: healthStatus.color,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              />
            </button>

            <AnimatePresence>
              {showHealthMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '12px',
                    width: '256px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #E2EEF5',
                    padding: '8px',
                    zIndex: 9999
                  }}
                >
                  {healthStatus.zones.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', color: '#1A6A82' }}>
                      <CheckCircle2 size={20} />
                      All systems normal ✓
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', color: '#5A7A88', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2EEF5' }}>
                        Affected Zones ({healthStatus.zones.length})
                      </div>
                      {healthStatus.zones.map(zone => (
                        <button
                          key={zone.zone_name}
                          onClick={() => {
                            navigate(`/zones?zone=${encodeURIComponent(zone.zone_name)}`);
                            setShowHealthMenu(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          className="hover:bg-[#D6EEF5]"
                        >
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1A6A82' }}>{t(zone.zone_name)}</span>
                          <AlertStateBadge state={(zone.status || (zone as any).alertState) as any} className="scale-75 origin-right" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Total Load pill - hide text on mobile to save space */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '12px',
            padding: isMobile ? '6px 10px' : '8px 16px',
            borderRadius: '12px',
            backgroundColor: '#D6EEF5',
            border: 'none',
            color: '#1A6A82'
          }}>
            {!isMobile && <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1A6A82' }}>Total Load</span>}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 900, color: '#1A6A82' }}>
                <CountUp value={totalLoad} />
              </span>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1A6A82' }}>kW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar below TopNav */}
      {isMobile && showMobileSearch && (
        <div style={{
          width: '100%',
          padding: '8px 12px',
          borderBottom: '1px solid #E2EEF5',
          backgroundColor: '#ffffff'
        }}>
          <SearchBar />
        </div>
      )}
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 600;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(startValue + progress * (endValue - startValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <>{displayValue.toFixed(1)}</>;
}

export default TopNav;
