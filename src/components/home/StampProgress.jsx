import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StampProgress({ stamps = 0, points = 0, rewards = [] }) {
  const sortedRewards = [...rewards].sort((a, b) => (a.points_required || a.stamps_required) - (b.points_required || b.stamps_required));
  const nextReward = sortedRewards.find(r => (r.points_required || r.stamps_required) > points);
  const maxPoints = sortedRewards.length > 0 ? (sortedRewards[sortedRewards.length - 1].points_required || sortedRewards[sortedRewards.length - 1].stamps_required) : 100;
  
  const progressPercent = Math.min((points / maxPoints) * 100, 100);
  const pointsToNext = nextReward ? (nextReward.points_required || nextReward.stamps_required) - points : 0;

  return (
    <Link to={createPageUrl('PointsRewards')}>
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 shadow-lg text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Points Balance</h3>
              <p className="text-xs text-amber-100">Tap • <Link to={createPageUrl('HowPointsWork')} className="underline">How it works</Link></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{points}</p>
            <p className="text-xs text-amber-100">pts</p>
          </div>
        </div>

      {/* Progress Bar */}
      {nextReward && (
        <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-white rounded-full"
          />
        </div>
      )}

      {/* Next Reward */}
      {nextReward ? (
        <p className="text-xs text-amber-50">
          <span className="font-semibold">{pointsToNext} pts</span> until {nextReward.title}
        </p>
      ) : points > 0 ? (
        <p className="text-xs font-semibold text-amber-50">
          🎉 All rewards unlocked!
        </p>
      ) : (
        <p className="text-xs text-amber-50">
          Earn points at games and bar!
        </p>
      )}
      </div>
    </Link>
  );
}