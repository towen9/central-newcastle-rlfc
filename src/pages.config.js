import Home from './pages/Home';
import CheckIn from './pages/CheckIn';
import Membership from './pages/Membership';
import Rewards from './pages/Rewards';
import Offers from './pages/Offers';
import Fixtures from './pages/Fixtures';
import News from './pages/News';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminMembers from './pages/AdminMembers';
import AdminRewards from './pages/AdminRewards';
import AdminOffers from './pages/AdminOffers';
import AdminSponsors from './pages/AdminSponsors';
import AdminQRCodes from './pages/AdminQRCodes';
import AdminNews from './pages/AdminNews';
import AdminFixtures from './pages/AdminFixtures';
import AdminEvents from './pages/AdminEvents';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "CheckIn": CheckIn,
    "Membership": Membership,
    "Rewards": Rewards,
    "Offers": Offers,
    "Fixtures": Fixtures,
    "News": News,
    "Profile": Profile,
    "AdminDashboard": AdminDashboard,
    "AdminMembers": AdminMembers,
    "AdminRewards": AdminRewards,
    "AdminOffers": AdminOffers,
    "AdminSponsors": AdminSponsors,
    "AdminQRCodes": AdminQRCodes,
    "AdminNews": AdminNews,
    "AdminFixtures": AdminFixtures,
    "AdminEvents": AdminEvents,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};