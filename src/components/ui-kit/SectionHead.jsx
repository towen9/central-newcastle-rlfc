import React from 'react';
import { useClub } from '@/contexts/ClubContext';
import Eyebrow from './Eyebrow';

export default function SectionHead({ kicker, title, action, onAction }) {
  const { club } = useClub();
  const t = club.theme;
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        {kicker && <Eyebrow color={t.gold}>{kicker}</Eyebrow>}
        {title && (
          <h2 className="text-white mt-0.5" style={{ fontFamily: t.fontDisplay, fontSize: 18, fontWeight: 400 }}>
            {title}
          </h2>
        )}
      </div>
      {action && onAction && (
        <button onClick={onAction} className="text-xs font-semibold" style={{ color: t.cyan, fontFamily: t.fontBody }}>
          {action}
        </button>
      )}
    </div>
  );
}