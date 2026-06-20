import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SupporterPackAlert({ membership }) {
  const [dismissed, setDismissed] = useState(false);

  if (!membership?.tier_name?.includes('Supporter Pack')) return null;

  const remaining = membership.games_remaining ?? 0;

  if (remaining === 0) {
    // Persistent — no dismiss
    return (
      <div className="rounded-2xl overflow-hidden bg-red-50 border border-red-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <RefreshCw className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Your Supporter Pack has run out 🏉</p>
            <p className="text-xs text-red-600 mt-1">
              Upgrade to a Premium membership for $75 and get entry to every remaining home game, a member hat and 20% off merch.
            </p>
            <Link to={createPageUrl('JoinMembership')}>
              <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (remaining === 1 && !dismissed) {
    return (
      <div className="rounded-2xl overflow-hidden bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">1 game entry left</p>
            <p className="text-xs text-amber-700 mt-1">
              You have 1 entry remaining on your Supporter Pack. Consider upgrading to Premium to keep coming all season.
            </p>
            <Link to={createPageUrl('JoinMembership')}>
              <Button size="sm" variant="outline" className="mt-3 border-amber-400 text-amber-800 hover:bg-amber-100">
                View Membership Options
              </Button>
            </Link>
          </div>
          <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}