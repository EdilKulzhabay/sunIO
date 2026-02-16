import { useState, useEffect } from "react";
import { UserLayout } from "../../components/User/UserLayout"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import api from "../../api"
import { useAuth } from "../../contexts/AuthContext"
import logo from "../../assets/logo.png"
import users from "../../assets/users.png"
import faq from "../../assets/faq.png"
import user from "../../assets/user.png"
import productsCatalog from "../../assets/productsCatalog.png"
// import mainVideo from "../../assets/mainVideo.png"
// import mainPractice from "../../assets/mainPractice.png"
// import mainMeditation from "../../assets/mainMeditation.png"
import main1 from "../../assets/main1.png"
import main2 from "../../assets/main2.png"
import main3 from "../../assets/main3.png"
import main4 from "../../assets/main4.png"
import goldUser from "../../assets/goldUser.png"
import { ClientSchedule } from "./ClientSchedule"


// const SmallCard = ({ title, link, img }: { title: string, link: string, img: string }) => {
//     return (
//         <Link 
//             to={link} 
//             className="min-h-24 flex items-center bg-[#114E50] relative rounded-lg p-4 overflow-hidden"
//             style={{
//                 backgroundImage: `url(${img})`,
//                 backgroundSize: 'cover',
//                 backgroundPosition: 'right',
//                 backgroundRepeat: 'no-repeat',
//             }}
//         >
//             <p className="text-xl font-medium" dangerouslySetInnerHTML={{ __html: title }}></p>
//         </Link>
//     )
// }

const SmallCard = ({ title, link, img }: { title: string, link: string, img: string }) => {
    return (
        <Link 
            to={link} 
            className="min-h-24 flex items-center bg-[#114E50] relative rounded-lg p-4 overflow-hidden"
            style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'right',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <p className="text-xl font-medium" dangerouslySetInnerHTML={{ __html: title }}></p>
        </Link>
    )
}

// const LargeCard = ({ title, link, image, content }: { title: string, link: string, image: string, content: string }) => {
//     return (
//         <Link to={link} className="flex items-center bg-[#114E50] rounded-lg p-4 gap-x-4">
//             <div className="w-[98px] h-[98px] flex items-center justify-center rounded-full bg-white/10 shrink-0">
//                 <img src={image} alt={title} className="w-[50px] h-[50px] object-cover" />
//             </div>
//             <div className="">
//                 <p className="text-xl font-medium">{title}</p>
//                 <p className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: content }}></p>    
//             </div>
//         </Link>
//     )
// }

interface ModalNotification {
    modalTitle: string;
    modalDescription: string;
    modalButtonText: string;
    modalButtonLink?: string;
}

