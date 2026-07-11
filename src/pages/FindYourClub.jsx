import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useClub } from '@/contexts/ClubContext';

export default function FindYourClub() {
  const { club: currentClub } = useClub();

  const { data: clubs = [], isLoading } = useQuery({
    queryKey: ['allClubs'],
    queryFn: () => base44.entities.Club.filter({})
  });

  const activeClubs = clubs.filter(c => c.is_active !== false && (c.status === 'live' || c.status === 'onboarding'));

  return (
    <div className="min-h-screen p-6" style={{ background: '#000' }}>
      <div className="max-w-md mx-auto">
        <h1 className="text-white text-2xl font-bold mb-2">Find Your Club</h1>
        <p className="text-white/50 text-sm mb-6">Select your club to continue</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activeClubs.map(c => (
              <Link
                key={c.id}
                to={`/?club=${c.slug}`}
                className="flex items-center gap-3 p-4 rounded-2xl transition-all"
                style={{
                  background: currentClub?.slug === c.slug ? 'rgba(240,180,41,0.1)' : 'rgba(255,255,255,0.05)',
                  border: currentClub?.slug === c.slug ? '1px solid rgba(240,180,41,0.3)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {c.logo_url && (
                  <img src={c.logo_url} alt={c.name} className="w-12 h-12 rounded-full object-contain bg-white p-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-white font-semibold">{c.name}</p>
                  {c.venue_name && <p className="text-white/40 text-xs">{c.venue_name}</p>}
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </Link>
            ))}
            {activeClubs.length === 0 && (
              <p className="text-white/40 text-sm text-center py-8">No clubs available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}