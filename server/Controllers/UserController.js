import User from "../Models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import XLSX from "xlsx";
import axios from "axios";
import crypto from 'crypto';
import { addAdminAction } from "../utils/addAdminAction.js";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "manager@psylife.io",
        pass: process.env.MailSMTP,
    },
});

const generateCode = () => {
    const characters = "0123456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
        randomPart += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return randomPart;
};

const codes = {};
const lastSentTime = {}; // Отслеживание времени последней отправки
const sendingInProgress = new Set(); // Отслеживание отправок в процессе

// URL бот сервера для управления группой и каналом
const BOT_SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:5011';

export const sendMail = async (req, res) => {
    const { mail } = req.body;

    const user = await User.findOne({ mail: mail?.toLowerCase() });
    if (user) {
        return res.status(400).json({
            success: false,
            message: "Пользователь с такой почтой уже существует",
        });
    }

    // Валидация email
    if (!mail || !mail.includes('@')) {
        return res.status(400).json({
            success: false,
            message: "Некорректный email адрес"
        });
    }

    const normalizedMail = mail.toLowerCase();

    // Проверка на повторную отправку (защита от спама)
    const now = Date.now();
    const lastSent = lastSentTime[normalizedMail];
    const COOLDOWN_PERIOD = 60000; // 1 минута

    if (lastSent && (now - lastSent) < COOLDOWN_PERIOD) {
        const remainingTime = Math.ceil((COOLDOWN_PERIOD - (now - lastSent)) / 1000);
        return res.status(429).json({
            success: false,
            message: `Повторная отправка возможна через ${remainingTime} секунд`
        });
    }

    // Проверка на отправку в процессе
    if (sendingInProgress.has(normalizedMail)) {
        return res.status(429).json({
            success: false,
            message: "Отправка уже в процессе, пожалуйста подождите"
        });
    }

    // Добавляем в процесс отправки
    sendingInProgress.add(normalizedMail);

    try {
        const confirmCode = generateCode();

        codes[normalizedMail] = confirmCode;
        lastSentTime[normalizedMail] = now;

        const mailOptions = {
            from: "aytenov_01@mail.ru",
            to: normalizedMail,
            subject: "Подтверждение электронной почты",
            text: `Ваш код подтверждения: ${confirmCode}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            // Убираем из процесса отправки
            sendingInProgress.delete(normalizedMail);
            
            if (error) {
                console.log("Ошибка отправки email:", error);
                // Удаляем сохраненный код при ошибке
                delete codes[normalizedMail];
                delete lastSentTime[normalizedMail];
                
                res.status(500).json({
                    success: false,
                    message: "Ошибка при отправке письма"
                });
            } else {
                console.log("Email sent successfully:", info.response);
                res.status(200).json({
                    success: true,
                    message: "Письмо успешно отправлено"
                });
            }
        });

    } catch (error) {
        // Убираем из процесса отправки при ошибке
        sendingInProgress.delete(normalizedMail);
        console.log("Ошибка в sendMail:", error);
        res.status(500).json({
            success: false,
            message: "Внутренняя ошибка сервера"
        });
    }
};

export const sendMailRecovery = async (req, res) => {
    const { mail } = req.body;

    // Валидация email
    if (!mail || !mail.includes('@')) {
        return res.status(400).json({
            success: false,
            message: "Некорректный email адрес"
        });
    }

    const normalizedMail = mail.toLowerCase();

    // Проверка на повторную отправку (защита от спама)
    const now = Date.now();
    const lastSent = lastSentTime[normalizedMail];
    const COOLDOWN_PERIOD = 60000; // 1 минута

    if (lastSent && (now - lastSent) < COOLDOWN_PERIOD) {
        const remainingTime = Math.ceil((COOLDOWN_PERIOD - (now - lastSent)) / 1000);
        return res.status(429).json({
            success: false,
            message: `Повторная отправка возможна через ${remainingTime} секунд`
        });
    }

    // Проверка на отправку в процессе
    if (sendingInProgress.has(normalizedMail)) {
        return res.status(429).json({
            success: false,
            message: "Отправка уже в процессе, пожалуйста подождите"
        });
    }

    // Добавляем в процесс отправки
    sendingInProgress.add(normalizedMail);

    try {
        const confirmCode = generateCode();

        codes[normalizedMail] = confirmCode;
        lastSentTime[normalizedMail] = now;

        const mailOptions = {
            from: "aytenov_01@mail.ru",
            to: normalizedMail,
            subject: "Подтверждение электронной почты",
            text: `Ваш код подтверждения: ${confirmCode}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            // Убираем из процесса отправки
            sendingInProgress.delete(normalizedMail);
            
            if (error) {
                console.log("Ошибка отправки email:", error);
                // Удаляем сохраненный код при ошибке
                delete codes[normalizedMail];
                delete lastSentTime[normalizedMail];
                
                res.status(500).json({
                    success: false,
                    message: "Ошибка при отправке письма"
                });
            } else {
                console.log("Email sent successfully:", info.response);
                res.status(200).json({
                    success: true,
                    message: "Письмо успешно отправлено"
                });
            }
        });

    } catch (error) {
        // Убираем из процесса отправки при ошибке
        sendingInProgress.delete(normalizedMail);
        console.log("Ошибка в sendMailRecovery:", error);
        res.status(500).json({
            success: false,
            message: "Внутренняя ошибка сервера"
        });
    }
};

