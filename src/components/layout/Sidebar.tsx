import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, LayoutGrid, BarChart2, BrainCircuit, Settings,
  ActivitySquare, Wrench, Users, Zap, LogOut,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useReadAloud } from "@/hooks/useReadAloud";
import { useLanguage } from "../../context/LanguageContext";

const navItems = [
  { label: "Home",             href: "/",            icon: Home,           key: 'nav.home',        theme: { bg: "#D6EEF5", icon: "#5BB8D4", text: "#1A6A82" } },
  { label: "Live Monitor",     href: "/live",         icon: ActivitySquare, key: 'nav.live',        theme: { bg: "#C8F0E8", icon: "#3DBFA0", text: "#0D6B56" } },
  { label: "Zones",            href: "/zones",        icon: LayoutGrid,     key: 'nav.zones',       theme: { bg: "#F5ECD6", icon: "#D4A85A", text: "#7A5A1A" } },
  { label: "Maintenance",      href: "/maintenance",  icon: Wrench,         key: 'nav.maintenance',  theme: { bg: "#F5E0CC", icon: "#D4845A", text: "#7A3E1A" } },
  { label: "Reports",          href: "/reports",      icon: BarChart2,      key: 'nav.reports',     theme: { bg: "#CCE8F5", icon: "#5A9FD4", text: "#1A507A" } },
  { label: "AI Insights",      href: "/ai-insights",  icon: BrainCircuit,   key: 'nav.ai_insights', theme: { bg: "#D8EEFF", icon: "#6AB4F0", text: "#1A5888" } },
  { label: "Admin Portal",     href: "/admin/users",  icon: Users,          key: 'nav.admin',       theme: { bg: "#F5E8D0", icon: "#C4986A", text: "#6B4820" } },
  { label: "Settings",         href: "/settings",     icon: Settings,       key: 'nav.settings',    theme: { bg: "#D4F0E8", icon: "#4ABFA8", text: "#0D6858" } },
];

export function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse
}: {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
} = {}) {
  const location = useLocation();
  const { displayName, role, initials, permissions, signOut, requireAuth } = useAuth();
  const { speak } = useReadAloud();
  const { t } = useLanguage();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: 0, width: '100%', boxSizing: 'border-box' }}>
      {navItems.map((item) => {
        if (item.key === "nav.admin" && !permissions?.canAccessAdmin) {
          return null;
        }
        
        const isActive =
          item.href === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.href);
            
        const Icon = item.icon;
        const isHovered = hoveredItem === item.href;
        
        // Colors & Backgrounds
        const cardBg = isActive 
          ? item.theme.bg 
          : isHovered 
            ? `${item.theme.bg}A5` 
            : `${item.theme.bg}38`; // ~22% opacity for subtle elegant background
            
        const cardBorder = isActive 
          ? `${item.theme.icon}A0` 
          : isHovered 
            ? `${item.theme.icon}50` 
            : 'transparent';

        const textColor = item.theme.text;
            
        return (
          <Link
            key={item.href}
            to={item.href}
            title={collapsed ? item.label : undefined}
            onClick={(e) => {
              e.stopPropagation();
              speak(`Navigating to ${item.label}`);
              if (onNavigate) onNavigate();
            }}
            onMouseEnter={() => setHoveredItem(item.href)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : '12px',
              padding: collapsed ? '8px' : '8px 12px',
              margin: '2px 0',
              borderRadius: '16px',
              textDecoration: 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: cardBg,
              border: `1.5px solid ${cardBorder}`,
              boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none',
              width: '100%',
              boxSizing: 'border-box',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            {/* Colored Icon Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              flexShrink: 0,
              transition: 'transform 0.25s ease',
              transform: isHovered ? 'scale(1.08)' : 'scale(1)'
            }}>
              <Icon size={16} style={{ color: item.theme.icon, strokeWidth: isActive ? 2.5 : 2 }} />
            </div>

            {/* Deep Tonal Text */}
            {!collapsed && (
              <span style={{
                fontSize: '13.5px',
                fontWeight: isActive ? 800 : 600,
                color: textColor,
                letterSpacing: '-0.01em',
                transition: 'transform 0.2s ease',
                transform: isHovered && !isActive ? 'translateX(2px)' : 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  const UserProfile = () => (
    <div style={{
      padding: collapsed ? '10px 4px' : '14px',
      margin: '16px 0 8px 0',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #E2EEF5',
      boxShadow: 'var(--shadow-pastel)',
      marginTop: 'auto',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div 
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '14px',
            border: '2px solid #ffffff',
            backgroundColor: '#1A6A82',
            flexShrink: 0
          }}
        >
          {initials || 'AD'}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1A6A82', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{displayName || 'Admin'}</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#5A7A88', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{role || 'Admin'}</div>
            </div>
            {requireAuth && (
              <button
                onClick={() => signOut()}
                title="Sign out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5A7A88',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div 
      style={{
        width: collapsed ? '72px' : '260px',
        minWidth: collapsed ? '72px' : '260px',
        maxWidth: collapsed ? '72px' : '260px',
        height: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '20px 8px 12px 8px' : '20px 12px 12px 12px',
        boxSizing: 'border-box',
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
        transition: 'width 250ms ease, min-width 250ms ease, max-width 250ms ease, padding 250ms ease'
      }}
      className={`border-r border-[#E2EEF5] sidebar-container ${isOpen ? 'open' : ''}`}
    >
      {/* Close × Button - visible only on mobile/tablet (<1024px) */}
      <button 
        onClick={onClose}
        className="lg:hidden"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1A6A82',
          cursor: 'pointer',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 101,
          minWidth: '40px',
          minHeight: '40px'
        }}
        aria-label="Close Sidebar"
      >
        ×
      </button>

      {/* Collapse/Expand Toggle - desktop only (>=1024px) */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex"
        style={{
          position: 'absolute',
          top: '26px',
          right: '-16px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: '1.5px solid #E2EEF5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 102,
          transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
          padding: 0,
          color: '#1A6A82',
        }}
        aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed
          ? <ChevronRight size={18} />
          : <ChevronLeft size={18} />
        }
      </button>

      {/* Logo Section */}
      <div style={{ padding: '0 0 20px 0', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : '12px',
          backgroundColor: '#ffffff',
          padding: collapsed ? '8px' : '8px 14px',
          borderRadius: '100px',
          border: '1px solid #E2EEF5',
          boxShadow: 'var(--shadow-pastel)',
          boxSizing: 'border-box',
          width: '100%',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'padding 250ms ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#D6EEF5',
            flexShrink: 0
          }}>
            <Zap className="h-5 w-5 text-[#1A6A82]" fill="#1A6A82" />
          </div>
          {!collapsed && (
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#1A6A82', letterSpacing: '-0.025em', whiteSpace: 'nowrap', overflow: 'hidden' }}>CLINERGY</span>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <NavLinks />
      </nav>

      <UserProfile />

      {!collapsed && (
        <div style={{ padding: '0 0 6px 0', display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', color: '#9DBFD3', textTransform: 'uppercase', margin: 0 }}>CLINERGY V2.0</p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
