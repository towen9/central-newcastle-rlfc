import React from 'react';
import BottomNav from './components/shared/BottomNav';
import PushNotificationManager from './components/shared/PushNotificationManager';

const memberPages = ['Home', 'Membership', 'Benefits', 'Sponsors', 'Profile', 'CheckIn', 'Fixtures', 'News', 'PointsRewards'];
const memberPages2 = ['OldButchers', 'OldButchersHonourRoll'];

const adminPages = ['AdminDashboard', 'AdminMembers', 'AdminOffers', 'AdminRewards', 'AdminNews', 'AdminQRCodes', 'AdminSponsors', 'AdminFixtures', 'AdminEvents', 'AdminGameDay', 'AdminTransactions', 'AdminLocationDiscounts', 'AdminUsers', 'AdminBulkImport', 'AdminFixturesComms', 'AdminMonitoring', 'AdminPerformance', 'AdminPushNotifications', 'AdminSMSNotifications', 'AdminReferrals', 'GateScan', 'BarScan', 'GateStaffGuide', 'CanteenStaffGuide', 'TroubleshootingGuide', 'GateStaffLogin', 'CanteenStaffLogin', 'LeaguesClubScan', 'MerchandiseScan'];

export default function Layout({ children, currentPageName }) {
  const isAdminPage = adminPages.includes(currentPageName);
  const showBottomNav = memberPages.includes(currentPageName) || memberPages2.includes(currentPageName);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <PushNotificationManager />
      <style>{`
        :root {
          --color-primary: #1a365d;
          --color-primary-light: #2c5282;
          --color-accent: #2b6cb0;
        }
        
        .dark {
          --color-primary: #2c5282;
          --color-primary-light: #3b82f6;
          --color-accent: #60a5fa;
        }
        
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
        
        .pt-safe {
          padding-top: env(safe-area-inset-top, 0px);
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Native UX */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        body {
          overscroll-behavior-x: none;
          overscroll-behavior-y: auto;
          -webkit-user-select: none;
          user-select: none;
          -webkit-overflow-scrolling: touch;
          -webkit-touch-callout: none;
        }

        html, body {
          height: 100%;
          overflow-x: hidden;
        }

        input, textarea, [contenteditable] {
          -webkit-user-select: text;
          user-select: text;
          -webkit-touch-callout: default;
        }

        button, a, [role="button"], .clickable {
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
          touch-action: manipulation;
        }

        img, video {
          -webkit-user-select: none;
          user-select: none;
          pointer-events: none;
        }
      `}</style>
      
      {children}
      
      {showBottomNav && <BottomNav currentPage={currentPageName} />}
    </div>
  );
}