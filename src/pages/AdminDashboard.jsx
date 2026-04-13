import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, CreditCard, Gift, Percent, TrendingUp, Calendar, 
  BarChart3, ArrowUpRight, ArrowDownRight, QrCode, Newspaper,
  Menu, X, ChevronRight, Shield, Bell, MessageSquare, LineChart, AlertTriangle, BookOpen,
  LayoutDashboard, UserCog, Upload, Ticket, ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const tabMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'AdminDashboard' },
  { icon: Users, label: 'Members', page: 'AdminMembers' },
  { icon: UserCog, label: 'Users', page: 'AdminUsers' },
  { icon: Upload, label: 'Bulk Import', page: 'AdminBulkImport' },
  { icon: Gift, label: 'Rewards', page: 'AdminRewards' },
  { icon: Percent, label: 'Offers', page: 'AdminOffers' },
  { icon: Shield, label: 'Sponsors', page: 'AdminSponsors' },
  { icon: QrCode, label: 'QR Codes', page: 'AdminQRCodes' },
  { icon: Newspaper, label: 'News', page: 'AdminNews' },
  { icon: Calendar, label: 'Fixtures', page: 'AdminFixtures' },
  { icon: Calendar, label: 'Events', page: 'AdminEvents' },
  { icon: Ticket, label: 'Game Day', page: 'AdminGameDay' },
  { icon: ShoppingBag, label: 'Transactions', page: 'AdminTransactions' },
];

const adminMenuItems = [
  { icon: Users, label: 'Members', page: 'AdminMembers', color: 'bg-blue-500' },
  { icon: Gift, label: 'Rewards', page: 'AdminRewards', color: 'bg-amber-500' },
  { icon: Percent, label: 'Offers', page: 'AdminOffers', color: 'bg-emerald-500' },
  { icon: Shield, label: 'Sponsors', page: 'AdminSponsors', color: 'bg-purple-500' },
  { icon: QrCode, label: 'QR Codes', page: 'AdminQRCodes', color: 'bg-cyan-500' },
  { icon: Newspaper, label: 'News', page: 'AdminNews', color: 'bg-pink-500' },
  { icon: Calendar, label: 'Fixtures', page: 'AdminFixtures', color: 'bg-indigo-500' },
  { icon: MessageSquare, label: 'Comms', page: 'AdminFixturesComms', color: 'bg-sky-500' },
  { icon: Calendar, label: 'Events', page: 'AdminEvents', color: 'bg-orange-500' },
  { icon: Bell, label: 'Push Alerts', page: 'AdminPushNotifications', color: 'bg-red-500' },
  { icon: MessageSquare, label: 'SMS', page: 'AdminSMSNotifications', color: 'bg-green-500' },
  { icon: LineChart, label: 'Performance', page: 'AdminPerformance', color: 'bg-violet-500' },
  { icon: AlertTriangle, label: 'Monitoring', page: 'AdminMonitoring', color: 'bg-rose-500' },
  { icon: Upload, label: 'Bulk Sponsors', page: 'AdminBulkImportSponsors', color: 'bg-teal-500' },
];

