import React from 'react';
import { motion } from 'framer-motion';
import { useClub } from '@/contexts/ClubContext';

export default function UtilityButton({ children, variant = 'primary', onClick, disabled = false, className = '', style = {}, ...props }) {
  const { club } = useClub();
  const t = club.theme;
  const VARIANTS = {
    primary: { background: t.gold, color: '#1A1303' },
    secondary: { background: t.navy, color: '#FFFFFF' },
    danger: { background: '#DC2626', color: '#FFFFFF' }
  };
  const fill = VARIANTS[variant] || VARIANTS.primary;

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${className}`}
      style={{
        minHeight: 56,
        borderRadius: 13,
        fontFamily: t.fontDisplay,
        fontSize: 16,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        opacity: disabled ? 0.5 : 1,
        ...fill,
        ...style
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}