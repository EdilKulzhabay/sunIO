import { useEffect, useState, useMemo } from "react";
import { UserLayout } from "../../components/User/UserLayout"
import api from "../../api";
import { BackNav } from "../../components/User/BackNav";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import copyLinkIcon from "../../assets/copyLink.png";
import level1 from "../../assets/level1.png";
import level2 from "../../assets/level2.png";
import level3 from "../../assets/level3.png";
import level4 from "../../assets/level4.png";
import level5 from "../../assets/level5.png";
import level6 from "../../assets/level6.png";

const REFERRAL_LEVELS = [
    { min: 0, max: 5, label: 'Новичок', icon: level1 },
    { min: 5, max: 10, label: 'Знакомый', icon: level2 },
    { min: 10, max: 25, label: 'Друг', icon: level3 },
    { min: 25, max: 50, label: 'Наставник', icon: level4 },
    { min: 50, max: 75, label: 'Лидер', icon: level5 },
    { min: 75, max: 100, label: 'Амбассадор', icon: level6 },
];

function getReferralLevel(count: number) {
    for (let i = REFERRAL_LEVELS.length - 1; i >= 0; i--) {
        if (count >= REFERRAL_LEVELS[i].min) return { ...REFERRAL_LEVELS[i], index: i };
    }
    return { ...REFERRAL_LEVELS[0], index: 0 };
}

