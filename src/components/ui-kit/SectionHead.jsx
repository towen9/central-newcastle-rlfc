import React from 'react';
import clubConfig from '@/config/club.config';
import Eyebrow from './Eyebrow';

const t = clubConfig.theme;

export default function SectionHead({ kicker, title, action, onAction }) {
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