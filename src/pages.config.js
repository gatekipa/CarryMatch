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
import AITripPlanner from './pages/AITripPlanner';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminBusApprovals from './pages/AdminBusApprovals';
import AdminBusSeatControl from './pages/AdminBusSeatControl';
import AdminBusSettings from './pages/AdminBusSettings';
import AdminDashboard from './pages/AdminDashboard';
import AdminListings from './pages/AdminListings';
import AdminVerifications from './pages/AdminVerifications';
import ApplyForVerification from './pages/ApplyForVerification';
import BoardingControl from './pages/BoardingControl';
import BrowseRequests from './pages/BrowseRequests';
import BrowseTrips from './pages/BrowseTrips';
import BusCheckout from './pages/BusCheckout';
import BusMarketingTools from './pages/BusMarketingTools';
import BusOperatorPage from './pages/BusOperatorPage';
import BusOperatorSettings from './pages/BusOperatorSettings';
import BusOperatorSignup from './pages/BusOperatorSignup';
import BusPassengerCRM from './pages/BusPassengerCRM';
import BusRatings from './pages/BusRatings';
import BusResults from './pages/BusResults';
import BusSearch from './pages/BusSearch';
import BusSeatReports from './pages/BusSeatReports';
import BusTicketConfirmation from './pages/BusTicketConfirmation';
import BusTripDetails from './pages/BusTripDetails';
import BusTrips from './pages/BusTrips';
import CarryMatchAdminAnalytics from './pages/CarryMatchAdminAnalytics';
import CarryMatchAdminApplications from './pages/CarryMatchAdminApplications';
import CarryMatchAdminAudit from './pages/CarryMatchAdminAudit';
import CarryMatchAdminBilling from './pages/CarryMatchAdminBilling';
import CarryMatchAdminDashboard from './pages/CarryMatchAdminDashboard';
import CarryMatchAdminDisputes from './pages/CarryMatchAdminDisputes';
import CarryMatchAdminSystemConfig from './pages/CarryMatchAdminSystemConfig';
import CarryMatchAdminLogin from './pages/CarryMatchAdminLogin';
import CarryMatchAdminVendorOnboarding from './pages/CarryMatchAdminVendorOnboarding';
import CarryMatchAdminVendors from './pages/CarryMatchAdminVendors';
import ContactUs from './pages/ContactUs';
import DailyCloseout from './pages/DailyCloseout';
import DriverApp from './pages/DriverApp';
import DriverDispatcher from './pages/DriverDispatcher';
import DriverPerformanceAnalytics from './pages/DriverPerformanceAnalytics';
import DriverSchedule from './pages/DriverSchedule';
import DriverTripControl from './pages/DriverTripControl';
import ETAMonitor from './pages/ETAMonitor';
import EditProfile from './pages/EditProfile';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import LeaveReview from './pages/LeaveReview';
import LogisticsPartners from './pages/LogisticsPartners';
import ManageAgentPINs from './pages/ManageAgentPINs';
import ManageBusRoutes from './pages/ManageBusRoutes';
import ManageBusTrips from './pages/ManageBusTrips';
import ManageBusVehicles from './pages/ManageBusVehicles';
import ManageDrivers from './pages/ManageDrivers';
import ManagePromoCodes from './pages/ManagePromoCodes';
import ManageRecurringServices from './pages/ManageRecurringServices';
import ManageSeatMaps from './pages/ManageSeatMaps';
import MessageTemplates from './pages/MessageTemplates';
import Messages from './pages/Messages';
import MyBusTickets from './pages/MyBusTickets';
import MyDisputes from './pages/MyDisputes';
import MyMatches from './pages/MyMatches';
import MyRequests from './pages/MyRequests';
import MyTrips from './pages/MyTrips';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import PartnerLogin from './pages/PartnerLogin';
import PartnerSignup from './pages/PartnerSignup';
import PostRequest from './pages/PostRequest';
import PostTrip from './pages/PostTrip';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PromoAnalytics from './pages/PromoAnalytics';
import PublicTracking from './pages/PublicTracking';
import RebalanceHistory from './pages/RebalanceHistory';
import ReferralAnalytics from './pages/ReferralAnalytics';
import RequestDetails from './pages/RequestDetails';
import SavedItems from './pages/SavedItems';
import SmartMatches from './pages/SmartMatches';
import SubmitDispute from './pages/SubmitDispute';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TermsAndConditions from './pages/TermsAndConditions';
import TodayManifests from './pages/TodayManifests';
import TrackMyBus from './pages/TrackMyBus';
import TripDetails from './pages/TripDetails';
import TripManifest from './pages/TripManifest';
import TripMessaging from './pages/TripMessaging';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import VendorAnalytics from './pages/VendorAnalytics';
import VendorBatchManagement from './pages/VendorBatchManagement';
import VendorBilling from './pages/VendorBilling';
import VendorBoardingDashboard from './pages/VendorBoardingDashboard';
import VendorBusCheckin from './pages/VendorBusCheckin';
import VendorBusDashboard from './pages/VendorBusDashboard';
import VendorBusReports from './pages/VendorBusReports';
import VendorCashierCloseout from './pages/VendorCashierCloseout';
import VendorDashboard from './pages/VendorDashboard';
import VendorInsuranceClaims from './pages/VendorInsuranceClaims';
import VendorNotificationLogs from './pages/VendorNotificationLogs';
import VendorNotificationTemplates from './pages/VendorNotificationTemplates';
import VendorOfflineSales from './pages/VendorOfflineSales';
import VendorPerformance from './pages/VendorPerformance';
import VendorPerformanceReviews from './pages/VendorPerformanceReviews';
import VendorPricing from './pages/VendorPricing';
import VendorRealTimeTracking from './pages/VendorRealTimeTracking';
import VendorRouteOptimization from './pages/VendorRouteOptimization';
import VendorScanUpdate from './pages/VendorScanUpdate';
import VendorShipmentDetails from './pages/VendorShipmentDetails';
import VendorShipmentIntake from './pages/VendorShipmentIntake';
import VendorShipmentPayments from './pages/VendorShipmentPayments';
import VendorShipments from './pages/VendorShipments';
import VendorSettings from './pages/VendorSettings';
import VendorStaffManagement from './pages/VendorStaffManagement';
import VendorTrackingFeedback from './pages/VendorTrackingFeedback';
import VerifyIdentity from './pages/VerifyIdentity';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AITripPlanner": AITripPlanner,
    "AdminAnalytics": AdminAnalytics,
    "AdminBusApprovals": AdminBusApprovals,
    "AdminBusSeatControl": AdminBusSeatControl,
    "AdminBusSettings": AdminBusSettings,
    "AdminDashboard": AdminDashboard,
    "AdminListings": AdminListings,
    "AdminVerifications": AdminVerifications,
    "ApplyForVerification": ApplyForVerification,
    "BoardingControl": BoardingControl,
    "BrowseRequests": BrowseRequests,
    "BrowseTrips": BrowseTrips,
    "BusCheckout": BusCheckout,
    "BusMarketingTools": BusMarketingTools,
    "BusOperatorPage": BusOperatorPage,
    "BusOperatorSettings": BusOperatorSettings,
    "BusOperatorSignup": BusOperatorSignup,
    "BusPassengerCRM": BusPassengerCRM,
    "BusRatings": BusRatings,
    "BusResults": BusResults,
    "BusSearch": BusSearch,
    "BusSeatReports": BusSeatReports,
    "BusTicketConfirmation": BusTicketConfirmation,
    "BusTripDetails": BusTripDetails,
    "BusTrips": BusTrips,
    "CarryMatchAdminAnalytics": CarryMatchAdminAnalytics,
    "CarryMatchAdminApplications": CarryMatchAdminApplications,
    "CarryMatchAdminAudit": CarryMatchAdminAudit,
    "CarryMatchAdminBilling": CarryMatchAdminBilling,
    "CarryMatchAdminDashboard": CarryMatchAdminDashboard,
    "CarryMatchAdminDisputes": CarryMatchAdminDisputes,
    "CarryMatchAdminSystemConfig": CarryMatchAdminSystemConfig,
    "CarryMatchAdminLogin": CarryMatchAdminLogin,
    "CarryMatchAdminVendorOnboarding": CarryMatchAdminVendorOnboarding,
    "CarryMatchAdminVendors": CarryMatchAdminVendors,
    "ContactUs": ContactUs,
    "DailyCloseout": DailyCloseout,
    "DriverApp": DriverApp,
    "DriverDispatcher": DriverDispatcher,
    "DriverPerformanceAnalytics": DriverPerformanceAnalytics,
    "DriverSchedule": DriverSchedule,
    "DriverTripControl": DriverTripControl,
    "ETAMonitor": ETAMonitor,
    "EditProfile": EditProfile,
    "FAQ": FAQ,
    "Home": Home,
    "LeaveReview": LeaveReview,
    "LogisticsPartners": LogisticsPartners,
    "ManageAgentPINs": ManageAgentPINs,
    "ManageBusRoutes": ManageBusRoutes,
    "ManageBusTrips": ManageBusTrips,
    "ManageBusVehicles": ManageBusVehicles,
    "ManageDrivers": ManageDrivers,
    "ManagePromoCodes": ManagePromoCodes,
    "ManageRecurringServices": ManageRecurringServices,
    "ManageSeatMaps": ManageSeatMaps,
    "MessageTemplates": MessageTemplates,
    "Messages": Messages,
    "MyBusTickets": MyBusTickets,
    "MyDisputes": MyDisputes,
    "MyMatches": MyMatches,
    "MyRequests": MyRequests,
    "MyTrips": MyTrips,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "PartnerLogin": PartnerLogin,
    "PartnerSignup": PartnerSignup,
    "PostRequest": PostRequest,
    "PostTrip": PostTrip,
    "PrivacyPolicy": PrivacyPolicy,
    "PromoAnalytics": PromoAnalytics,
    "PublicTracking": PublicTracking,
    "RebalanceHistory": RebalanceHistory,
    "ReferralAnalytics": ReferralAnalytics,
    "RequestDetails": RequestDetails,
    "SavedItems": SavedItems,
    "SmartMatches": SmartMatches,
    "SubmitDispute": SubmitDispute,
    "SuperAdminDashboard": SuperAdminDashboard,
    "TermsAndConditions": TermsAndConditions,
    "TodayManifests": TodayManifests,
    "TrackMyBus": TrackMyBus,
    "TripDetails": TripDetails,
    "TripManifest": TripManifest,
    "TripMessaging": TripMessaging,
    "UserDashboard": UserDashboard,
    "UserProfile": UserProfile,
    "VendorAnalytics": VendorAnalytics,
    "VendorBatchManagement": VendorBatchManagement,
    "VendorBilling": VendorBilling,
    "VendorBoardingDashboard": VendorBoardingDashboard,
    "VendorBusCheckin": VendorBusCheckin,
    "VendorBusDashboard": VendorBusDashboard,
    "VendorBusReports": VendorBusReports,
    "VendorCashierCloseout": VendorCashierCloseout,
    "VendorDashboard": VendorDashboard,
    "VendorInsuranceClaims": VendorInsuranceClaims,
    "VendorNotificationLogs": VendorNotificationLogs,
    "VendorNotificationTemplates": VendorNotificationTemplates,
    "VendorOfflineSales": VendorOfflineSales,
    "VendorPerformance": VendorPerformance,
    "VendorPerformanceReviews": VendorPerformanceReviews,
    "VendorPricing": VendorPricing,
    "VendorRealTimeTracking": VendorRealTimeTracking,
    "VendorRouteOptimization": VendorRouteOptimization,
    "VendorScanUpdate": VendorScanUpdate,
    "VendorShipmentDetails": VendorShipmentDetails,
    "VendorShipmentIntake": VendorShipmentIntake,
    "VendorShipmentPayments": VendorShipmentPayments,
    "VendorShipments": VendorShipments,
    "VendorSettings": VendorSettings,
    "VendorStaffManagement": VendorStaffManagement,
    "VendorTrackingFeedback": VendorTrackingFeedback,
    "VerifyIdentity": VerifyIdentity,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};