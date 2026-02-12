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
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-semibold">Points Balance</h3>
              <p className="text-sm text-amber-100">Tap to view rewards • <Link to={createPageUrl('HowPointsWork')} className="underline">How it works</Link></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{points}</p>
            <p className="text-xs text-amber-100">points</p>
          </div>
        </div>

      {/* Progress Bar */}
      {nextReward && (
        <div className="relative h-2 bg-white/20 rounded-full overflow-hidden mb-3">
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
        <p className="text-sm text-amber-50">
          <span className="font-semibold">{pointsToNext} points</span> until {nextReward.title}
        </p>
      ) : points > 0 ? (
        <p className="text-sm font-semibold text-amber-50">
          🎉 All rewards unlocked!
        </p>
      ) : (
        <p className="text-sm text-amber-50">
          Earn points by attending games and making purchases!
        </p>
      )}
      </div>
    </Link>
  );
}