export const ClientHumanDesign = () => {
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const [dynamicContentHumanDesignFirstPart, setDynamicContentHumanDesignFirstPart] = useState<string>('');
    const [dynamicContentHumanDesignSecondPart, setDynamicContentHumanDesignSecondPart] = useState<string>('');
    const [dynamicContentHumanDesignThirdPart, setDynamicContentHumanDesignThirdPart] = useState<string>('');

    const [invitedUsersCount, setInvitedUsersCount] = useState(0);
    const [linkCopied, setLinkCopied] = useState(false);

    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthCity, setBirthCity] = useState('');
    const [saving, setSaving] = useState(false);

    const [modalType, setModalType] = useState<'registration' | 'referrals' | 'success' | null>(null);

    const fetchDynamicContentHumanDesignFirstPart = async () => {
        const response = await api.get(`/api/dynamic-content/name/human-design-first-part`);
        if (response.data.success) {
            setDynamicContentHumanDesignFirstPart(response.data.data.content);
        }
    }

    const fetchDynamicContentHumanDesignSecondPart = async () => {
        const response = await api.get(`/api/dynamic-content/name/human-design-second-part`);
        if (response.data.success) {
            setDynamicContentHumanDesignSecondPart(response.data.data.content);
        }
    }

    const fetchDynamicContentHumanDesignThirdPart = async () => {
        const response = await api.get(`/api/dynamic-content/name/human-design-third-part`);
        if (response.data.success) {
            setDynamicContentHumanDesignThirdPart(response.data.data.content);
        }
    }

    const fetchUserData = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await api.get(`/api/user/${user._id}`);
        if (response.data.success) {
            setUserData(response.data.data);
            if (response.data.data.hdBirthDate) setBirthDate(response.data.data.hdBirthDate);
            if (response.data.data.hdBirthTime) setBirthTime(response.data.data.hdBirthTime);
            if (response.data.data.hdBirthCity) setBirthCity(response.data.data.hdBirthCity);
        }
    }

    const fetchInvitedUsersCount = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.telegramId) return;
            const response = await api.post('/api/user/invited-users-count', { telegramId: user.telegramId });
            if (response.data.success) {
                setInvitedUsersCount(response.data.invitedUsersCount);
            }
        } catch (error) {
            console.error('Ошибка загрузки количества приглашенных:', error);
        }
    }

    const copyReferralLink = async () => {
        if (userData?.telegramId) {
            const referralLink = `t.me/io_sun_bot?start=${userData.telegramId}`;
            try {
                await navigator.clipboard.writeText(referralLink);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            } catch (err) {
                console.error('Ошибка копирования:', err);
            }
        }
    }

    const isRegistered = useMemo(() => {
        if (!userData) return false;
        return userData.fullName && userData.fullName.trim() !== '';
    }, [userData]);

    const levelInfo = useMemo(() => getReferralLevel(invitedUsersCount), [invitedUsersCount]);

    const progressPercent = useMemo(() => {
        const range = levelInfo.max - levelInfo.min;
        if (range === 0) return 100;
        return Math.min(100, ((invitedUsersCount - levelInfo.min) / range) * 100);
    }, [invitedUsersCount, levelInfo]);

    const handleSave = async () => {
        if (!isRegistered) {
            setModalType('registration');
            return;
        }
        if (invitedUsersCount < 10) {
            setModalType('referrals');
            return;
        }

        setSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await api.put('/api/user/profile/update', {
                userId: user._id,
                hdBirthDate: birthDate,
                hdBirthTime: birthTime,
                hdBirthCity: birthCity,
            });
            const updatedUser = { ...userData, hdBirthDate: birthDate, hdBirthTime: birthTime, hdBirthCity: birthCity };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUserData(updatedUser);
            setModalType('success');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== 'admin') {
                    window.location.href = '/client/blocked-user';
                    return;
                }
            } catch (e) {
                console.error('Ошибка парсинга user из localStorage:', e);
            }
        }

        Promise.all([
            fetchUserData(),
            fetchInvitedUsersCount(),
            fetchDynamicContentHumanDesignFirstPart(),
            fetchDynamicContentHumanDesignSecondPart(),
            fetchDynamicContentHumanDesignThirdPart(),
        ]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const updateScreenHeight = () => {
            const height = window.innerHeight;
            setScreenHeight(height);
            
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const safeTop = computedStyle.getPropertyValue('--tg-safe-top') || '0px';
            const safeBottom = computedStyle.getPropertyValue('--tg-safe-bottom') || '0px';
            
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <UserLayout>
            <div className="flex flex-col bg-[#031F23]">
                <BackNav title="Дизайн Человека" />
                <div 
                    className="flex flex-col justify-between mt-2 px-4 pb-4 flex-1 bg-[#031F23]"
                    style={{ minHeight: `${screenHeight - (64 + safeAreaTop + safeAreaBottom)}px` }}
                >
                    <div>
                        <div dangerouslySetInnerHTML={{ __html: dynamicContentHumanDesignFirstPart }}></div>
                        {/* Статус и прогресс-бар */}
                        <div className="mt-3 bg-[#114E50] rounded-xl p-4 flex items-center gap-x-5 justify-between">
                            <div className="flex-1">
                                <div className="text-white text-xl font-medium">
                                    Твой статус - {levelInfo.label}
                                </div>
                                <div className="mt-1 w-full">
                                    <div className="flex items-center justify-between text-white text-sm">
                                        <div>{levelInfo.min}</div>
                                        <div>{levelInfo.max}</div>
                                    </div>
                                    <div className="w-full h-[6px] bg-white/40 rounded-full mt-1">
                                        <div className="h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                </div>
                                <div className="text-white text-sm mt-1">
                                    Пригласи ещё друзей для повышения статуса
                                </div>
                            </div>
                            <div className="shrink-0">
                                <img src={levelInfo.icon} alt={levelInfo.label} className="w-16 h-16 object-contain" />
                            </div>
                        </div>

                        <div dangerouslySetInnerHTML={{ __html: dynamicContentHumanDesignSecondPart }}></div>

                        {/* Блок приглашения */}
                        <div onClick={() => navigate('/client/invited-users')} className="mt-3 bg-[#114E50] rounded-lg p-4 space-y-2 cursor-pointer">
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
                                    }}
                                >
                                    <img src={copyLinkIcon} alt="copy" className="w-5 h-5 object-cover" />
                                </button>
                            </div>
                            {linkCopied && (
                                <div className="text-sm text-[#C4841D] mt-1">Ссылка скопирована!</div>
                            )}
                        </div>

                        <div dangerouslySetInnerHTML={{ __html: dynamicContentHumanDesignThirdPart }}></div>

                        {/* Поля ввода данных рождения */}
                        <div className="mt-3 grid grid-cols-3 gap-x-3">
                            <div className="col-span-1">
                                <input
                                    type="text"
                                    placeholder="Дата рождения"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full bg-[#114E50] py-3 px-4 rounded-xl text-white placeholder-white/60 outline-none"
                                />
                            </div>
                            <div className="col-span-1">
                                <input
                                    type="text"
                                    placeholder="Время рождения"
                                    value={birthTime}
                                    onChange={(e) => setBirthTime(e.target.value)}
                                    className="w-full bg-[#114E50] py-3 px-4 rounded-xl text-white placeholder-white/60 outline-none"
                                />
                            </div>
                            <div className="col-span-1">
                                <input
                                    type="text"
                                    placeholder="Город рождения"
                                    value={birthCity}
                                    onChange={(e) => setBirthCity(e.target.value)}
                                    className="w-full bg-[#114E50] py-3 px-4 rounded-xl text-white placeholder-white/60 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full block mt-4 bg-white/10 text-[#FFFFFF] py-2.5 text-center font-medium rounded-full cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Сохранение...' : 'Сохранить данные'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Модальные окна */}
            {modalType && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen sm:hidden">
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity z-20"
                            onClick={() => setModalType(null)}
                        />
                        <div 
                            className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setModalType(null)}
                                className="absolute top-[26px] right-5 cursor-pointer"
                            >
                                <X size={24} />
                            </button>

                            {modalType === 'registration' && (
                                <>
                                    <h3 className="text-xl font-bold mb-2">Сохранение данных</h3>
                                    <p className="mb-4">Чтобы сохранить данные рождения для получения рекомендаций, нужно пройти регистрацию</p>
                                </>
                            )}
                            {modalType === 'referrals' && (
                                <>
                                    <h3 className="text-xl font-bold mb-2">Доступ к рекомендациям</h3>
                                    <p className="mb-4">Персональные рекомендации предоставляются только Друзьям Сообщества. Чтобы получить статус Друга, пригласи 10 человек в Приложение «Солнце»</p>
                                </>
                            )}
                            {modalType === 'success' && (
                                <>
                                    <h3 className="text-xl font-bold mb-2">Данные переданы в работу</h3>
                                    <p className="mb-4">Данные по рождению переданы администратору. В течение нескольких дней ты получишь уведомление и сможешь ознакомиться с рекомендациями</p>
                                    <button
                                        onClick={() => setModalType(null)}
                                        className="w-full bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full mt-2"
                                    >
                                        Понятно
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Десктопная версия */}
                    <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity"
                            onClick={() => setModalType(null)}
                        />
                        <div 
                            className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl"
                            style={{ maxWidth: '500px', width: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setModalType(null)}
                                className="absolute top-8 right-8 cursor-pointer"
                            >
                                <X size={32} />
                            </button>

                            {modalType === 'registration' && (
                                <>
                                    <h3 className="text-xl font-bold mb-2">Сохранение данных</h3>
                                    <p className="mb-4">Чтобы сохранить данные рождения для получения рекомендаций, нужно пройти регистрацию</p>
                                </>
                            )}
                            {modalType === 'referrals' && (
                                <>
                                    <h3 className="text-xl font-bold mb-2">Доступ к рекомендациям</h3>
                                    <p className="mb-4">Персональные рекомендации предоставляются только Друзьям Сообщества. Чтобы получить статус Друга, пригласи 10 человек в Приложение «Солнце»</p>
                                </>
                            )}
                            {modalType === 'success' && (
                                <>
                                    <h3 className="text-xl font-bold mb-2">Данные переданы в работу</h3>
                                    <p className="mb-4">Данные по рождению переданы администратору. В течение нескольких дней ты получишь уведомление и сможешь ознакомиться с рекомендациями</p>
                                    <button
                                        onClick={() => setModalType(null)}
                                        className="w-full bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full mt-2"
                                    >
                                        Понятно
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    )
}
