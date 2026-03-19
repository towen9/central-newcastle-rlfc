/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminBulkImport from './pages/AdminBulkImport';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminFixtures from './pages/AdminFixtures';
import AdminFixturesComms from './pages/AdminFixturesComms';
import AdminGameDay from './pages/AdminGameDay';
import AdminLocationDiscounts from './pages/AdminLocationDiscounts';
import AdminMembers from './pages/AdminMembers';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminNews from './pages/AdminNews';
import AdminOffers from './pages/AdminOffers';
import AdminPerformance from './pages/AdminPerformance';
import AdminPushNotifications from './pages/AdminPushNotifications';
import AdminQRCodes from './pages/AdminQRCodes';
import AdminRewards from './pages/AdminRewards';
import AdminSMSNotifications from './pages/AdminSMSNotifications';
import AdminSponsors from './pages/AdminSponsors';
import AdminTransactions from './pages/AdminTransactions';
import AdminUsers from './pages/AdminUsers';
import BarScan from './pages/BarScan';
import Benefits from './pages/Benefits';
import CanteenStaffGuide from './pages/CanteenStaffGuide';
import CanteenStaffLogin from './pages/CanteenStaffLogin';
import CheckIn from './pages/CheckIn';
import DayPass from './pages/DayPass';
import DayPassQR from './pages/DayPassQR';
import Fixtures from './pages/Fixtures';
import GameDayCheckIn from './pages/GameDayCheckIn';
import GameDayPass from './pages/GameDayPass';
import GateScan from './pages/GateScan';
import GateStaffGuide from './pages/GateStaffGuide';
import GateStaffLogin from './pages/GateStaffLogin';
import Home from './pages/Home';
import HowPointsWork from './pages/HowPointsWork';
import JoinMembership from './pages/JoinMembership';
import LeaguesClubScan from './pages/LeaguesClubScan';
import Membership from './pages/Membership';
import MyDayPass from './pages/MyDayPass';
import News from './pages/News';
import Offers from './pages/Offers';
import OldButchers from './pages/OldButchers';
import OldButchersHonourRoll from './pages/OldButchersHonourRoll';
import PhotoCapture from './pages/PhotoCapture';
import PlayerPassRegistration from './pages/PlayerPassRegistration';
import PointsRewards from './pages/PointsRewards';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import ScanForPoints from './pages/ScanForPoints';
import Sponsors from './pages/Sponsors';
import TroubleshootingGuide from './pages/TroubleshootingGuide';
import __Layout from './Layout.jsx';


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