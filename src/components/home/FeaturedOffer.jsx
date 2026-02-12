import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeaturedOffer({ offer }) {
  if (!offer) return null;

  return (
    <Link to={createPageUrl(`Offers?offerId=${offer.id}`)}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-3 text-white shadow-lg"
      >
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="w-3 h-3" />
              <span className="text-xs font-medium text-white/80">Featured Offer</span>
            </div>
            <h3 className="font-bold text-sm mb-0.5">{offer.title}</h3>
            <p className="text-white/80 text-xs">{offer.sponsor_name}</p>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}