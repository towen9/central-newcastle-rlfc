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
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;

const categoryColors = {
  announcement: t.royal,
  match_report: t.green,
  player_news: '#7c3aed',
  community: t.gold,
  sponsor: '#ec4899',
  general: 'rgba(255,255,255,0.4)'
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
    <div className="min-h-full pb-24" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Header */}
      <div className="pt-safe px-5 py-4 flex items-center gap-4">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <div>
          <Eyebrow color={t.gold}>Latest Updates</Eyebrow>
          <h1 className="text-white text-xl font-bold" style={{ fontFamily: t.fontDisplay }}>Club News</h1>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-5 py-4">
        {news.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <h3 className="font-semibold text-white mb-1" style={{ fontFamily: t.fontBody }}>No news yet</h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Check back soon for updates</p>
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
              >
                <GlassCard className="overflow-hidden cursor-pointer">
                  {item.image_url && (
                    <img 
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ background: `${categoryColors[item.category] || categoryColors.general}22`, color: categoryColors[item.category] || categoryColors.general }}>
                        {item.category?.replace('_', ' ')}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {item.publish_date && format(new Date(item.publish_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2" style={{ fontFamily: t.fontBody }}>{item.title}</h3>
                    <p className="line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.summary}</p>
                  </div>
                </GlassCard>
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
              >
                <GlassCard className="p-4 flex gap-4 cursor-pointer">
                  {item.image_url ? (
                    <img 
                      src={item.image_url}
                      alt={item.title}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Newspaper className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: `${categoryColors[item.category] || categoryColors.general}22`, color: categoryColors[item.category] || categoryColors.general }}>
                        {item.category?.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white line-clamp-2 mb-1 text-sm" style={{ fontFamily: t.fontBody }}>{item.title}</h3>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {item.publish_date && format(new Date(item.publish_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </GlassCard>
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
              className="min-h-screen sm:min-h-0 sm:max-w-2xl sm:mx-auto sm:my-8 sm:rounded-2xl overflow-hidden"
              style={{ background: `linear-gradient(180deg, ${t.bg1}, ${t.bg0})`, border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Header */}
              <div className="sticky top-0 px-4 py-3 flex items-center justify-between z-10" style={{ background: `${t.bg0}cc`, backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ background: `${categoryColors[selectedNews.category] || categoryColors.general}22`, color: categoryColors[selectedNews.category] || categoryColors.general }}>
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
                <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <Calendar className="w-4 h-4" />
                  {selectedNews.publish_date && format(new Date(selectedNews.publish_date), 'MMMM d, yyyy')}
                </div>

                <h1 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: t.fontDisplay }}>{selectedNews.title}</h1>

                {selectedNews.summary && (
                  <p className="text-lg mb-6 pl-4" style={{ color: 'rgba(255,255,255,0.7)', borderLeft: `4px solid ${t.gold}` }}>
                    {selectedNews.summary}
                  </p>
                )}

                <div className="prose prose-invert max-w-none">
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