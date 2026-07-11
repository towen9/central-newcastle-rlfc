import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useClub } from '@/contexts/ClubContext';

export default function UtilityHeader({ title, onBack, right }) {
  const { club } = useClub();
  const t = club.theme;
  return (
    <div
      style={{
        background: t.bg1,
        borderBottom: `2px solid ${t.navy}`,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        padding: '16px 20px'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              style={{
                width: 48,
                height: 48,
                minHeight: 48,
                borderRadius: 12,
                background: t.navy,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          {title && (
            <h1
              style={{
                color: '#FFFFFF',
                fontFamily: t.fontDisplay,
                fontSize: 20,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                margin: 0
              }}
            >
              {title}
            </h1>
          )}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </div>
  );
}