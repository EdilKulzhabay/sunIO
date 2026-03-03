import bgGar from '../../assets/bgGar.png';
import { useState, useEffect } from 'react';
import { RedButton } from '../../components/User/RedButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import sunWithHands from '../../assets/sunWithHands.png';

export const ClientAppTemporarilyUnavailable = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
            className='px-4 pb-6 flex flex-1 flex-col justify-between lg:justify-start'
        >
            <div style={{ height: `${screenHeight/3}px` }} className='flex justify-center items-end'>
                <img src={sunWithHands} alt="Sun with Hands" className='object-cover h-[175px] w-[175px] mb-5' />
            </div>
            <div className='flex-1 lg:flex-0 lg:w-[700px] lg:mx-auto'>
                <h1 className='text-[48px] font-semibold text-white leading-12'>Приложение временно недоступно</h1>
                <p className='mt-5 text-white'>
                    Приложение временно недоступно из-за технических работ на сервере. Мы уже работаем над восстановлением и совсем скоро всё заработает снова. Благодарим за терпение
                </p>
            </div>

            <div className='lg:w-[700px] lg:mx-auto'>
                <RedButton 
                    text={"Связаться с нами"} 
                    onClick={() => navigate('/client/contactus')} 
                    className='w-full mt-4'
                />
            </div>
        </div>
    );
};