export const codeConfirm = async (req, res) => {
    try {
        const { mail, code } = req.body;
        console.log("codeConfirm req.body: ", req.body);
        
        const normalizedMail = mail?.toLowerCase();
        
        if (!normalizedMail || !code) {
            return res.status(400).json({
                success: false,
                message: "Необходимо указать email и код"
            });
        }
        
        if (codes[normalizedMail] === code) {
            console.log("codeConfirm code is correct");
            delete codes[normalizedMail]; // Удаляем код после успешного подтверждения
            delete lastSentTime[normalizedMail]; // Удаляем время последней отправки

            await User.findOneAndUpdate({ mail: normalizedMail }, { status: 'registered' });
            res.status(200).json({
                success: true,
                message: "Код успешно подтвержден"
            });
        } else {
            console.log("codeConfirm code is incorrect");
            res.status(400).json({
                success: false,
                message: "Неверный код"
            });
        }
    } catch (error) {
        console.log("Ошибка в codeConfirm:", error);
        res.status(500).json({
            message: "Что-то пошло не так",
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const { telegramId, telegramUserName, referralTelegramId, profilePhotoUrl } = req.body;
        const candidate = await User.findOne({ telegramId });

        console.log("createUser req.body: ", req.body);

        if (candidate) {
            await User.findByIdAndUpdate(candidate._id, { profilePhotoUrl });
            return res.status(200).json({
                success: false,
                message: "Пользователь существует, пропускаем создание пользователя",
            });
        }

        // Обработка реферальной ссылки
        let invitedUser = null;
        if (referralTelegramId) {
            // Находим пользователя, который пригласил (по telegramId)
            const inviter = await User.findOne({ telegramId: referralTelegramId });
            
            if (inviter) {
                invitedUser = inviter._id;
                
                // // Добавляем 1 бонус тому, кто пригласил
                // await User.findByIdAndUpdate(inviter._id, {
                //     $inc: { bonus: 2, inviteesCount: 1 }
                // });

                // console.log(`✅ Пользователь ${inviter.telegramId} получил 1 бонус за приглашение пользователя ${telegramId}`);
            } else {
                console.log(`⚠️ Реферальный пользователь с telegramId ${referralTelegramId} не найден`);
            }
        }

        const doc = new User({
            telegramId,
            telegramUserName,
            status: 'anonym',
            invitedUser: invitedUser,
            profilePhotoUrl,
        });

        const user = await doc.save();
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log("Ошибка в createUser:", error);
        res.status(500).json({
            message: "Что-то пошло не так",
        });
    }
};

export const register = async (req, res) => {
    try {
        const { fullName, mail, phone, telegramId } = req.body;

        console.log("register req.body: ", req.body);
        
        if (!fullName || !mail || !phone) {
            return res.status(400).json({
                success: false,
                message: "Все поля обязательны для заполнения",
            });
        }

        const telegramUser = await User.findOne({ telegramId });

        let user;

        if (telegramUser) {
            await User.findByIdAndUpdate(telegramUser._id, {
                fullName,
                mail: mail?.toLowerCase(),
                phone,
                status: 'registered',
                $inc: { bonus: 10 },
            });
            
            user = await User.findById(telegramUser._id);
        } else {
            const doc = new User({
                fullName,
                mail: mail?.toLowerCase(),
                phone,
                status: 'registered',
                bonus: 10,
            });
            user = await doc.save();
        }

        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.SecretKey,
            {
                expiresIn: "30d",
            }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.SecretKeyRefresh,
            {
                expiresIn: "30d",
            }
        );

        // Сохраняем refresh токен
        await User.findByIdAndUpdate(user._id, {
            refreshToken: refreshToken,
        });

        const userData = {
            _id: user._id,
            fullName: user.fullName,
            phone: user.phone,
            mail: user.mail,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        res.json({ success: true, accessToken, refreshToken, userData });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Что-то пошло не так",
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("login req.body: ", req.body);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email и пароль обязательны",
            });
        }

        const candidate = await User.findOne({ mail: email?.toLowerCase() });

        console.log("login candidate: ", candidate);

        if (!candidate) {
            console.log("login candidate is not found");
            return res.status(404).json({
                success: false,
                message: "Неверный логин или пароль",
            });
        }

        // Проверяем, есть ли у пользователя пароль
        if (!candidate.password) {
            console.log("login candidate has no password");
            return res.status(404).json({
                success: false,
                message: "Неверный логин или пароль",
            });
        }

        const isValidPass = await bcrypt.compare(
            password,
            candidate.password
        );

        if (!isValidPass) {
            console.log("login isValidPass is false");
            return res.status(404).json({
                success: false,
                message: "Неверный логин или пароль",
            });
        }

        // if (candidate.status !== "active") {
        //     console.log("login candidate.status is not active");
        //     return res.status(403).json({
        //         success: false,
        //         message: "Ваш аккаунт заблокирован, свяжитесь с администратором",
        //     });
        // }

        const { password: _, ...userData } = candidate.toObject();
        // Создаем новый токен (это инвалидирует предыдущую сессию)
        const accessToken = jwt.sign(
            { userId: candidate._id },
            process.env.SecretKey,
            {
                expiresIn: "30d",
            }
        );

        const refreshToken = jwt.sign(
            { userId: candidate._id },
            process.env.SecretKeyRefresh,
            {
                expiresIn: "30d",
            }
        );

        // Сохраняем refresh токен
        await User.findByIdAndUpdate(candidate._id, {
            refreshToken: refreshToken,
        });

        console.log("login successful");

        res.json({ success: true, accessToken, refreshToken, userData });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Не удалось авторизоваться",
        });
    }
};

