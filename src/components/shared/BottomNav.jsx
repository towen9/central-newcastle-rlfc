import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Home, CreditCard, Award, User, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

const leftItems = [
  { icon: Home, label: 'Home', page: 'Home' },
  { icon: CreditCard, label: 'Membership', page: 'Membership' },
];

const rightItems = [
  { icon: Award, label: 'Sponsors', page: 'Sponsors' },
  { icon: User, label: 'Profile', page: 'Profile' },
];

export default function BottomNav({ currentPage }) {
  const renderNavItem = (item, idx) => {
    const isActive = currentPage === item.page;
    const Icon = item.icon;
    return (
      <Link key={idx} to={createPageUrl(item.page)} className="flex-1 flex justify-center" style={{ pointerEvents: 'auto' }}>
        <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center py-2 px-1">
          <Icon className="w-5 h-5 mb-0.5" style={{ color: isActive ? t.goldHi : 'rgba(255,255,255,0.4)', strokeWidth: isActive ? 2.5 : 1.8 }} />
          <span className="text-[9px] font-bold" style={{ color: isActive ? t.goldHi : 'rgba(255,255,255,0.4)' }}>{item.label}</span>
        </motion.div>
      </Link>
    );
  };

  const nav = (
    <div style={{ position: 'fixed', bottom: 'calc(14px + env(safe-area-inset-bottom))', left: '14px', right: '14px', zIndex: 50, pointerEvents: 'none' }}>
      <div className="relative flex items-center px-2 py-2" style={{
        pointerEvents: 'auto',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: '22px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div className="flex flex-1 items-center justify-around">
          {leftItems.map(renderNavItem)}
        </div>

        <div className="flex-shrink-0" style={{ width: '60px' }} />

        <div className="flex flex-1 items-center justify-around">
          {rightItems.map(renderNavItem)}
        </div>

        <Link to={createPageUrl('ScanForPoints')} className="absolute left-1/2 flex flex-col items-center" style={{ transform: 'translateX(-50%)', top: '-22px', pointerEvents: 'auto' }}>
          <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
            <div className="flex items-center justify-center" style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${t.goldHi}, ${t.gold})`,
              boxShadow: `0 4px 20px ${t.gold}55`,
              border: `3px solid ${t.bg0}`
            }}>
              <ScanLine className="w-6 h-6" style={{ color: t.bg0 }} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-bold mt-0.5" style={{ color: t.gold }}>SCAN</span>
          </motion.div>
        </Link>
      </div>
    </div>
  );

  return createPortal(nav, document.body);
}