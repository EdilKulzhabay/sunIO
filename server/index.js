import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import "dotenv/config";
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { 
    UserController,
    FAQController,
    PracticeController,
    ScheduleController,
    DynamicContentController,
    WelcomeController,
    AboutClubController,
    BroadcastController,
    RobokassaController,
    UploadController,
    DiaryController,
    VideoProgressController,
    SubscriptionController,
    ModalNotificationController,
    AdminActionLogController,
    HealthLabController,
    RelationshipWorkshopController,
    SpiritForgeController,
    MastersTowerController,
    FemininityGazeboController,
    ConsciousnessLibraryController,
    ProductCatalogController,
    AnalysisHealthController,
    AnalysisRelationshipsController,
    AnalysisRealizationController,
    PsychodiagnosticsController
} from "./Controllers/index.js";
import { authMiddleware } from "./Middlewares/authMiddleware.js";
import { adminActionLogMiddleware } from "./Middlewares/adminActionLogMiddleware.js";
import User from "./Models/User.js";
import { 
    setupSwagger,
    handleSwaggerAuthCheck,
    handleSwaggerAuthLogout,
    handleSwaggerCustomJs
} from "./utils/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose
    .connect(process.env.MONGOURL)
    .then(() => {
        console.log("Mongodb OK");
    })
    .catch((err) => {
        console.log("Mongodb Error", err);
    });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(cookieParser());
app.use(cors({ 
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'X-Telegram-WebApp',
        'X-Telegram-Platform',
        'X-Telegram-Init-Data'
    ],
    exposedHeaders: ['Content-Disposition'],
    credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting для создания пользователей (5 запросов в минуту)
const createUserRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 5, // максимум 5 запросов
    message: {
        success: false,
        message: 'Слишком много попыток создания пользователя. Пожалуйста, попробуйте через минуту.'
    },
    standardHeaders: true, // Возвращает информацию о лимите в заголовках `RateLimit-*`
    legacyHeaders: false, // Отключает заголовки `X-RateLimit-*`
    // Используем IP адрес или userId для идентификации
    keyGenerator: (req) => {
        // Если пользователь авторизован, используем его ID
        if (req.userId) {
            return `user:${req.userId}`;
        }
        // Иначе используем правильный способ получения IP адреса (поддерживает IPv6)
        return ipKeyGenerator(req);
    }
});

// Rate limiting для создания контента (5 запросов в минуту)
const createContentRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 5, // максимум 5 запросов
    message: {
        success: false,
        message: 'Слишком много попыток создания контента. Пожалуйста, попробуйте через минуту.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Используем IP адрес или userId для идентификации
    keyGenerator: (req) => {
        // Если пользователь авторизован, используем его ID
        if (req.userId) {
            return `user:${req.userId}`;
        }
        // Иначе используем правильный способ получения IP адреса (поддерживает IPv6)
        return ipKeyGenerator(req);
    }
});

// ==================== Swagger UI маршруты ====================
// Маршрут для проверки пароля Swagger
app.post('/swagger-auth/check', express.json(), handleSwaggerAuthCheck);
app.post('/api/swagger-auth/check', express.json(), handleSwaggerAuthCheck);
app.post('/api/api/swagger-auth/check', express.json(), handleSwaggerAuthCheck);

// Маршрут для выхода из Swagger
app.post('/swagger-auth/logout', handleSwaggerAuthLogout);
app.post('/api/swagger-auth/logout', handleSwaggerAuthLogout);
app.post('/api/api/swagger-auth/logout', handleSwaggerAuthLogout);

// Кастомный JS для кнопки выхода
app.get('/swagger-ui/custom.js', handleSwaggerCustomJs);
app.get('/api/swagger-ui/custom.js', handleSwaggerCustomJs);
app.get('/api/api/swagger-ui/custom.js', handleSwaggerCustomJs);

// Настройка Swagger UI
setupSwagger(app);

