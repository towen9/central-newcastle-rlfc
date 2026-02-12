import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Mail, Phone, Globe, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Sponsors() {
  const { data: sponsors = [] } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const allSponsors = await base44.entities.Sponsor.filter({ is_active: true });
      // Sort sponsors: Oneills Tyres first, then naming rights, then alphabetically
      return allSponsors.sort((a, b) => {
        if (a.name === "Oneills Tyres") return -1;
        if (b.name === "Oneills Tyres") return 1;
        if (a.tier === 'naming_rights') return -1;
        if (b.tier === 'naming_rights') return 1;
        return a.name.localeCompare(b.name);
      });
    }
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => base44.entities.Offer.filter({ is_active: true })
  });

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
        {/* Sponsors List */}
        <div className="space-y-4">
          {sponsors.map((sponsor, idx) => {
            const sponsorOffers = getOffersForSponsor(sponsor.id);
            
            return (
              <motion.div
                key={sponsor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
              >
                <div className="p-5">
                  {/* Logo & Name */}
                  <div className="flex items-start gap-4 mb-4">
                   {sponsor.logo_url ? (
                     <img 
                       src={sponsor.logo_url} 
                       alt={sponsor.name}
                       className="w-16 h-16 object-contain rounded-xl border-2 border-gray-200 p-2"
                     />
                   ) : (
                     <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                       {sponsor.name.charAt(0)}
                     </div>
                   )}
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-bold text-gray-900 text-lg">{sponsor.name}</h3>
                       {sponsor.tier === 'naming_rights' && (
                         <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                           Naming Rights Partner
                         </span>
                       )}
                       {sponsorOffers.length > 0 && (
                         <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                           <Percent className="w-3 h-3" />
                           {sponsorOffers.length}
                         </span>
                       )}
                     </div>
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

        {sponsors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sponsors yet</p>
          </div>
        )}
      </div>
    </div>
  );
}