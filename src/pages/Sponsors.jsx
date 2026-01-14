import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Mail, Phone, Globe, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const tierConfig = {
  platinum: { color: 'bg-gradient-to-r from-slate-400 to-slate-600', label: 'Platinum', ring: 'ring-slate-400' },
  gold: { color: 'bg-gradient-to-r from-yellow-400 to-yellow-600', label: 'Gold', ring: 'ring-yellow-400' },
  silver: { color: 'bg-gradient-to-r from-gray-300 to-gray-500', label: 'Silver', ring: 'ring-gray-400' },
  bronze: { color: 'bg-gradient-to-r from-amber-600 to-amber-800', label: 'Bronze', ring: 'ring-amber-600' },
  community: { color: 'bg-gradient-to-r from-blue-400 to-blue-600', label: 'Community', ring: 'ring-blue-400' }
};

export default function Sponsors() {
  const [selectedTier, setSelectedTier] = useState('all');

  const { data: sponsors = [] } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => base44.entities.Sponsor.filter({ is_active: true }, '-tier')
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => base44.entities.Offer.filter({ is_active: true })
  });

  const filteredSponsors = selectedTier === 'all' 
    ? sponsors 
    : sponsors.filter(s => s.tier === selectedTier);

  const getOffersForSponsor = (sponsorId) => {
    return offers.filter(o => o.sponsor_id === sponsorId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] pt-safe">
        <div className="px-5 py-6 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
              alt="Central Newcastle RLFC"
              className="w-12 h-12 object-contain bg-white rounded-full p-1"
            />
            <div>
              <h1 className="text-white text-xl font-bold">Our Sponsors</h1>
              <p className="text-blue-200 text-sm">Supporting our club</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Tier Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide mb-6">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedTier === 'all' 
                ? 'bg-[#1a365d] text-white' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            All Sponsors
          </button>
          {Object.entries(tierConfig).map(([tier, config]) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedTier === tier 
                  ? 'bg-[#1a365d] text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Sponsors List */}
        <div className="space-y-4">
          {filteredSponsors.map((sponsor, idx) => {
            const tierStyle = tierConfig[sponsor.tier] || tierConfig.community;
            const sponsorOffers = getOffersForSponsor(sponsor.id);
            
            return (
              <motion.div
                key={sponsor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
              >
                {/* Tier Badge */}
                <div className={`${tierStyle.color} px-4 py-2 flex items-center justify-between`}>
                  <span className="text-white font-semibold text-sm">{tierStyle.label} Sponsor</span>
                  {sponsorOffers.length > 0 && (
                    <span className="bg-white/20 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      {sponsorOffers.length} {sponsorOffers.length === 1 ? 'Offer' : 'Offers'}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  {/* Logo & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    {sponsor.logo_url ? (
                      <img 
                        src={sponsor.logo_url} 
                        alt={sponsor.name}
                        className={`w-16 h-16 object-contain rounded-xl border-2 ${tierStyle.ring} p-2`}
                      />
                    ) : (
                      <div className={`w-16 h-16 ${tierStyle.color} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
                        {sponsor.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{sponsor.name}</h3>
                      {sponsor.description && (
                        <p className="text-sm text-gray-500">{sponsor.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {sponsor.website && (
                      <a 
                        href={sponsor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{sponsor.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                    {sponsor.contact_email && (
                      <a 
                        href={`mailto:${sponsor.contact_email}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{sponsor.contact_email}</span>
                      </a>
                    )}
                    {sponsor.contact_phone && (
                      <a 
                        href={`tel:${sponsor.contact_phone}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
                      >
                        <Phone className="w-4 h-4" />
                        {sponsor.contact_phone}
                      </a>
                    )}
                  </div>

                  {/* Offers */}
                  {sponsorOffers.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-500 font-medium mb-3">Member Offers:</p>
                      <div className="space-y-2">
                        {sponsorOffers.map((offer) => (
                          <Link 
                            key={offer.id} 
                            to={createPageUrl('Benefits')}
                            className="block bg-emerald-50 rounded-lg p-3 hover:bg-emerald-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{offer.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{offer.description}</p>
                              </div>
                              <Percent className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-3" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredSponsors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sponsors in this tier</p>
          </div>
        )}
      </div>
    </div>
  );
}