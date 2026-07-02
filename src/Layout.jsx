import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import BottomNav from './components/shared/BottomNav';
import PushNotificationManager from './components/shared/PushNotificationManager';
import PushPromptModal from './components/shared/PushPromptModal';

const t = clubConfig.theme;

const memberPages = ['Home', 'Membership', 'Benefits', 'Sponsors', 'Profile', 'CheckIn', 'Fixtures', 'News', 'PointsRewards'];
const memberPages2 = ['OldButchers', 'OldButchersHonourRoll'];
const adminPages = ['AdminDashboard', 'AdminMembers', 'AdminOffers', 'AdminRewards', 'AdminNews', 'AdminQRCodes', 'AdminSponsors', 'AdminFixtures', 'AdminEvents', 'AdminGameDay', 'AdminTransactions', 'AdminLocationDiscounts', 'AdminUsers', 'AdminBulkImport', 'AdminFixturesComms', 'AdminMonitoring', 'AdminPerformance', 'AdminPushNotifications', 'AdminSMSNotifications', 'AdminReferrals', 'GateScan', 'BarScan', 'GateStaffGuide', 'CanteenStaffGuide', 'TroubleshootingGuide', 'GateStaffLogin', 'CanteenStaffLogin', 'LeaguesClubScan', 'MerchandiseScan', 'EventReport'];

export default function Layout({ children, currentPageName }) {
  const isAdminPage = adminPages.includes(currentPageName);
  const showBottomNav = memberPages.includes(currentPageName) || memberPages2.includes(currentPageName);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="relative flex flex-col" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)`, minHeight: '100dvh' }}>
      <PushNotificationManager />
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
        .pt-safe { padding-top: env(safe-area-inset-top, 0px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        * { -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior-x: none; overscroll-behavior-y: auto; -webkit-user-select: none; user-select: none; -webkit-overflow-scrolling: touch; -webkit-touch-callout: none; }
        html, body { height: 100%; overflow-x: hidden; }
        input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }
        button, a, [role="button"], .clickable { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; touch-action: manipulation; }
        img, video { -webkit-user-select: none; user-select: none; pointer-events: none; }
      `}</style>

      {showBottomNav && (
        <header className="relative z-30 pt-safe sticky top-0" style={{ background: `${t.bg0}cc`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={clubConfig.identity.logo_url} alt={clubConfig.identity.club_name} className="w-10 h-10 object-contain bg-white rounded-full p-0.5" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold" style={{ color: t.gold }}>Central Newcastle RLFC</p>
                <h1 className="text-white text-base leading-tight" style={{ fontFamily: t.fontDisplay }}>{clubConfig.identity.short_name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: t.gold }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: t.bg0 }} />
                  </div>
                </Link>
              )}
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <Bell className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 relative z-10" style={{ paddingBottom: showBottomNav ? '110px' : '0' }}>
        {children}
      </main>

      {showBottomNav && <BottomNav currentPage={currentPageName} />}
      {!isAdminPage && <PushPromptModal />}
    </div>
  );
}