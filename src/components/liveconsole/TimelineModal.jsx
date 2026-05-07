import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const EVENT_LABELS = {
  kickoff: 'Kick Off', try: 'Try', conversion: 'Conversion',
  penalty_goal: 'Penalty Goal', field_goal: 'Field Goal',
  sin_bin: 'Sin Bin', send_off: 'Send Off', half_time: 'Half Time',
  second_half: '2nd Half KO', full_time: 'Full Time', moment: 'Moment',
};

// Recalculate score from scratch using remaining events
function recalculateScore(events) {
  let score_us = 0;
  let score_them = 0;
  for (const ev of events) {
    const isUs = ev.team === 'us';
    const isThem = ev.team === 'them';
    switch (ev.type) {
      case 'try':
        if (isUs) score_us += 4; else if (isThem) score_them += 4; break;
      case 'conversion':
        if (ev.payload_text === 'made') {
          if (isUs) score_us += 2; else if (isThem) score_them += 2;
        }
        break;
      case 'penalty_goal':
        if (isUs) score_us += 2; else if (isThem) score_them += 2; break;
      case 'field_goal':
        if (isUs) score_us += 1; else if (isThem) score_them += 1; break;
    }
  }
  return { score_us, score_them };
}

export default function TimelineModal({ fixture, onClose, onUpdated }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['allEvents', fixture.id],
    queryFn: () => base44.entities.MatchEvent.filter({ fixture: fixture.id }, '-occurred_at', 100),
  });

  const handleDelete = async (ev) => {
    setDeleting(true);
    try {
      await base44.entities.MatchEvent.delete(ev.id);
      const remaining = events.filter(e => e.id !== ev.id);
      const newScore = recalculateScore(remaining);
      await base44.entities.Fixture.update(fixture.id, newScore);
      await refetch();
      onUpdated();
      toast.success('Event deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-black text-gray-900">Edit Timeline</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Events list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {isLoading && (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          )}
          {!isLoading && events.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No events recorded yet.</p>
          )}
          {events.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-800">{EVENT_LABELS[ev.type] || ev.type}</span>
                  {ev.team && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ev.team === 'us' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {ev.team === 'us' ? 'Us' : 'Them'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">
                    {ev.occurred_at ? format(new Date(ev.occurred_at), 'h:mm a') : '—'}
                  </span>
                  {ev.scorer && <span className="text-xs text-gray-500">· {ev.scorer}</span>}
                  {ev.payload_text && ev.type !== 'conversion' && (
                    <span className="text-xs text-gray-500 truncate">· {ev.payload_text}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setConfirmDelete(ev)}
                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 shrink-0 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6 z-10">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Delete this event?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Score will recalculate, but the push notification was already sent and cannot be retracted.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1" disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}