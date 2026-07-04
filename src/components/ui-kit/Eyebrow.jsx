import React from 'react';

export default function Eyebrow({ color = 'rgba(255,255,255,0.34)', children }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  );
}