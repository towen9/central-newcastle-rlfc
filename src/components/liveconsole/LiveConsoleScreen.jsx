import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, List } from 'lucide-react';
import { format } from 'date-fns';
import EventModal from './EventModal';
import TimelineModal from './TimelineModal';
import { toast } from 'sonner';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  live_first_half: '1st Half',
  half_time: 'Half Time',
  live_second_half: '2nd Half',
  full_time: 'Full Time',
};

const STATUS_COLORS = {
  scheduled: 'bg-gray-200 text-gray-600',
  live_first_half: 'bg-blue-500 text-white',
  half_time: 'bg-amber-400 text-amber-900',
  live_second_half: 'bg-blue-500 text-white',
  full_time: 'bg-green-500 text-white',
};

// Each button: id, label, color classes, enabledFn(matchStatus, hasTry)
const BUTTONS = [
  {
    id: 'kickoff', label: 'KICK OFF',
    cls: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    enabled: (s) => s === 'scheduled',
  },
  {
    id: 'try', label: 'TRY',
    cls: 'bg-[#1a365d] hover:bg-[#2c5282] text-white',
    enabled: (s) => s === 'live_first_half' || s === 'live_second_half',
  },
  {
    id: 'conversion', label: 'CONVERSION',
    cls: 'bg-[#2c5282] hover:bg-[#1a365d] text-white',
    enabled: (s, hasTry) => hasTry && (s === 'live_first_half' || s === 'live_second_half'),
  },
  {
    id: 'penalty_goal', label: 'PENALTY GOAL',
    cls: 'bg-[#2c5282] hover:bg-[#1a365d] text-white',
    enabled: (s) => s === 'live_first_half' || s === 'live_second_half',
  },
  {
    id: 'field_goal', label: 'FIELD GOAL',
    cls: 'bg-[#2c5282] hover:bg-[#1a365d] text-white',
    enabled: (s) => s === 'live_first_half' || s === 'live_second_half',
  },
  {
    id: 'sin_bin', label: 'SIN BIN',
    cls: 'bg-amber-500 hover:bg-amber-600 text-white',
    enabled: (s) => s === 'live_first_half' || s === 'live_second_half',
  },
  {
    id: 'send_off', label: 'SEND OFF',
    cls: 'bg-red-600 hover:bg-red-700 text-white',
    enabled: (s) => s === 'live_first_half' || s === 'live_second_half',
  },
  {
    id: 'half_time', label: 'HALF TIME',
    cls: 'bg-amber-500 hover:bg-amber-600 text-white',
    enabled: (s) => s === 'live_first_half',
  },
  {
    id: 'second_half', label: '2ND HALF KICK OFF',
    cls: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    enabled: (s) => s === 'half_time',
  },
  {
    id: 'full_time', label: 'FULL TIME',
    cls: 'bg-red-600 hover:bg-red-700 text-white',
    enabled: (s) => s === 'live_first_half' || s === 'half_time' || s === 'live_second_half',
  },
  {
    id: 'moment', label: 'MOMENT',
    cls: 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900',
    enabled: (s) => s === 'live_first_half' || s === 'live_second_half',
  },
];

export default function LiveConsoleScreen({ fixture: initialFixture, user, onChangeFixture }) {
  const [activeModal, setActiveModal] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const queryClient = useQueryClient();

  // Live fixture data — auto-refreshed every 30s
  const { data: fixture } = useQuery({
    queryKey: ['liveFixture', initialFixture.id],
    queryFn: async () => {
      const rows = await base44.entities.Fixture.filter({ id: initialFixture.id });
      return rows[0] || initialFixture;
    },
    initialData: initialFixture,
    refetchInterval: 30000,
  });

  // Recent events (last 5)
  const { data: recentEvents = [] } = useQuery({
    queryKey: ['recentEvents', fixture.id],
    queryFn: () => base44.entities.MatchEvent.filter({ fixture: fixture.id }, '-occurred_at', 5),
    refetchInterval: 30000,
  });

  // Track whether a try has been recorded this match (for conversion enable)
  const hasTry = recentEvents.some(e => e.type === 'try') ||
    (fixture.score_us > 0 || fixture.score_them > 0); // if score>0, a try must have happened

  const status = fixture.match_status || 'scheduled';
  const opponent = fixture.opponent_name || fixture.opponent || 'Opponent';

  const handleEventSubmitted = () => {
    queryClient.invalidateQueries(['liveFixture', fixture.id]);
    queryClient.invalidateQueries(['recentEvents', fixture.id]);
    setActiveModal(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky Header */}
      <div className="bg-[#1a365d] rounded-2xl p-5 mb-5 text-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3 text-sm">
          <button onClick={onChangeFixture} className="flex items-center gap-1 text-blue-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Change fixture
          </button>
          <button onClick={() => setShowTimeline(true)} className="flex items-center gap-1 text-blue-300 hover:text-white transition-colors">
            <List className="w-4 h-4" />
            Edit timeline
          </button>
        </div>

        <div className="text-center">
          <p className="text-3xl font-black tracking-tight">
            Central {fixture.score_us ?? 0} — {fixture.score_them ?? 0} {opponent.toUpperCase()}
          </p>
          <div className="mt-2 flex justify-center">
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status] || status}
            </span>
          </div>
        </div>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {BUTTONS.map(btn => {
          const isEnabled = btn.enabled(status, hasTry);
          return (
            <button
              key={btn.id}
              onClick={() => isEnabled && setActiveModal(btn.id)}
              disabled={!isEnabled}
              className={`rounded-2xl font-bold text-sm py-5 px-3 transition-all min-h-[56px] ${
                isEnabled
                  ? btn.cls + ' shadow-sm active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Recent Events</h3>
          <div className="space-y-2">
            {recentEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 text-xs w-14 shrink-0">
                  {ev.occurred_at ? format(new Date(ev.occurred_at), 'h:mm a') : '—'}
                </span>
                <span className="font-semibold text-gray-800 capitalize">{ev.type.replace('_', ' ')}</span>
                {ev.team && <span className={`text-xs px-2 py-0.5 rounded-full ${ev.team === 'us' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{ev.team === 'us' ? 'Us' : 'Them'}</span>}
                {ev.scorer && <span className="text-gray-500">· {ev.scorer}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event modal */}
      {activeModal && (
        <EventModal
          eventType={activeModal}
          fixture={fixture}
          user={user}
          onClose={() => setActiveModal(null)}
          onSuccess={handleEventSubmitted}
        />
      )}

      {/* Timeline modal */}
      {showTimeline && (
        <TimelineModal
          fixture={fixture}
          onClose={() => setShowTimeline(false)}
          onUpdated={() => {
            queryClient.invalidateQueries(['liveFixture', fixture.id]);
            queryClient.invalidateQueries(['recentEvents', fixture.id]);
          }}
        />
      )}
    </div>
  );
}