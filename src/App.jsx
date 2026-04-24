import { Toaster } from "@/components/ui/toaster"
import { Suspense } from 'react'
import useAppVersionCheck from '@/hooks/useAppVersionCheck'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PlayerPassInvite from './pages/PlayerPassInvite';
import AdminReferrals from './pages/AdminReferrals';
import GateQRPoster from './pages/GateQRPoster';
import AdminBulkImportSponsors from './pages/AdminBulkImportSponsors';
import MerchandiseScan from './pages/MerchandiseScan';
import MerchQRPoster from './pages/MerchQRPoster';
import MemberMerchStatus from './pages/MemberMerchStatus';
import MembershipAssistant from './pages/MembershipAssistant';
import StaffFAQ from './pages/StaffFAQ';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const hideSplash = () => {
  const splash = document.getElementById('splash');
  if (splash && !splash.classList.contains('hide')) {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 350);
  }
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Hide splash once auth state is resolved
  if (!isLoadingPublicSettings && !isLoadingAuth) {
    hideSplash();
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/PlayerPassInvite" element={<LayoutWrapper currentPageName="PlayerPassInvite"><PlayerPassInvite /></LayoutWrapper>} />
      <Route path="/AdminReferrals" element={<LayoutWrapper currentPageName="AdminReferrals"><AdminReferrals /></LayoutWrapper>} />
      <Route path="/GateQRPoster" element={<GateQRPoster />} />
      <Route path="/AdminBulkImportSponsors" element={<LayoutWrapper currentPageName="AdminBulkImportSponsors"><AdminBulkImportSponsors /></LayoutWrapper>} />
      <Route path="/MerchandiseScan" element={<LayoutWrapper currentPageName="MerchandiseScan"><MerchandiseScan /></LayoutWrapper>} />
      <Route path="/MerchQRPoster" element={<MerchQRPoster />} />
      <Route path="/MemberMerchStatus" element={<LayoutWrapper currentPageName="MemberMerchStatus"><MemberMerchStatus /></LayoutWrapper>} />
      <Route path="/MembershipAssistant" element={<MembershipAssistant />} />
      <Route path="/StaffFAQ" element={<LayoutWrapper currentPageName="StaffFAQ"><StaffFAQ /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {
  useAppVersionCheck();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App