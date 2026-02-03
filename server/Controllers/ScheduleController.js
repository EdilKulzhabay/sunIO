import Schedule from "../Models/Schedule.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Функция для конвертации datetime-local (без часового пояса) в Date
// Интерпретирует время как локальное время в Asia/Almaty (UTC+6) и конвертирует в UTC
const parseDateTimeLocal = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    // Формат: "YYYY-MM-DDTHH:mm" или "YYYY-MM-DDTHH:mm:ss"
    // Если это ISO формат с Z или +, используем стандартный парсинг
    if (dateTimeString.includes('Z') || (dateTimeString.includes('+') && dateTimeString.length > 16) || (dateTimeString.includes('-') && dateTimeString.length > 16)) {
        const date = new Date(dateTimeString);
        return isNaN(date.getTime()) ? null : date;
    }
    
    // Парсим datetime-local формат: "YYYY-MM-DDTHH:mm"
    const match = dateTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
        const date = new Date(dateTimeString);
        return isNaN(date.getTime()) ? null : date;
    }
    
    const [, year, month, day, hours, minutes, seconds = '0'] = match;
    
    // Создаем дату в UTC, интерпретируя введенное время как время в Asia/Almaty (UTC+6)
    // Если пользователь ввел 14:00, это означает 14:00 в Asia/Almaty, что равно 08:00 UTC
    // Используем Date.UTC и вычитаем 6 часов (360 минут)
    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10) - 1; // месяцы начинаются с 0
    const dayInt = parseInt(day, 10);
    const hoursInt = parseInt(hours, 10);
    const minutesInt = parseInt(minutes, 10);
    const secondsInt = parseInt(seconds, 10);
    
    // Создаем дату как будто это UTC, но затем вычитаем смещение часового пояса
    const utcDate = new Date(Date.UTC(yearInt, monthInt, dayInt, hoursInt, minutesInt, secondsInt));
    // Вычитаем 6 часов (Asia/Almaty = UTC+6, значит UTC = локальное время - 6 часов)
    utcDate.setUTCHours(utcDate.getUTCHours() - 6);
    
    return utcDate;
};

// Создать новое событие
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { eventTitle, startDate, endDate, eventLink, googleCalendarLink, appleCalendarLink, description } = req.body;

        // if (!eventTitle || !startDate || !endDate || !description) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Все обязательные поля должны быть заполнены",
        //     });
        // }

        // Конвертируем даты: datetime-local интерпретируется как время в Asia/Almaty
        const parsedStartDate = startDate ? parseDateTimeLocal(startDate) : null;
        const parsedEndDate = endDate ? parseDateTimeLocal(endDate) : null;
        
        // Проверка валидности дат
        if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Неверный формат даты начала",
            });
        }
        
        if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Неверный формат даты окончания",
            });
        }

        const schedule = new Schedule({
            eventTitle,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            eventLink,
            googleCalendarLink,
            appleCalendarLink,
            description,
        });

        await schedule.save();

        await addAdminAction(user._id, `Создал(а) событие: "${eventTitle}"`);

        res.status(201).json({
            success: true,
            data: schedule,
            message: "Событие успешно создано",
        });
    } catch (error) {
        console.log("Ошибка в ScheduleController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании события",
            error: error.message,
        });
    }
};

// Функция для парсинга даты из формата DD.MM.YYYY
const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Формат DD.MM.YYYY
    const parts = dateString.split('.');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // месяцы в JS начинаются с 0
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        
        // Проверка валидности даты
        if (isNaN(date.getTime())) {
            return null;
        }
        
        return date;
    }
    
    // Попытка стандартного парсинга
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return null;
    }
    
    return date;
};

// Получить все события
export const getAll = async (req, res) => {
    try {
        const { startDate: queryStartDate, endDate: queryEndDate, upcoming } = req.query;
        
        const filter = {};
        
        // Фильтр для предстоящих событий
        if (upcoming === 'true') {
            filter.startDate = { $gte: new Date() };
        }
        
        // Фильтр по диапазону дат (для поиска событий, которые пересекаются с указанным диапазоном)
        if (queryStartDate && queryEndDate) {
            const parsedStartDate = parseDate(queryStartDate);
            const parsedEndDate = parseDate(queryEndDate);
            
            if (parsedStartDate && parsedEndDate) {
                // Устанавливаем время начала дня для startDate
                const start = new Date(parsedStartDate);
                start.setHours(0, 0, 0, 0);
                
                // Устанавливаем время конца дня для endDate
                const end = new Date(parsedEndDate);
                end.setHours(23, 59, 59, 999);
                
                // Ищем события, которые пересекаются с указанным диапазоном
                filter.$or = [
                    { startDate: { $lte: end }, endDate: { $gte: start } }
                ];
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Неверный формат даты. Используйте формат DD.MM.YYYY",
                });
            }
        } else if (queryStartDate || queryEndDate) {
            // Если передана только одна дата
            return res.status(400).json({
                success: false,
                message: "Необходимо указать обе даты: startDate и endDate",
            });
        }

        const schedules = await Schedule.find(filter).sort({ startDate: 1 });

        res.json({
            success: true,
            data: schedules,
            count: schedules.length,
        });
    } catch (error) {
        console.log("Ошибка в ScheduleController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении событий",
            error: error.message,
        });
    }
};

// Получить событие по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await Schedule.findById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Событие не найдено",
            });
        }

        res.json({
            success: true,
            data: schedule,
        });
    } catch (error) {
        console.log("Ошибка в ScheduleController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении события",
            error: error.message,
        });
    }
};

// Обновить событие
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        
        // Проверяем, существует ли событие
        const existingSchedule = await Schedule.findById(id);
        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                message: "Событие не найдено",
            });
        }
        
        const updateData = { ...req.body };

        // Конвертируем даты: datetime-local интерпретируется как время в Asia/Almaty
        if (updateData.startDate) {
            const parsedDate = parseDateTimeLocal(updateData.startDate);
            if (!parsedDate || isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Неверный формат даты начала",
                });
            }
            updateData.startDate = parsedDate;
        }
        
        if (updateData.endDate) {
            const parsedDate = parseDateTimeLocal(updateData.endDate);
            if (!parsedDate || isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Неверный формат даты окончания",
                });
            }
            updateData.endDate = parsedDate;
        }

        const schedule = await Schedule.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Событие не найдено",
            });
        }

        await addAdminAction(user._id, `Обновил(а) событие: "${schedule.eventTitle}"`);

        res.json({
            success: true,
            data: schedule,
            message: "Событие успешно обновлено",
        });
    } catch (error) {
        console.log("Ошибка в ScheduleController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении события",
            error: error.message,
        });
    }
};

// Удалить событие
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const schedule = await Schedule.findByIdAndDelete(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Событие не найдено",
            });
        }

        await addAdminAction(user._id, `Удалил(а) событие: "${schedule.eventTitle}"`);

        res.json({
            success: true,
            message: "Событие успешно удалено",
        });
    } catch (error) {
        console.log("Ошибка в ScheduleController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении события",
            error: error.message,
        });
    }
};

