import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UserLayout } from '../../components/User/UserLayout';
import api from '../../api';
import { MyLink } from '../../components/User/MyLink';
import { useAuth } from '../../contexts/AuthContext';

export const Welcome = () => {
    const [searchParams] = useSearchParams();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    useEffect(() => {
        setLoading(true);
        // Извлекаем параметры из URL
        let telegramId = searchParams.get('telegramId') || '';
        const telegramUserName = searchParams.get('telegramUserName') || '';

        if (telegramId === "") {
            telegramId = localStorage.getItem('telegramId') || '';
        }

        // Сохраняем в localStorage
        if (telegramId) localStorage.setItem("telegramId", telegramId);
        if (telegramUserName) localStorage.setItem("telegramUserName", telegramUserName);

        const fetchUser = async () => {
            if (!telegramId) {
                console.log('telegramId не найден');
                return;
            }
            
            try {
                const response = await api.get(`/api/user/telegram/${telegramId}`);

                if (!response.data.success) {
                    localStorage.clear();
                    if (telegramId) localStorage.setItem("telegramId", telegramId);
                    if (telegramUserName) localStorage.setItem("telegramUserName", telegramUserName);
                    return;
                }
                
                if (response.data.success && response.data.user) {
                    
                    // Проверяем, что user не null и не undefined
                    if (response.data.user !== null && response.data.user !== undefined) {
                        // Всегда сохраняем пользователя в localStorage, даже если fullName пустой
                        const userString = JSON.stringify(response.data.user);
                        localStorage.setItem('user', userString);
                        
                        // Обновляем состояние в AuthContext
                        updateUser(response.data.user);
                        
                        // Проверяем, что данные действительно сохранились
                        const savedUser = localStorage.getItem('user');
                        console.log("Проверка сохраненного user: ", savedUser);
                        
                        // Переходим на главную только если есть fullName
                        if (response.data.user.fullName && response.data.user.fullName.trim() !== '') {
                            const fullName = response.data.user.fullName;
                            localStorage.setItem('fullName', fullName);
                            navigate('/main');
                        } else {
                            // Оставляем только 'telegramId', 'telegramUserName' и 'user' в localStorage
                            const telegramIdValue = localStorage.getItem("telegramId");
                            const telegramUserNameValue = localStorage.getItem("telegramUserName");
                            const userValue = localStorage.getItem("user");
                            localStorage.clear();
                            if (telegramIdValue) localStorage.setItem("telegramId", telegramIdValue);
                            if (telegramUserNameValue) localStorage.setItem("telegramUserName", telegramUserNameValue);
                            if (userValue) localStorage.setItem("user", userValue);
                        }
                    } else {
                        console.error('response.data.user равен null или undefined');
                    }
                } else {
                    console.error('Не удалось получить пользователя:', {
                        success: response.data.success,
                        user: response.data.user
                    });
                }
            } catch (error) {
                console.error('Ошибка получения пользователя:', error);
            }
        }

        if (telegramId) {
            fetchUser();
        }

        // createUser();
        setLoading(false);
    }, [searchParams]);

    useEffect(() => {
        setLoading(true);
        const fetchContent = async () => {
            try {
                const response = await api.get(`/api/welcome`);
                setContent(response.data.data[0]);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        }
        fetchContent();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    }

    return (
        <UserLayout>
            <div className='bg-[#031F23]'>
                <div className='lg:w-[700px] lg:mx-auto bg-[#031F23]'>
                    <div className='relative'>
                        {content?.image && (
                            <div className="relative flex justify-center items-center">
                                <img 
                                    src={`${import.meta.env.VITE_API_URL}${content?.image}`} 
                                    alt={content?.title} 
                                    className='w-full h-auto rounded-lg object-top z-10' 
                                />
                            </div>
                        )}
                        <div 
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(to top, #000000 0%, #00000000 70%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(to bottom, #16161600 70%, #161616 100%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0 z-10 hidden lg:block"
                            style={{
                                background: 'linear-gradient(to right, #16161600 70%, #161616 100%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0 z-10 hidden lg:block"
                            style={{
                                background: 'linear-gradient(to left, #16161600 70%, #161616 100%)',
                            }}
                        />
                    </div>
                    <div className='px-4 pt-4 pb-10 bg-[#031F23]'>
                        <div 
                            className={`relative lg:w-[700px] lg:mx-auto z-20`}
                        >
                            <h1 className="text-2xl font-bold">{content?.title}</h1>
                            <p className="mt-4" dangerouslySetInnerHTML={{ __html: content?.content }} />
                            <MyLink to="/client/ease-launch" text="Далее" className='w-full mt-4' color='red'/>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    )
}