// Публичные маршруты
app.post("/api/user/create", createUserRateLimit, UserController.createUser);
app.post("/api/user/register", createUserRateLimit, UserController.register);
app.post("/api/user/login", UserController.login);
app.post("/api/user/send-mail", UserController.sendMail);
app.post("/api/user/code-confirm", UserController.codeConfirm);
app.post("/api/user/send-mail-recovery", UserController.sendMailRecovery);
app.patch("/api/users/:telegramId", UserController.updateUserByTelegramId);
app.post("/api/send-code", UserController.sendMail);
app.post("/api/user/profile", UserController.getProfile);
app.get("/api/user/telegram/:telegramId", UserController.getUserByTelegramId);
app.post("/api/user/invited-users", UserController.getInvitedUsers);
app.post("/api/user/invited-users-count", UserController.getInvitedUsersCount);
app.post("/api/user/add-bonus-to-inviter", UserController.addBonusToInviter);

app.get("/api/user/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -currentToken -refreshToken");
        if (!user) {
            return res.status(404).json({ success: false, message: "Пользователь не найден" });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log("Ошибка получения данных пользователя:", error);
        res.status(500).json({ success: false, message: "Ошибка получения данных пользователя" });
    }
});

app.get("/api/user/check-session", authMiddleware, (req, res) => {
    res.json({ success: true, valid: true });
});
app.post("/api/user/logout", authMiddleware, UserController.logout);

// Управление пользователями (для client_manager, manager, admin)
app.post("/api/user/create-by-admin", UserController.createUserByAdmin);
app.get("/api/user/all", UserController.getAllUsers);
app.get("/api/user/export/excel", UserController.exportUsersToExcel);
app.get("/api/user/:id", UserController.getUserById);
app.put("/api/user/:id", authMiddleware, UserController.updateUser);
app.put("/api/user/:id/activate-subscription", authMiddleware, UserController.activateSubscription);
app.put("/api/user/:id/deactivate-subscription", authMiddleware, UserController.deactivateSubscription);
app.put("/api/user/:id/block", authMiddleware, UserController.blockUser);
app.put("/api/user/:id/unblock", authMiddleware, UserController.unblockUser);
app.delete("/api/user/:id", authMiddleware, UserController.deleteUser);

// Управление администраторами (только для admin)
app.get("/api/admin/all", authMiddleware, UserController.getAllAdmins);
app.get("/api/admin/:id", authMiddleware, UserController.getAdminById);
app.post("/api/admin/create", authMiddleware, createUserRateLimit, UserController.createAdmin);
app.put("/api/admin/:id", authMiddleware, UserController.updateAdmin);
app.put("/api/admin/:id/block", authMiddleware, UserController.blockAdmin);
app.put("/api/admin/:id/unblock", authMiddleware, UserController.unblockAdmin);

// Журнал действий админа (только для admin)
app.get("/api/admin-action-logs", authMiddleware, AdminActionLogController.getAll);

// Управление профилем (для авторизованных пользователей)
app.put("/api/user/profile/update", UserController.updateProfile);
app.post("/api/user/purchase-content", UserController.purchaseContent);

// ==================== FAQ маршруты ====================
app.post("/api/faq", createContentRateLimit, authMiddleware, FAQController.create);
app.get("/api/faq", FAQController.getAll);
app.get("/api/faq/:id", FAQController.getById);
app.put("/api/faq/:id", authMiddleware, FAQController.update);
app.delete("/api/faq/:id", authMiddleware, FAQController.remove);

// ==================== Practice маршруты ====================
app.post("/api/practice", createContentRateLimit, authMiddleware, PracticeController.create);
app.get("/api/practice", PracticeController.getAll);
app.get("/api/practice/:id", PracticeController.getById);
app.put("/api/practice/:id", authMiddleware, PracticeController.update);
app.delete("/api/practice/:id", authMiddleware, PracticeController.remove);

// ==================== HealthLab (Лаборатория здоровья) маршруты ====================
app.post("/api/health-lab", createContentRateLimit, authMiddleware, HealthLabController.create);
app.get("/api/health-lab", HealthLabController.getAll);
app.get("/api/health-lab/:id", HealthLabController.getById);
app.put("/api/health-lab/:id", authMiddleware, HealthLabController.update);
app.delete("/api/health-lab/:id", authMiddleware, HealthLabController.remove);

