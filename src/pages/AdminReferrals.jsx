import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trophy, CheckCircle2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import AdminLayout from '../components/admin/AdminLayout';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminReferrals() {
  const [rewardDialog, setRewardDialog] = useState(null);
  const [rewardNote, setRewardNote] = useState('');
  const queryClient = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 200)
  });

  // Group referrals by referrer and count conversions
  const leaderboard = useMemo(() => {
    const map = {};
    referrals.forEach(r => {
      if (!map[r.referrer_user_id]) {
        map[r.referrer_user_id] = {
          referrer_user_id: r.referrer_user_id,
          referrer_name: r.referrer_name,
          referrer_email: r.referrer_email,
          referral_code: r.referral_code,
          total: 0,
          converted: 0,
          rewarded: 0,
          referrals: []
        };
      }
      map[r.referrer_user_id].total++;
      if (r.status === 'converted') map[r.referrer_user_id].converted++;
      if (r.status === 'rewarded') map[r.referrer_user_id].rewarded++;
      map[r.referrer_user_id].referrals.push(r);
    });
    return Object.values(map).sort((a, b) => b.converted - a.converted);
  }, [referrals]);

  const markRewardedMutation = useMutation({
    mutationFn: async ({ referrerId, note }) => {
      const toReward = referrals.filter(
        r => r.referrer_user_id === referrerId && r.status === 'converted'
      );
      await Promise.all(toReward.map(r =>
        base44.entities.Referral.update(r.id, {
          status: 'rewarded',
          reward_note: note,
          rewarded_at: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['referrals']);
      setRewardDialog(null);
      setRewardNote('');
      toast.success('Marked as rewarded!');
    }
  });

  const totalConverted = referrals.filter(r => r.status === 'converted').length;
  const totalRewarded = referrals.filter(r => r.status === 'rewarded').length;

  return (
    <AdminLayout currentPage="AdminReferrals">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Referral Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">Members who have referred new season memberships</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-[#1a365d]">{leaderboard.length}</p>
            <p className="text-xs text-gray-500 mt-1">Referrers</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalConverted}</p>
            <p className="text-xs text-gray-500 mt-1">Conversions</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-amber-500">{totalRewarded}</p>
            <p className="text-xs text-gray-500 mt-1">Rewarded</p>
          </div>
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No referrals yet</p>
            <p className="text-sm text-gray-400 mt-1">Members will appear here once they start sharing their referral links</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, idx) => (
              <div key={entry.referrer_user_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                    idx === 1 ? 'bg-gray-100 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </div>

                  {/* Member info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{entry.referrer_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{entry.referrer_email}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{entry.referral_code}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-[#1a365d]">{entry.converted}</p>
                    <p className="text-xs text-gray-400">conversions</p>
                  </div>
                </div>

                {/* Referred members list */}
                {entry.referrals.filter(r => r.status !== 'pending').length > 0 && (
                  <div className="border-t border-gray-50 px-4 py-3 bg-gray-50">
                    <p className="text-xs text-gray-500 font-semibold mb-2">REFERRED MEMBERS</p>
                    <div className="space-y-1">
                      {entry.referrals.filter(r => r.status !== 'pending').map(r => (
                        <div key={r.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{r.referred_name} — {r.referred_tier_name}</span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            r.status === 'rewarded' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reward button */}
                {entry.converted > entry.rewarded && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <Button
                      size="sm"
                      onClick={() => setRewardDialog(entry)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Mark Prize as Awarded
                    </Button>
                  </div>
                )}

                {entry.converted > 0 && entry.converted === entry.rewarded && (
                  <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2 text-emerald-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Prize awarded
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reward Dialog */}
      <Dialog open={!!rewardDialog} onOpenChange={() => setRewardDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Prize as Awarded</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">
              Marking <strong>{rewardDialog?.referrer_name}</strong> as rewarded for{' '}
              <strong>{rewardDialog?.converted}</strong> referral(s).
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Prize / Reward Note (optional)
              </label>
              <input
                type="text"
                value={rewardNote}
                onChange={e => setRewardNote(e.target.value)}
                placeholder="e.g. $50 voucher, free jersey, etc."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRewardDialog(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => markRewardedMutation.mutate({ referrerId: rewardDialog.referrer_user_id, note: rewardNote })}
                disabled={markRewardedMutation.isPending}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                {markRewardedMutation.isPending ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}