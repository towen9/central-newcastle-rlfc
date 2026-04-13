/**
 * pages.config.js - Page routing configuration
 * Home is eagerly loaded; all other pages are lazy-loaded to reduce initial bundle size.
 */
import { lazy } from 'react';
import Home from './pages/Home';
import __Layout from './Layout.jsx';

const AdminBulkImport = lazy(() => import('./pages/AdminBulkImport'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminEvents = lazy(() => import('./pages/AdminEvents'));
const AdminFixtures = lazy(() => import('./pages/AdminFixtures'));
const AdminFixturesComms = lazy(() => import('./pages/AdminFixturesComms'));
const AdminGameDay = lazy(() => import('./pages/AdminGameDay'));
const AdminLocationDiscounts = lazy(() => import('./pages/AdminLocationDiscounts'));
const AdminMembers = lazy(() => import('./pages/AdminMembers'));
const AdminMonitoring = lazy(() => import('./pages/AdminMonitoring'));
const AdminNews = lazy(() => import('./pages/AdminNews'));
const AdminOffers = lazy(() => import('./pages/AdminOffers'));
const AdminPerformance = lazy(() => import('./pages/AdminPerformance'));
const AdminPushNotifications = lazy(() => import('./pages/AdminPushNotifications'));
const AdminQRCodes = lazy(() => import('./pages/AdminQRCodes'));
const AdminRewards = lazy(() => import('./pages/AdminRewards'));
const AdminSMSNotifications = lazy(() => import('./pages/AdminSMSNotifications'));
const AdminSponsors = lazy(() => import('./pages/AdminSponsors'));
const AdminTransactions = lazy(() => import('./pages/AdminTransactions'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const BarScan = lazy(() => import('./pages/BarScan'));
const Benefits = lazy(() => import('./pages/Benefits'));
const CanteenStaffGuide = lazy(() => import('./pages/CanteenStaffGuide'));
const CanteenStaffLogin = lazy(() => import('./pages/CanteenStaffLogin'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const DayPass = lazy(() => import('./pages/DayPass'));
const DayPassQR = lazy(() => import('./pages/DayPassQR'));
const Fixtures = lazy(() => import('./pages/Fixtures'));
const GameDayCheckIn = lazy(() => import('./pages/GameDayCheckIn'));
const GameDayPass = lazy(() => import('./pages/GameDayPass'));
const GateScan = lazy(() => import('./pages/GateScan'));
const GateStaffGuide = lazy(() => import('./pages/GateStaffGuide'));
const GateStaffLogin = lazy(() => import('./pages/GateStaffLogin'));
const HowPointsWork = lazy(() => import('./pages/HowPointsWork'));
const JoinMembership = lazy(() => import('./pages/JoinMembership'));
const LeaguesClubScan = lazy(() => import('./pages/LeaguesClubScan'));
const Membership = lazy(() => import('./pages/Membership'));
const MyDayPass = lazy(() => import('./pages/MyDayPass'));
const News = lazy(() => import('./pages/News'));
const Offers = lazy(() => import('./pages/Offers'));
const OldButchers = lazy(() => import('./pages/OldButchers'));
const OldButchersHonourRoll = lazy(() => import('./pages/OldButchersHonourRoll'));
const PhotoCapture = lazy(() => import('./pages/PhotoCapture'));
const PlayerPassRegistration = lazy(() => import('./pages/PlayerPassRegistration'));
const PointsRewards = lazy(() => import('./pages/PointsRewards'));
const Profile = lazy(() => import('./pages/Profile'));
const Rewards = lazy(() => import('./pages/Rewards'));
const ScanForPoints = lazy(() => import('./pages/ScanForPoints'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const TroubleshootingGuide = lazy(() => import('./pages/TroubleshootingGuide'));

export const PAGES = {
    "AdminBulkImport": AdminBulkImport,
    "AdminDashboard": AdminDashboard,
    "AdminEvents": AdminEvents,
    "AdminFixtures": AdminFixtures,
    "AdminFixturesComms": AdminFixturesComms,
    "AdminGameDay": AdminGameDay,
    "AdminLocationDiscounts": AdminLocationDiscounts,
    "AdminMembers": AdminMembers,
    "AdminMonitoring": AdminMonitoring,
    "AdminNews": AdminNews,
    "AdminOffers": AdminOffers,
    "AdminPerformance": AdminPerformance,
    "AdminPushNotifications": AdminPushNotifications,
    "AdminQRCodes": AdminQRCodes,
    "AdminRewards": AdminRewards,
    "AdminSMSNotifications": AdminSMSNotifications,
    "AdminSponsors": AdminSponsors,
    "AdminTransactions": AdminTransactions,
    "AdminUsers": AdminUsers,
    "BarScan": BarScan,
    "Benefits": Benefits,
    "CanteenStaffGuide": CanteenStaffGuide,
    "CanteenStaffLogin": CanteenStaffLogin,
    "CheckIn": CheckIn,
    "DayPass": DayPass,
    "DayPassQR": DayPassQR,
    "Fixtures": Fixtures,
    "GameDayCheckIn": GameDayCheckIn,
    "GameDayPass": GameDayPass,
    "GateScan": GateScan,
    "GateStaffGuide": GateStaffGuide,
    "GateStaffLogin": GateStaffLogin,
    "Home": Home,
    "HowPointsWork": HowPointsWork,
    "JoinMembership": JoinMembership,
    "LeaguesClubScan": LeaguesClubScan,
    "Membership": Membership,
    "MyDayPass": MyDayPass,
    "News": News,
    "Offers": Offers,
    "OldButchers": OldButchers,
    "OldButchersHonourRoll": OldButchersHonourRoll,
    "PhotoCapture": PhotoCapture,
    "PlayerPassRegistration": PlayerPassRegistration,
    "PointsRewards": PointsRewards,
    "Profile": Profile,
    "Rewards": Rewards,
    "ScanForPoints": ScanForPoints,
    "Sponsors": Sponsors,
    "TroubleshootingGuide": TroubleshootingGuide,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};