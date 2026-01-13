import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Trophy } from 'lucide-react';

export default function StampProgress({ stamps = 0, rewards = [] }) {
  const sortedRewards = [...rewards].sort((a, b) => a.stamps_required - b.stamps_required);
  const nextReward = sortedRewards.find(r => r.stamps_required > stamps);
  const maxStamps = sortedRewards.length > 0 ? sortedRewards[sortedRewards.length - 1].stamps_required : 50;
  
  const progressPercent = Math.min((stamps / maxStamps) * 100, 100);
  const stampsToNext = nextReward ? nextReward.stamps_required - stamps : 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Your Stamps</h3>
            <p className="text-sm text-gray-500">Check in to earn rewards</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{stamps}</p>
          <p className="text-xs text-gray-500">stamps</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
        />
        {/* Milestone markers */}
        {sortedRewards.map((reward, idx) => {
          const position = (reward.stamps_required / maxStamps) * 100;
          const isUnlocked = stamps >= reward.stamps_required;
          return (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white"
              style={{ left: `${Math.min(position, 98)}%` }}
            >
              <div className={`w-full h-full rounded-full ${isUnlocked ? 'bg-amber-500' : 'bg-gray-300'}`} />
            </div>
          );
        })}
      </div>

      {/* Next Reward */}
      {nextReward ? (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Gift className="w-4 h-4 text-amber-500" />
            <span>Next: {nextReward.title}</span>
          </div>
          <span className="text-amber-600 font-medium">{stampsToNext} stamps away</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <Trophy className="w-4 h-4" />
          <span>All rewards unlocked!</span>
        </div>
      )}
    </div>
  );
}