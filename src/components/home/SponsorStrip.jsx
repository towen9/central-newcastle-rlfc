import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

export default function SponsorStrip() {
  const { data: sponsors = [] } = useQuery({
    queryKey: ['homeSponsors'],
    queryFn: () => base44.entities.Sponsor.filter({ is_active: true }, 'sort_order', 5),
    staleTime: 60000,
  });

  const withLogos = sponsors.filter(s => s.logo_url);

  if (!withLogos.length) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <span className="text-white/30 text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ fontFamily: t.fontBody }}>Proudly supported by</span>
      <div className="flex items-center gap-2">
        {withLogos.slice(0, 3).map((s) => (
          <div key={s.id} className="bg-white rounded px-1.5 py-0.5">
            <img src={s.logo_url} alt={s.name} className="h-4 w-auto object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}