export const logout = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Токен не предоставлен",
            });
        }

        await User.findByIdAndUpdate(userId, {
            refreshToken: null,
            currentToken: null,
        });

        res.json({
            success: true,
            message: "Сессия завершена",
        });
    } catch (error) {
        console.log("Ошибка в logout:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка завершения сессии",
        });
    }
};

// Получить всех пользователей (только для админа)
export const getAllUsers = async (req, res) => {
    try {
        // Параметры пагинации
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        // Параметры фильтрации
        const statusFilter = req.query.statusFilter || 'all';
        const lastActiveFilter = req.query.lastActiveFilter || 'all';
        const searchQuery = req.query.searchQuery || '';

        // Параметры сортировки
        const sortField = req.query.sortField || '';
        const sortDirection = req.query.sortDirection === 'desc' ? -1 : 1;

        // Строим фильтр для запроса
        const filter = { role: "user" };

        // Фильтр по статусу
        if (statusFilter !== 'all') {
            if (statusFilter === 'blocked') {
                filter.isBlocked = true;
            } else {
                filter.isBlocked = { $ne: true }; // Не заблокированные
                filter.status = statusFilter;
            }
        } else {
            // Если "all", показываем всех, но исключаем заблокированных если нужно
            // Или показываем всех включая заблокированных
            // Оставляем как есть - показываем всех
        }

        // Фильтр по активности (в течение 15 дней / больше 15 дней)
        if (lastActiveFilter === 'active' || lastActiveFilter === 'inactive') {
            const thresholdDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            if (lastActiveFilter === 'active') {
                // Активные в течение 15 дней
                filter.lastActiveDate = { $gte: thresholdDate };
            } else {
                // Неактивные больше 15 дней (или никогда не было активности)
                filter.$or = [
                    { lastActiveDate: { $lt: thresholdDate } },
                    { lastActiveDate: { $eq: null } },
                ];
            }
        }

        // Поиск по полям (если указан)
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.trim();
            filter.$or = [
                { fullName: { $regex: query, $options: 'i' } },
                { telegramUserName: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
                { mail: { $regex: query, $options: 'i' } }
            ];
        }

        // Получаем общее количество пользователей с учетом фильтров
        const totalUsers = await User.countDocuments(filter);

        // Определяем сортировку
        let sortOptions = { createdAt: 1 }; // По умолчанию по дате создания (asc)
        
        if (sortField) {
            sortOptions = {};
            sortOptions[sortField] = sortDirection;
            // Если сортируем не по createdAt, добавляем его как вторичную сортировку
            if (sortField !== 'createdAt') {
                sortOptions.createdAt = 1;
            }
        }

        // Получаем пользователей с пагинацией, фильтрацией и сортировкой
        const users = await User.find(filter)
            .select("-password -currentToken -refreshToken")
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Вычисляем номера пользователей
        // Номер основан на позиции в отсортированном списке с учетом фильтров
        const usersWithNumbers = users.map((user, index) => {
            const userNumber = skip + index + 1;
            return {
                ...user.toObject(),
                userNumber
            };
        });

        res.json({
            success: true,
            data: usersWithNumbers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers: totalUsers,
                limit: limit,
                hasNextPage: page < Math.ceil(totalUsers / limit),
                hasPrevPage: page > 1
            },
            count: usersWithNumbers.length,
        });
    } catch (error) {
        console.log("Ошибка в getAllUsers:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения пользователей",
        });
    }
};

// Экспорт пользователей в Excel
export const exportUsersToExcel = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password -currentToken -refreshToken")
            .sort({ createdAt: -1 });

        // Подготовка данных для Excel
        const excelData = users.map((user, index) => {
            // Определяем статус
            let status = '';
            if (user.isBlocked) {
                status = 'Заблокирован';
            } else {
                status = user.status === 'guest' ? 'Гость' : 
                        user.status === 'registered' ? 'Зарегистрирован' : 
                        user.status === 'client' ? 'Клиент' : user.status || '';
            }

            // Определяем роль
            const roleLabels = {
                'user': 'Пользователь',
                'admin': 'Администратор',
                'content_manager': 'Контент-менеджер',
                'client_manager': 'Менеджер по клиентам',
                'manager': 'Менеджер'
            };
            const role = roleLabels[user.role] || user.role || '';

            // Форматируем дату подписки
            let subscriptionDate = 'Нет подписки';
            if (user.subscriptionEndDate) {
                const date = new Date(user.subscriptionEndDate);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                subscriptionDate = `${day}-${month}-${year}`;
            }

            // Форматируем дату регистрации
            const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '';

            return {
                '№': index + 1,
                'Полное имя': user.fullName || '',
                'TG Имя': user.telegramUserName ? `@${user.telegramUserName}` : '',
                'Email': user.mail || '',
                'Телефон': user.phone || '',
                'Роль': role,
                'Статус': status,
                'Звёзды': user.bonus || 0,
                'Рефералы': user.inviteesCount || 0,
                'Подписка до': subscriptionDate,
                'Дата регистрации': createdAt,
            };
        });

        // Создаем рабочую книгу Excel
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Пользователи');

        // Генерируем буфер Excel файла
        const excelBuffer = XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: 'xlsx' 
        });

        // Устанавливаем заголовки для скачивания файла
        const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

        // Отправляем файл
        res.send(excelBuffer);
    } catch (error) {
        console.log("Ошибка в exportUsersToExcel:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка экспорта пользователей в Excel",
        });
    }
};

