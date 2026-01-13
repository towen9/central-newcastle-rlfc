import React from 'react';
import BottomNav from './components/shared/BottomNav';

const memberPages = ['Home', 'Membership', 'Rewards', 'Offers', 'Profile', 'CheckIn', 'Fixtures', 'News'];
const adminPages = ['AdminDashboard', 'AdminMembers', 'AdminOffers', 'AdminRewards', 'AdminNews', 'AdminQRCodes', 'AdminSponsors', 'AdminFixtures', 'AdminEvents'];

export default function Layout({ children, currentPageName }) {
  const isAdminPage = adminPages.includes(currentPageName);
  const showBottomNav = memberPages.includes(currentPageName);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --color-primary: #1a365d;
          --color-primary-light: #2c5282;
          --color-accent: #2b6cb0;
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
      `}</style>
      
      {children}
      
      {showBottomNav && <BottomNav currentPage={currentPageName} />}
    </div>
  );
}