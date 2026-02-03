import { UserLayout } from "../../components/User/UserLayout";
import { useState, useEffect, useRef } from "react";
import api from "../../api";
import { MiniVideoCard } from "../../components/User/MiniVideoCard";
import { VideoCard } from "../../components/User/VideoCard";
import { ClientSubscriptionDynamicModal } from "../../components/User/ClientSubscriptionDynamicModal";
import { ClientPurchaseConfirmModal } from "../../components/User/ClientPurchaseConfirmModal";
import { ClientInsufficientBonusModal } from "../../components/User/ClientInsufficientBonusModal";
import inBothDirections from "../../assets/inBothDirections.png";

export const ClientPracticesList = () => {
    const [practices, setPractices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isInsufficientBonusModalOpen, setIsInsufficientBonusModalOpen] = useState(false);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const [subscriptionContent, setSubscriptionContent] = useState<string>('');
    const [starsContent, setStarsContent] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [accessType, setAccessType] = useState<string>('');
    const [userData, setUserData] = useState<any>(null);
    const [selectedPractice, setSelectedPractice] = useState<any>(null);
    const [progresses, setProgresses] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Проверка на блокировку пользователя
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

        fetchPractices();
        fetchContent();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (practices.length > 0 && userData?._id) {
            fetchProgresses();
        }
    }, [practices, userData]);

    const fetchUserData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user._id) {
                const response = await api.get(`/api/user/${user._id}`);
                const userData = response.data.data;
                // Проверка на блокировку пользователя после получения данных с сервера
                if (userData && userData.isBlocked && userData.role !== 'admin') {
                    window.location.href = '/client/blocked-user';
                    return;
                }
                setUserData(userData);
            }
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
        }
    };

    const fetchContent = async () => {
        const responseSubscription = await api.get('/api/dynamic-content/name/practice-subscription');
        setSubscriptionContent(responseSubscription.data.data.content);
        const responseStars = await api.get('/api/dynamic-content/name/practice-stars');
        setStarsContent(responseStars.data.data.content);
    }

    const fetchPractices = async () => {
        try {
            const response = await api.get('/api/practice');
            setPractices(response.data.data);
        } catch (error) {
            console.error('Ошибка загрузки практик:', error);
        } finally {
            setLoading(false);
        }
    }

    const fetchProgresses = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) return;

            const contentIds = practices.map((p: any) => p._id);
            if (contentIds.length === 0) return;

            const response = await api.post(`/api/video-progress/batch/${user._id}/practice`, {
                contentIds
            });

            if (response.data.success && response.data.data) {
                const progressMap: Record<string, number> = {};
                Object.keys(response.data.data).forEach((contentId) => {
                    progressMap[contentId] = response.data.data[contentId].progress || 0;
                });
                setProgresses(progressMap);
            }
        } catch (error) {
            console.error('Ошибка получения прогрессов:', error);
        }
    }

    const handleLockedPracticeClick = (practice: any) => {
        const accessType = practice.accessType;
        
        // Проверяем, есть ли уже доступ к контенту
        if (hasAccessToContent(practice._id)) {
            // Если есть доступ, ничего не делаем (контент уже доступен)
            return;
        }
        
        // Если это контент за бонусы (stars)
        if (accessType === 'stars') {
            // Проверяем, зарегистрирован ли клиент
            if (!userData?.emailConfirmed) {
                // Если не зарегистрирован, показываем стандартное модальное окно
                setAccessType(accessType);
                setContent(starsContent);
                setIsModalOpen(true);
                return;
            }

            // Если зарегистрирован, проверяем бонусы
            const starsRequired = practice.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                // Недостаточно бонусов, показываем модальное окно о недостатке бонусов
                setSelectedPractice(practice);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            // Достаточно бонусов, показываем модальное окно подтверждения покупки
            setSelectedPractice(practice);
            setIsPurchaseModalOpen(true);
            return;
        }

        // Для subscription показываем стандартное модальное окно
        setAccessType(accessType);
        if (accessType === 'subscription') {
            setContent(subscriptionContent);
        }
        setIsModalOpen(true);
    }
    
    const handleLockedPracticeClickSubscription = (practice: any) => {
        const accessType = practice.accessType;
        
        // Проверяем, есть ли уже доступ к контенту
        if (hasAccessToContentSubscription()) {
            // Если есть доступ, ничего не делаем (контент уже доступен)
            return;
        }
        
        // Если это контент за бонусы (stars)
        if (accessType === 'stars') {
            // Проверяем, зарегистрирован ли клиент
            if (!userData?.emailConfirmed) {
                // Если не зарегистрирован, показываем стандартное модальное окно
                setAccessType(accessType);
                setContent(starsContent);
                setIsModalOpen(true);
                return;
            }

            // Если зарегистрирован, проверяем бонусы
            const starsRequired = practice.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                // Недостаточно бонусов, показываем модальное окно о недостатке бонусов
                setSelectedPractice(practice);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            // Достаточно бонусов, показываем модальное окно подтверждения покупки
            setSelectedPractice(practice);
            setIsPurchaseModalOpen(true);
            return;
        }

        // Для subscription показываем стандартное модальное окно
        setAccessType(accessType);
        if (accessType === 'subscription') {
            setContent(subscriptionContent);
        }
        setIsModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    const handleClosePurchaseModal = () => {
        setIsPurchaseModalOpen(false);
        setSelectedPractice(null);
    }

    const handleCloseInsufficientBonusModal = () => {
        setIsInsufficientBonusModalOpen(false);
        setSelectedPractice(null);
    }

    const handlePurchaseSuccess = async () => {
        // Обновляем данные пользователя после покупки
        await fetchUserData();
        await fetchPractices();
    }

    // Проверка доступа к контенту
    const hasAccessToContent = (contentId: string): boolean => {
        if (!userData?.products) return false;
        return userData.products.some(
            (product: any) => product.productId === contentId && product.type === 'one-time' && product.paymentStatus === 'paid'
        );
    }

    const hasAccessToContentSubscription = (): boolean => {
        if (userData?.hasPaid && userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date()) return true;
        return false;
    }

    const scrollRight = () => {
        const container = cardsContainerRef.current;
        if (!container) return;

        const firstCard = container.querySelector('[data-card]') as HTMLElement | null;
        const styles = window.getComputedStyle(container);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
        const scrollAmount = (firstCard?.offsetWidth || 300) + gap;

        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        const isAtEnd = container.scrollLeft >= maxScrollLeft - 1;

        container.scrollTo({
            left: isAtEnd ? 0 : Math.min(maxScrollLeft, container.scrollLeft + scrollAmount),
            behavior: 'smooth',
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#161616]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
            <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-semibold ml-4">Практики</h1>
                    </div>
                    <div className="md:hidden">
                        <button 
                            onClick={scrollRight}
                            className="flex items-center justify-center w-8 h-8 border border-[#FFC293] rounded-full cursor-pointer hover:bg-[#FFB070] transition-colors"
                        >
                            <img 
                                src={inBothDirections}
                                alt="inBothDirections"
                                className="w-5 h-5"
                            />
                        </button>
                    </div>
                </div>

                <div className="px-4 mt-2 pb-10 bg-[#161616]">
                    <div ref={cardsContainerRef} className="flex overflow-x-auto gap-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {practices.length > 0 ? (
                            practices.filter((practice: any) => practice.location === 'top').sort((a: any, b: any) => a.order - b.order).map((practice: any) => (
                                <div 
                                    key={practice._id} 
                                    data-card
                                    className="flex-shrink-0 w-[45vw] sm:w-[35vw] lg:w-[25vw] h-[210px] sm:h-[275px] lg:h-[330px]"
                                >
                                    <MiniVideoCard 
                                        title={practice.title} 
                                        image={practice.imageUrl} 
                                        link={`/client/practice/${practice._id}`} 
                                        progress={progresses[practice._id] || 0} 
                                        accessType={hasAccessToContentSubscription() ? 'free' : practice.accessType}
                                        onLockedClick={hasAccessToContentSubscription() ? undefined : (practice.accessType !== 'free' ? () => handleLockedPracticeClickSubscription(practice) : undefined)}
                                        duration={practice?.duration || 0}
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">Нет практик</p>
                        )}
                    </div>

                    <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                        { practices.length > 0 ? (
                            <>
                                {
                                    practices.filter((practice: any) => practice.location === 'bottom').sort((a: any, b: any) => a.order - b.order).map((practice: any) => (
                                        <VideoCard 
                                            key={practice._id} 
                                            title={practice.title} 
                                            description={practice.shortDescription} 
                                            image={practice.imageUrl} 
                                            link={`/client/practice/${practice._id}`} 
                                            accessType={hasAccessToContent(practice._id) ? 'free' : practice.accessType} 
                                            progress={progresses[practice._id] || 0} 
                                            onLockedClick={hasAccessToContent(practice._id) ? undefined : (practice.accessType !== 'free' ? () => handleLockedPracticeClick(practice) : undefined)} 
                                            starsRequired={practice?.starsRequired || 0}
                                            duration={practice?.duration || 0}
                                        />
                                    ))
                                }
                                {/* {
                                    practices.filter((practice: any) => practice.location === 'bottom' && practice.accessType === 'free').map((practice: any) => (
                                        <VideoCard 
                                            key={practice._id} 
                                            title={practice.title} 
                                            description={practice.shortDescription} 
                                            image={practice.imageUrl} 
                                            link={`/client/practice/${practice._id}`} 
                                            accessType={hasAccessToContent(practice._id) ? 'free' : practice.accessType} 
                                            progress={progresses[practice._id] || 0} 
                                            onLockedClick={hasAccessToContent(practice._id) ? undefined : (practice.accessType !== 'free' ? () => handleLockedPracticeClick(practice) : undefined)} 
                                            starsRequired={practice?.starsRequired || 0}
                                            duration={practice?.duration || 0}
                                        />
                                    ))
                                } */}
                            </>
                        ) : (
                            <p className="text-center text-gray-500 lg:col-span-2">Нет практик</p>
                        )}
                    </div>
                </div>
            </UserLayout>

            {/* Модальное окно для платных практик */}
            <ClientSubscriptionDynamicModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                content={content}
                accessType={accessType}
            />

            {/* Модальное окно подтверждения покупки */}
            {selectedPractice && (
                <ClientPurchaseConfirmModal
                    isOpen={isPurchaseModalOpen}
                    onClose={handleClosePurchaseModal}
                    contentId={selectedPractice._id}
                    contentType="practice"
                    contentTitle={selectedPractice.title}
                    starsRequired={selectedPractice.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    onPurchaseSuccess={handlePurchaseSuccess}
                />
            )}

            {/* Модальное окно недостаточного количества бонусов */}
            {selectedPractice && (
                <ClientInsufficientBonusModal
                    isOpen={isInsufficientBonusModalOpen}
                    onClose={handleCloseInsufficientBonusModal}
                    starsRequired={selectedPractice.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    contentTitle={selectedPractice.title}
                />
            )}
        </div>
    )
}