// Получить пользователя по ID (только для админа)
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select("-password -currentToken -refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.log("Ошибка в getUserById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения пользователя",
        });
    }
};

// Создать пользователя (для админа и менеджеров)
export const createUserByAdmin = async (req, res) => {
    try {
        const admin = req.user;
        const { fullName, mail, phone, password, role, status } = req.body;

        if (!fullName || !mail || !phone) {
            return res.status(400).json({
                success: false,
                message: "Имя, email и телефон обязательны для заполнения",
            });
        }

        // Проверяем, существует ли пользователь с таким email
        const candidate = await User.findOne({ mail: mail?.toLowerCase() });
        if (candidate) {
            return res.status(409).json({
                success: false,
                message: "Пользователь с такой почтой уже существует",
            });
        }

        // Если пароль не указан, генерируем случайный
        let hashedPassword = null;
        let generatedPassword = password;
        if (!password || password.trim() === '') {
            // Генерируем случайный пароль из 12 символов
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
            generatedPassword = '';
            for (let i = 0; i < 12; i++) {
                generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(generatedPassword, salt);

        const doc = new User({
            fullName,
            mail: mail?.toLowerCase(),
            phone,
            password: hashedPassword,
            role: role || 'user',
            status: status || 'guest',
            emailConfirmed: true, // Админ создает пользователя с подтвержденным email
        });

        const user = await doc.save();

        if (admin && admin !== null) {
            await addAdminAction(admin._id, `Создал(а) пользователя: "${user.fullName}"`);
        }

        // Возвращаем сгенерированный пароль только если он был сгенерирован автоматически
        const responseData = {
            success: true,
            data: user,
            message: "Пользователь создан",
        };
        
        if (!password || password.trim() === '') {
            responseData.generatedPassword = generatedPassword;
            responseData.message = `Пользователь создан. Сгенерированный пароль: ${generatedPassword}`;
        }
        
        res.json(responseData);
    } catch (error) {
        console.log("Ошибка в createUserByAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка создания пользователя",
            error: error.message,
        });
    }
};

// Обновить пользователя (только для админа)
export const updateUser = async (req, res) => {
    try {
        const admin = req.user;
        
        const { id } = req.params;
        const updateData = req.body;

        // Удаляем поля, которые нельзя обновлять через этот метод
        delete updateData.password;
        delete updateData.currentToken;
        delete updateData.refreshToken;
        // bonus теперь можно обновлять

        const candidate = await User.findById(id)

        if ('bonus' in updateData && updateData.bonus !== candidate.bonus && updateData.bonus > candidate.bonus) {
            const notification = {
                modalTitle: "Вам начислены Звёзды",
                modalDescription: `Администратор отправил: ${updateData.bonus - candidate.bonus} шт.`,
                modalButtonText: "Принимаю с благодарностью",
                modalButtonLink: undefined,
            };
            await User.findByIdAndUpdate(candidate._id, { $push: { modalNotifications: notification } });
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password -currentToken -refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        if (admin && admin !== null) {
            await addAdminAction(admin._id, `Обновил(а) пользователя: "${user.fullName}"`);
        }

        res.json({
            success: true,
            data: user,
            message: "Пользователь обновлен",
        });
    } catch (error) {
        console.log("Ошибка в updateUser:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка обновления пользователя",
        });
    }
};

// Активировать подписку пользователя
export const activateSubscription = async (req, res) => {
    try {
        const admin = req.user;
        const { id } = req.params;
        const { subscriptionEndDate } = req.body;

        if (!subscriptionEndDate) {
            return res.status(400).json({
                success: false,
                message: "Дата окончания подписки обязательна",
            });
        }

        // Сначала находим пользователя, чтобы получить текущий статус
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        const previousStatus = existingUser.status;

        const user = await User.findByIdAndUpdate(
            id,
            { 
                subscriptionEndDate: new Date(subscriptionEndDate),
                status: 'client',
                previousStatus: previousStatus,
                hasPaid: true
            },
            { new: true, runValidators: true }
        ).select("-password -currentToken -refreshToken");

        if (admin && admin !== null) {
            await addAdminAction(admin._id, `Активировал(а) подписку для пользователя: "${user.fullName}"`);
        }

        // // Добавляем пользователя в группу и канал через бота
        // if (user.telegramId) {
        //     try {
        //         const botResponse = await axios.post(`${BOT_SERVER_URL}/api/bot/add-user`, {
        //             telegramId: user.telegramId
        //         }, {
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //             timeout: 10000, // 10 секунд таймаут
        //         });

        //         if (botResponse.data.success) {
        //             console.log(`Пользователь ${user.telegramId} успешно добавлен в группу и канал`);
        //         } else {
        //             console.warn(`Частичное выполнение при добавлении пользователя ${user.telegramId}:`, botResponse.data);
        //         }
        //     } catch (botError) {
        //         console.error(`Ошибка при добавлении пользователя ${user.telegramId} в группу/канал:`, botError.message);
        //         // Не прерываем выполнение, если ошибка с ботом
        //     }
        // }

        res.json({
            success: true,
            data: user,
            message: "Подписка активирована",
        });
    } catch (error) {
        console.log("Ошибка в activateSubscription:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка активации подписки",
        });
    }
};

