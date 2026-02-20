import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import profile from "../../assets/profile.png";
import sun from "../../assets/sun.png";
import copyLink from "../../assets/copyLink.png";
import edit from "../../assets/edit.png";
import linkArrow from "../../assets/linkArrow.png";
import { MyLink } from "../../components/User/MyLink";
import { Switch } from "../../components/User/Switch";
import { BonusPolicyModal } from "../../components/User/ClientInsufficientBonusModal";
import { X } from 'lucide-react';
import { toast } from "react-toastify";
import referralLevel1 from "../../assets/referralLevel1.png";
import referralLevel2 from "../../assets/referralLevel2.png";
import referralLevel3 from "../../assets/referralLevel3.png";
import referralLevel4 from "../../assets/referralLevel4.png";
import referralLevel5 from "../../assets/referralLevel5.png";

export const ClientProfile = () => {
    const [userData, setUserData] = useState<any>(null);
    const [notifications, setNotifications] = useState(true);
    const [locatedInRussia, setLocatedInRussia] = useState(true);
    const [linkCopied, setLinkCopied] = useState(false);
    const navigate = useNavigate();
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [isBonusPolicyModalOpen, setIsBonusPolicyModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [updatingName, setUpdatingName] = useState(false);
    const [invitedUsersCount, setInvitedUsersCount] = useState(0);
    const [pointsAwardingPolicy, setPointsAwardingPolicy] = useState<any>(null);

    const fetchPointsAwardingPolicy = async () => {
        const response = await api.get('/api/points-awarding-policy');
        if (response.data.success) {
            setPointsAwardingPolicy(response.data.data[0]);
        }
    }

    useEffect(() => {
        // Проверка на блокировку пользователя
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== 'admin') {
                    navigate('/client/blocked-user');
                    return;
                }
            } catch (e) {
                console.error('Ошибка парсинга user из localStorage:', e);
            }
        }

        fetchUserData();
        fetchPointsAwardingPolicy();
    }, [navigate]);

    useEffect(() => {
        if (userData) {
            fetchInvitedUsersCount();
        }
    }, [userData]);

    const fetchInvitedUsersCount = async () => {
        try {
            const response = await api.post('/api/user/invited-users-count', { telegramId: userData.telegramId });
            if (response.data.success) {
                setInvitedUsersCount(response.data.invitedUsersCount);
            }
        } catch (error) {
            console.error('Ошибка загрузки количества приглашенных пользователей:', error);
        }
    }

    const fetchUserData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await api.post('/api/user/profile', { userId: user._id }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                setUserData(response.data.user);
                setNotifications(response.data.user.notifyPermission);
                setLocatedInRussia(response.data.user.locatedInRussia);
                
                // Проверка на блокировку после получения данных с сервера
                if (response.data.user.isBlocked && response.data.user.role !== 'admin') {
                    navigate('/client/blocked-user');
                    return;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        } finally {
            setLoading(false);
        }
    }

    const copyReferralLink = async () => {
        if (userData?.telegramId) {
            const referralLink = `t.me/io_sun_bot?start=${userData.telegramId}`;
            try {
                await navigator.clipboard.writeText(referralLink);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            } catch (error) {
                console.error('Ошибка копирования ссылки:', error);
            }
        }
    }

    const updateUserData = async (field: string, value: any) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await api.patch(`/api/users/${user.telegramId}`, { [field]: value });
        if (response.data.success) {
            setUserData(response.data.data);
        } else {
            toast.error(response.data.message || 'Ошибка обновления данных пользователя');
        }
    }

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Проверка типа файла
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Недопустимый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WEBP)');
            return;
        }

        // Проверка размера файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Размер файла не должен превышать 5MB');
            return;
        }

        setUploadingPhoto(true);

        try {
            // Создаем FormData для отправки файла
            const formData = new FormData();
            formData.append('image', file);

            // Отправляем файл на сервер
            const uploadResponse = await api.post('/api/upload/image?type=profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (uploadResponse.data.success) {
                const imageUrl = uploadResponse.data.imageUrl;
                // Формируем полный URL для отображения
                const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${imageUrl}`;
                

                updateUserData('profilePhotoUrl', fullUrl);
                setUploadedPhotoUrl(fullUrl);
            } else {
                alert(uploadResponse.data.message || 'Ошибка загрузки изображения');
            }
        } catch (error: any) {
            console.error('Ошибка загрузки фото:', error);
            alert(error.response?.data?.message || 'Ошибка загрузки изображения');
        } finally {
            setUploadingPhoto(false);
            // Очищаем input для возможности загрузки того же файла снова
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    // Определяем URL фото для отображения (приоритет: uploadedPhotoUrl > userData?.profilePhotoUrl)
    const getProfilePhotoUrl = () => {
        if (uploadedPhotoUrl) return uploadedPhotoUrl;
        if (userData?.profilePhotoUrl) return userData.profilePhotoUrl;
        return null;
    }

    const handleEditNameClick = () => {
        // Разбиваем fullName на имя и фамилию
        const fullName = userData?.fullName || '';
        const nameParts = fullName.trim().split(' ');
        if (nameParts.length >= 2) {
            setFirstName(nameParts.slice(0, -1).join(' ')); // Все кроме последнего слова - имя
            setLastName(nameParts[nameParts.length - 1]); // Последнее слово - фамилия
        } else if (nameParts.length === 1) {
            setFirstName(nameParts[0]);
            setLastName('');
        } else {
            setFirstName('');
            setLastName('');
        }
        setIsEditNameModalOpen(true);
    }

    useEffect(() => {
        const updateScreenHeight = () => {
            const height = window.innerHeight;
            setScreenHeight(height);
            
            // Получаем значения CSS переменных и преобразуем в числа
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const safeTop = computedStyle.getPropertyValue('--tg-safe-top') || '0px';
            const safeBottom = computedStyle.getPropertyValue('--tg-safe-bottom') || '0px';
            
            // Преобразуем '0px' в число (убираем 'px' и парсим)
            const topValue = parseInt(safeTop.replace('px', '')) || 0;
            const bottomValue = parseInt(safeBottom.replace('px', '')) || 0;
            console.log(topValue, bottomValue);
            const addPadding = topValue > 0 ? 40 : 0;
            
            setSafeAreaTop(topValue + addPadding);
            setSafeAreaBottom(bottomValue);
        }
        updateScreenHeight();
        window.addEventListener('resize', updateScreenHeight);
        return () => {
            window.removeEventListener('resize', updateScreenHeight);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="Профиль" />
                <div 
                    className="px-4 pb-10 bg-[#031F23] flex flex-col justify-between"
                    style={{ minHeight: `${screenHeight - (64 + safeAreaTop + safeAreaBottom)}px` }}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-x-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoUpload}
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                style={{ display: 'none' }}
                            />
                            <div 
                                className="w-[60px] h-[60px] bg-[#114E50] rounded-full flex items-center justify-center cursor-pointer relative"
                                onClick={handlePhotoClick}
                            >
                                {uploadingPhoto ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                                    </div>
                                ) : getProfilePhotoUrl() ? (
                                    <img 
                                        src={getProfilePhotoUrl() || ''} 
                                        alt="profile" 
                                        className="w-full h-full object-cover rounded-full" 
                                    />
                                ) : (
                                    <img src={profile} alt="profile" className="w-[30px] h-[30px] object-cover rounded-full" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-x-1" onClick={handleEditNameClick}>
                                    <div 
                                        className="text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        {userData?.fullName || 'Не указано'}
                                    </div>
                                    <img src={edit} alt="edit" className="w-5 h-5 object-cover" />
                                </div>
                                <div>{userData?.mail || ""}</div>
                            </div>
                            <div className="ml-auto w-[79px] h-[79px]">
                                {invitedUsersCount < 5 && (
                                    <img src={referralLevel1} alt="referralLevel1" className="w-full h-full object-cover" />
                                )}
                                {invitedUsersCount >= 5 && invitedUsersCount < 10 && (
                                    <img src={referralLevel2} alt="referralLevel2" className="w-full h-full object-cover" />
                                )}
                                {invitedUsersCount >= 10 && invitedUsersCount < 25 && (
                                    <img src={referralLevel3} alt="referralLevel3" className="w-full h-full object-cover" />
                                )}
                                {invitedUsersCount >= 25 && invitedUsersCount < 50 && (
                                    <img src={referralLevel4} alt="referralLevel4" className="w-full h-full object-cover" />
                                )}
                                {invitedUsersCount >= 50 && (
                                    <img src={referralLevel5} alt="referralLevel5" className="w-full h-full object-cover" />
                                )}
                            </div>
                        </div>

                        <div onClick={() => setIsBonusPolicyModalOpen(true)} className="flex items-start gap-x-3 mt-4 bg-[#114E50] rounded-lg p-4">
                            <div className="shrink-0 cursor-pointer">
                                <img src={sun} alt="sun" className="w-10 h-10 object-cover" />
                            </div>
                            <div className="w-full">
                                <div className="flex items-center justify-between w-full">
                                    <div className="text-xl font-medium">Солнца</div>
                                    <div className="text-xl font-medium">{userData?.bonus}</div>
                                </div>
                                <div className="mt-1">
                                Начисляются за выполнение заданий, ведение дневника осознаний, просмотр контента и приглашение друзей. Солнца обмениваются на эксклюзивный контент, который нельзя купить за деньги
                                </div>
                            </div>
                        </div>

                        <div 
                            className="mt-4 bg-[#114E50] rounded-lg p-4 space-y-2"
                            onClick={() => {
                                if (userData?.hasPaid && userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date()) {
                                    console.log('Подписка активна');
                                } else {
                                    navigate('/client/masters-tower');
                                }
                            }}
                        >
                            <div className="text-xl font-medium">Подписка на Мастерскую Энергий</div>
                            {userData?.hasPaid && userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date() ? (
                                <div>
                                    Ваша подписка действует до{' '}
                                    {userData?.subscriptionEndDate ? new Date(userData.subscriptionEndDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                                </div>
                            ) : (
                                <div>У вас нет доступа в Башню Мастеров</div>
                            )}
                        </div>

                        {userData?.invitedUser && (
                            <div className="mt-4 bg-[#114E50] rounded-lg p-4 space-y-2">
                                <div className="text-xl font-medium">Вас пригласил</div>
                                <div>
                                    {userData.invitedUser.telegramUserName 
                                        ? `@${userData.invitedUser.telegramUserName}`
                                        : ''
                                    }
                                    {userData.invitedUser.fullName 
                                        ? `, ${userData.invitedUser.fullName}`
                                        : ''
                                    }
                                </div>
                            </div>
                        )}

                        <div onClick={() => navigate('/client/invited-users')} className="mt-4 bg-[#114E50] rounded-lg p-4 space-y-2 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-medium">Пригласи друга по ссылке</div>
                                <div className="text-lg font-medium">
                                    {invitedUsersCount}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyReferralLink();
                                    }}
                                    className="break-all"
                                >
                                    {userData?.telegramId 
                                        ? `t.me/io_sun_bot?start=${userData.telegramId}`
                                        : 'Загрузка...'
                                    }
                                </div>
                                <button
                                className="cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyReferralLink();
                                }}>
                                    <img src={copyLink} alt="copy" className="w-5 h-5 object-cover" />
                                </button>
                            </div>
                            {linkCopied && (
                                <div className="text-sm text-[#C4841D] mt-1">Ссылка скопирована!</div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center gap-x-2">
                            <a
                                href="https://t.me/io_center"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="basis-1/2 bg-[#114E50] rounded-lg p-4 pr-2 flex items-center justify-between"
                            >
                                <div className="font-medium text-sm">Телеграм канал</div>
                                <img src={linkArrow} alt="linkArrow" className="w-5 h-5 object-cover shrink-0" />
                            </a>
                            <a
                                href="https://t.me/+UWaWd3xq3erdWnny"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="basis-1/2 bg-[#114E50] rounded-lg p-4 pr-2 flex items-center justify-between"
                            >
                                <div className="font-medium text-sm">Телеграм чат</div>
                                <img src={linkArrow} alt="linkArrow" className="w-5 h-5 object-cover shrink-0" />
                            </a>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div>Просмотр видео в РФ без VPN</div>
                            <Switch checked={locatedInRussia} onChange={() => {
                                updateUserData('locatedInRussia', !locatedInRussia);
                                setLocatedInRussia(!locatedInRussia);
                            }} />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div>Разрешить уведомления</div>
                            <Switch checked={notifications} onChange={() => {
                                updateUserData('notifyPermission', !notifications);
                                setNotifications(!notifications);
                            }} />
                        </div>
                    </div>
                    {!userData?.emailConfirmed && (
                        <Link 
                            to="/client/register"
                            className="w-full block mt-4 bg-white/10 text-[#FFFFFF] py-2.5 text-center font-medium rounded-full"
                        >
                            Регистрация
                        </Link>
                    )}
                    <div className="mt-3">
                        <MyLink to="/client/contactus" text="Связаться с нами" className='w-full' color='red'/>
                    </div>
                </div>
            </UserLayout>
            <BonusPolicyModal 
                isOpen={isBonusPolicyModalOpen} 
                pointsAwardingPolicy={pointsAwardingPolicy || null}
                onClose={() => setIsBonusPolicyModalOpen(false)} 
            />
            
            {/* Модальное окно для редактирования имени */}
            {isEditNameModalOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    {/* Мобильная версия: модальное окно снизу */}
                    <div className="flex items-end justify-center min-h-screen sm:hidden">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity z-20"
                            onClick={() => setIsEditNameModalOpen(false)}
                        />

                        {/* Modal - снизу на мобильных */}
                        <div 
                            className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsEditNameModalOpen(false)}
                                className="absolute top-[26px] right-5 cursor-pointer z-10"
                            >
                                <X size={24} />
                            </button>
                            
                            <div className="mt-8">
                                <h3 className="text-xl font-bold mb-6">Редактировать имя</h3>
                                
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-300">Фамилия</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#031F23] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            placeholder="Введите имя"
                                            disabled={updatingName}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-300">Имя</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#031F23] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            placeholder="Введите фамилию"
                                            disabled={updatingName}
                                        />
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        setUpdatingName(true);
                                        updateUserData('fullName', `${firstName.trim()} ${lastName.trim()}`);
                                        setUpdatingName(false);
                                        setIsEditNameModalOpen(false);
                                    }}
                                    disabled={updatingName}
                                    className="w-full px-4 py-3 bg-[#C4841D] rounded-xl hover:bg-[#C4841D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updatingName ? 'Сохранение...' : 'Подтвердить'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Десктопная версия: модальное окно по центру */}
                    <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity"
                            onClick={() => setIsEditNameModalOpen(false)}
                        />

                        {/* Modal - по центру на десктопе */}
                        <div 
                            className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all max-h-[90vh] overflow-y-auto"
                            style={{ maxWidth: '500px', width: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsEditNameModalOpen(false)}
                                className="absolute top-8 right-8 cursor-pointer z-10"
                            >
                                <X size={32} />
                            </button>
                            
                            <div className="mt-4">
                                <h3 className="text-2xl font-bold mb-6">Редактировать имя</h3>
                                
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-300">Фамилия</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#031F23] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            placeholder="Введите имя"
                                            disabled={updatingName}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-300">Имя</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#031F23] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            placeholder="Введите фамилию"
                                            disabled={updatingName}
                                        />
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        setUpdatingName(true);
                                        updateUserData('fullName', `${firstName.trim()} ${lastName.trim()}`);
                                        setUpdatingName(false);
                                        setIsEditNameModalOpen(false);
                                    }}
                                    disabled={updatingName}
                                    className="w-full px-4 py-3 bg-[#C4841D] rounded-xl hover:bg-[#C4841D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updatingName ? 'Сохранение...' : 'Подтвердить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};