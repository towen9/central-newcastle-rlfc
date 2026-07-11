import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClub } from '@/contexts/ClubContext';

export default function CheckInCelebration({ pointsEarned, streak, onDismiss }) {
  const { club } = useClub();
  const t = club.theme;
  const HYPE_LINES = club.celebration.lines;
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);
  const hypeLine = useMemo(() => HYPE_LINES[Math.floor(Math.random() * HYPE_LINES.length)], []);

  // Count up animation 0 → pointsEarned over ~0.8s
  useEffect(() => {
    const duration = 800;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(progress * pointsEarned));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [pointsEarned]);

  // Auto-dismiss after ~2.6s
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(6,13,31,0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {/* Expanding gold circles */}
          {[0, 0.85].map((delay, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut', delay }}
              style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: '50%',
                border: `2px solid ${t.gold}`
              }}
            />
          ))}

          {/* Content */}
          <motion.div
            initial={{ y: 30, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 text-center px-8"
          >
            <p
              className="text-xs uppercase tracking-[0.2em] font-semibold mb-3"
              style={{ color: t.gold }}
            >
              Checked In · {club.identity.venue_name}
            </p>

            <h2
              className="text-white mb-6"
              style={{ fontFamily: t.fontDisplay, fontSize: '30px', lineHeight: 1.1 }}
            >
              {hypeLine}
            </h2>

            <div
              style={{
                fontFamily: t.fontDisplay,
                fontSize: '68px',
                color: t.gold,
                textShadow: `0 0 40px ${t.gold}88, 0 0 80px ${t.gold}44`,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1
              }}
            >
              +{count}
            </div>
            <p className="text-white/60 text-sm mt-2" style={{ fontFamily: t.fontBody }}>points</p>

            {streak > 0 && (
              <p className="text-white/80 text-sm mt-6" style={{ fontFamily: t.fontBody }}>
                {streak} check-in{streak > 1 ? 's' : ''} this season
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}