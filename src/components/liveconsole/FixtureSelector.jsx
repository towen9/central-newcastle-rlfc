import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  live_first_half: '1st Half',
  half_time: 'Half Time',
  live_second_half: '2nd Half',
  full_time: 'Full Time',
};

const STATUS_COLORS = {
  scheduled: 'bg-gray-100 text-gray-600',
  live_first_half: 'bg-blue-100 text-blue-700',
  half_time: 'bg-amber-100 text-amber-700',
  live_second_half: 'bg-blue-100 text-blue-700',
  full_time: 'bg-green-100 text-green-700',
};

export default function FixtureSelector({ onSelect }) {
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['liveConsoleFixtures'],
    queryFn: async () => {
      const all = await base44.entities.Fixture.list('date_time', 100);
      const now = new Date();
      const sixHours = 6 * 60 * 60 * 1000;

      // Primary: within ±6h window
      const inWindow = all.filter(f => {
        const t = new Date(f.kickoff_at || f.date_time);
        return Math.abs(t - now) <= sixHours;
      });

      if (inWindow.length > 0) return inWindow.sort((a, b) => new Date(a.kickoff_at || a.date_time) - new Date(b.kickoff_at || b.date_time));

      // Fallback: any active (not full_time)
      return all
        .filter(f => f.match_status !== 'full_time')
        .sort((a, b) => new Date(a.kickoff_at || a.date_time) - new Date(b.kickoff_at || b.date_time));
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium mb-1">No fixtures available.</p>
        <p className="text-sm text-gray-400">Add one in the Fixtures admin or wait until a match is scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-sm text-gray-500 mb-4">Select a fixture to open the Live Console.</p>
      {fixtures.map(f => {
        const kickoff = new Date(f.kickoff_at || f.date_time);
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:border-[#1a365d] hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 text-lg truncate">vs {f.opponent_name || f.opponent}</span>
                  {f.division && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.division === 'womens' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {f.division === 'womens' ? "Women's" : "Men's"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{format(kickoff, 'EEE d MMM • h:mm a')}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  Central {f.score_us ?? 0} — {f.score_them ?? 0} {f.opponent_name || f.opponent}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${STATUS_COLORS[f.match_status] || 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[f.match_status] || f.match_status}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}