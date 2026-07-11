import React from 'react';
import { motion } from 'framer-motion';
import { useClub } from '@/contexts/ClubContext';

export default function GoldButton({ children, onClick, fullWidth, variant = 'solid', className = '', style = {}, ...props }) {
  const { club } = useClub();
  const t = club.theme;
  const isSolid = variant === 'solid';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        borderRadius: 13,
        fontFamily: t.fontDisplay,
        fontSize: 13,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        border: 'none',
        ...(isSolid
          ? {
              background: `linear-gradient(135deg, ${t.goldHi}, ${t.gold})`,
              color: '#1A1303',
              boxShadow: `0 0 16px ${t.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`
            }
          : {
              background: 'transparent',
              color: t.gold,
              border: `1px solid ${t.gold}`
            }),
        ...style
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}