export default function AdminDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: memberships = [] } = useQuery({
    queryKey: ['allMemberships'],
    queryFn: () => base44.entities.Membership.list()
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ['allCheckins'],
    queryFn: () => base44.entities.CheckIn.list('-timestamp', 500)
  });

  const { data: offerRedemptions = [] } = useQuery({
    queryKey: ['allOfferRedemptions'],
    queryFn: () => base44.entities.OfferRedemption.list('-timestamp', 500)
  });

  const { data: rewardRedemptions = [] } = useQuery({
    queryKey: ['allRewardRedemptions'],
    queryFn: () => base44.entities.RewardRedemption.list('-created_date', 500)
  });

  // Stats calculations
  const activeMemberships = memberships.filter(m => m.status === 'active').length;
  const thisMonthMemberships = memberships.filter(m => {
    const created = new Date(m.created_date);
    return created >= startOfMonth(new Date()) && created <= endOfMonth(new Date());
  }).length;

  const weekAgo = subDays(new Date(), 7);
  const weekCheckins = checkins.filter(c => new Date(c.timestamp) >= weekAgo).length;
  
  const monthlyOfferRedemptions = offerRedemptions.filter(r => {
    const date = new Date(r.timestamp);
    return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
  }).length;

  const monthlyRewardRedemptions = rewardRedemptions.filter(r => {
    const date = new Date(r.created_date);
    return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
  }).length;

  const stats = [
    { 
      label: 'Active Members', 
      value: activeMemberships, 
      icon: Users, 
      color: 'bg-blue-500',
      trend: `+${thisMonthMemberships} this month`
    },
    { 
      label: 'Check-ins (7 days)', 
      value: weekCheckins, 
      icon: QrCode, 
      color: 'bg-emerald-500',
      trend: 'This week'
    },
    { 
      label: 'Offer Redemptions', 
      value: monthlyOfferRedemptions, 
      icon: Percent, 
      color: 'bg-purple-500',
      trend: 'This month'
    },
    { 
      label: 'Reward Claims', 
      value: monthlyRewardRedemptions, 
      icon: Gift, 
      color: 'bg-amber-500',
      trend: 'This month'
    },
  ];

  // Check if user is admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">You need admin access to view this page.</p>
          <Link to={createPageUrl('Home')}>
            <button className="px-6 py-3 bg-[#1a365d] text-white rounded-xl font-medium">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#1a365d] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="font-bold text-lg">Central Newcastle RLFC</h1>
                <p className="text-blue-200 text-xs">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')}>
                <button className="text-sm text-blue-200 hover:text-white">
                  View App →
                </button>
              </Link>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation - same as AdminLayout */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabMenuItems.map((item) => (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <button className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  item.page === 'AdminDashboard'
                    ? 'bg-[#1a365d] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {adminMenuItems.map((item) => (
            <Link key={item.page} to={createPageUrl(item.page)}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 ${item.color} rounded-lg mx-auto mb-2 flex items-center justify-center`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{stat.trend}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Staff Access */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Staff Access Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link to={createPageUrl('GateScan')}>
                <div className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <h3 className="font-bold mb-1">🎫 Gate Scanner</h3>
                  <p className="text-sm text-blue-100">Scan member & day pass QR codes</p>
                </div>
              </Link>
              <Link to={createPageUrl('BarScan')}>
                <div className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <h3 className="font-bold mb-1">🍺 Bar/Canteen Scanner</h3>
                  <p className="text-sm text-green-100">Award points for purchases</p>
                </div>
              </Link>
              <button onClick={() => { window.location.href = '/GateScan'; }} className="w-full text-left">
                <div className="p-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors h-full">
                  <h3 className="font-bold mb-1">🚪 Enter Gate Staff Mode</h3>
                  <p className="text-sm text-amber-100">Open gate scanner as admin — no role change needed</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Resources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Staff Resources & Guides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to={createPageUrl('GateStaffGuide')}>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <h3 className="font-bold text-blue-900 mb-1">Gate Staff Guide</h3>
                  <p className="text-sm text-blue-700">Entry & check-in procedures</p>
                </div>
              </Link>
              <Link to={createPageUrl('CanteenStaffGuide')}>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <h3 className="font-bold text-green-900 mb-1">Canteen Staff Guide</h3>
                  <p className="text-sm text-green-700">Bar & food service instructions</p>
                </div>
              </Link>
              <Link to={createPageUrl('TroubleshootingGuide')}>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                  <h3 className="font-bold text-amber-900 mb-1">Troubleshooting Guide</h3>
                  <p className="text-sm text-amber-700">Quick fixes for common issues</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Check-ins</span>
                <Link to={createPageUrl('AdminMembers')} className="text-sm text-blue-600 font-normal">
                  View all →
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkins.slice(0, 5).map((checkin, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{checkin.location}</p>
                        <p className="text-xs text-gray-500">
                          {checkin.timestamp && format(new Date(checkin.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {checkins.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent check-ins</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Offer Redemptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Offer Redemptions</span>
                <Link to={createPageUrl('AdminOffers')} className="text-sm text-blue-600 font-normal">
                  View all →
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {offerRedemptions.slice(0, 5).map((redemption, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Percent className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{redemption.offer_title}</p>
                        <p className="text-xs text-gray-500">{redemption.sponsor_name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {redemption.timestamp && format(new Date(redemption.timestamp), 'MMM d')}
                    </p>
                  </div>
                ))}
                {offerRedemptions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent redemptions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}