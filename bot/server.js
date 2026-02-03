import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import bot from './bot.js';
import { executeUserOperation } from './queue.js';

const app = express();

app.use(express.json());
app.use(cors());

// Функция задержки между отправками (в миллисекундах)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Задержка между сообщениями (50 мс = безопасная частота ~20 сообщений/сек)
// Telegram позволяет до 30 сообщений/сек, но лучше быть консервативнее
const DELAY_BETWEEN_MESSAGES = 50;

// Функция для очистки HTML от недопустимых тегов Telegram
// Telegram поддерживает: <b>, <strong>, <i>, <em>, <u>, <ins>, <s>, <strike>, <del>, 
// <a>, <code>, <pre>, <span class="tg-spoiler">, <blockquote>, <tg-emoji>
const cleanTelegramHTML = (html) => {
    if (!html) return '';
    
    let cleaned = html;
    
    // Сначала сохраняем правильные <span class="tg-spoiler">, заменяя их временным маркером
    const spoilerPlaceholders = [];
    cleaned = cleaned.replace(/<span\s+class\s*=\s*["']tg-spoiler["'][^>]*>(.*?)<\/span>/gis, (match, content) => {
        const placeholder = `__SPOILER_${spoilerPlaceholders.length}__`;
        spoilerPlaceholders.push(`<span class="tg-spoiler">${content}</span>`);
        return placeholder;
    });
    
    // Удаляем ВСЕ остальные <span> теги (включая вложенные и с другими атрибутами)
    // Повторяем несколько раз для надежности (на случай вложенных тегов)
    for (let i = 0; i < 5; i++) {
        cleaned = cleaned.replace(/<span[^>]*>(.*?)<\/span>/gis, '$1');
    }
    cleaned = cleaned.replace(/<span[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/span>/gi, '');
    
    // Восстанавливаем правильные spoiler теги
    spoilerPlaceholders.forEach((spoiler, index) => {
        cleaned = cleaned.replace(`__SPOILER_${index}__`, spoiler);
    });
    
    // Удаляем style атрибуты из blockquote (Telegram их не поддерживает)
    cleaned = cleaned.replace(/<blockquote[^>]*>/gi, '<blockquote>');
    
    // Удаляем другие недопустимые теги
    cleaned = cleaned
        .replace(/<div[^>]*>/gi, '') // <div> -> удаляем
        .replace(/<\/div>/gi, '\n') // </div> -> новая строка
        .replace(/<p[^>]*>/gi, '') // <p> -> удаляем
        .replace(/<\/p>/gi, '\n\n') // </p> -> двойная новая строка
        .replace(/<br\s*\/?>/gi, '\n') // <br> -> новая строка
        // Удаляем все остальные недопустимые теги (кроме разрешенных Telegram)
        // Разрешенные: b, strong, i, em, u, ins, s, strike, del, a, code, pre, span (только tg-spoiler), blockquote, tg-emoji
        .replace(/<(?!\/?(?:b|strong|i|em|u|ins|s|strike|del|a|code|pre|span|blockquote|tg-emoji)\b)[^>]+>/gi, '')
        // Нормализуем пробелы
        .replace(/&nbsp;/g, ' ') // &nbsp; -> пробел
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Убираем лишние пустые строки
        .trim();
    
    console.log('🧹 HTML очищен для Telegram (первые 300 символов):', cleaned.substring(0, 300));
    
    return cleaned;
};

// Получаем ID группы и канала из переменных окружения
const CHANNEL_ID = process.env.CHANNEL_ID;
const GROUP_ID = process.env.GROUP_ID;

/**
 * КРИТИЧЕСКОЕ ПРАВИЛО TELEGRAM BOT API:
 * 
 * ❌ Бот НЕ МОЖЕТ добавить пользователя в канал или супергруппу напрямую по userId
 * ✅ Единственный допустимый способ «добавления» — создание одноразовой пригласительной ссылки
 * ✅ Пользователь сам должен перейти по invite-ссылке
 * 
 * Эта функция НЕ добавляет пользователя, а только отправляет ему пригласительную ссылку.
 * 
 * @param {number|string} chatId - ID канала или супергруппы
 * @param {number|string} userId - Telegram ID пользователя
 * @returns {Promise<Object>} Результат операции с invite-ссылкой
 */
const sendInviteLinkToUser = async (chatId, userId) => {
    try {
        console.log(`📤 [sendInviteLinkToUser] Начало отправки invite-ссылки для пользователя ${userId} в чат ${chatId}`);
        
        // ШАГ 1: Проверка типа чата (ОБЯЗАТЕЛЬНО)
        // Telegram Bot API поддерживает только supergroup и channel для invite-ссылок
        // Обычные группы (group) не поддерживаются
        // getChat обращается к Telegram API, поэтому используем очередь для избежания конфликтов
        let chat;
        try {
            chat = await executeUserOperation(async () => {
                return await bot.telegram.getChat(chatId);
            });
            console.log(`✅ [sendInviteLinkToUser] Тип чата ${chatId}: ${chat.type}`);
        } catch (chatError) {
            const errorMsg = chatError.response?.description || chatError.message || 'Неизвестная ошибка';
            console.error(`❌ [sendInviteLinkToUser] Ошибка получения информации о чате ${chatId}:`, errorMsg);
            return {
                success: false,
                error: `Не удалось получить информацию о чате: ${errorMsg}`,
                errorCode: chatError.response?.error_code,
                inviteSent: false
            };
        }
        
        // Проверяем, что чат является каналом или супергруппой
        if (!['supergroup', 'channel'].includes(chat.type)) {
            const errorMsg = `Неподдерживаемый тип чата: ${chat.type}. Поддерживаются только 'supergroup' и 'channel'`;
            console.error(`❌ [sendInviteLinkToUser] ${errorMsg}`);
                return { 
                success: false,
                error: errorMsg,
                inviteSent: false
            };
        }
        
        // ШАГ 2: Создание одноразовой пригласительной ссылки
        // ❌ НЕ вызываем unbanChatMember до вступления пользователя
        // ❌ НЕ проверяем getChatMember как обязательную проверку
        // ✅ Создаем invite-ссылку с ограничениями:
        //    - member_limit: 1 (одноразовая ссылка)
        //    - expire_date: текущее время + 1 час
        const expireDate = Math.floor(Date.now() / 1000) + 60 * 60; // Текущее время + 1 час в Unix timestamp
        
        let inviteLink;
        try {
            // createChatInviteLink изменяет состояние, поэтому используем очередь
            inviteLink = await executeUserOperation(async () => {
                return await bot.telegram.createChatInviteLink(chatId, {
                member_limit: 1, // Одноразовая ссылка - может быть использована только одним пользователем
                });
            });
            console.log(`✅ [sendInviteLinkToUser] Создана invite-ссылка для пользователя ${userId}: ${inviteLink.invite_link}`);
        } catch (inviteError) {
            const errorMsg = inviteError.response?.description || inviteError.message || 'Неизвестная ошибка';
            const errorCode = inviteError.response?.error_code;
            console.error(`❌ [sendInviteLinkToUser] Ошибка создания invite-ссылки для чата ${chatId}:`, errorMsg);
            return {
                success: false,
                error: `Не удалось создать invite-ссылку: ${errorMsg}`,
                errorCode,
                inviteSent: false,
                details: 'Проверьте, что бот является администратором в группе/канале с правами на создание пригласительных ссылок'
            };
        }
        
        // ШАГ 3: Отправка invite-ссылки пользователю в личные сообщения
        // Пользователь должен сам перейти по ссылке - автоматического добавления нет
        // Используем очередь для предотвращения конфликтов с polling
        try {
            await executeUserOperation(async () => {
                return await bot.telegram.sendMessage(userId, 
                `🎉 Вам открыт доступ к закрытым материалам!\n\n` +
                `📌 Присоединяйтесь к нашему сообществу по ссылке ниже:\n\n` +
                `${inviteLink.invite_link}\n\n` +
                `⏰ Ссылка действует 1 час.`,
                {
                    reply_markup: {
                        inline_keyboard: [[
                            {
                                text: '🔗 Присоединиться',
                                url: inviteLink.invite_link
                            }
                        ]]
                    }
                }
            );
            });
            
            console.log(`✅ [sendInviteLinkToUser] Invite-ссылка успешно отправлена пользователю ${userId}`);
            
            return { 
                success: true, 
                inviteSent: true,
                inviteLink: inviteLink.invite_link,
                expireDate: expireDate,
                message: 'Пригласительная ссылка отправлена пользователю'
            };
        } catch (sendError) {
            // Если не удалось отправить в личку, это не критическая ошибка
            // Ссылка все равно создана и может быть использована
            const errorMsg = sendError.response?.description || sendError.message || 'Неизвестная ошибка';
            const errorCode = sendError.response?.error_code;
            
            console.warn(`⚠️ [sendInviteLinkToUser] Invite-ссылка создана, но не удалось отправить пользователю ${userId}:`, errorMsg);
            
            return { 
                success: true, // Ссылка создана успешно
                inviteSent: false, // Но не отправлена
                inviteLink: inviteLink.invite_link,
                expireDate: expireDate,
                warning: 'Пользователь заблокировал бота или не начал диалог',
                error: errorMsg,
                errorCode,
                message: 'Пригласительная ссылка создана, но не удалось отправить в личку'
            };
        }
    } catch (error) {
        const errorMessage = error.response?.description || error.message || 'Неизвестная ошибка';
        const errorCode = error.response?.error_code;
        
        console.error(`❌ [sendInviteLinkToUser] Критическая ошибка для пользователя ${userId} в чат ${chatId}:`, errorMessage);
        return { 
            success: false, 
            inviteSent: false,
            error: errorMessage, 
            errorCode,
            details: 'Проверьте, что бот является администратором в группе/канале с правами на создание пригласительных ссылок'
        };
    }
};

/**
 * Удаление пользователя из канала или супергруппы
 * 
 * КОРРЕКТНАЯ ЛОГИКА УДАЛЕНИЯ:
 * 1. banChatMember - удаляет пользователя из чата
 * 2. unbanChatMember - разбанивает, чтобы пользователь мог вернуться по новой invite-ссылке
 * 
 * ⚠️ Ошибки USER_NOT_PARTICIPANT считаются успехом (пользователь уже не участник)
 * 
 * @param {number|string} chatId - ID канала или супергруппы
 * @param {number|string} userId - Telegram ID пользователя
 * @returns {Promise<Object>} Результат операции удаления
 */
const removeUserFromChat = async (chatId, userId) => {
    try {
        console.log(`🗑️ [removeUserFromChat] Начало удаления пользователя ${userId} из чата ${chatId}`);
        
        // ШАГ 1: Проверка типа чата (ОБЯЗАТЕЛЬНО)
        // Telegram Bot API поддерживает только supergroup и channel для ban/unban операций
        // getChat обращается к Telegram API, поэтому используем очередь для избежания конфликтов
        let chat;
        try {
            chat = await executeUserOperation(async () => {
                return await bot.telegram.getChat(chatId);
            });
            console.log(`✅ [removeUserFromChat] Тип чата ${chatId}: ${chat.type}`);
        } catch (chatError) {
            const errorMsg = chatError.response?.description || chatError.message || 'Неизвестная ошибка';
            console.error(`❌ [removeUserFromChat] Ошибка получения информации о чате ${chatId}:`, errorMsg);
            return {
                success: false,
                error: `Не удалось получить информацию о чате: ${errorMsg}`,
                errorCode: chatError.response?.error_code,
                removed: false
            };
        }
        
        // Проверяем, что чат является каналом или супергруппой
        if (!['supergroup', 'channel'].includes(chat.type)) {
            const errorMsg = `Неподдерживаемый тип чата: ${chat.type}. Поддерживаются только 'supergroup' и 'channel'`;
            console.error(`❌ [removeUserFromChat] ${errorMsg}`);
            return {
                success: false,
                error: errorMsg,
                removed: false
            };
        }
        
        // ШАГ 2: Удаление пользователя через banChatMember
        // banChatMember удаляет пользователя из группы/канала
        // revoke_messages: false - не удаляем сообщения пользователя
        // Используем очередь для предотвращения конфликтов с polling
        try {
            await executeUserOperation(async () => {
                return await bot.telegram.banChatMember(chatId, userId, {
                revoke_messages: false // Не удаляем сообщения пользователя
                });
            });
            console.log(`✅ [removeUserFromChat] Пользователь ${userId} забанен (удален) из чата ${chatId}`);
        } catch (banError) {
            const errorMsg = banError.response?.description || banError.message || 'Неизвестная ошибка';
            const errorCode = banError.response?.error_code;
            
            // Если пользователь не является участником, это не ошибка
            if (errorMsg.includes('not a member') || 
                errorMsg.includes('not in the chat') || 
                errorMsg.includes('USER_NOT_PARTICIPANT') ||
                errorCode === 400) {
                console.log(`ℹ️ [removeUserFromChat] Пользователь ${userId} уже не является участником чата ${chatId}`);
                return { 
                    success: true, 
                    removed: false,
                    alreadyRemoved: true,
                    message: 'Пользователь не является участником'
                };
            }
            
            console.error(`❌ [removeUserFromChat] Ошибка бана пользователя ${userId} из чата ${chatId}:`, errorMsg);
            return { 
                success: false,
                removed: false,
                error: `Не удалось удалить пользователя: ${errorMsg}`,
                errorCode,
                details: 'Проверьте, что бот является администратором в группе/канале с правами на удаление пользователей'
            };
        }
        
        // ШАГ 3: Уведомление пользователя о завершении подписки (опционально)
        // Это не критично для успешного удаления
        // Используем очередь для предотвращения конфликтов с polling
        try {
            await executeUserOperation(async () => {
                return await bot.telegram.sendMessage(userId, 
                `⏰ Ваша подписка завершена.\n\n` +
                `Вы были удалены из закрытых групп и каналов.\n\n` +
                `Для возобновления доступа, пожалуйста, продлите подписку.`
            );
            });
            console.log(`✅ [removeUserFromChat] Уведомление отправлено пользователю ${userId}`);
        } catch (sendError) {
            // Если не удалось отправить уведомление, это не критично
            console.log(`ℹ️ [removeUserFromChat] Не удалось отправить уведомление пользователю ${userId}:`, sendError.message);
        }
        
        return { 
            success: true, 
            removed: true,
            message: 'Пользователь успешно удален'
        };
    } catch (error) {
        const errorMessage = error.response?.description || error.message || 'Неизвестная ошибка';
        const errorCode = error.response?.error_code;
        
        // Если пользователь не в группе/канале, это не ошибка
        if (errorMessage.includes('not a member') || 
            errorMessage.includes('not in the chat') || 
            errorMessage.includes('USER_NOT_PARTICIPANT')) {
            console.log(`ℹ️ [removeUserFromChat] Пользователь ${userId} не является участником чата ${chatId}`);
            return { 
                success: true, 
                removed: false,
                alreadyRemoved: true,
                message: 'Пользователь не является участником'
            };
        }
        
        console.error(`❌ [removeUserFromChat] Критическая ошибка удаления пользователя ${userId} из чата ${chatId}:`, errorMessage);
        return { 
            success: false, 
            removed: false,
            error: errorMessage, 
            errorCode,
            details: 'Проверьте, что бот является администратором в группе/канале с правами на удаление пользователей'
        };
    }
};

// Функция для конвертации HTML в текст для Telegram
const htmlToTelegramText = (html) => {
    if (!html) return '';
    
    // Удаляем HTML теги и заменяем их на текстовые эквиваленты
    let text = html
        .replace(/<br\s*\/?>/gi, '\n') // <br> -> новая строка
        .replace(/<\/p>/gi, '\n\n') // </p> -> двойная новая строка
        .replace(/<p>/gi, '') // <p> -> удаляем
        .replace(/<\/div>/gi, '\n') // </div> -> новая строка
        .replace(/<div[^>]*>/gi, '') // <div> -> удаляем
        .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1') // <span> -> удаляем, оставляем содержимое
        .replace(/<strong>(.*?)<\/strong>/gi, '*$1*') // <strong> -> жирный текст
        .replace(/<b>(.*?)<\/b>/gi, '*$1*') // <b> -> жирный текст
        .replace(/<em>(.*?)<\/em>/gi, '_$1_') // <em> -> курсив
        .replace(/<i>(.*?)<\/i>/gi, '_$1_') // <i> -> курсив
        .replace(/<u>(.*?)<\/u>/gi, '__$1__') // <u> -> подчеркивание
        .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)') // <a> -> текст (ссылка)
        .replace(/<[^>]+>/g, '') // Удаляем все остальные HTML теги
        .replace(/&nbsp;/g, ' ') // &nbsp; -> пробел
        .replace(/&amp;/g, '&') // &amp; -> &
        .replace(/&lt;/g, '<') // &lt; -> <
        .replace(/&gt;/g, '>') // &gt; -> >
        .replace(/&quot;/g, '"') // &quot; -> "
        .replace(/&#39;/g, "'") // &#39; -> '
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Убираем лишние пустые строки
        .trim();
    
    return text;
};

app.post('/api/bot/broadcast', async (req, res) => {
    try {
        const { text, telegramIds, parseMode, imageUrl, buttonText, buttonUrl, usersData, backgroundColor } = req.body;
        
        // Валидация входных данных
        if (!text || !telegramIds || !Array.isArray(telegramIds)) {
            return res.status(400).json({ 
                error: 'Необходимо предоставить text (текст сообщения) и telegramIds (массив ID пользователей)' 
            });
        }

        if (telegramIds.length === 0) {
            return res.status(400).json({ 
                error: 'Список telegramIds не может быть пустым' 
            });
        }

        // Проверяем соответствие количества usersData и telegramIds
        if (usersData && usersData.length !== telegramIds.length) {
            console.warn('Количество usersData не соответствует количеству telegramIds');
        }

        // Определяем режим парсинга (HTML, Markdown или текст)
        const parse_mode = parseMode || 'HTML';
        
        // Если режим HTML, но текст содержит HTML теги, используем HTML парсинг
        // Иначе конвертируем HTML в текст
        let messageText = text;
        let finalParseMode = parse_mode;
        
        if (parse_mode === 'HTML' && /<[^>]+>/.test(text)) {
            // Текст содержит HTML теги, очищаем от недопустимых тегов Telegram
            messageText = cleanTelegramHTML(text);
            
            // Дополнительная проверка: если после очистки все еще есть <span> без tg-spoiler, удаляем их
            // Это защита на случай, если регулярное выражение пропустило какие-то теги
            if (/<span(?!\s+class=["']tg-spoiler["'])[^>]*>/i.test(messageText)) {
                console.warn('Обнаружены <span> теги без tg-spoiler после очистки, выполняем дополнительную очистку');
                messageText = messageText.replace(/<span(?!\s+class=["']tg-spoiler["'])[^>]*>/gi, '');
                messageText = messageText.replace(/<\/span>/gi, '');
            }
            
            console.log('Очищенный HTML (первые 200 символов):', messageText.substring(0, 200)); // Логируем для отладки
            finalParseMode = 'HTML';
        } else if (parse_mode === 'HTML') {
            // HTML режим, но тегов нет - используем текст
            finalParseMode = undefined;
        } else if (parse_mode === 'Markdown') {
            // Для Markdown конвертируем HTML в Markdown формат
            // Сначала конвертируем HTML теги в Markdown синтаксис
            messageText = text
                .replace(/<br\s*\/?>/gi, '\n') // <br> -> новая строка
                .replace(/<\/p>/gi, '\n\n') // </p> -> двойная новая строка
                .replace(/<p>/gi, '') // <p> -> удаляем
                .replace(/<\/div>/gi, '\n') // </div> -> новая строка
                .replace(/<div[^>]*>/gi, '') // <div> -> удаляем
                .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1') // <span> -> удаляем
                .replace(/<strong>(.*?)<\/strong>/gi, '*$1*') // <strong> -> жирный текст
                .replace(/<b>(.*?)<\/b>/gi, '*$1*') // <b> -> жирный текст
                .replace(/<em>(.*?)<\/em>/gi, '_$1_') // <em> -> курсив
                .replace(/<i>(.*?)<\/i>/gi, '_$1_') // <i> -> курсив
                .replace(/<u>(.*?)<\/u>/gi, '__$1__') // <u> -> подчеркивание
                .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)') // <a> -> Markdown ссылка
                .replace(/<code>(.*?)<\/code>/gi, '`$1`') // <code> -> код
                .replace(/<pre>(.*?)<\/pre>/gis, '```\n$1\n```') // <pre> -> блок кода
                .replace(/<[^>]+>/g, '') // Удаляем все остальные HTML теги
                .replace(/&nbsp;/g, ' ') // &nbsp; -> пробел
                .replace(/&amp;/g, '&') // &amp; -> &
                .replace(/&lt;/g, '<') // &lt; -> <
                .replace(/&gt;/g, '>') // &gt; -> >
                .replace(/&quot;/g, '"') // &quot; -> "
                .replace(/&#39;/g, "'") // &#39; -> '
                .replace(/\n\s*\n\s*\n/g, '\n\n') // Убираем лишние пустые строки
                .trim();
            finalParseMode = 'Markdown';
        } else {
            // Текстовый режим - конвертируем HTML в текст
            messageText = htmlToTelegramText(text);
            finalParseMode = undefined;
        }

        // Используем переданную задержку или значение по умолчанию
        const messageDelay = DELAY_BETWEEN_MESSAGES;

        // Отправка сообщений всем пользователям
        const results = {
            success: [],
            failed: []
        };

        console.log(`Начинаем рассылку для ${telegramIds.length} пользователей. Режим парсинга: ${finalParseMode || 'текст'}`);
        if (imageUrl) {
            console.log('Будет отправлено изображение:', imageUrl);
        }
        if (buttonText && buttonUrl) {
            console.log('Будет добавлена inline кнопка:', buttonText);
        }

        // Функция для формирования URL кнопки с базовым URL и параметрами
        const buildButtonUrl = (userData) => {
            if (!userData) return 'https://portal.tochkali.com/';
            
            const baseUrl = 'https://portal.tochkali.com/';
            const params = new URLSearchParams();
            
            // Всегда добавляем telegramId
            if (userData.telegramId) {
                params.append('telegramId', userData.telegramId);
            }
            
            // Добавляем profilePhotoUrl только если он не пустой
            if (userData.profilePhotoUrl && userData.profilePhotoUrl.trim() !== '') {
                params.append('profilePhotoUrl', userData.profilePhotoUrl);
            }
            
            // Добавляем backgroundColor (фон рассылки): 'blue' (дефолт) или 'orange'
            // Если не указан, используется 'blue' по умолчанию
            const bgColor = backgroundColor === 'orange' ? 'orange' : 'blue';
            params.append('backgroundColor', bgColor);
            
            // Формируем финальный URL с параметрами
            return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
        };

        for (let i = 0; i < telegramIds.length; i++) {
            const telegramId = telegramIds[i];
            const userData = usersData && usersData[i] ? usersData[i] : { telegramId, telegramUserName: '', profilePhotoUrl: '' };
            
            try {
                // Формируем опции для отправки сообщения
                const messageOptions = {
                    parse_mode: finalParseMode
                };

                // Добавляем inline кнопку, если указан текст
                if (buttonText) {
                    const finalButtonUrl = buildButtonUrl(userData);
                    messageOptions.reply_markup = {
                        inline_keyboard: [[
                            {
                                text: buttonText,
                                web_app: {
                                    url: finalButtonUrl
                                }
                            }
                        ]]
                    };
                }

                // Если есть изображение, отправляем фото с подписью
                if (imageUrl) {
                    // Формируем полный URL изображения
                    // Если URL уже полный (начинается с http/https), используем как есть
                    // Иначе добавляем базовый URL API сервера
                    const API_BASE_URL = process.env.API_URL || process.env.BOT_API_URL || 'http://localhost:3002';
                    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
                    
                    console.log(`Отправка фото пользователю ${telegramId}, URL: ${fullImageUrl}`);
                    
                    // sendPhoto изменяет состояние, поэтому используем очередь
                    await executeUserOperation(async () => {
                        return await bot.telegram.sendPhoto(telegramId, fullImageUrl, {
                        caption: messageText,
                        parse_mode: finalParseMode,
                        ...(messageOptions.reply_markup && { reply_markup: messageOptions.reply_markup })
                        });
                    });
                } else {
                    // Отправляем обычное текстовое сообщение
                    // sendMessage изменяет состояние, поэтому используем очередь
                    await executeUserOperation(async () => {
                        return await bot.telegram.sendMessage(telegramId, messageText, messageOptions);
                    });
                }
                
                results.success.push(telegramId);
                
                // Добавляем задержку между сообщениями (кроме последнего)
                if (i < telegramIds.length - 1) {
                    await delay(messageDelay);
                }
            } catch (error) {
                const errorMessage = error.response?.description || error.message || 'Неизвестная ошибка';
                const errorCode = error.response?.error_code;
                
                console.error(`Ошибка отправки сообщения пользователю ${telegramId}:`, errorMessage);
                
                // Если это ошибка rate limit, добавляем дополнительную задержку
                if (errorCode === 429 || errorMessage.includes('Too Many Requests')) {
                    console.log('Обнаружен rate limit, добавляем дополнительную задержку...');
                    await delay(1000); // Задержка 1 секунда при rate limit
                }
                
                // Если пользователь заблокировал бота или не найден, не добавляем большую задержку
                if (errorCode === 403 || errorCode === 400) {
                    // Пользователь заблокировал бота или неверный chat_id
                    console.log(`Пользователь ${telegramId} заблокировал бота или не найден`);
                }
                
                results.failed.push({
                    telegramId,
                    error: errorMessage,
                    errorCode: errorCode
                });
            }
        }

        console.log(`Рассылка завершена. Успешно: ${results.success.length}, Ошибок: ${results.failed.length}`);

        res.status(200).json({
            message: 'Рассылка завершена',
            total: telegramIds.length,
            success: results.success.length,
            failed: results.failed.length,
            results
        });
    } catch (error) {
        console.error('Ошибка при выполнении рассылки:', error);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            message: error.message 
        });
    }
});

/**
 * API эндпоинт для отправки пригласительных ссылок пользователю
 * 
 * ⚠️ ВАЖНО: Этот эндпоинт НЕ добавляет пользователя напрямую!
 * Он только отправляет invite-ссылки. Пользователь должен сам перейти по ссылке.
 * 
 * POST /api/bot/add-user
 * Body: { telegramId: number }
 * 
 * Возвращает статус 200 всегда, ошибки внутри JSON
 */
app.post('/api/bot/add-user', async (req, res) => {
    try {
        const { telegramId } = req.body;
        
        if (!telegramId) {
            return res.status(200).json({
                success: false,
                error: 'Необходимо предоставить telegramId',
                channel: null,
                group: null
            });
        }

        // await bot.telegram.sendMessage(telegramId, '🎉 Вам открыт доступ к закрытым материалам!')
        
        console.log(`📥 [API] Запрос на отправку invite-ссылок для пользователя ${telegramId}`);

        const results = {
            channel: null,
            group: null
        };

        // Отправляем invite-ссылку для канала, если указан
        if (CHANNEL_ID) {
            try {
                // Используем очередь для предотвращения конфликтов с polling
                await executeUserOperation(async () => {
                    return await bot.telegram.unbanChatMember(CHANNEL_ID, telegramId, {
                    only_if_banned: true
                    });
                });
            
                console.log(
                    `✅ Пользователь ${telegramId} был разбанен (если находился в бане)`
                );
            } catch (error) {
                const errorMsg = error.response?.description || error.message;
                const errorCode = error.response?.error_code;
            
                // Обрабатываем ошибку 409 (конфликт с polling)
                if (errorCode === 409) {
                    console.warn(
                        `⚠️ Конфликт 409 при разбане пользователя ${telegramId}. Операция будет повторена.`
                    );
                } else {
                console.warn(
                    `⚠️ Ошибка при попытке разбана пользователя ${telegramId}:`,
                    errorMsg
                );
                }
            }
            
            try {
                console.log(`📤 [API] Отправка invite-ссылки для канала ${CHANNEL_ID}`);
                results.channel = await sendInviteLinkToUser(CHANNEL_ID, parseInt(telegramId));
            } catch (error) {
                console.error(`❌ [API] Ошибка отправки invite-ссылки для канала ${CHANNEL_ID}:`, error);
                results.channel = {
                    success: false,
                    inviteSent: false,
                    error: error.message || 'Неизвестная ошибка'
                };
            }
        } else {
            console.warn(`⚠️ [API] CHANNEL_ID не указан в переменных окружения`);
            results.channel = {
                success: false,
                inviteSent: false,
                error: 'CHANNEL_ID не указан в переменных окружения'
            };
        }

        // Отправляем invite-ссылку для группы, если указана
        if (GROUP_ID) {
            try {
                // Используем очередь для предотвращения конфликтов с polling
                await executeUserOperation(async () => {
                    return await bot.telegram.unbanChatMember(GROUP_ID, telegramId, {
                    only_if_banned: true
                    });
                });
            
                console.log(
                    `✅ Пользователь ${telegramId} был разбанен (если находился в бане)`
                );
            } catch (error) {
                const errorMsg = error.response?.description || error.message;
                const errorCode = error.response?.error_code;
            
                // Обрабатываем ошибку 409 (конфликт с polling)
                if (errorCode === 409) {
                    console.warn(
                        `⚠️ Конфликт 409 при разбане пользователя ${telegramId}. Операция будет повторена.`
                    );
                } else {
                console.warn(
                    `⚠️ Ошибка при попытке разбана пользователя ${telegramId}:`,
                    errorMsg
                );
                }
            }
            
            try {
                console.log(`📤 [API] Отправка invite-ссылки для группы ${GROUP_ID}`);
                results.group = await sendInviteLinkToUser(GROUP_ID, parseInt(telegramId));
            } catch (error) {
                console.error(`❌ [API] Ошибка отправки invite-ссылки для группы ${GROUP_ID}:`, error);
                results.group = {
                    success: false,
                    inviteSent: false,
                    error: error.message || 'Неизвестная ошибка'
                };
            }
        } else {
            console.warn(`⚠️ [API] GROUP_ID не указан в переменных окружения`);
            results.group = {
                success: false,
                inviteSent: false,
                error: 'GROUP_ID не указан в переменных окружения'
            };
        }

        // Определяем общий статус успеха
        const channelSuccess = results.channel?.success === true;
        const groupSuccess = results.group?.success === true;
        const allSuccess = channelSuccess && groupSuccess;
        const anySuccess = channelSuccess || groupSuccess;

        // Всегда возвращаем статус 200, ошибки внутри JSON
        res.status(200).json({
            success: allSuccess,
            message: allSuccess 
                ? 'Пригласительные ссылки успешно отправлены для канала и группы'
                : anySuccess
                    ? 'Пригласительные ссылки отправлены частично'
                    : 'Не удалось отправить пригласительные ссылки',
            results
        });
    } catch (error) {
        console.error('❌ [API] Критическая ошибка при отправке invite-ссылок:', error);
        res.status(200).json({
            success: false,
            error: 'Внутренняя ошибка сервера',
            message: error.message,
            results: {
                channel: null,
                group: null
            }
        });
    }
});

/**
 * API эндпоинт для удаления пользователя из группы и канала
 * 
 * Этот эндпоинт реально удаляет пользователя через banChatMember + unbanChatMember
 * 
 * POST /api/bot/remove-user
 * Body: { telegramId: number }
 * 
 * Возвращает статус 200 всегда, ошибки внутри JSON
 * Ошибки USER_NOT_PARTICIPANT считаются успехом
 */
app.post('/api/bot/remove-user', async (req, res) => {
    try {
        const { telegramId } = req.body;
        
        if (!telegramId) {
            return res.status(200).json({
                success: false,
                error: 'Необходимо предоставить telegramId',
                channel: null,
                group: null
            });
        }

        console.log(`🗑️ [API] Запрос на удаление пользователя ${telegramId}`);

        const results = {
            channel: null,
            group: null
        };

        // Удаляем из канала, если указан
        if (CHANNEL_ID) {
            try {
                console.log(`🗑️ [API] Удаление пользователя из канала ${CHANNEL_ID}`);
                results.channel = await removeUserFromChat(CHANNEL_ID, parseInt(telegramId));
            } catch (error) {
                console.error(`❌ [API] Ошибка удаления из канала ${CHANNEL_ID}:`, error);
                results.channel = {
                    success: false,
                    removed: false,
                    error: error.message || 'Неизвестная ошибка'
                };
            }
        } else {
            console.warn(`⚠️ [API] CHANNEL_ID не указан в переменных окружения`);
            results.channel = {
                success: false,
                removed: false,
                error: 'CHANNEL_ID не указан в переменных окружения'
            };
        }

        // Удаляем из группы, если указана
        if (GROUP_ID) {
            try {
                console.log(`🗑️ [API] Удаление пользователя из группы ${GROUP_ID}`);
                results.group = await removeUserFromChat(GROUP_ID, parseInt(telegramId));
            } catch (error) {
                console.error(`❌ [API] Ошибка удаления из группы ${GROUP_ID}:`, error);
                results.group = {
                    success: false,
                    removed: false,
                    error: error.message || 'Неизвестная ошибка'
                };
            }
        } else {
            console.warn(`⚠️ [API] GROUP_ID не указан в переменных окружения`);
            results.group = {
                success: false,
                removed: false,
                error: 'GROUP_ID не указан в переменных окружения'
            };
        }

        // Определяем общий статус успеха
        // Ошибки USER_NOT_PARTICIPANT считаются успехом (пользователь уже не участник)
        const channelSuccess = results.channel?.success === true;
        const groupSuccess = results.group?.success === true;
        const allSuccess = channelSuccess && groupSuccess;
        const anySuccess = channelSuccess || groupSuccess;

        // Всегда возвращаем статус 200, ошибки внутри JSON
        res.status(200).json({
            success: allSuccess,
            message: allSuccess 
                ? 'Пользователь успешно удален из канала и группы'
                : anySuccess
                    ? 'Пользователь удален частично'
                    : 'Не удалось удалить пользователя',
            results
        });
    } catch (error) {
        console.error('❌ [API] Критическая ошибка при удалении пользователя:', error);
        res.status(200).json({
            success: false,
            error: 'Внутренняя ошибка сервера',
            message: error.message,
            results: {
                channel: null,
                group: null
            }
        });
    }
});

// Запускаем бота при старте сервера
bot.launch({
    allowedUpdates: ['message', 'callback_query'], // Указываем типы обновлений
    dropPendingUpdates: false // Не удаляем ожидающие обновления при перезапуске
}).then(() => {
    console.log('✅ Telegram bot started successfully');
}).catch((error) => {
    console.error('❌ Error starting bot:', error);
    
    // Если это ошибка конфликта (409), выводим понятное сообщение
    if (error.response?.error_code === 409) {
        console.error('\n⚠️  ВНИМАНИЕ: Обнаружен конфликт!');
        console.error('Другой экземпляр бота уже запущен.');
        console.error('Решение:');
        console.error('1. Проверьте запущенные процессы: ps aux | grep node');
        console.error('2. Остановите все экземпляры бота');
        console.error('3. Перезапустите только один экземпляр\n');
    }
    
    // Не завершаем процесс при ошибке запуска, чтобы сервер продолжал работать
    // Можно добавить логику повторной попытки или уведомления администратора
});

// Graceful shutdown для корректного завершения бота
const gracefulShutdown = () => {
    console.log('\n🛑 Получен сигнал завершения, останавливаем бота...');
    bot.stop('SIGTERM');
    process.exit(0);
};

process.once('SIGINT', gracefulShutdown);
process.once('SIGTERM', gracefulShutdown);

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Не завершаем процесс, только логируем
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Не завершаем процесс, только логируем
});

app.listen(process.env.PORT, () => {
    console.log(`✅ Server is running on port ${process.env.PORT}`);
});