// ==================== RelationshipWorkshop (Мастерская отношений) маршруты ====================
app.post("/api/relationship-workshop", createContentRateLimit, authMiddleware, RelationshipWorkshopController.create);
app.get("/api/relationship-workshop", RelationshipWorkshopController.getAll);
app.get("/api/relationship-workshop/:id", RelationshipWorkshopController.getById);
app.put("/api/relationship-workshop/:id", authMiddleware, RelationshipWorkshopController.update);
app.delete("/api/relationship-workshop/:id", authMiddleware, RelationshipWorkshopController.remove);

// ==================== SpiritForge (Кузница Духа) маршруты ====================
app.post("/api/spirit-forge", createContentRateLimit, authMiddleware, SpiritForgeController.create);
app.get("/api/spirit-forge", SpiritForgeController.getAll);
app.get("/api/spirit-forge/:id", SpiritForgeController.getById);
app.put("/api/spirit-forge/:id", authMiddleware, SpiritForgeController.update);
app.delete("/api/spirit-forge/:id", authMiddleware, SpiritForgeController.remove);

// ==================== MastersTower (Башня мастеров) маршруты ====================
app.post("/api/masters-tower", createContentRateLimit, authMiddleware, MastersTowerController.create);
app.get("/api/masters-tower", MastersTowerController.getAll);
app.get("/api/masters-tower/:id", MastersTowerController.getById);
app.put("/api/masters-tower/:id", authMiddleware, MastersTowerController.update);
app.delete("/api/masters-tower/:id", authMiddleware, MastersTowerController.remove);

// ==================== FemininityGazebo (Беседка женственности) маршруты ====================
app.post("/api/femininity-gazebo", createContentRateLimit, authMiddleware, FemininityGazeboController.create);
app.get("/api/femininity-gazebo", FemininityGazeboController.getAll);
app.get("/api/femininity-gazebo/:id", FemininityGazeboController.getById);
app.put("/api/femininity-gazebo/:id", authMiddleware, FemininityGazeboController.update);
app.delete("/api/femininity-gazebo/:id", authMiddleware, FemininityGazeboController.remove);

// ==================== ConsciousnessLibrary (Библиотека сознания) маршруты ====================
app.post("/api/consciousness-library", createContentRateLimit, authMiddleware, ConsciousnessLibraryController.create);
app.get("/api/consciousness-library", ConsciousnessLibraryController.getAll);
app.get("/api/consciousness-library/:id", ConsciousnessLibraryController.getById);
app.put("/api/consciousness-library/:id", authMiddleware, ConsciousnessLibraryController.update);
app.delete("/api/consciousness-library/:id", authMiddleware, ConsciousnessLibraryController.remove);

// ==================== ProductCatalog (Каталог продуктов) маршруты ====================
app.post("/api/product-catalog", createContentRateLimit, authMiddleware, ProductCatalogController.create);
app.get("/api/product-catalog", ProductCatalogController.getAll);
app.get("/api/product-catalog/:id", ProductCatalogController.getById);
app.put("/api/product-catalog/:id", authMiddleware, ProductCatalogController.update);
app.delete("/api/product-catalog/:id", authMiddleware, ProductCatalogController.remove);

// ==================== AnalysisHealth (Разборы - Здоровье) маршруты ====================
app.post("/api/analysis-health", createContentRateLimit, authMiddleware, AnalysisHealthController.create);
app.get("/api/analysis-health", AnalysisHealthController.getAll);
app.get("/api/analysis-health/:id", AnalysisHealthController.getById);
app.put("/api/analysis-health/:id", authMiddleware, AnalysisHealthController.update);
app.delete("/api/analysis-health/:id", authMiddleware, AnalysisHealthController.remove);

// ==================== AnalysisRelationships (Разборы - Отношения) маршруты ====================
app.post("/api/analysis-relationships", createContentRateLimit, authMiddleware, AnalysisRelationshipsController.create);
app.get("/api/analysis-relationships", AnalysisRelationshipsController.getAll);
app.get("/api/analysis-relationships/:id", AnalysisRelationshipsController.getById);
app.put("/api/analysis-relationships/:id", authMiddleware, AnalysisRelationshipsController.update);
app.delete("/api/analysis-relationships/:id", authMiddleware, AnalysisRelationshipsController.remove);