// Деактивировать подписку пользователя
export const deactivateSubscription = async (req, res) => {
    try {
        const admin = req.user;
        const { id } = req.params;

        // Сначала находим пользователя, чтобы получить previousStatus
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        const previousStatus = existingUser.previousStatus || 'registered';

        const user = await User.findByIdAndUpdate(
            id,
            { 
                subscriptionEndDate: null,
                status: previousStatus,
                previousStatus: null,
                hasPaid: false
            },
            { new: true, runValidators: true }
        ).select("-password -currentToken -refreshToken");

        if (admin && admin !== null) {
            await addAdminAction(admin._id, `Деактивировал(а) подписку для пользователя: "${user.fullName}"`);
        }

        // // Удаляем пользователя из группы и канала через бота
        // if (user.telegramId) {
        //     try {
        //         const botResponse = await axios.post(`${BOT_SERVER_URL}/api/bot/remove-user`, {
        //             telegramId: user.telegramId
        //         }, {
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //             timeout: 10000, // 10 секунд таймаут
        //         });

        //         if (botResponse.data.success) {
        //             console.log(`Пользователь ${user.telegramId} успешно удален из группы и канала`);
        //         } else {
        //             console.warn(`Частичное выполнение при удалении пользователя ${user.telegramId}:`, botResponse.data);
        //         }
        //     } catch (botError) {
        //         console.error(`Ошибка при удалении пользователя ${user.telegramId} из группы/канала:`, botError.message);
        //         // Не прерываем выполнение, если ошибка с ботом
        //     }
        // }

        res.json({
            success: true,
            data: user,
            message: "Подписка отменена",
        });
    } catch (error) {
        console.log("Ошибка в deactivateSubscription:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка отмены подписки",
        });
    }
};

// Заблокировать пользователя
export const blockUser = async (req, res) => {
    try {
        const admin = req.user;
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: true
            },
            { new: true, runValidators: true }
        ).select("-password -currentToken -refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        if (admin && admin !== null) {
            await addAdminAction(admin._id, `Заблокировал(а) пользователя: "${user.fullName}"`);
        }

        res.json({
            success: true,
            data: user,
            message: "Пользователь заблокирован",
        });
    } catch (error) {
        console.log("Ошибка в blockUser:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка блокировки пользователя",
        });
    }
};

// Разблокировать пользователя
export const unblockUser = async (req, res) => {
    try {
        const admin = req.user;
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: false
            },
            { new: true, runValidators: true }
        ).select("-password -currentToken -refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        if (admin && admin !== null) {
            await addAdminAction(admin._id, `Разблокировал(а) пользователя: "${user.fullName}"`);
        }

        res.json({
            success: true,
            data: user,
            message: "Пользователь разблокирован",
        });
    } catch (error) {
        console.log("Ошибка в unblockUser:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка разблокировки пользователя",
        });
    }
};

// Удалить пользователя (только для админа)
export const deleteUser = async (req, res) => {
    try {
        const admin = req.user;
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        if (admin && admin !== null) {
            await addAdminAction(admin._id, `Удалил(а) пользователя: "${user.fullName}"`);
        }

        res.json({
            success: true,
            message: "Пользователь удален",
        });
    } catch (error) {
        console.log("Ошибка в deleteUser:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка удаления пользователя",
        });
    }
};

// Обновить профиль текущего пользователя
export const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, profilePhotoUrl, userId } = req.body;

        // Формируем объект для обновления
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (profilePhotoUrl !== undefined) updateData.profilePhotoUrl = profilePhotoUrl;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("-password -currentToken -refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        res.json({
            success: true,
            data: user,
            message: "Профиль обновлен",
        });
    } catch (error) {
        console.log("Ошибка в updateProfile:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка обновления профиля",
        });
    }
};

// Обновить пользователя по telegramId
export const updateUserByTelegramId = async (req, res) => {
    try {
        const { telegramId } = req.params;
        const updateData = req.body;

        // Не позволяем обновлять пароль через этот метод
        delete updateData.currentToken;
        delete updateData.refreshToken;

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(updateData.password, salt);
            updateData.password = hash;
        }

        const user = await User.findOneAndUpdate(
            { telegramId },
            updateData,
            { new: true, runValidators: true }
        ).populate('invitedUser', 'fullName telegramUserName telegramId').select("-password -currentToken -refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        res.json({
            success: true,
            data: user,
            message: "Пользователь обновлен",
        });
    } catch (error) {
        console.log("Ошибка в updateUserByTelegramId:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка обновления пользователя",
            error: error.message,
        });
    }
};

