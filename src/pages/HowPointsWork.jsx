import React from 'react';
import { ArrowLeft, Ticket, Beer, Building2, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function HowPointsWork() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe pb-8">
        <div className="px-5 py-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white mb-4 -ml-3">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">How Points Work</h1>
          </div>
          <p className="text-blue-200 text-lg">Earn rewards for supporting the Butcher Boys</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-4 space-y-4">
        {/* Earn Points Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-900">How to Earn Points</h2>
          
          <div className="space-y-4">
            {/* Attendance */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">Game Attendance</h3>
                  <span className="text-2xl font-bold text-blue-600">+10</span>
                </div>
                <p className="text-sm text-gray-600">
                  Show your membership QR at the gate when you arrive. Get checked in and earn 10 points every home game.
                </p>
              </div>
            </div>

            {/* Bar Purchase */}
            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Beer className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">Bar Purchase</h3>
                  <span className="text-2xl font-bold text-amber-600">+5</span>
                </div>
                <p className="text-sm text-gray-600">
                  Show your membership QR when ordering drinks at the bar. Earn 5 points per transaction.
                </p>
              </div>
            </div>

            {/* Leagues Club */}
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">Leagues Club Bonus</h3>
                  <span className="text-2xl font-bold text-purple-600">+20</span>
                </div>
                <p className="text-sm text-gray-600">
                  Head to Central Leagues Club after the game. Show your QR for a massive 20 bonus points (once per day).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Example: One Game Day
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span>Scan in at gate</span>
              <span className="font-bold">+10 points</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span>Buy 2 beers at bar</span>
              <span className="font-bold">+10 points</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span>Visit Leagues Club after</span>
              <span className="font-bold">+20 points</span>
            </div>
            <div className="flex items-center justify-between pt-3 text-lg">
              <span className="font-bold">Total for the day:</span>
              <span className="text-2xl font-bold">40 points</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-emerald-100">
            After just 3 games like this, you'll have enough for a free beer! (100 points)
          </p>
        </div>

        {/* Rewards Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-900">What You Can Redeem</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Free Mid Strength Beer</p>
                <p className="text-sm text-gray-500">Perfect for a match day drink</p>
              </div>
              <span className="text-xl font-bold text-amber-600">100 pts</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Free Full Strength Beer</p>
                <p className="text-sm text-gray-500">Your favourite full strength</p>
              </div>
              <span className="text-xl font-bold text-amber-600">150 pts</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">$20 Merchandise Voucher</p>
                <p className="text-sm text-gray-500">Get some Butcher Boys gear</p>
              </div>
              <span className="text-xl font-bold text-amber-600">250 pts</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Prize Draw Entry</p>
                <p className="text-sm text-gray-500">Chance to win big prizes</p>
              </div>
              <span className="text-xl font-bold text-amber-600">300 pts</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link to={createPageUrl('PointsRewards')}>
          <Button className="w-full bg-amber-500 hover:bg-amber-600 py-6 text-lg">
            View My Points & Rewards
          </Button>
        </Link>
      </div>
    </div>
  );
}