// ==================== AnalysisRealization (Разборы - Реализация) маршруты ====================
app.post("/api/analysis-realization", createContentRateLimit, authMiddleware, AnalysisRealizationController.create);
app.get("/api/analysis-realization", AnalysisRealizationController.getAll);
app.get("/api/analysis-realization/:id", AnalysisRealizationController.getById);
app.put("/api/analysis-realization/:id", authMiddleware, AnalysisRealizationController.update);
app.delete("/api/analysis-realization/:id", authMiddleware, AnalysisRealizationController.remove);

// ==================== Psychodiagnostics (Психодиагностика) маршруты ====================
app.post("/api/psychodiagnostics", createContentRateLimit, authMiddleware, PsychodiagnosticsController.create);
app.get("/api/psychodiagnostics", PsychodiagnosticsController.getAll);
app.get("/api/psychodiagnostics/:id", PsychodiagnosticsController.getById);
app.put("/api/psychodiagnostics/:id", authMiddleware, PsychodiagnosticsController.update);
app.delete("/api/psychodiagnostics/:id", authMiddleware, PsychodiagnosticsController.remove);

// ==================== Schedule маршруты ====================
app.post("/api/schedule", createContentRateLimit, authMiddleware, ScheduleController.create);
app.get("/api/schedule", ScheduleController.getAll);
app.get("/api/schedule/:id", ScheduleController.getById);
app.put("/api/schedule/:id", authMiddleware, ScheduleController.update);
app.delete("/api/schedule/:id", authMiddleware, ScheduleController.remove);

// ==================== DynamicContent маршруты ====================
app.post("/api/dynamic-content", createContentRateLimit, authMiddleware, DynamicContentController.create);
app.get("/api/dynamic-content", DynamicContentController.getAll);
app.get("/api/dynamic-content/horoscope-corridor", DynamicContentController.getHoroscopeCorridorContent);
app.get("/api/dynamic-content/blocked-browser", DynamicContentController.getBlockedBrowserContent);
app.get("/api/dynamic-content/name/:name", DynamicContentController.getByName);
app.get("/api/dynamic-content/:id", DynamicContentController.getById);
app.put("/api/dynamic-content/:id", authMiddleware, DynamicContentController.update);
app.delete("/api/dynamic-content/:id", authMiddleware, DynamicContentController.remove);
// ==================== Welcome маршруты ====================
app.post("/api/welcome", createContentRateLimit, authMiddleware, WelcomeController.create);
app.get("/api/welcome", WelcomeController.getAll);
app.get("/api/welcome/:id", WelcomeController.getById);
app.put("/api/welcome/:id", authMiddleware, WelcomeController.update);
app.delete("/api/welcome/:id", authMiddleware, WelcomeController.remove);

// ==================== AboutClub маршруты ====================
app.post("/api/about-club", createContentRateLimit, authMiddleware, AboutClubController.create);
app.get("/api/about-club", AboutClubController.getAll);
app.get("/api/about-club/:id", AboutClubController.getById);
app.put("/api/about-club/:id", authMiddleware, AboutClubController.update);
app.delete("/api/about-club/:id", authMiddleware, AboutClubController.remove);

// ==================== Broadcast маршруты ====================
app.post("/api/broadcast/users", BroadcastController.getFilteredUsers);
app.post("/api/broadcast/send", BroadcastController.sendBroadcast);
app.post("/api/broadcast/test", BroadcastController.sendTestMessage);
// Маршруты для сохраненных рассылок
app.post("/api/broadcast", createContentRateLimit, authMiddleware, BroadcastController.createBroadcast);
app.get("/api/broadcast", BroadcastController.getAllBroadcasts);
app.get("/api/broadcast/:id", BroadcastController.getBroadcastById);
app.put("/api/broadcast/:id", authMiddleware, BroadcastController.updateBroadcast);
app.delete("/api/broadcast/:id", authMiddleware, BroadcastController.deleteBroadcast);

