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
import { DocumentsAdmin } from "./pages/Admin/Documents";
import { DocumentsForm } from "./pages/Admin/DocumentsForm";
import { PracticeAdmin } from "./pages/Admin/Practice";
import { PracticeForm } from "./pages/Admin/PracticeForm";
import { BroadcastRecordingAdmin } from "./pages/Admin/BroadcastRecording";
import { BroadcastRecordingForm } from "./pages/Admin/BroadcastRecordingForm";
import { ParablesOfLifeAdmin } from "./pages/Admin/ParablesOfLife";
import { ParablesOfLifeForm } from "./pages/Admin/ParablesOfLifeForm";
import { ScientificDiscoveriesAdmin } from "./pages/Admin/ScientificDiscoveries";
import { ScientificDiscoveriesForm } from "./pages/Admin/ScientificDiscoveriesForm";
import { ScheduleAdmin } from "./pages/Admin/Schedule";
import { ScheduleForm } from "./pages/Admin/ScheduleForm";
import { ActivationLinksAdmin } from "./pages/Admin/ActivationLinks";
import { ActivationLinkForm } from "./pages/Admin/ActivationLinkForm";
import { LevelsAdmin } from "./pages/Admin/Levels";
import { LevelForm } from "./pages/Admin/LevelForm";
import { AssignmentsAdmin } from "./pages/Admin/Assignments";
import { AssignmentForm } from "./pages/Admin/AssignmentForm";
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
import { BotTrafficSourcesAdmin } from "./pages/Admin/BotTrafficSources";
import { ClientPageAnalytics } from "./pages/Admin/ClientPageAnalytics";
import { BotTrafficSourceForm } from "./pages/Admin/BotTrafficSourceForm";
import { ClosedClubHub } from "./pages/Admin/ClosedClubHub";
import { ClosedClubSectionForm } from "./pages/Admin/ClosedClubSectionForm";
import { ClosedClubMembers } from "./pages/Admin/ClosedClubMembers";
import { UsersAdmin } from "./pages/Admin/Users";
import { UserForm } from "./pages/Admin/UserForm";
import { ProfileAdmin } from "./pages/Admin/Profile";
import { BroadcastAdmin } from "./pages/Admin/Broadcast";
import { BroadcastFormAdmin } from "./pages/Admin/BroadcastForm";
import { BroadcastSentView } from "./pages/Admin/BroadcastSentView";
import { ModalNotificationsAdmin } from "./pages/Admin/ModalNotifications";
import { ModalNotificationFormAdmin } from "./pages/Admin/ModalNotificationForm";
import { ModalNotificationCampaignView } from "./pages/Admin/ModalNotificationCampaignView";
import { AdminsAdmin } from "./pages/Admin/Admins";
import { AdminForm } from "./pages/Admin/AdminForm";
import { AdminActionLogs } from "./pages/Admin/AdminActionLogs";
import { OperationLogs } from "./pages/Admin/OperationLogs";
import { RobokassaSuccess } from "./pages/Robokassa/Success";
import { RobokassaFail } from "./pages/Robokassa/Fail";
import { ClientPerfomance } from "./pages/User/ClientPerfomance";
import { ClientTelegramAuth } from "./pages/User/ClientTelegramAuth";
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
import { ClientBroadcastRecordingsList } from "./pages/User/ClientBroadcastRecordingsList";
import { ClientBroadcastRecording } from "./pages/User/ClientBroadcastRecording";
import { ClientParablesOfLifeList } from "./pages/User/ClientParablesOfLifeList";
import { ClientParablesOfLife } from "./pages/User/ClientParablesOfLife";
import { ClientScientificDiscoveriesList } from "./pages/User/ClientScientificDiscoveriesList";
import { ClientScientificDiscoveries } from "./pages/User/ClientScientificDiscoveries";
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
import { ClientInvitedUsers } from "./pages/User/ClientInvitedUsers.tsx";
import { ClientNavigator } from "./pages/User/ClientNavigator";
import { ClientBegginingJourney } from "./pages/User/ClientBegginingJourney";
import { ClientConnectError } from "./pages/User/ClientConnectError";
import { ClientTasks } from "./pages/User/ClientTasks";
import { ClientNewTask } from "./pages/User/ClientNewTask";
import { ClientRegion } from "./pages/User/ClientRegion";
import { ClientAppTemporarilyUnavailable } from "./pages/User/ClientAppTemporarilyUnavailable";
import { ClientDocuments } from "./pages/User/ClientDocuments";
import { ClientOperationLog } from "./pages/User/ClientOperationLog";
import { ClientDepositLog } from "./pages/User/ClientDepositLog";
import { ClientPurchaseLog } from "./pages/User/ClientPurchaseLog";
import { ClientWelcome2 } from "./pages/User/ClientWelcome2";
import { ClientContentSearch } from "./pages/User/ClientContentSearch";
import { ClientChooseYourPath } from "./pages/User/ClientChooseYourPath";
import { ClientHumanDesign } from "./pages/User/ClientHumanDesign";
import { UserIosPwaTopInset } from "./components/UserIosPwaTopInset";

