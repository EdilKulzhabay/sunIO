import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserLayout } from '../../components/User/UserLayout';

export const RobokassaSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(10);

    const outSum = searchParams.get('OutSum');
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

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <UserLayout>
            <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center" style={{ backgroundColor: '#2a2a2a' }}>
                    {/* Иконка успеха */}
                    <div className="mb-6">
                        <div className="mx-auto w-24 h-24 bg-green-900 rounded-full flex items-center justify-center">
                            <svg 
                                className="w-16 h-16 text-green-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M5 13l4 4L19 7" 
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Заголовок */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Оплата успешна!
                    </h1>

                    {/* Описание */}
                    <p className="text-gray-300 mb-6">
                        Спасибо за покупку! Ваш платеж успешно обработан.
                    </p>

                    {/* Детали платежа */}
                    {(invId || outSum) && (
                        <div className="bg-gray-700 rounded-lg p-6 mb-6 space-y-3">
                            {invId && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 font-medium">Номер счета:</span>
                                    <span className="text-white font-semibold">{invId}</span>
                                </div>
                            )}
                            {outSum && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 font-medium">Сумма:</span>
                                    <span className="text-purple-400 font-bold text-xl">{outSum} ₸</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Информация */}
                    <div className="bg-blue-900 border-l-4 border-blue-500 p-4 mb-6">
                        <p className="text-sm text-blue-200">
                            💡 Доступ к курсу уже активирован! Вы можете начать обучение прямо сейчас.
                        </p>
                    </div>

                    {/* Автоматический редирект */}
                    <p className="text-sm text-gray-400 mb-6">
                        Автоматический переход на главную через {countdown} сек...
                    </p>

                    {/* Кнопка */}
                    <button
                        onClick={handleGoHome}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                        Перейти на главную страницу
                    </button>

                    {/* Дополнительная информация */}
                    <p className="text-xs text-gray-500 mt-6">
                        На вашу почту отправлено подтверждение платежа
                    </p>
                </div>
            </div>
        </UserLayout>
    );
};

