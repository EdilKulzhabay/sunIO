import User from "../Models/User.js";

/**
 * Проверяет истекшие подписки и обновляет статус пользователей
 * Если подписка истекла, меняет статус на предыдущий и hasPaid на false
 */
export const checkExpiredSubscriptions = async () => {
    try {
        const now = new Date();
        // Устанавливаем время на начало дня (00:00:00) для корректного сравнения
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        console.log(`[${new Date().toISOString()}] Начало проверки истекших подписок...`);
        
        // Находим всех пользователей с истекшими подписками
        // subscriptionEndDate < today (подписка истекла до начала сегодняшнего дня)
        // hasPaid === true (подписка была оплачена)
        const expiredUsers = await User.find({
            subscriptionEndDate: { $lt: today },
            hasPaid: true
        });

        if (expiredUsers.length === 0) {
            console.log(`[${new Date().toISOString()}] Истекших подписок не найдено`);
            return {
                success: true,
                expiredCount: 0,
                updatedCount: 0
            };
        }

        console.log(`[${new Date().toISOString()}] Найдено пользователей с истекшими подписками: ${expiredUsers.length}`);

        let updatedCount = 0;
        const errors = [];

        // Обновляем каждого пользователя
        for (const user of expiredUsers) {
            try {
                const previousStatus = user.previousStatus || 'guest'; // Если previousStatus null, используем 'guest' по умолчанию
                
                await User.findByIdAndUpdate(
                    user._id,
                    {
                        status: previousStatus,
                        previousStatus: null,
                        hasPaid: false,
                        subscriptionEndDate: null
                    },
                    { new: true }
                );

                updatedCount++;
                console.log(`[${new Date().toISOString()}] Пользователь ${user._id} (${user.fullName || user.telegramUserName || 'без имени'}) - статус изменен с '${user.status}' на '${previousStatus}'`);
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Ошибка обновления пользователя ${user._id}:`, error);
                errors.push({
                    userId: user._id,
                    error: error.message
                });
            }
        }

        console.log(`[${new Date().toISOString()}] Проверка завершена. Обновлено: ${updatedCount}, Ошибок: ${errors.length}`);

        return {
            success: true,
            expiredCount: expiredUsers.length,
            updatedCount: updatedCount,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Критическая ошибка при проверке подписок:`, error);
        return {
            success: false,
            error: error.message
        };
    }
};

