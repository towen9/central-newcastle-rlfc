import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function LatestNews({ news = [] }) {
  if (news.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Latest News</h3>
        <Link to={createPageUrl('News')} className="text-sm text-blue-600 font-medium flex items-center gap-1">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {news.slice(0, 3).map((item, idx) => (
          <Link key={idx} to={createPageUrl(`News?newsId=${item.id}`)}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4"
            >
              {item.image_url ? (
                <img 
                  loading="lazy"
                  src={item.image_url} 
                  alt={item.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">
                  {item.publish_date ? format(new Date(item.publish_date), 'MMM d, yyyy') : ''}
                </p>
                <h4 className="font-medium text-gray-900 line-clamp-2">{item.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-1 mt-1">{item.summary}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}