// ==================== Modal Notification маршруты ====================
app.post("/api/modal-notification/users", ModalNotificationController.getFilteredUsers);
app.post("/api/modal-notification/create", createContentRateLimit, authMiddleware, ModalNotificationController.createModalNotification);
app.post("/api/modal-notification/my", ModalNotificationController.getUserModalNotifications);
app.post("/api/modal-notification/remove", authMiddleware, ModalNotificationController.removeModalNotification);

// ==================== Robokassa ====================
app.post("/api/robres", RobokassaController.handleResult);
app.post("/api/user/payment", UserController.payment);

app.all("/robokassa_callback/success", (req, res) => {
    const params = req.method === 'POST' ? req.body : req.query;
    const queryString = new URLSearchParams(params).toString();
    res.redirect(`${process.env.CLIENT_URL}/robokassa_callback/success${queryString ? '?' + queryString : ''}`);
});

app.all("/robokassa_callback/fail", (req, res) => {
    const params = req.method === 'POST' ? req.body : req.query;
    const queryString = new URLSearchParams(params).toString();
    res.redirect(`${process.env.CLIENT_URL}/robokassa_callback/fail${queryString ? '?' + queryString : ''}`);
});

// ==================== Upload маршруты ====================
app.post("/api/upload/image", authMiddleware, UploadController.upload.single('image'), UploadController.uploadImage);
app.post("/api/upload/delete", authMiddleware, UploadController.deleteImage);

// ==================== Diary маршруты ====================
app.post("/api/diary", createContentRateLimit, DiaryController.create);
app.get("/api/diary", DiaryController.getAll);
app.post("/api/diary/my", DiaryController.getMyDiaries);
app.get("/api/diary/:id", DiaryController.getById);
app.put("/api/diary/:id", DiaryController.update);
app.delete("/api/diary/:id", DiaryController.remove);

// ==================== VideoProgress ====================
app.post("/api/video-progress", VideoProgressController.saveProgress);
app.post("/api/video-progress/award-bonus", VideoProgressController.awardBonusOnPlay);
app.get("/api/video-progress/:userId/:contentType/:contentId", VideoProgressController.getProgress);
app.get("/api/video-progress/user/:userId/:contentType", VideoProgressController.getUserProgresses);
app.post("/api/video-progress/batch/:userId/:contentType", VideoProgressController.getProgressesForContents);

// ==================== Subscription ====================
// Ручной запуск проверки истекших подписок (для тестирования и администрирования)
app.post("/api/subscription/check-expired", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
            return res.status(403).json({
                success: false,
                message: "Доступ запрещен. Требуется роль admin или manager"
            });
        }
        
        const result = await SubscriptionController.checkExpiredSubscriptions();
        res.json(result);
    } catch (error) {
        console.error("Ошибка при ручной проверке подписок:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при проверке подписок",
            error: error.message
        });
    }
});


// Настройка cron задачи для проверки истекших подписок
// Запускается каждый день в 12:00 (по времени сервера)
cron.schedule('0 12 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Запуск автоматической проверки истекших подписок...`);
    const result = await SubscriptionController.checkExpiredSubscriptions();
    if (result.success) {
        console.log(`[${new Date().toISOString()}] Проверка завершена успешно. Обновлено пользователей: ${result.updatedCount}`);
    } else {
        console.error(`[${new Date().toISOString()}] Ошибка при проверке подписок:`, result.error);
    }
}, {
    timezone: "Asia/Almaty" // Устанавливаем часовой пояс (можно изменить на нужный)
});

console.log('Cron задача для проверки подписок настроена: каждый день в 12:00');

// Запуск рассылок по расписанию (каждую минуту)
cron.schedule('* * * * *', async () => {
    try {
        await BroadcastController.processScheduledBroadcasts();
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Ошибка обработки запланированных рассылок:`, error);
    }
}, {
    timezone: "Asia/Almaty"
});

console.log('Cron задача для рассылок настроена: проверка каждую минуту');

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});