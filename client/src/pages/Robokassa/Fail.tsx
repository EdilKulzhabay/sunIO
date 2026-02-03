import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserLayout } from '../../components/User/UserLayout';

export const RobokassaFail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(15);

    const invId = searchParams.get('InvId');

    useEffect(() => {
        // Обратный отсчет для автоматического редиректа
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    const handleTryAgain = () => {
        navigate('/');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <UserLayout>
            <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center" style={{ backgroundColor: '#2a2a2a' }}>
                    {/* Иконка ошибки */}
                    <div className="mb-6">
                        <div className="mx-auto w-24 h-24 bg-red-900 rounded-full flex items-center justify-center">
                            <svg 
                                className="w-16 h-16 text-red-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M6 18L18 6M6 6l12 12" 
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Заголовок */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Оплата не выполнена
                    </h1>

                    {/* Описание */}
                    <p className="text-gray-300 mb-6">
                        К сожалению, платеж не был завершен. Возможные причины:
                    </p>

                    {/* Причины */}
                    <div className="bg-gray-700 rounded-lg p-6 mb-6 text-left space-y-2">
                        <div className="flex items-start">
                            <span className="text-red-400 mr-2">•</span>
                            <span className="text-gray-300 text-sm">Платеж был отменен</span>
                        </div>
                        <div className="flex items-start">
                            <span className="text-red-400 mr-2">•</span>
                            <span className="text-gray-300 text-sm">Недостаточно средств на карте</span>
                        </div>
                        <div className="flex items-start">
                            <span className="text-red-400 mr-2">•</span>
                            <span className="text-gray-300 text-sm">Технические проблемы со стороны банка</span>
                        </div>
                        <div className="flex items-start">
                            <span className="text-red-400 mr-2">•</span>
                            <span className="text-gray-300 text-sm">Неверные данные карты</span>
                        </div>
                    </div>

                    {/* Детали */}
                    {invId && (
                        <div className="bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-6">
                            <p className="text-sm text-yellow-200">
                                <span className="font-semibold">Номер попытки:</span> {invId}
                            </p>
                        </div>
                    )}

                    {/* Информация */}
                    <div className="bg-blue-900 border-l-4 border-blue-500 p-4 mb-6">
                        <p className="text-sm text-blue-200">
                            💡 Вы можете попробовать оплатить снова или обратиться в поддержку
                        </p>
                    </div>

                    {/* Автоматический редирект */}
                    <p className="text-sm text-gray-400 mb-6">
                        Автоматический переход на главную через {countdown} сек...
                    </p>

                    {/* Кнопки */}
                    <div className="space-y-3">
                        <button
                            onClick={handleTryAgain}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                        >
                            Попробовать снова
                        </button>
                        <button
                            onClick={handleGoHome}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Вернуться на главную
                        </button>
                    </div>

                    {/* Поддержка */}
                    <div className="mt-6 pt-6 border-t border-gray-600">
                        <p className="text-sm text-gray-300">
                            Нужна помощь? 
                            <a href="mailto:support@portal.tochkali.com" className="text-purple-400 hover:text-purple-300 ml-1 font-medium">
                                Свяжитесь с поддержкой
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
};

