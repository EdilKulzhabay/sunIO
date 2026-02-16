import { createBrowserRouter } from "react-router-dom";
import { Login } from "./pages/Login";
import { Welcome } from "./pages/User/Welcome";
import { Main } from "./pages/User/Main";
import { Main as AdminMain } from "./pages/Admin/Main";
import { Register } from "./pages/Register";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { FAQAdmin } from "./pages/Admin/FAQ";
import { FAQForm } from "./pages/Admin/FAQForm";
import { PracticeAdmin } from "./pages/Admin/Practice";
import { PracticeForm } from "./pages/Admin/PracticeForm";
import { ScheduleAdmin } from "./pages/Admin/Schedule";
import { ScheduleForm } from "./pages/Admin/ScheduleForm";
import { HealthLabAdmin } from "./pages/Admin/HealthLab";
import { HealthLabForm } from "./pages/Admin/HealthLabForm";
import { RelationshipWorkshopAdmin } from "./pages/Admin/RelationshipWorkshop";
import { RelationshipWorkshopForm } from "./pages/Admin/RelationshipWorkshopForm";
import { SpiritForgeAdmin } from "./pages/Admin/SpiritForge";
import { SpiritForgeForm } from "./pages/Admin/SpiritForgeForm";
import { MastersTowerAdmin } from "./pages/Admin/MastersTower";
import { MastersTowerForm } from "./pages/Admin/MastersTowerForm";
import { FemininityGazeboAdmin } from "./pages/Admin/FemininityGazebo";
import { FemininityGazeboForm } from "./pages/Admin/FemininityGazeboForm";
import { ConsciousnessLibraryAdmin } from "./pages/Admin/ConsciousnessLibrary";
import { ConsciousnessLibraryForm } from "./pages/Admin/ConsciousnessLibraryForm";
import { ProductCatalogAdmin } from "./pages/Admin/ProductCatalog";
import { ProductCatalogForm } from "./pages/Admin/ProductCatalogForm";
import { AnalysisHealthAdmin } from "./pages/Admin/AnalysisHealth";
import { AnalysisHealthForm } from "./pages/Admin/AnalysisHealthForm";
import { AnalysisRelationshipsAdmin } from "./pages/Admin/AnalysisRelationships";
import { AnalysisRelationshipsForm } from "./pages/Admin/AnalysisRelationshipsForm";
import { AnalysisRealizationAdmin } from "./pages/Admin/AnalysisRealization";
import { AnalysisRealizationForm } from "./pages/Admin/AnalysisRealizationForm";
import { PsychodiagnosticsAdmin } from "./pages/Admin/Psychodiagnostics";
import { PsychodiagnosticsForm } from "./pages/Admin/PsychodiagnosticsForm";
import { DynamicContentAdmin } from "./pages/Admin/DynamicContent";
import { DynamicContentForm } from "./pages/Admin/DynamicContentForm";
import { WelcomeAdmin } from "./pages/Admin/Welcome";
import { WelcomeForm } from "./pages/Admin/WelcomeForm";
import { AboutClubAdmin } from "./pages/Admin/AboutClub";
import { AboutClubForm } from "./pages/Admin/AboutClubForm";
import { BegginingJourneyAdmin } from "./pages/Admin/BegginingJourney";
import { BegginingJourneyForm } from "./pages/Admin/BegginingJourneyForm";
import { NavigatorDescriptionsAdmin } from "./pages/Admin/NavigatorDescriptions";
import { NavigatorDescriptionsForm } from "./pages/Admin/NavigatorDescriptionsForm";
import { PointsAwardingPolicyAdmin } from "./pages/Admin/PointsAwardingPolicy";
import { PointsAwardingPolicyForm } from "./pages/Admin/PointsAwardingPolicyForm";
import { UsersAdmin } from "./pages/Admin/Users";
import { UserForm } from "./pages/Admin/UserForm";
import { ProfileAdmin } from "./pages/Admin/Profile";
import { BroadcastAdmin } from "./pages/Admin/Broadcast";
import { BroadcastFormAdmin } from "./pages/Admin/BroadcastForm";
import { ModalNotificationsAdmin } from "./pages/Admin/ModalNotifications";
import { AdminsAdmin } from "./pages/Admin/Admins";
import { AdminForm } from "./pages/Admin/AdminForm";
import { AdminActionLogs } from "./pages/Admin/AdminActionLogs";
import { RobokassaSuccess } from "./pages/Robokassa/Success";
import { RobokassaFail } from "./pages/Robokassa/Fail";
import { ClientPerfomance } from "./pages/User/ClientPerfomance";
import { ClientRegister } from "./pages/User/ClientRegister";
import { ClientLogin } from "./pages/User/ClientLogin";
import { About } from "./pages/User/About";
import { ClientFAQ } from "./pages/User/ClientFAQ";
import { ClientHoroscope } from "./pages/User/ClientHoroscope";
import { ClientHoroscopesList } from "./pages/User/ClientHoroscopesList";
import { ClientHoroscopeDetail } from "./pages/User/ClientHoroscopeDetail";
import { ClientTransit } from "./pages/User/ClientTransit";
import { ClientTransitsList } from "./pages/User/ClientTransitsList";
import { ClientTransitDetail } from "./pages/User/ClientTransitDetail";
import { ClientSchumann } from "./pages/User/ClientSchumann";
import { ClientContactUs } from "./pages/User/ClientContactUs";
import { ClientPracticesList } from "./pages/User/ClientPracticesList";
import { ClientPractice } from "./pages/User/ClientPractice";
import { ClientHealthLabList } from "./pages/User/ClientHealthLabList";
import { ClientHealthLab } from "./pages/User/ClientHealthLab";
import { ClientRelationshipWorkshopList } from "./pages/User/ClientRelationshipWorkshopList";
import { ClientRelationshipWorkshop } from "./pages/User/ClientRelationshipWorkshop";
import { ClientSpiritForgeList } from "./pages/User/ClientSpiritForgeList";
import { ClientSpiritForge } from "./pages/User/ClientSpiritForge";
import { ClientMastersTowerList } from "./pages/User/ClientMastersTowerList";
import { ClientMastersTower } from "./pages/User/ClientMastersTower";
import { ClientFemininityGazeboList } from "./pages/User/ClientFemininityGazeboList";
import { ClientFemininityGazebo } from "./pages/User/ClientFemininityGazebo";
import { ClientConsciousnessLibraryList } from "./pages/User/ClientConsciousnessLibraryList";
import { ClientConsciousnessLibrary } from "./pages/User/ClientConsciousnessLibrary";
import { ClientProductCatalogList } from "./pages/User/ClientProductCatalogList";
import { ClientProductCatalog } from "./pages/User/ClientProductCatalog";
import { ClientAnalysisHealthList } from "./pages/User/ClientAnalysisHealthList";
import { ClientAnalysisHealth } from "./pages/User/ClientAnalysisHealth";
import { ClientAnalysisRelationshipsList } from "./pages/User/ClientAnalysisRelationshipsList";
import { ClientAnalysisRelationships } from "./pages/User/ClientAnalysisRelationships";
import { ClientAnalysisRealizationList } from "./pages/User/ClientAnalysisRealizationList";
import { ClientAnalysisRealization } from "./pages/User/ClientAnalysisRealization";
import { ClientPsychodiagnosticsList } from "./pages/User/ClientPsychodiagnosticsList";
import { ClientPsychodiagnostics } from "./pages/User/ClientPsychodiagnostics";
import { ClientSchedule } from "./pages/User/ClientSchedule";
import { ClientDiary } from "./pages/User/ClientDiary";
import { ClientProfile } from "./pages/User/ClientProfile";
import { TelegramWebAppHandler } from "./components/TelegramWebAppHandler";
import { BlockedUser } from "./pages/User/BlockedUser";
import { BlockedBrowser } from "./pages/User/BlockedBrowser";
import { EaseLaunch } from "./pages/User/EaseLaunch";
import { TelegramGuard } from "./components/TelegramGuard";
import { ClientInvitedUsers } from "./pages/User/ClientInvitedUsers.tsx";
import { ClientNavigator } from "./pages/User/ClientNavigator";
import { ClientBegginingJourney } from "./pages/User/ClientBegginingJourney";
import { ClientConnectError } from "./pages/User/ClientConnectError";
import { ClientTasks } from "./pages/User/ClientTasks";

