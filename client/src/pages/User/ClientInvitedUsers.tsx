import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import profile from "../../assets/profile.png";
import sun from "../../assets/sun.png";
import edit from "../../assets/edit.png";
import { X } from 'lucide-react';
import { toast } from "react-toastify";
import { BonusPolicyModal } from "../../components/User/ClientInsufficientBonusModal";

export const ClientInvitedUsers = () => {
    const [userData, setUserData] = useState<any>(null);
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
    const [invitedUsers, setInvitedUsers] = useState<any>([]);
    const [sunCount, setSunCount] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [transferringBonus, setTransferringBonus] = useState(false);
    
    // useEffect(() => {
    //     fetchContent();
    // }, []);

    // const fetchContent = async () => {
    //     const response = await api.get('/api/dynamic-content/name/invited-users');
    //     setContent(response.data.data?.content ? response.data.data.content : '');
    // }
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
    }, [navigate]);

    useEffect(() => {
        if (userData) {
            fetchInvitedUsers();
        }
    }, [userData]);

    const fetchInvitedUsers = async () => {
        try {
            const response = await api.post('/api/user/invited-users', { telegramId: userData.telegramId });
            if (response.data.success) {
                setInvitedUsers(response.data.invitedUsers);
            } else {
                toast.error(response.data.message || 'Ошибка загрузки списка приглашенных пользователей');
            }
        } catch (error) {
            console.error('Ошибка загрузки списка приглашенных пользователей:', error);
            toast.error('Ошибка загрузки списка приглашенных пользователей');
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

    const handleShareSunClick = async () => {
        const amount = Number(sunCount);
        if (!selectedUser) {
            toast.error('Выберите пользователя, которому хотите передать солнца');
            return;
        }
        if (!Number.isInteger(amount) || amount <= 0) {
            toast.error('Укажите корректное количество солнц');
            return;
        }
        const currentBonus = userData?.bonus ?? 0;
        if (amount > currentBonus) {
            toast.error(`Недостаточно солнц. У вас: ${currentBonus}`);
            return;
        }
        setTransferringBonus(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await api.post('/api/user/transfer-bonus', {
                userId: user._id,
                recipientTelegramId: selectedUser,
                amount,
            });
            if (response.data.success) {
                toast.success(response.data.message || 'Солнца успешно переданы');
                setSunCount('');
                setSelectedUser(null);
                await fetchUserData();
            } else {
                toast.error(response.data.message || 'Ошибка при передаче солнц');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Ошибка при передаче солнц';
            toast.error(msg);
        } finally {
            setTransferringBonus(false);
        }
    }

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
                <BackNav title="Приглашённые друзья" />
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
                        </div>

                        <div className="flex items-start gap-x-3 mt-4 bg-[#114E50] rounded-lg p-4">
                            <div className="shrink-0 cursor-pointer" onClick={() => setIsBonusPolicyModalOpen(true)}>
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

                        <div className="mt-4">
                            <p className="text-white">Сколькими Солнцами хотите поделиться?</p>
                        </div>

                        <div className="mt-3">
                            <input 
                                className="block w-full py-2.5 px-3 border border-white/40 rounded-xl text-left text-white font-medium hover:bg-white/10 transition-colors outline-none focus:outline-none" 
                                type="number"
                                onWheel={(e) => e.currentTarget.blur()}
                                value={sunCount}
                                onChange={(e) => setSunCount(e.target.value)}
                            />
                        </div>

                        {/* {content && (
                            <div className="mt-4">
                                <p className="text-white" dangerouslySetInnerHTML={{ __html: content }} />
                            </div>
                        )} */}

                        <div className="mt-4">
                            <p className="text-white">Поделиться с</p>
                        </div>

                        {invitedUsers.length > 0 && (
                            <div className="mt-4">
                                <div className="flex flex-col gap-y-2">
                                    {invitedUsers.map((user: any) => {
                                        if (user.telegramUserName) {
                                            return (
                                                <button
                                                    onClick={() => setSelectedUser(user.telegramId)}
                                                    key={user.telegramId}
                                                    className="flex items-center justify-between w-full py-2.5 px-3 border border-white/40 rounded-xl text-left text-white font-medium hover:bg-white/10 transition-colors"
                                                >
                                                    <a href={`https://t.me/${user.telegramUserName}`} target="_blank" rel="noopener noreferrer">
                                                        {user.telegramUserName && `@${user.telegramUserName}`}
                                                        {user.telegramUserName && user.fullName && ', '}
                                                        {user.fullName && `${user.fullName}`}
                                                    </a>
                                                    <div className={`w-4 h-4 flex items-center justify-center border ${selectedUser === user.telegramId ? 'border-[#C4841D]' : 'border-white/40'} rounded-full`}>
                                                        {selectedUser === user.telegramId && (
                                                            <div className="w-[6px] h-[6px] bg-[#C4841D] rounded-full"></div>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        } else {
                                            return (
                                                <button
                                                    onClick={() => setSelectedUser(user.telegramId)}
                                                    key={user.telegramId}
                                                    className="flex items-center justify-between w-full py-2.5 px-3 border border-white/40 rounded-xl text-left text-white font-medium hover:bg-white/10 transition-colors"
                                                >
                                                    {user.telegramUserName && `@${user.telegramUserName}`}
                                                    {user.telegramUserName && user.fullName && ', '}
                                                    {user.fullName && `${user.fullName}`}
                                                    <div className={`w-4 h-4 flex items-center justify-center border ${selectedUser === user.telegramId ? 'border-[#C4841D]' : 'border-white/40'} rounded-full`}>
                                                        {selectedUser === user.telegramId && (
                                                            <div className="w-[6px] h-[6px] bg-[#C4841D] rounded-full"></div>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        }
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="mt-4">
                            <button
                                onClick={() => handleShareSunClick()}
                                disabled={transferringBonus}
                                className="bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full mt-4 w-full disabled:opacity-60 disabled:cursor-not-allowed">
                                <p>{transferringBonus ? 'Отправка...' : 'Поделиться Солнцем'}</p>
                            </button>
                        </div>
                    </div>
                </div>
            </UserLayout>

            <BonusPolicyModal
                isOpen={isBonusPolicyModalOpen}
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
                                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
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
                                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
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
                                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
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
                                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#555] rounded-lg text-white focus:outline-none focus:border-purple-500"
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