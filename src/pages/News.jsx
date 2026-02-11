import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Newspaper, X, Calendar, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import PullToRefresh from '../components/shared/PullToRefresh';

const categoryColors = {
  announcement: 'bg-blue-100 text-blue-700',
  match_report: 'bg-emerald-100 text-emerald-700',
  player_news: 'bg-purple-100 text-purple-700',
  community: 'bg-amber-100 text-amber-700',
  sponsor: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700'
};

export default function News() {
  const [selectedNews, setSelectedNews] = useState(null);
  const queryClient = useQueryClient();

  const { data: news = [] } = useQuery({
    queryKey: ['news'],
    queryFn: () => base44.entities.News.filter({ is_published: true }, '-publish_date')
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['news']);
  };

  // Check URL for newsId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newsId = params.get('newsId');
    if (newsId && news.length > 0) {
      const item = news.find(n => n.id === newsId);
      if (item) setSelectedNews(item);
    }
  }, [news]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] dark:bg-gray-800 pt-safe">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-white text-xl font-bold">Club News</h1>
            <p className="text-blue-200 dark:text-gray-400 text-sm">Latest updates from Charlestown RLC</p>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-5 py-6">
        {news.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No news yet</h3>
            <p className="text-sm text-gray-500">Check back soon for updates</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured News */}
            {news.filter(n => n.is_featured).slice(0, 1).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedNews(item)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg cursor-pointer"
              >
                {item.image_url && (
                  <img 
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[item.category] || categoryColors.general}`}>
                      {item.category?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.publish_date && format(new Date(item.publish_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 line-clamp-2">{item.summary}</p>
                </div>
              </motion.div>
            ))}

            {/* Other News */}
            {news.filter(n => !n.is_featured || news.filter(x => x.is_featured).indexOf(n) > 0).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedNews(item)}
                className="bg-white rounded-xl p-4 border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                {item.image_url ? (
                  <img 
                    src={item.image_url}
                    alt={item.title}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Newspaper className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[item.category] || categoryColors.general}`}>
                      {item.category?.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">
                    {item.publish_date && format(new Date(item.publish_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </PullToRefresh>

      {/* News Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto"
            onClick={() => setSelectedNews(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="min-h-screen bg-white sm:min-h-0 sm:max-w-2xl sm:mx-auto sm:my-8 sm:rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${categoryColors[selectedNews.category] || categoryColors.general}`}>
                  {selectedNews.category?.replace('_', ' ')}
                </span>
              </div>

              {/* Image */}
              {selectedNews.image_url && (
                <img 
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="w-full h-56 sm:h-72 object-cover"
                />
              )}

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  {selectedNews.publish_date && format(new Date(selectedNews.publish_date), 'MMMM d, yyyy')}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedNews.title}</h1>

                {selectedNews.summary && (
                  <p className="text-lg text-gray-600 mb-6 border-l-4 border-[#1a365d] pl-4">
                    {selectedNews.summary}
                  </p>
                )}

                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown>{selectedNews.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}