// Компонент-обертка для всех маршрутов
const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            <TelegramWebAppHandler />
            {children}
        </AuthProvider>
    );
};

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout><TelegramGuard><Welcome /></TelegramGuard></RootLayout>,
    },
    {
        path: "/main",
        element: <RootLayout><TelegramGuard><ProtectedRoute><Main /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client-performance",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientPerfomance /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/register",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientRegister /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/login",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientLogin /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/about",
        element: <RootLayout><TelegramGuard><ProtectedRoute><About /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/faq",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientFAQ /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/horoscope",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientHoroscope /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/horoscopes",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientHoroscopesList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/horoscope/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientHoroscopeDetail /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/transit",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientTransit /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/transits",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientTransitsList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/transit/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientTransitDetail /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/schumann",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientSchumann /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/contactus",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientContactUs /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/practices",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientPracticesList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/practice/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientPractice /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/health-lab",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientHealthLabList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/health-lab/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientHealthLab /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/relationship-workshop",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientRelationshipWorkshopList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/relationship-workshop/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientRelationshipWorkshop /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/spirit-forge",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientSpiritForgeList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/spirit-forge/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientSpiritForge /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/masters-tower",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientMastersTowerList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/masters-tower/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientMastersTower /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/femininity-gazebo",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientFemininityGazeboList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/femininity-gazebo/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientFemininityGazebo /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/consciousness-library",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientConsciousnessLibraryList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/consciousness-library/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientConsciousnessLibrary /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/product-catalog",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientProductCatalogList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/product-catalog/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientProductCatalog /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/analysis-health",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientAnalysisHealthList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/analysis-health/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientAnalysisHealth /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/analysis-relationships",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientAnalysisRelationshipsList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/analysis-relationships/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientAnalysisRelationships /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/analysis-realization",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientAnalysisRealizationList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/analysis-realization/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientAnalysisRealization /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/psychodiagnostics",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientPsychodiagnosticsList /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/psychodiagnostics/:id",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientPsychodiagnostics /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/schedule",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientSchedule /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/diary",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientDiary /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/navigator",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientNavigator /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/profile",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientProfile /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/beggining-journey",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientBegginingJourney /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/tasks",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientTasks /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/login",
        element: <RootLayout><Login /></RootLayout>,
    },
    {
        path: "/register",
        element: <RootLayout><Register /></RootLayout>,
    },
    {
        path: "/client/ease-launch",
        element: <RootLayout><TelegramGuard><ProtectedRoute><EaseLaunch /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/blocked-user",
        element: <RootLayout><TelegramGuard><ProtectedRoute><BlockedUser /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/blocked-browser",
        element: <RootLayout><BlockedBrowser /></RootLayout>,
    },
    {
        path: "/client/connect-error",
        element: <RootLayout><TelegramGuard><ProtectedRoute><ClientConnectError /></ProtectedRoute></TelegramGuard></RootLayout>,
    },
    {
        path: "/client/invited-users",
        element: <RootLayout><ClientInvitedUsers /></RootLayout>,
    },
    {
        path: "/admin",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "client_manager", "manager"]}><AdminMain /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/faq",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><FAQAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/faq/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><FAQForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/faq/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><FAQForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/practice",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PracticeAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/practice/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PracticeForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/practice/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PracticeForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/schedule",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ScheduleAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/schedule/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ScheduleForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/schedule/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ScheduleForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== HealthLab (Лаборатория здоровья) ====================
    {
        path: "/admin/health-lab",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><HealthLabAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/health-lab/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><HealthLabForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/health-lab/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><HealthLabForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== RelationshipWorkshop (Мастерская отношений) ====================
    {
        path: "/admin/relationship-workshop",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><RelationshipWorkshopAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/relationship-workshop/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><RelationshipWorkshopForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/relationship-workshop/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><RelationshipWorkshopForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== SpiritForge (Кузница Духа) ====================
    {
        path: "/admin/spirit-forge",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><SpiritForgeAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/spirit-forge/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><SpiritForgeForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/spirit-forge/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><SpiritForgeForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== MastersTower (Башня мастеров) ====================
    {
        path: "/admin/masters-tower",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><MastersTowerAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/masters-tower/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><MastersTowerForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/masters-tower/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><MastersTowerForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== FemininityGazebo (Беседка женственности) ====================
    {
        path: "/admin/femininity-gazebo",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><FemininityGazeboAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/femininity-gazebo/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><FemininityGazeboForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/femininity-gazebo/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><FemininityGazeboForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== ConsciousnessLibrary (Библиотека сознания) ====================
    {
        path: "/admin/consciousness-library",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ConsciousnessLibraryAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/consciousness-library/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ConsciousnessLibraryForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/consciousness-library/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ConsciousnessLibraryForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== ProductCatalog (Каталог платных продуктов) ====================
    {
        path: "/admin/product-catalog",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ProductCatalogAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/product-catalog/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ProductCatalogForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/product-catalog/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ProductCatalogForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== AnalysisHealth (Разборы - Здоровье) ====================
    {
        path: "/admin/analysis-health",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisHealthAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/analysis-health/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisHealthForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/analysis-health/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisHealthForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== AnalysisRelationships (Разборы - Отношения) ====================
    {
        path: "/admin/analysis-relationships",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisRelationshipsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/analysis-relationships/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisRelationshipsForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/analysis-relationships/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisRelationshipsForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== AnalysisRealization (Разборы - Реализация) ====================
    {
        path: "/admin/analysis-realization",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisRealizationAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/analysis-realization/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisRealizationForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/analysis-realization/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AnalysisRealizationForm /></ProtectedRoute></RootLayout>,
    },
    // ==================== Psychodiagnostics (Психодиагностика) ====================
    {
        path: "/admin/psychodiagnostics",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PsychodiagnosticsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/psychodiagnostics/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PsychodiagnosticsForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/psychodiagnostics/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PsychodiagnosticsForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/dynamic-content",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><DynamicContentAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/dynamic-content/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><DynamicContentForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/dynamic-content/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><DynamicContentForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/welcome",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><WelcomeAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/welcome/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><WelcomeForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/welcome/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><WelcomeForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/about-club",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AboutClubAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/about-club/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AboutClubForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/about-club/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AboutClubForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/beggining-journey",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BegginingJourneyAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/beggining-journey/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BegginingJourneyForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/beggining-journey/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BegginingJourneyForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/navigator-descriptions",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><NavigatorDescriptionsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/navigator-descriptions/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><NavigatorDescriptionsForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/navigator-descriptions/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><NavigatorDescriptionsForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/points-awarding-policy",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PointsAwardingPolicyAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/points-awarding-policy/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PointsAwardingPolicyForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/points-awarding-policy/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><PointsAwardingPolicyForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/users",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><UsersAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/users/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><UserForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/users/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><UserForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/profile",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "client_manager", "manager"]}><ProfileAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/broadcast",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><BroadcastAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/broadcast/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><BroadcastFormAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/broadcast/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><BroadcastFormAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/modal-notifications",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><ModalNotificationsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/admins",
        element: <RootLayout><ProtectedRoute requiredRole={["admin"]}><AdminsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/admins/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin"]}><AdminForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/admins/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin"]}><AdminForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/action-logs",
        element: <RootLayout><ProtectedRoute requiredRole={["admin"]}><AdminActionLogs /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/robokassa_callback/success",
        element: <RootLayout><RobokassaSuccess /></RootLayout>,
    },
    {
        path: "/robokassa_callback/fail",
        element: <RootLayout><RobokassaFail /></RootLayout>,
    },
])