// Изменить пароль
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Необходимо указать текущий и новый пароль",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        const isValidPass = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPass) {
            return res.status(400).json({
                success: false,
                message: "Неверный текущий пароль",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Новый пароль должен содержать минимум 6 символов",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(userId, { password: hash });

        res.json({
            success: true,
            message: "Пароль успешно изменен",
        });
    } catch (error) {
        console.log("Ошибка в changePassword:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка изменения пароля",
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId)
            .select("-password -currentToken -refreshToken")
            .populate('invitedUser', 'fullName telegramUserName telegramId');
        res.json({ success: true, user });
    } catch (error) {
        console.log("Ошибка в getProfile:", error);
        res.status(500).json({ success: false, message: "Ошибка получения профиля" });
    }
};

export const getUserByTelegramId = async (req, res) => {
    try {
        const { telegramId } = req.params;
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log("Ошибка в getUserByTelegramId:", error);
        res.status(500).json({ success: false, message: "Ошибка получения пользователя" });
    }
};

// Покупка контента за бонусы
export const purchaseContent = async (req, res) => {
    try {
        const { userId, contentId, contentType } = req.body; // contentType: 'practice', 'meditation', 'video-lesson'

        if (!contentId || !contentType) {
            return res.status(400).json({
                success: false,
                message: "Необходимо указать contentId и contentType",
            });
        }

        // Получаем пользователя
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        // Проверяем, подтвержден ли email
        if (!user.emailConfirmed) {
            return res.status(400).json({
                success: false,
                message: "Необходимо подтвердить email для покупки контента",
            });
        }

        // Импортируем модели контента
        const Practice = (await import("../Models/Practice.js")).default;
        const HealthLab = (await import("../Models/HealthLab.js")).default;
        const RelationshipWorkshop = (await import("../Models/RelationshipWorkshop.js")).default;
        const SpiritForge = (await import("../Models/SpiritForge.js")).default;
        const MastersTower = (await import("../Models/MastersTower.js")).default;
        const FemininityGazebo = (await import("../Models/FemininityGazebo.js")).default;
        const ConsciousnessLibrary = (await import("../Models/ConsciousnessLibrary.js")).default;
        const ProductCatalog = (await import("../Models/ProductCatalog.js")).default;
        const AnalysisHealth = (await import("../Models/AnalysisHealth.js")).default;
        const AnalysisRelationships = (await import("../Models/AnalysisRelationships.js")).default;
        const AnalysisRealization = (await import("../Models/AnalysisRealization.js")).default;
        const Psychodiagnostics = (await import("../Models/Psychodiagnostics.js")).default;

        const contentModels = {
            'practice': Practice,
            'health-lab': HealthLab,
            'relationship-workshop': RelationshipWorkshop,
            'spirit-forge': SpiritForge,
            'masters-tower': MastersTower,
            'femininity-gazebo': FemininityGazebo,
            'consciousness-library': ConsciousnessLibrary,
            'product-catalog': ProductCatalog,
            'analysis-health': AnalysisHealth,
            'analysis-relationships': AnalysisRelationships,
            'analysis-realization': AnalysisRealization,
            'psychodiagnostics': Psychodiagnostics,
        };

        // Получаем контент в зависимости от типа
        const Model = contentModels[contentType];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: "Неверный тип контента",
            });
        }
        const content = await Model.findById(contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Контент не найден",
            });
        }

        // Проверяем, что контент доступен за бонусы
        if (content.accessType !== 'stars') {
            return res.status(400).json({
                success: false,
                message: "Этот контент нельзя купить за бонусы",
            });
        }

        // Проверяем, есть ли уже этот контент у пользователя
        const existingProduct = user.products.find(
            (p) => p.productId === contentId.toString() && p.type === 'one-time'
        );

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "У вас уже есть доступ к этому контенту",
            });
        }

        // Проверяем количество бонусов
        const starsRequired = content.starsRequired || 0;
        if (user.bonus < starsRequired) {
            return res.status(400).json({
                success: false,
                message: `Недостаточно бонусов. Требуется: ${starsRequired}, у вас: ${user.bonus}`,
                starsRequired,
                userBonus: user.bonus,
            });
        }

        // Списываем бонусы и добавляем контент в products
        user.bonus -= starsRequired;
        user.products.push({
            productId: contentId.toString(),
            type: 'one-time',
            paymentDate: new Date(),
            paymentAmount: starsRequired,
            paymentStatus: 'paid',
        });

        await user.save();

        res.json({
            success: true,
            message: "Контент успешно приобретен",
            user: {
                bonus: user.bonus,
                products: user.products,
            },
        });
    } catch (error) {
        console.log("Ошибка в purchaseContent:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при покупке контента",
        });
    }
};

// Получить всех администраторов (включая все административные роли)
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ 
            role: { $in: ['admin', 'content_manager', 'client_manager'] }
        })
            .select("-password -currentToken -refreshToken")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: admins,
            count: admins.length,
        });
    } catch (error) {
        console.log("Ошибка в getAllAdmins:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения администраторов",
        });
    }
};

