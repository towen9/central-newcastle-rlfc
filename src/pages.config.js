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
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminFixtures from './pages/AdminFixtures';
import AdminGameDay from './pages/AdminGameDay';
import AdminLocationDiscounts from './pages/AdminLocationDiscounts';
import AdminMembers from './pages/AdminMembers';
import AdminNews from './pages/AdminNews';
import AdminOffers from './pages/AdminOffers';
import AdminPushNotifications from './pages/AdminPushNotifications';
import AdminQRCodes from './pages/AdminQRCodes';
import AdminRewards from './pages/AdminRewards';
import AdminSponsors from './pages/AdminSponsors';
import AdminTransactions from './pages/AdminTransactions';
import BarScan from './pages/BarScan';
import Benefits from './pages/Benefits';
import CheckIn from './pages/CheckIn';
import DayPass from './pages/DayPass';
import DayPassQR from './pages/DayPassQR';
import Fixtures from './pages/Fixtures';
import GameDayCheckIn from './pages/GameDayCheckIn';
import GameDayPass from './pages/GameDayPass';
import GateScan from './pages/GateScan';
import Home from './pages/Home';
import HowPointsWork from './pages/HowPointsWork';
import JoinMembership from './pages/JoinMembership';
import LeaguesClubScan from './pages/LeaguesClubScan';
import Membership from './pages/Membership';
import MyDayPass from './pages/MyDayPass';
import News from './pages/News';
import Offers from './pages/Offers';
import PhotoCapture from './pages/PhotoCapture';
import PointsRewards from './pages/PointsRewards';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import Sponsors from './pages/Sponsors';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminEvents": AdminEvents,
    "AdminFixtures": AdminFixtures,
    "AdminGameDay": AdminGameDay,
    "AdminLocationDiscounts": AdminLocationDiscounts,
    "AdminMembers": AdminMembers,
    "AdminNews": AdminNews,
    "AdminOffers": AdminOffers,
    "AdminPushNotifications": AdminPushNotifications,
    "AdminQRCodes": AdminQRCodes,
    "AdminRewards": AdminRewards,
    "AdminSponsors": AdminSponsors,
    "AdminTransactions": AdminTransactions,
    "BarScan": BarScan,
    "Benefits": Benefits,
    "CheckIn": CheckIn,
    "DayPass": DayPass,
    "DayPassQR": DayPassQR,
    "Fixtures": Fixtures,
    "GameDayCheckIn": GameDayCheckIn,
    "GameDayPass": GameDayPass,
    "GateScan": GateScan,
    "Home": Home,
    "HowPointsWork": HowPointsWork,
    "JoinMembership": JoinMembership,
    "LeaguesClubScan": LeaguesClubScan,
    "Membership": Membership,
    "MyDayPass": MyDayPass,
    "News": News,
    "Offers": Offers,
    "PhotoCapture": PhotoCapture,
    "PointsRewards": PointsRewards,
    "Profile": Profile,
    "Rewards": Rewards,
    "Sponsors": Sponsors,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};