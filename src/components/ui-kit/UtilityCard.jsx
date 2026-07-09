import React from 'react';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

export default function UtilityCard({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={className}
      style={{
        background: t.bg1,
        border: `2px solid ${t.navy}`,
        borderRadius: 16,
        padding: 24,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}