// Получить администратора по ID (любая административная роль)
export const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await User.findOne({ 
            _id: id, 
            role: { $in: ['admin', 'content_manager', 'client_manager'] }
        })
            .select("-password -currentToken -refreshToken");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Администратор не найден",
            });
        }

        res.json({
            success: true,
            data: admin,
        });
    } catch (error) {
        console.log("Ошибка в getAdminById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения администратора",
        });
    }
};

// Создать администратора (с любой административной ролью)
export const createAdmin = async (req, res) => {
    try {
        const user = req.user;
        const { fullName, mail, phone, role, status, password } = req.body;

        if (!fullName || !mail || !phone) {
            return res.status(400).json({
                success: false,
                message: "Имя, email и телефон обязательны для заполнения",
            });
        }

        // Валидация роли - должна быть одна из административных ролей
        const allowedRoles = ['admin', 'content_manager', 'client_manager'];
        const finalRole = role && allowedRoles.includes(role) ? role : 'admin';

        // Проверяем, существует ли пользователь с таким email
        const candidate = await User.findOne({ mail: mail?.toLowerCase() });
        if (candidate) {
            return res.status(409).json({
                success: false,
                message: "Пользователь с такой почтой уже существует",
            });
        }

        // Если пароль не указан, генерируем случайный
        let hashedPassword = null;
        let generatedPassword = password;
        if (!password || password.trim() === '') {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
            generatedPassword = '';
            for (let i = 0; i < 12; i++) {
                generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(generatedPassword, salt);

        const doc = new User({
            fullName,
            mail: mail?.toLowerCase(),
            phone,
            password: hashedPassword,
            role: finalRole,
            status: status || 'active',
            emailConfirmed: true,
        });

        const admin = await doc.save();

        if (user && user !== null) {
            await addAdminAction(user._id, `Создал(а) администратора: "${fullName}"`);
        }

        res.status(201).json({
            success: true,
            data: {
                _id: admin._id,
                fullName: admin.fullName,
                mail: admin.mail,
                phone: admin.phone,
                role: admin.role,
                status: admin.status,
            },
            message: "Администратор успешно создан",
            generatedPassword: !password ? generatedPassword : undefined,
        });
    } catch (error) {
        console.log("Ошибка в createAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка создания администратора",
            error: error.message,
        });
    }
};

// Обновить администратора (поддерживает изменение роли)
export const updateAdmin = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const candidate = await User.findOne({ _id: id });
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: "Администратор не найден",
            });
        }

        // Проверяем, не пытаются ли изменить защищенного администратора
        if (candidate?.isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Этот администратор защищен от изменений",
            });
        }

        // Удаляем поля, которые нельзя обновлять через этот метод
        delete updateData.password;
        delete updateData.currentToken;
        delete updateData.refreshToken;

        // Валидация роли - если указана, должна быть одна из административных ролей
        const allowedRoles = ['admin', 'content_manager', 'client_manager'];
        if (updateData.role && !allowedRoles.includes(updateData.role)) {
            return res.status(400).json({
                success: false,
                message: "Недопустимая роль. Разрешенные роли: admin, content_manager, client_manager",
            });
        }

        const admin = await User.findOneAndUpdate(
            { _id: id, role: { $in: ['admin', 'content_manager', 'client_manager'] } },
            updateData,
            { new: true, runValidators: true }
        ).select("-password -currentToken -refreshToken");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Администратор не найден",
            });
        }

        if (user && user !== null) {
            await addAdminAction(user._id, `Обновил(а) администратора: "${admin.fullName}"`);
        }

        res.json({
            success: true,
            data: admin,
            message: "Администратор обновлен",
        });
    } catch (error) {
        console.log("Ошибка в updateAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка обновления администратора",
        });
    }
};

// Заблокировать администратора (любая административная роль)
export const blockAdmin = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const candidate = await User.findOne({ _id: id });
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: "Администратор не найден",
            });
        }
        // Проверяем, не пытаются ли заблокировать защищенного администратора
        if (candidate?.isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Этот администратор защищен от блокировки",
            });
        }

        const admin = await User.findOneAndUpdate(
            { _id: id, role: { $in: ['admin', 'content_manager', 'client_manager'] } },
            { isBlocked: true },
            { new: true }
        ).select("-password -currentToken -refreshToken");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Администратор не найден",
            });
        }

        if (user && user !== null) {
            await addAdminAction(user._id, `Заблокировал(а) администратора: "${admin.fullName}"`);
        }

        res.json({
            success: true,
            data: admin,
            message: "Администратор заблокирован",
        });
    } catch (error) {
        console.log("Ошибка в blockAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка блокировки администратора",
        });
    }
};

// Разблокировать администратора (любая административная роль)
export const unblockAdmin = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const candidate = await User.findOne({ _id: id });
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: "Администратор не найден",
            });
        }
        if (candidate?.isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Этот администратор защищен от изменений",
            });
        }

        const admin = await User.findOneAndUpdate(
            { _id: id, role: { $in: ['admin', 'content_manager', 'client_manager'] } },
            { isBlocked: false },
            { new: true }
        ).select("-password -currentToken -refreshToken");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Администратор не найден",
            });
        }

        if (user && user !== null) {
            await addAdminAction(user._id, `Разблокировал(а) администратора: "${admin.fullName}"`);
        }

        res.json({
            success: true,
            data: admin,
            message: "Администратор разблокирован",
        });
    } catch (error) {
        console.log("Ошибка в unblockAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка разблокировки администратора",
        });
    }
};

