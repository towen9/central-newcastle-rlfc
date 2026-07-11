import React from 'react';
import { useClub } from '@/contexts/ClubContext';

export default function UtilityCard({ children, className = '', style = {}, ...props }) {
  const { club } = useClub();
  const t = club.theme;
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