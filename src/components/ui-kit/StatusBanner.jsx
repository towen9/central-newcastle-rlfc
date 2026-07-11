import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useClub } from '@/contexts/ClubContext';

const VARIANTS = {
  valid: {
    background: '#16A34A',
    color: '#FFFFFF',
    icon: CheckCircle
  },
  invalid: {
    background: '#DC2626',
    color: '#FFFFFF',
    icon: XCircle
  },
  warning: {
    background: '#F59E0B',
    color: '#1A1303',
    icon: AlertTriangle
  }
};

export default function StatusBanner({ variant = 'valid', title, subtitle }) {
  const { club } = useClub();
  const t = club.theme;
  const config = VARIANTS[variant] || VARIANTS.valid;
  const Icon = config.icon;

  return (
    <div
      style={{
        width: '100%',
        minHeight: 72,
        background: config.background,
        color: config.color,
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontFamily: t.fontBody
      }}
    >
      <Icon className="w-10 h-10 flex-shrink-0" style={{ color: config.color }} />
      <div className="flex flex-col">
        {title && (
          <span style={{ fontSize: 24, fontWeight: 800, fontFamily: t.fontDisplay, lineHeight: 1.2 }}>
            {title}
          </span>
        )}
        {subtitle && (
          <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.85, marginTop: 4 }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}