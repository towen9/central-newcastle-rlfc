import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Gift, Percent, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const actions = [
  { icon: QrCode, label: 'Check In', page: 'CheckIn', color: 'bg-blue-500' },
  { icon: Gift, label: 'Rewards', page: 'Rewards', color: 'bg-amber-500' },
  { icon: Percent, label: 'Offers', page: 'Offers', color: 'bg-emerald-500' },
  { icon: Calendar, label: 'Fixtures', page: 'Fixtures', color: 'bg-purple-500' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, idx) => (
        <Link key={idx} to={createPageUrl(action.page)}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2"
          >
            <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-lg shadow-${action.color}/30`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">{action.label}</span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}