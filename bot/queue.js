// Очередь для операций с пользователями, чтобы избежать конфликтов
// Все обращения к Telegram API должны проходить через executeUserOperation

// Функция задержки между операциями
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Задержка между операциями с пользователями (ban/unban/sendMessage)
// Это предотвращает конфликт с polling механизмом
const DELAY_BETWEEN_USER_OPERATIONS = 200; // 200 мс между операциями

// Очередь для операций с пользователями, чтобы избежать конфликтов
const userOperationsQueue = [];
let isProcessingQueue = false;

// Функция для безопасного выполнения операций с пользователями
export const executeUserOperation = async (operation) => {
    return new Promise((resolve, reject) => {
        userOperationsQueue.push({ operation, resolve, reject });
        processUserOperationsQueue();
    });
};

// Обработка очереди операций
const processUserOperationsQueue = async () => {
    if (isProcessingQueue || userOperationsQueue.length === 0) {
        return;
    }

    isProcessingQueue = true;

    while (userOperationsQueue.length > 0) {
        const { operation, resolve, reject } = userOperationsQueue.shift();
        
        try {
            const result = await operation();
            resolve(result);
        } catch (error) {
            // Обрабатываем ошибку 409 (конфликт с polling)
            if (error.response?.error_code === 409) {
                console.warn('⚠️ Обнаружен конфликт 409 при операции с пользователем. Повторяем через 1 секунду...');
                // Добавляем операцию обратно в очередь с задержкой
                setTimeout(() => {
                    userOperationsQueue.unshift({ operation, resolve, reject });
                    isProcessingQueue = false;
                    processUserOperationsQueue();
                }, 1000);
                return;
            }
            reject(error);
        }
        
        // Задержка между операциями
        if (userOperationsQueue.length > 0) {
            await delay(DELAY_BETWEEN_USER_OPERATIONS);
        }
    }

    isProcessingQueue = false;
};

