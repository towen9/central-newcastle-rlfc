import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GlassCard } from '@/components/ui-kit';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

const benefits = [
  'Unlimited home game entry',
  'Rewards points & sponsor deals',
  'Members-only events & perks',
];

export default function ValueStrip() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <GlassCard className="p-4">
        <div className="space-y-2">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}22` }}>
                <Check className="w-3 h-3" style={{ color: t.gold }} />
              </div>
              <span className="text-white/80 text-sm" style={{ fontFamily: t.fontBody }}>{benefit}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}