import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Calendar, Zap, Share2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const actions = [
  { icon: Sparkles, label: 'Benefits', page: 'Benefits', color: 'bg-sky-500 dark:bg-sky-600' },
  { icon: Zap, label: 'Earn Points', page: 'ScanForPoints', color: 'bg-amber-500 dark:bg-amber-600' },
  { icon: Gift, label: 'Rewards', page: 'Rewards', color: 'bg-emerald-500 dark:bg-emerald-600' },
  { icon: Calendar, label: 'Fixtures', page: 'Fixtures', color: 'bg-purple-500 dark:bg-purple-600' },
  { icon: Share2, label: 'Share App', action: 'share', color: 'bg-pink-500 dark:bg-pink-600' },
];

export default function QuickActions() {
  const handleShare = async () => {
    const shareData = {
      title: 'Central Newcastle RLFC',
      text: 'Join Central Newcastle RLFC! Get your membership, earn rewards, and stay connected with the club.',
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.origin);
        toast.success('App link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {actions.map((action, idx) => {
        if (action.action === 'share') {
          return (
            <motion.button
              key={idx}
              onClick={handleShare}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div className={`w-11 h-11 ${action.color} rounded-xl flex items-center justify-center shadow-md`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
            </motion.button>
          );
        }

        const content = (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`w-11 h-11 ${action.color} rounded-xl flex items-center justify-center shadow-md`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
          </motion.div>
        );

        return action.external ? (
          <a key={idx} href={action.url} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        ) : (
          <Link key={idx} to={createPageUrl(action.page)}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}