// Компонент-обертка для всех маршрутов
const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            <TelegramWebAppHandler />
            <UserIosPwaTopInset />
            {children}
        </AuthProvider>
    );
};

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout><Welcome /></RootLayout>,
    },
    {
        path: "/client/telegram-auth",
        element: (
            <RootLayout>
                <ClientTelegramAuth />
            </RootLayout>
        ),
    },
    {
        path: "/main",
        element: <RootLayout><ProtectedRoute><Main /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/welcome2",
        element: <RootLayout><ProtectedRoute><ClientWelcome2 /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client-performance",
        element: <RootLayout><ProtectedRoute><ClientPerfomance /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/register",
        element: <RootLayout><ProtectedRoute><ClientRegister /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/login",
        element: <RootLayout><ProtectedRoute><ClientLogin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/about",
        element: <RootLayout><ProtectedRoute><About /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/faq",
        element: <RootLayout><ProtectedRoute><ClientFAQ /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/horoscope",
        element: <RootLayout><ProtectedRoute><ClientHoroscope /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/horoscopes",
        element: <RootLayout><ProtectedRoute><ClientHoroscopesList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/horoscope/:id",
        element: <RootLayout><ProtectedRoute><ClientHoroscopeDetail /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/transit",
        element: <RootLayout><ProtectedRoute><ClientTransit /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/transits",
        element: <RootLayout><ProtectedRoute><ClientTransitsList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/transit/:id",
        element: <RootLayout><ProtectedRoute><ClientTransitDetail /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/schumann",
        element: <RootLayout><ProtectedRoute><ClientSchumann /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/contactus",
        element: <RootLayout><ProtectedRoute><ClientContactUs /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/practices",
        element: <RootLayout><ProtectedRoute><ClientPracticesList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/practice/:id",
        element: <RootLayout><ProtectedRoute><ClientPractice /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/broadcast-recordings",
        element: <RootLayout><ProtectedRoute><ClientBroadcastRecordingsList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/broadcast-recording/:id",
        element: <RootLayout><ProtectedRoute><ClientBroadcastRecording /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/parables-of-life",
        element: <RootLayout><ProtectedRoute><ClientParablesOfLifeList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/parables-of-life/:id",
        element: <RootLayout><ProtectedRoute><ClientParablesOfLife /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/scientific-discoveries",
        element: <RootLayout><ProtectedRoute><ClientScientificDiscoveriesList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/scientific-discoveries/:id",
        element: <RootLayout><ProtectedRoute><ClientScientificDiscoveries /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/health-lab",
        element: <RootLayout><ProtectedRoute><ClientHealthLabList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/health-lab/:id",
        element: <RootLayout><ProtectedRoute><ClientHealthLab /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/relationship-workshop",
        element: <RootLayout><ProtectedRoute><ClientRelationshipWorkshopList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/relationship-workshop/:id",
        element: <RootLayout><ProtectedRoute><ClientRelationshipWorkshop /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/spirit-forge",
        element: <RootLayout><ProtectedRoute><ClientSpiritForgeList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/spirit-forge/:id",
        element: <RootLayout><ProtectedRoute><ClientSpiritForge /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/masters-tower",
        element: <RootLayout><ProtectedRoute><ClientMastersTowerList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/masters-tower/:id",
        element: <RootLayout><ProtectedRoute><ClientMastersTower /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/femininity-gazebo",
        element: <RootLayout><ProtectedRoute><ClientFemininityGazeboList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/femininity-gazebo/:id",
        element: <RootLayout><ProtectedRoute><ClientFemininityGazebo /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/consciousness-library",
        element: <RootLayout><ProtectedRoute><ClientConsciousnessLibraryList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/consciousness-library/:id",
        element: <RootLayout><ProtectedRoute><ClientConsciousnessLibrary /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/product-catalog",
        element: <RootLayout><ProtectedRoute><ClientProductCatalogList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/product-catalog/:id",
        element: <RootLayout><ProtectedRoute><ClientProductCatalog /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/analysis-health",
        element: <RootLayout><ProtectedRoute><ClientAnalysisHealthList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/analysis-health/:id",
        element: <RootLayout><ProtectedRoute><ClientAnalysisHealth /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/analysis-relationships",
        element: <RootLayout><ProtectedRoute><ClientAnalysisRelationshipsList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/analysis-relationships/:id",
        element: <RootLayout><ProtectedRoute><ClientAnalysisRelationships /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/analysis-realization",
        element: <RootLayout><ProtectedRoute><ClientAnalysisRealizationList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/analysis-realization/:id",
        element: <RootLayout><ProtectedRoute><ClientAnalysisRealization /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/psychodiagnostics",
        element: <RootLayout><ProtectedRoute><ClientPsychodiagnosticsList /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/psychodiagnostics/:id",
        element: <RootLayout><ProtectedRoute><ClientPsychodiagnostics /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/schedule",
        element: <RootLayout><ProtectedRoute><ClientSchedule /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/diary",
        element: <RootLayout><ProtectedRoute><ClientDiary /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/navigator",
        element: <RootLayout><ProtectedRoute><ClientNavigator /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/profile",
        element: <RootLayout><ProtectedRoute><ClientProfile /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/beggining-journey",
        element: <RootLayout><ProtectedRoute><ClientBegginingJourney /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/tasks",
        element: <RootLayout><ProtectedRoute><ClientTasks /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/new-task",
        element: <RootLayout><ProtectedRoute><ClientNewTask /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/region",
        element: <RootLayout><ProtectedRoute><ClientRegion /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/app-temporarily-unavailable",
        element: <RootLayout><ProtectedRoute><ClientAppTemporarilyUnavailable /></ProtectedRoute></RootLayout>,
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
        element: <RootLayout><ProtectedRoute><EaseLaunch /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/blocked-user",
        element: <RootLayout><ProtectedRoute><BlockedUser /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/blocked-browser",
        element: <RootLayout><BlockedBrowser /></RootLayout>,
    },
    {
        path: "/client/connect-error",
        element: <RootLayout><ProtectedRoute><ClientConnectError /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/invited-users",
        element: (
            <RootLayout>
                <ProtectedRoute>
                    <ClientInvitedUsers />
                </ProtectedRoute>
            </RootLayout>
        ),
    },
    {
        path: "/client/documents",
        element: <RootLayout><ProtectedRoute><ClientDocuments /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/operation-log",
        element: <RootLayout><ProtectedRoute><ClientOperationLog /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/deposit-log",
        element: <RootLayout><ProtectedRoute><ClientDepositLog /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/purchase-log",
        element: <RootLayout><ProtectedRoute><ClientPurchaseLog /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/content-search",
        element: <RootLayout><ProtectedRoute><ClientContentSearch /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/choose-your-path",
        element: <RootLayout><ProtectedRoute><ClientChooseYourPath /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/client/human-design",
        element: <RootLayout><ProtectedRoute><ClientHumanDesign /></ProtectedRoute></RootLayout>,
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
        path: "/admin/documents",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><DocumentsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/documents/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><DocumentsForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/documents/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><DocumentsForm /></ProtectedRoute></RootLayout>,
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
        path: "/admin/broadcast-recordings",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BroadcastRecordingAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/broadcast-recordings/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BroadcastRecordingForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/broadcast-recordings/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BroadcastRecordingForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/parables-of-life",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ParablesOfLifeAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/parables-of-life/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ParablesOfLifeForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/parables-of-life/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ParablesOfLifeForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/scientific-discoveries",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ScientificDiscoveriesAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/scientific-discoveries/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ScientificDiscoveriesForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/scientific-discoveries/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ScientificDiscoveriesForm /></ProtectedRoute></RootLayout>,
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
    {
        path: "/admin/activation-links",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ActivationLinksAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/activation-links/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ActivationLinkForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/activation-links/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><ActivationLinkForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/levels",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><LevelsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/levels/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><LevelForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/levels/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><LevelForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/assignments",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AssignmentsAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/assignments/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AssignmentForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/assignments/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><AssignmentForm /></ProtectedRoute></RootLayout>,
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
        path: "/admin/bot-traffic-sources",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BotTrafficSourcesAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/bot-traffic-sources/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BotTrafficSourceForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/bot-traffic-sources/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "content_manager", "manager"]}><BotTrafficSourceForm /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/closed-club",
        element: (
            <RootLayout>
                <ProtectedRoute requiredRole={["admin", "content_manager", "manager", "client_manager"]}>
                    <ClosedClubHub />
                </ProtectedRoute>
            </RootLayout>
        ),
    },
    {
        path: "/admin/closed-club/members/:context",
        element: (
            <RootLayout>
                <ProtectedRoute requiredRole={["admin", "content_manager", "manager", "client_manager"]}>
                    <ClosedClubMembers />
                </ProtectedRoute>
            </RootLayout>
        ),
    },
    {
        path: "/admin/closed-club/:section",
        element: (
            <RootLayout>
                <ProtectedRoute requiredRole={["admin", "content_manager", "manager", "client_manager"]}>
                    <ClosedClubSectionForm />
                </ProtectedRoute>
            </RootLayout>
        ),
    },
    {
        path: "/admin/client-page-analytics",
        element: (
            <RootLayout>
                <ProtectedRoute requiredRole={["admin", "manager", "client_manager"]}>
                    <ClientPageAnalytics />
                </ProtectedRoute>
            </RootLayout>
        ),
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
        path: "/admin/broadcast/sent/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><BroadcastSentView /></ProtectedRoute></RootLayout>,
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
        path: "/admin/modal-notifications/create",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><ModalNotificationFormAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/modal-notifications/edit/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><ModalNotificationFormAdmin /></ProtectedRoute></RootLayout>,
    },
    {
        path: "/admin/modal-notifications/campaign/:id",
        element: <RootLayout><ProtectedRoute requiredRole={["admin", "client_manager", "manager"]}><ModalNotificationCampaignView /></ProtectedRoute></RootLayout>,
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
        path: "/admin/operation-logs",
        element: <RootLayout><ProtectedRoute requiredRole={["admin"]}><OperationLogs /></ProtectedRoute></RootLayout>,
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