import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertState = 'NORMAL' | 'WARNING' | 'CRITICAL';

interface AlertStateBadgeProps {
  state: AlertState;
  className?: string;
}

/**
 * AlertStateBadge — shows the LIVE alarm state of a zone.
 * Design: solid filled pill, bright & saturated, with a status icon.
 * AlertStateBadge — live alarm state. Clean dot + text, no heavy fills.
 */
export const AlertStateBadge: React.FC<AlertStateBadgeProps> = ({ state, className }) => {
  const config = {
    NORMAL:   { dot: '#10b981', label: 'Normal'   },
    WARNING:  { dot: '#f59e0b', label: 'Warning'  },
    CRITICAL: { dot: '#ef4444', label: 'Critical' },
  };

  const upperState = (state || 'NORMAL').toUpperCase() as AlertState;
  const current = config[upperState] || config.NORMAL;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 8,
          paddingRight: 10,
          paddingTop: 4,
          paddingBottom: 4,
          borderRadius: 6,
          background: '#fff',
          border: '1px solid #e5e7eb',
          fontSize: 11,
          fontWeight: 600,
          color: '#374151',
        }}
        className={cn(className)}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: current.dot, display: 'inline-block', flexShrink: 0 }} />
        {current.label}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * ZoneCategoryPill — clinical zone classification. Plain outlined chip.
 */
interface ZoneCategoryPillProps {
  category: string;
  className?: string;
}

export const ZoneCategoryPill: React.FC<ZoneCategoryPillProps> = ({ category, className }) => {
  const normalizeCategory = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c === 'critical' || c === 'critical care') return 'Critical Care';
    if (c === 'essential' || c === 'semi-critical') return 'Essential';
    return 'Standard';
  };

  const normalized = normalizeCategory(category);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 3,
        paddingBottom: 3,
        borderRadius: 4,
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        color: '#6b7280',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
      className={cn(className)}
    >
      <Tag style={{ width: 9, height: 9 }} strokeWidth={2.5} />
      {normalized}
    </div>
  );
};
