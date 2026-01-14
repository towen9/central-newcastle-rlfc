import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminFixtures from './pages/AdminFixtures';
import AdminMembers from './pages/AdminMembers';
import AdminNews from './pages/AdminNews';
import AdminOffers from './pages/AdminOffers';
import AdminQRCodes from './pages/AdminQRCodes';
import AdminRewards from './pages/AdminRewards';
import AdminSponsors from './pages/AdminSponsors';
import CheckIn from './pages/CheckIn';
import Fixtures from './pages/Fixtures';
import Home from './pages/Home';
import Membership from './pages/Membership';
import News from './pages/News';
import Offers from './pages/Offers';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import Benefits from './pages/Benefits';
import Sponsors from './pages/Sponsors';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminEvents": AdminEvents,
    "AdminFixtures": AdminFixtures,
    "AdminMembers": AdminMembers,
    "AdminNews": AdminNews,
    "AdminOffers": AdminOffers,
    "AdminQRCodes": AdminQRCodes,
    "AdminRewards": AdminRewards,
    "AdminSponsors": AdminSponsors,
    "CheckIn": CheckIn,
    "Fixtures": Fixtures,
    "Home": Home,
    "Membership": Membership,
    "News": News,
    "Offers": Offers,
    "Profile": Profile,
    "Rewards": Rewards,
    "Benefits": Benefits,
    "Sponsors": Sponsors,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};