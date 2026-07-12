import React from 'react';
import { ArrowRight } from 'lucide-react';

function HealthChip({ club }) {
  let color, label;
  if (club.status === 'churned' || club.is_active === false) {
    color = '#ef4444';
    label = 'Red';
  } else if (club.status === 'live' && (club.onboarding_progress || 0) >= 100) {
    color = '#22c55e';
    label = 'Green';
  } else {
    color = '#f59e0b';
    label = 'Amber';
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs font-medium text-white/70">{label}</span>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClubTable({ clubs, stats, onActAs }) {
  return (
    <>
    {/* Mobile: card list — every action reachable without horizontal scroll */}
    <div className="md:hidden divide-y divide-white/5">
      {clubs.map((club) => {
        const s = stats[club.id] || { memberCount: 0, pushOptInRate: 0, lastActive: null };
        const progress = club.onboarding_progress || 0;
        return (
          <div key={club.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              {club.logo_url ? (
                <img src={club.logo_url} alt="" className="w-10 h-10 rounded-full object-cover bg-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/50">
                  {(club.name || '?')[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{club.name}</p>
                <p className="text-xs text-white/40 font-mono truncate">{club.slug}</p>
              </div>
              <HealthChip club={club} />
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-white/60">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">{club.product_tier || 'starter'}</span>
              <span className="capitalize">{club.status || '—'}</span>
              <span>· {s.memberCount} members</span>
              <span>· {s.pushOptInRate}% push</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress >= 100 ? '#22c55e' : '#f59e0b' }} />
              </div>
              <span className="text-xs text-white/50">{progress}%</span>
            </div>
            <button
              onClick={() => onActAs(club)}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl bg-amber-500/15 text-amber-400 active:bg-amber-500/25 transition-colors"
              style={{ minHeight: 48 }}
            >
              Act as {club.name} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>

    {/* Desktop: full table */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
            <th className="py-2.5 pr-4 font-semibold">Club</th>
            <th className="py-2.5 pr-4 font-semibold">Slug</th>
            <th className="py-2.5 pr-4 font-semibold">Tier</th>
            <th className="py-2.5 pr-4 font-semibold">Status</th>
            <th className="py-2.5 pr-4 font-semibold">Onboarding</th>
            <th className="py-2.5 pr-4 font-semibold text-right">Members</th>
            <th className="py-2.5 pr-4 font-semibold text-right">Push Opt-in</th>
            <th className="py-2.5 pr-4 font-semibold">Last Active</th>
            <th className="py-2.5 pr-4 font-semibold">Health</th>
            <th className="py-2.5 pr-2 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club) => {
            const s = stats[club.id] || { memberCount: 0, pushOptInRate: 0, lastActive: null };
            const progress = club.onboarding_progress || 0;
            return (
              <tr key={club.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    {club.logo_url ? (
                      <img src={club.logo_url} alt="" className="w-8 h-8 rounded-full object-cover bg-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                        {(club.name || '?')[0]}
                      </div>
                    )}
                    <span className="text-sm font-medium text-white">{club.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-xs text-white/50 font-mono">{club.slug}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {club.product_tier || 'starter'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs text-white/60 capitalize">{club.status || '—'}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress >= 100 ? '#22c55e' : '#f59e0b' }} />
                    </div>
                    <span className="text-xs text-white/50">{progress}%</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-sm text-white/80 text-right tabular-nums">{s.memberCount}</td>
                <td className="py-3 pr-4 text-sm text-white/80 text-right tabular-nums">{s.pushOptInRate}%</td>
                <td className="py-3 pr-4 text-xs text-white/50">{formatDate(s.lastActive)}</td>
                <td className="py-3 pr-4"><HealthChip club={club} /></td>
                <td className="py-3 pr-2">
                  <button
                    onClick={() => onActAs(club)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                  >
                    Act as <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}