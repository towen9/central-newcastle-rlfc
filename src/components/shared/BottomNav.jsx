import React from 'react';
import { motion } from 'framer-motion';
import { Home, CreditCard, Gift, Award, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const navItems = [
  { icon: Home, label: 'Home', page: 'Home' },
  { icon: CreditCard, label: 'Membership', page: 'Membership' },
  { icon: Gift, label: 'Benefits', page: 'Benefits' },
  { icon: Award, label: 'Sponsors', page: 'Sponsors' },
  { icon: User, label: 'Profile', page: 'Profile' },
];

export default function BottomNav({ currentPage }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-2 pb-safe z-50 shadow-lg">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item, idx) => {
          const isActive = currentPage === item.page;
          return (
            <Link key={idx} to={createPageUrl(item.page)} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute bottom-1 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}