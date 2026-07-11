import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useClub } from '@/contexts/ClubContext';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

/**
 * Full-screen glass overlay designed to be SHOWN to staff at the counter.
 * Pulsing gold border frame, sponsor logo, offer text, code block, Done button.
 */
export default function SponsorRedemptionOverlay({ sponsor, offer, onDismiss }) {
  const { club } = useClub();
  const t = club.theme;
  const [visible, setVisible] = useState(true);

  const handleDone = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const hasCode = offer && (offer.offer_code || offer.redemption_type === 'show_code');

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(6,13,31,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          {/* Pulsing gold border frame */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-full max-w-sm"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 24px ${t.gold}33, 0 8px 40px rgba(0,0,0,0.5)`,
                  `0 0 48px ${t.gold}66, 0 8px 40px rgba(0,0,0,0.5)`,
                  `0 0 24px ${t.gold}33, 0 8px 40px rgba(0,0,0,0.5)`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                borderRadius: 24,
                background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                border: `1px solid ${t.gold}66`,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                padding: 28,
                textAlign: 'center'
              }}
            >
              {/* Eyebrow */}
              <Eyebrow color={t.gold}>Member Offer</Eyebrow>

              {/* Logo on white chip */}
              <div className="flex justify-center my-5">
                {sponsor.logo_url ? (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 96, height: 96, borderRadius: 20,
                      background: '#fff', padding: 12,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 96, height: 96, borderRadius: 20,
                      background: 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <span style={{ fontFamily: t.fontDisplay, fontSize: 40, color: t.gold }}>
                      {sponsor.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Sponsor name */}
              <p className="text-white/50 text-xs mb-1" style={{ fontFamily: t.fontBody }}>{sponsor.name}</p>

              {/* Offer text big in Archivo Black */}
              {offer && (
                <h2
                  className="text-white leading-tight mb-4"
                  style={{ fontFamily: t.fontDisplay, fontSize: 22 }}
                >
                  {offer.title}
                </h2>
              )}

              {/* Offer description */}
              {offer?.description && (
                <p className="text-white/60 text-sm mb-4" style={{ fontFamily: t.fontBody }}>
                  {offer.description}
                </p>
              )}

              {/* Code / instruction block */}
              {hasCode && (
                <div
                  className="rounded-xl py-4 px-3 mb-5"
                  style={{
                    background: `${t.gold}11`,
                    border: `1px dashed ${t.gold}44`
                  }}
                >
                  <p className="text-[9px] uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: t.gold }}>
                    Show this code
                  </p>
                  <p className="text-white text-2xl tracking-wider" style={{ fontFamily: t.fontDisplay }}>
                    {offer.offer_code || sponsor.name?.toUpperCase().slice(0, 8)}
                  </p>
                </div>
              )}

              {/* "Show this at [sponsor name]" */}
              <p className="text-white/50 text-xs mb-5" style={{ fontFamily: t.fontBody }}>
                Show this at <span className="text-white/80 font-semibold">{sponsor.name}</span>
              </p>

              {/* Done button */}
              <GoldButton fullWidth onClick={handleDone}>
                <Check className="w-4 h-4" />
                Done
              </GoldButton>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}