export const payment = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        const MERCHANT_LOGIN = process.env.ROBOKASSA_MERCHANT_LOGIN;
        const PASSWORD_1 = process.env.ROBOKASSA_PASSWORD1;

        const outSum = '500.00';
        const invId = Date.now();
        const description = 'Подписка на Клуб .li (30 дней)';

        const receipt = {
            sno: 'usn_income',
            items: [
                {
                name: 'Подписка на Клуб .li (30 дней)',
                quantity: 1,
                sum: 500.00,
                tax: 'none',
                payment_method: 'prepayment_full',
                payment_object: 'service',
                },
            ],
        };

        const receiptJson = JSON.stringify(receipt);
        const receiptEncoded = encodeURIComponent(receiptJson);

        const signatureString =
        `${MERCHANT_LOGIN}:${outSum}:${invId}:${receiptEncoded}:${PASSWORD_1}:Shp_userId=${userId}`;

        const signature = crypto
        .createHash('md5')
        .update(signatureString)
        .digest('hex');

        const url =
        `https://auth.robokassa.ru/Merchant/Index.aspx` +
        `?MerchantLogin=${MERCHANT_LOGIN}` +
        `&OutSum=${outSum}` +
        `&InvId=${invId}` +
        `&Description=${encodeURIComponent(description)}` +
        `&Receipt=${encodeURIComponent(receiptEncoded)}` +
        `&SignatureValue=${signature}` +
        `&Shp_userId=${userId}`;

        user.paymentLink = url;
        user.paymentId = invId;
        await user.save();

        res.json({ success: true, url });
    } catch (error) {
        console.error('Ошибка в payment:', error);
        res.status(500).json({ success: false, message: 'Ошибка при получении ссылки оплаты' });
    }
};

export const getInvitedUsers = async (req, res) => {
    try {
        const { telegramId } = req.body;
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        const invitedUsers = await User.find({ invitedUser: user._id, status: { $ne: 'anonym' } }).select('telegramId telegramUserName fullName');
        res.json({ success: true, invitedUsers });
    } catch (error) {
        console.error('Ошибка в payment:', error);
        res.status(500).json({ success: false, message: 'Ошибка при получении списка приглашенных пользователей' });
    }
}

export const getInvitedUsersCount = async (req, res) => {
    try {
        const { telegramId } = req.body;
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        const invitedUsersCount = await User.countDocuments({ invitedUser: user._id, status: { $ne: 'anonym' } });
        res.json({ success: true, invitedUsersCount });
    } catch (error) {
        console.error('Ошибка в getInvitedUsersCount:', error);
        res.status(500).json({ success: false, message: 'Ошибка при получении количества приглашенных пользователей' });
    }
}

export const addBonusToInviter = async (req, res) => {
    try {
        const { telegramId } = req.body;
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        if (user.invitedUser) {
            await User.findByIdAndUpdate(user.invitedUser, {
                $inc: { bonus: 2, inviteesCount: 1 }
            });
            res.json({ success: true, message: 'Бонус добавлен' });
        } else {
            res.json({ success: false, message: 'Пользователь не пригласил других пользователей' });
        }
    }
    catch (error) {
        console.error('Ошибка в addBonusToInviter:', error);
        res.status(500).json({ success: false, message: 'Ошибка при добавлении бонуса тому, кто пригласил' });
    }
}

/** Передать солнца (бонус) приглашённому пользователю */
export const transferBonus = async (req, res) => {
    try {
        const { userId, recipientTelegramId, amount } = req.body;
        const amountNum = parseInt(amount, 10);
        if (!userId || !recipientTelegramId || !Number.isInteger(amountNum) || amountNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Укажите получателя и корректное количество солнц',
            });
        }
        const sender = await User.findById(userId);
        if (!sender) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }
        const recipient = await User.findOne({ telegramId: String(recipientTelegramId) });
        if (!recipient) {
            return res.status(404).json({ success: false, message: 'Получатель не найден' });
        }
        if (recipient.invitedUser?.toString() !== sender._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Можно передавать солнца только приглашённым вами пользователям',
            });
        }
        if ((sender.bonus || 0) < amountNum) {
            return res.status(400).json({
                success: false,
                message: `Недостаточно солнц. У вас: ${sender.bonus || 0}`,
            });
        }
        sender.bonus = (sender.bonus || 0) - amountNum;
        recipient.bonus = (recipient.bonus || 0) + amountNum;
        await sender.save();
        await recipient.save();

        const notification = {
            modalTitle: "С вами поделились Солнцем!",
            modalDescription: `${sender.telegramUserName && `@${sender.telegramUserName}`} ${sender.fullName && `, ${sender.fullName}`} отправил вам\n${amountNum} шт.`,
            modalButtonText: "Принимаю с благодарностью!",
            modalButtonLink: undefined,
        }

        await User.findByIdAndUpdate(recipient._id, { $push: { modalNotifications: notification } });
        res.json({
            success: true,
            message: 'Солнца успешно переданы',
            bonus: sender.bonus,
        });
    } catch (error) {
        console.error('Ошибка в transferBonus:', error);
        res.status(500).json({ success: false, message: 'Ошибка при передаче солнц' });
    }
};
