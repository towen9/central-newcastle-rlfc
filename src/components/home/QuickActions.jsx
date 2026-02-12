import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Gift, Percent, Calendar, Globe, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const actions = [
  { icon: QrCode, label: 'Check In', page: 'CheckIn', color: 'bg-blue-500' },
  { icon: Ticket, label: 'Day Pass', page: 'DayPass', color: 'bg-indigo-600' },
  { icon: Gift, label: 'Rewards', page: 'Rewards', color: 'bg-amber-500' },
  { icon: Percent, label: 'Offers', page: 'Offers', color: 'bg-emerald-500' },
  { icon: Calendar, label: 'Fixtures', page: 'Fixtures', color: 'bg-purple-500' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {actions.map((action, idx) => {
        const content = (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`w-11 h-11 ${action.color} rounded-xl flex items-center justify-center shadow-md`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">{action.label}</span>
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