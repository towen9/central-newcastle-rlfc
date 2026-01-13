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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Featured Offer</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{offer.title}</h3>
            <p className="text-white/80 text-sm">{offer.sponsor_name}</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}