export const Main = () => {
    const [userName, setUserName] = useState<string>("");
    const [userData, setUserData] = useState<any>(null);
    const [searchParams] = useSearchParams();
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [modalNotification, setModalNotification] = useState<ModalNotification | null>(null);
    const [notificationIndex, setNotificationIndex] = useState<number | null>(null);

    useEffect(() => {
        
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const userStr = localStorage.getItem('user');
                const telegramId = localStorage.getItem('telegramId');
                const token = localStorage.getItem('token');

                const telegramIdFromParams = searchParams.get('telegramId');
                const telegramUserNameFromParams = searchParams.get('telegramUserName');

                console.log("telegramIdFromParams", telegramIdFromParams);
                console.log("telegramUserNameFromParams", telegramUserNameFromParams);

                if (telegramIdFromParams) {
                    localStorage.setItem('telegramId', telegramIdFromParams);
                }
                if (telegramUserNameFromParams) {
                    localStorage.setItem('telegramUserName', telegramUserNameFromParams);
                }
                if (!userStr) {
                    console.log('Пользователь не найден в localStorage');
                    navigate('/?telegramId=' + telegramIdFromParams + '&telegramUserName=' + telegramUserNameFromParams);
                    return;
                }

                const user = JSON.parse(userStr);
                
                // Проверка на блокировку пользователя
                if (user && user.isBlocked && user.role !== 'admin') {
                    navigate('/client/blocked-user');
                    return;
                }
                let updatedUser = null;

                // Если есть токен, используем стандартный endpoint
                if (token) {
                    try {
                        const response = await api.get('/api/user/me');
                        if (response.data.success && response.data.user) {
                            updatedUser = response.data.user;
                            if (!updatedUser.fullName || updatedUser.fullName.trim() === '') {
                                navigate('/?telegramId=' + telegramIdFromParams + '&telegramUserName=' + telegramUserNameFromParams);
                                return;
                            }
                        }
                    } catch (error) {
                        console.error('Ошибка получения данных пользователя через /api/user/me:', error);
                    }
                }
                
                // Если есть telegramId, используем Telegram endpoint
                if (!updatedUser && telegramId) {
                    try {
                        const response = await api.get(`/api/user/telegram/${telegramId}`);
                        if (response.data.success && response.data.user) {
                            updatedUser = response.data.user;
                            if (!updatedUser.fullName || updatedUser.fullName.trim() === '') {
                                navigate('/?telegramId=' + telegramIdFromParams + '&telegramUserName=' + telegramUserNameFromParams);
                                return;
                            }
                        } else {
                            navigate('/?telegramId=' + telegramIdFromParams + '&telegramUserName=' + telegramUserNameFromParams);
                        }
                    } catch (error) {
                        console.error('Ошибка получения данных пользователя через Telegram API:', error);
                    }
                }
                
                // Если есть userId, используем общий endpoint
                if (!updatedUser && user._id) {
                    try {
                        const response = await api.get(`/api/user/${user._id}`);
                        if (response.data.success && response.data.data) {
                            updatedUser = response.data.data;
                            if (!updatedUser.fullName || updatedUser.fullName.trim() === '') {
                                navigate('/?telegramId=' + telegramIdFromParams + '&telegramUserName=' + telegramUserNameFromParams);
                                return;
                            }
                        } else {
                            navigate('/?telegramId=' + telegramIdFromParams + '&telegramUserName=' + telegramUserNameFromParams);
                        }
                    } catch (error) {
                        console.error('Ошибка получения данных пользователя через /api/user/:id:', error);
                    }
                }

                // Обновляем данные если получили их с сервера
                if (updatedUser) {
                    // Проверка на блокировку пользователя после получения данных с сервера
                    if (updatedUser.isBlocked && updatedUser.role !== 'admin') {
                        navigate('/client/blocked-user');
                        return;
                    }

                    // Сохраняем обновленные данные в localStorage
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setUserData(updatedUser);

                    if (!updatedUser.fullName || updatedUser.fullName.trim() === '') {
                        navigate('/?telegramId=' + telegramIdFromParams + '&telegramUserName=' + telegramUserNameFromParams);
                        return;
                    }
                    
                    // Обновляем fullName если он есть
                    if (updatedUser.fullName) {
                        localStorage.setItem('fullName', updatedUser.fullName);
                        const nameParts = updatedUser.fullName.split(' ');
                        setUserName(nameParts.length > 1 ? nameParts[1] : nameParts[0]);
                    }
                    
                    // Обновляем состояние в AuthContext
                    if (updateUser) {
                        updateUser(updatedUser);
                    }
                } else {
                    // Если не удалось получить данные с сервера, используем данные из localStorage
                    const loadUserName = () => {
                        try {
                            const fullNameStr = localStorage.getItem("fullName");
                            if (fullNameStr) {
                                const nameParts = fullNameStr.split(' ');
                                setUserName(nameParts.length > 1 ? nameParts[1] : nameParts[0]);
                            } else if (user.fullName) {
                                const nameParts = user.fullName.split(' ');
                                setUserName(nameParts.length > 1 ? nameParts[1] : nameParts[0]);
                            }
                        } catch (error) {
                            console.error('Ошибка парсинга user из localStorage:', error);
                        }
                    };
                    loadUserName();
                }
            } catch (error) {
                console.error('Ошибка при обновлении данных пользователя:', error);
                // В случае ошибки используем данные из localStorage
                try {
                    const fullNameStr = localStorage.getItem("fullName");
                    if (fullNameStr) {
                        const nameParts = fullNameStr.split(' ');
                        setUserName(nameParts.length > 1 ? nameParts[1] : nameParts[0]);
                    }
                } catch (e) {
                    console.error('Ошибка парсинга данных из localStorage:', e);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (userData) {
            fetchModalNotifications();
        }
    }, [userData]);

    const fetchModalNotifications = async () => {
        try {
            const response = await api.post('/api/modal-notification/my', { telegramId: userData.telegramId });
            console.log(response.data);
            if (response.data.success && response.data.notifications && response.data.notifications.length > 0) {
                // Показываем первое уведомление
                setModalNotification(response.data.notifications[0]);
                setNotificationIndex(0);
            }
        } catch (error) {
            console.error('Ошибка загрузки модальных уведомлений:', error);
        }
    };

    const handleModalButtonClick = async () => {
        if (notificationIndex === null || !modalNotification) return;

        const buttonLink = modalNotification.modalButtonLink;

        try {
            console.log("userData in handleModalButtonClick:", userData);
            // Удаляем уведомление с сервера
            await api.post('/api/modal-notification/remove', {
                notificationIndex: notificationIndex,
                telegramId: userData.telegramId
            });

            // Закрываем текущее модальное окно
            setModalNotification(null);
            setNotificationIndex(null);
            if (modalNotification.modalButtonLink) {
                if (modalNotification.modalButtonLink.startsWith('/')) {
                    navigate(modalNotification.modalButtonLink);
                } else {
                    window.location.href = modalNotification.modalButtonLink;
                }
            }

            // Загружаем следующее уведомление (если есть)
            const response = await api.post('/api/modal-notification/my', { mail: userData.mail });
            if (response.data.success && response.data.notifications && response.data.notifications.length > 0) {
                setModalNotification(response.data.notifications[0]);
                setNotificationIndex(0);
            }

            // Если есть ссылка, переходим на неё
            if (buttonLink) {
                // Если ссылка начинается с /, это внутренний маршрут
                if (buttonLink.startsWith('/')) {
                    navigate(buttonLink);
                } else {
                    // Иначе это внешняя ссылка
                    window.location.href = buttonLink;
                }
            }
        } catch (error) {
            console.error('Ошибка удаления уведомления:', error);
            // Все равно закрываем модальное окно и переходим по ссылке
            setModalNotification(null);
            setNotificationIndex(null);
            if (buttonLink) {
                if (buttonLink.startsWith('/')) {
                    navigate(buttonLink);
                } else {
                    window.location.href = buttonLink;
                }
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    }

    return (
        <UserLayout>
            {/* Модальное уведомление */}
            {modalNotification && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Мобильная версия: модальное окно снизу */}
                    <div className="flex items-end justify-center min-h-screen sm:hidden">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity z-20"
                        />
                        {/* Modal - снизу на мобильных */}
                        <div 
                            className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mt-4">
                                <h3 className="text-xl font-bold mb-4">{modalNotification.modalTitle}</h3>
                                <p className="mb-6 text-gray-300 text-lg" dangerouslySetInnerHTML={{ __html: modalNotification.modalDescription }}></p>
                                <button
                                    onClick={handleModalButtonClick}
                                    className="block text-white py-2.5 text-center font-medium rounded-full bg-[#C4841D] w-full"
                                >
                                    {modalNotification.modalButtonText}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Десктопная версия: модальное окно по центру */}
                    <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity"
                        />

                        {/* Modal - по центру на десктопе */}
                        <div 
                            className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                            style={{ maxWidth: '500px', width: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            
                            <div className="mt-4">
                                <h3 className="text-xl font-bold mb-4">{modalNotification.modalTitle}</h3>
                                <p className="mb-6 text-gray-300 text-lg" dangerouslySetInnerHTML={{ __html: modalNotification.modalDescription }}></p>
                                <button
                                    onClick={handleModalButtonClick}
                                    className="block text-white py-2.5 text-center font-medium rounded-full bg-[#C4841D] w-full"
                                >
                                    {modalNotification.modalButtonText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 pb-10 bg-[#031F23]">
                <div className="flex items-center justify-between pt-5 pb-4">
                    <div className="cursor-pointer" onClick={() => navigate('/client/contactus')}>
                        <img src={logo} alt="logo" className="w-[104px] h-[40px]" />
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/about">
                            <img src={users} alt="users" className="w-6 h-6" />
                        </Link>
                        <Link to="/client/product-catalog">
                            <img src={productsCatalog} alt="productsCatalog" className="w-6 h-6" />
                        </Link>
                        <Link to="/client/faq">
                            <img src={faq} alt="faq" className="w-6 h-6" />
                        </Link>
                        <Link to="/client/profile">
                            {userData?.hasPaid && userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date() ? (
                                <img src={goldUser} alt="gold user" className="w-6 h-6" />
                            ) : (
                                <img src={user} alt="user" className="w-6 h-6" />
                            )}
                        </Link>
                    </div>
                </div>
                <h1 className="mt-1 text-2xl font-bold">Добро пожаловать, {userName ? userName : ""}!</h1>
                <div className="grid grid-cols-2 gap-3 mt-5">
                    <SmallCard title="Навигатор" link="/client/navigator" img={main1} />
                    <SmallCard title="Задания" link="/client/tasks" img={main2} />
                    <SmallCard title={`Осознания`} link="/client/diary" img={main3} />
                    <SmallCard title={`Практики`} link="/client/practices" img={main4} />
                </div>

                <ClientSchedule />

                {/* <div className="mt-4 space-y-3">
                    <LargeCard 
                        title="Лаборатория здоровья" 
                        link="/client/health-lab" 
                        image={mainVideo} 
                        content="Популярные видео и эксклюзивный контент от экспертов, которые знакомят с Проектом «Точки»"
                    />
                    <LargeCard 
                        title="Практики" 
                        link="/client/practices" 
                        image={mainPractice} 
                        content="Эффективные инструменты управления энергией и подсознанием на каждый день"
                    />
                    <LargeCard 
                        title="Мастерская отношений" 
                        link="/client/relationship-workshop" 
                        image={mainMeditation} 
                        content="Разрешение внутренних конфликтов, соединение со своей энергией и запуск процессов изменений"
                    />
                </div> */}
            </div>
        </UserLayout>
    )
}