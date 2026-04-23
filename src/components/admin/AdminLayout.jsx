import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, Users, Gift, Percent, QrCode, Newspaper, 
  Calendar, LayoutDashboard, ArrowLeft, Ticket, ShoppingBag, UserCog, Upload, Share2
} from 'lucide-react';

const menuItems = [
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
  { icon: Percent, label: 'Discounts', page: 'AdminLocationDiscounts' },
  { icon: Share2, label: 'Referrals', page: 'AdminReferrals' },
];

export default function AdminLayout({ children, title, currentPage }) {
  const { data: pendingMemberships = [] } = useQuery({
    queryKey: ['pendingMemberships'],
    queryFn: () => base44.entities.Membership.filter({ status: 'pending' }),
    refetchInterval: 30000
  });
  const pendingCount = pendingMemberships.length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#1a365d] text-white" style={{paddingTop: 'env(safe-area-inset-top, 0px)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('AdminDashboard')}>
                <div className="flex items-center gap-3">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
                    alt="Central Newcastle RLFC"
                    className="w-12 h-12 object-contain bg-white rounded-full p-1"
                  />
                  <div>
                    <h1 className="font-bold text-lg">Central Newcastle RLFC</h1>
                    <p className="text-blue-200 text-xs">Admin</p>
                  </div>
                </div>
              </Link>
            </div>
            <Link to={createPageUrl('Home')}>
              <button className="text-sm text-blue-200 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to App
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {menuItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <button className={`relative flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-[#1a365d] text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.page === 'AdminMembers' && pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </Link>
              );
            })}
            <Link to="/MerchandiseScan">
              <button className={`relative flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                currentPage === 'MerchandiseScan'
                  ? 'bg-[#1a365d] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
                <ShoppingBag className="w-4 h-4" />
                Merch Scan
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Page Header */}
      {title && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}