import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_LABELS = {
  kickoff: 'Kick Off',
  try: 'Try',
  conversion: 'Conversion',
  penalty_goal: 'Penalty Goal',
  field_goal: 'Field Goal',
  sin_bin: 'Sin Bin',
  send_off: 'Send Off',
  half_time: 'Half Time',
  second_half: '2nd Half Kick Off',
  full_time: 'Full Time',
  moment: 'Moment',
};

const MILESTONE_TYPES = ['kickoff', 'half_time', 'second_half', 'full_time'];
const SCORE_TYPES = ['try', 'conversion', 'penalty_goal', 'field_goal'];
const DISCIPLINE_TYPES = ['sin_bin', 'send_off'];

export default function EventModal({ eventType, fixture, user, onClose, onSuccess }) {
  const [team, setTeam] = useState(DISCIPLINE_TYPES.includes(eventType) ? 'them' : 'us');
  const [conversionResult, setConversionResult] = useState('made');
  const [scorer, setScorer] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [momentText, setMomentText] = useState('');
  const [momentAudience, setMomentAudience] = useState('attendees');
  const [loading, setLoading] = useState(false);

  const label = EVENT_LABELS[eventType] || eventType;
  const opponent = fixture.opponent_name || fixture.opponent || 'Opponent';

  const isMilestone = MILESTONE_TYPES.includes(eventType);
  const isScore = SCORE_TYPES.includes(eventType);
  const isDiscipline = DISCIPLINE_TYPES.includes(eventType);
  const isMoment = eventType === 'moment';
  const isConversion = eventType === 'conversion';

  const canSubmit = isMoment ? momentText.trim().length > 0 : true;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const now = new Date().toISOString();
      const eventData = {
        fixture: fixture.id,
        type: eventType,
        occurred_at: now,
        created_by: user.id,
        pushed: false,
      };

      if (isScore && !isConversion) {
        eventData.team = team;
        if (eventType === 'try' && scorer.trim()) eventData.scorer = scorer.trim();
      }

      if (isConversion) {
        eventData.team = team;
        eventData.payload_text = conversionResult; // 'made' or 'missed'
      }

      if (isDiscipline) {
        eventData.team = team;
        if (playerNumber.trim()) eventData.player_number = parseInt(playerNumber, 10) || undefined;
      }

      if (isMoment) {
        eventData.payload_text = momentText.trim();
        eventData.moment_audience = momentAudience;
      }

      const newEvent = await base44.entities.MatchEvent.create(eventData);
      await base44.functions.invoke('processMatchEvent', { eventId: newEvent.id });

      toast.success(`${label} sent ✓`);
      onSuccess();
    } catch (err) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
      
    >
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900">{label}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Milestone: simple confirm */}
        {isMilestone && (
          <p className="text-gray-600 text-sm mb-6">
            Confirm <strong>{label}</strong>? This will push to all members.
          </p>
        )}

        {/* Score events: Us/Them toggle */}
        {isScore && !isConversion && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-600 mb-2">Which team?</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {['us', 'them'].map(t => (
                <button
                  key={t}
                  onClick={() => setTeam(t)}
                  className={`flex-1 py-3 text-sm font-bold transition-colors ${team === t ? 'bg-[#1a365d] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {t === 'us' ? 'Us (Central)' : `Them (${opponent})`}
                </button>
              ))}
            </div>
            {eventType === 'try' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Scorer (optional)</label>
                <input
                  type="text"
                  value={scorer}
                  onChange={e => setScorer(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  placeholder="Player name"
                />
              </div>
            )}
          </div>
        )}

        {/* Conversion: Made/Missed + Us/Them */}
        {isConversion && (
          <div className="mb-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Result</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {['made', 'missed'].map(r => (
                  <button
                    key={r}
                    onClick={() => setConversionResult(r)}
                    className={`flex-1 py-3 text-sm font-bold transition-colors capitalize ${conversionResult === r ? 'bg-[#1a365d] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Which team kicked?</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {['us', 'them'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTeam(t)}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${team === t ? 'bg-[#1a365d] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t === 'us' ? 'Us' : 'Them'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Discipline events */}
        {isDiscipline && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-600 mb-2">Which team?</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {['us', 'them'].map(t => (
                <button
                  key={t}
                  onClick={() => setTeam(t)}
                  className={`flex-1 py-3 text-sm font-bold transition-colors ${team === t ? 'bg-[#1a365d] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {t === 'us' ? 'Us (Central)' : `Them (${opponent})`}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Player # (optional)</label>
              <input
                type="number"
                value={playerNumber}
                onChange={e => setPlayerNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                placeholder="Jersey number"
              />
            </div>
          </div>
        )}

        {/* Moment */}
        {isMoment && (
          <div className="mb-5 space-y-4">
            <p className="text-sm text-gray-500">Send a custom push to fans about something happening right now.</p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                What's happening? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={momentText}
                onChange={e => setMomentText(e.target.value.slice(0, 80))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1a365d] resize-none"
                rows={3}
                placeholder="Something is happening..."
                autoFocus
              />
              <p className="text-xs text-gray-400 text-right mt-1">{momentText.length}/80</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Audience</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {['attendees', 'all_members'].map(a => (
                  <button
                    key={a}
                    onClick={() => setMomentAudience(a)}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${momentAudience === a ? 'bg-[#1a365d] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {a === 'attendees' ? 'Attendees' : 'All Members'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-6 text-base"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !canSubmit}
            className="flex-1 py-6 text-base bg-[#1a365d] hover:bg-[#2c5282] text-white font-bold min-h-[60px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isMoment ? 'Send' : 'Confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}