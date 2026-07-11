import React from 'react';

export default function GlassCard({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: '22px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}