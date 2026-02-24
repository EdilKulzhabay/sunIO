import bgGar from '../../assets/bgGar.png';
import { useState, useEffect } from 'react';
import { RedButton } from '../../components/User/RedButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import perfomanceInst from '../../assets/perfomanceInst.png';
import sunWithHands from '../../assets/sunWithHands.png';

export const ClientRegion = () => {
    const [locatedInRussia, setLocatedInRussia] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const { updateUser, user } = useAuth();
    const [screenHeight, setScreenHeight] = useState<number>(0);

    useEffect(() => {
        // Используем user из контекста, если он есть, иначе пытаемся получить из localStorage
        const currentUser = user || (() => {
            try {
                const userStr = localStorage.getItem('user');
                return userStr ? JSON.parse(userStr) : null;
            } catch (error) {
                console.error('Ошибка парсинга user из localStorage:', error);
                return null;
            }
        })();

        // Проверка на блокировку пользователя
        if (currentUser && currentUser.isBlocked && currentUser.role !== 'admin') {
            navigate('/client/blocked-user');
            return;
        }

        if (!currentUser || !currentUser.fullName || currentUser.fullName.trim() === '') {
            return;
        }

    }, [user]);

    const handleContinue = async () => {
        const telegramId = localStorage.getItem('telegramId');
        if (!telegramId) {
            toast.error('Ошибка: не найден telegramId');
            setError(true);
            navigate('/client/connect-error');
            return;
        }

        setLoading(true);
        try {
            
            const response = await api.patch(`/api/users/${telegramId}`, {
                locatedInRussia: locatedInRussia
            });

            if (response.data.success && response.data.data) {
                // Сохраняем обновленные данные пользователя в localStorage и обновляем контекст
                localStorage.setItem('user', JSON.stringify(response.data.data));
                updateUser(response.data.data);
                toast.success('Данные сохранены');
                navigate('/client/beggining-journey');
            } else {
                toast.error('Ошибка обновления данных');
                navigate('/client/connect-error');
            }
        } catch (error: any) {
            console.error('Ошибка обновления пользователя:', error);
            toast.error(error.response?.data?.message || 'Ошибка обновления данных');
            navigate('/client/connect-error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const updateScreenHeight = () => {
            // window.innerHeight - высота окна браузера в пикселях (это то же самое, что h-screen)
            const height = window.innerHeight;
            setScreenHeight(height);
        };

        // Получаем высоту при монтировании компонента
        updateScreenHeight();

        // Обновляем при изменении размера окна
        window.addEventListener('resize', updateScreenHeight);

        return () => {
            window.removeEventListener('resize', updateScreenHeight);
        };
    }, []);

    return (
        <div 
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            className='px-4 pb-6 flex flex-col justify-between lg:justify-start'
        >
            <div style={{ height: `${screenHeight/3}px` }} className='flex justify-center items-end'>
                <img src={sunWithHands} alt="Sun with Hands" className='object-cover h-[175px] w-[175px] mb-5' />
            </div>
            {error && (
                <div className='flex-1 lg:flex-0 lg:w-[700px] lg:mx-auto'>
                    <h1 className='text-[48px] font-semibold text-white leading-12'>Ошибка подключения</h1>
                    <p className='mt-5 text-white'>
                        Вам необходимо закрыть приложение и открыть заново через кнопку <span className='font-semibold'>Открыть Портал .li</span> 
                    </p>
                    <img src={perfomanceInst} alt="perfomanceInst" className='w-full h-auto object-cover sm:w-3/4 mt-3 rounded-lg' />
                </div>
            )}
            {!error && (
                <div className='flex-1 lg:flex-0 lg:w-[700px] lg:mx-auto'>
                    <h1 className='text-[48px] font-semibold text-white leading-12'>Просмотр видео контента</h1>
                    <p className='mt-3 text-white'>
                        В связи с действующими ограничениями доступ к YouTube на территории Российской Федерации ограничен. Мы заранее позаботились о твоём удобстве и подготовили альтернативные ссылки на платформе RuTube. Укажи свой регион, чтобы получать корректные ссылки для просмотра контента
                    </p>
                    <button
                    onClick={() => setLocatedInRussia(true)}
                    className='text-left w-full mt-4 flex items-center justify-between text-white py-2.5 px-3 border border-white/60 rounded-xl'>
                        <p>Нахожусь на территории РФ (YouTube не доступен, использовать RuTube)</p>
                        <div className={`flex-shrink-0 w-4 h-4 border rounded-full flex items-center justify-center ${locatedInRussia ? 'border-[#C4841D]' : 'border-white/60'}`}>
                            {locatedInRussia ? <div className='w-1.5 h-1.5 bg-[#C4841D] rounded-full'></div> : null}
                        </div>
                    </button>
                    <button
                    onClick={() => setLocatedInRussia(false)}
                    className='text-left w-full mt-2.5 flex items-center justify-between text-white py-2.5 px-3 border border-white/60 rounded-xl'>
                        <p>Нахожусь в другом регионе (YouTube доступен, использовать его)</p>
                        <div className={`flex-shrink-0 w-4 h-4 border rounded-full flex items-center justify-center ${!locatedInRussia ? 'border-[#C4841D]' : 'border-white/60'}`}>
                            {!locatedInRussia ? <div className='w-1.5 h-1.5 bg-[#C4841D] rounded-full'></div> : null}
                        </div>
                    </button>
                </div>
            )}

            <div className='lg:w-[700px] lg:mx-auto'>
                <button 
                    onClick={() => navigate(-1)}
                    className='w-full mt-4 lg:mt-10 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                >Назад</button>
                <RedButton 
                    text={loading ? 'Сохранение...' : 'Продолжить'} 
                    onClick={handleContinue} 
                    className='w-full mt-4'
                    disabled={loading || error}
                />
            </div>
        </div>
    );
};