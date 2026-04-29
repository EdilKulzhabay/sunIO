import { UserLayout } from "../../components/User/UserLayout";
import { useState, useEffect, useRef } from "react";
import api from "../../api";
import { MiniVideoCard } from "../../components/User/MiniVideoCard";
import { VideoCard } from "../../components/User/VideoCard";
import { ClientSubscriptionDynamicModal } from "../../components/User/ClientSubscriptionDynamicModal";
import { ClientPaidDynamicModal } from "../../components/User/ClientPaidDynamicModal";
import { ClientPurchaseConfirmModal } from "../../components/User/ClientPurchaseConfirmModal";
import { ClientInsufficientBonusModal } from "../../components/User/ClientInsufficientBonusModal";
import { useAutoScrollPreview } from "../../hooks/useAutoScrollPreview";
import { PwaBackButton } from "../../components/User/PwaBackButton";

export const ClientBroadcastRecordingsList = () => {
    const [recordings, setRecordings] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isInsufficientBonusModalOpen, setIsInsufficientBonusModalOpen] = useState(false);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const [subscriptionContent, setSubscriptionContent] = useState<string>('');
    const [starsContent, setStarsContent] = useState<string>('');
    const [paidContent, setPaidContent] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [accessType, setAccessType] = useState<string>('');
    const [userData, setUserData] = useState<any>(null);
    const [selectedPractice, setSelectedPractice] = useState<any>(null);
    const [progresses, setProgresses] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);

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

        fetchRecordings();
        fetchContent();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (recordings.length > 0 && userData?._id) {
            fetchProgresses();
        }
    }, [recordings, userData]);

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
        const responseSubscription = await api.get('/api/dynamic-content/name/content-suns');
        setSubscriptionContent(responseSubscription.data.data.content);
        const responseStars = await api.get('/api/dynamic-content/name/content-suns');
        setStarsContent(responseStars.data.data.content);
        const responsePaidContent = await api.get('/api/dynamic-content/name/paid-content');
        setPaidContent(responsePaidContent.data.data.content);
    }

    const fetchRecordings = async () => {
        try {
            const response = await api.get('/api/broadcast-recording');
            setRecordings(response.data.data);
        } catch (error) {
            console.error('Ошибка загрузки записей эфиров:', error);
        } finally {
            setLoading(false);
        }
    }

    const fetchProgresses = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) return;

            const contentIds = recordings.map((p: any) => p._id);
            if (contentIds.length === 0) return;

            const response = await api.post(`/api/video-progress/batch/${user._id}/broadcast-recording`, {
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
            setIsModalOpen(true);
        }
        if (accessType === 'paid') {
            setSelectedPractice(practice);
            setContent(paidContent);
            setIsPaidModalOpen(true);
        }
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
            setIsModalOpen(true);
        }
        if (accessType === 'paid') {
            setSelectedPractice(practice);
            setContent(paidContent);
            setIsPaidModalOpen(true);
        }
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

    const handleClosePaidModal = () => {
        setIsPaidModalOpen(false);
        setSelectedPractice(null);
    }

    const handlePurchaseSuccess = async () => {
        // Обновляем данные пользователя после покупки
        await fetchUserData();
        await fetchRecordings();
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

    const topPracticesCount = recordings.filter((p: any) => p.location === 'top' && p.visibility).length;
    useAutoScrollPreview(cardsContainerRef, topPracticesCount, !loading);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400/90" />
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
            <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-semibold">Записи эфиров</h1>
                    </div>
                    <PwaBackButton />
                </div>

                <div className="px-4 mt-2 pb-10 bg-[#031F23]">
                    <div ref={cardsContainerRef} className="flex overflow-x-auto gap-4 scrollbar-hide pl-4 pr-4 -mx-4" style={{ scrollbarWidth: 'none' }}>
                        {
                            recordings.filter((practice: any) => practice.location === 'top' && practice.visibility).length > 0 && (
                                <>
                                    {
                                        recordings.filter((practice: any) => practice.location === 'top' && practice.visibility).sort((a: any, b: any) => a.order - b.order).map((practice: any) => (
                                            <div 
                                                key={practice._id} 
                                                data-card
                                                className="flex-shrink-0 w-[44vw] sm:w-[35vw] lg:w-[25vw] h-[210px] sm:h-[275px] lg:h-[330px]"
                                            >
                                                <MiniVideoCard 
                                                    title={practice.title} 
                                                    image={practice.imageUrl} 
                                                    link={practice.redirectToPage?.trim() || `/client/broadcast-recording/${practice._id}`} 
                                                    progress={progresses[practice._id] || 0} 
                                                    accessType={hasAccessToContent(practice._id) ? 'free' : practice.accessType} 
                                                    onLockedClick={hasAccessToContentSubscription() ? undefined : (practice.accessType !== 'free' ? () => handleLockedPracticeClickSubscription(practice) : undefined)}
                                                    duration={practice?.duration || 0}
                                                    starsRequired={practice?.starsRequired || 0}
                                                />
                                            </div>
                                        ))
                                    }
                                </>
                            )
                        }
                    </div>

                    <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                        {
                            recordings.filter((practice: any) => practice.location === 'bottom' && practice.visibility).length > 0 && (
                                <>
                                    {
                                        recordings.filter((practice: any) => practice.location === 'bottom' && practice.visibility).sort((a: any, b: any) => a.order - b.order).map((practice: any) => (
                                            <VideoCard 
                                                key={practice._id} 
                                                title={practice.title} 
                                                description={practice.shortDescription} 
                                                image={practice.imageUrl} 
                                                link={practice.redirectToPage?.trim() || `/client/broadcast-recording/${practice._id}`} 
                                                accessType={hasAccessToContent(practice._id) ? 'free' : practice.accessType} 
                                                progress={progresses[practice._id] || 0} 
                                                onLockedClick={hasAccessToContent(practice._id) ? undefined : (practice.accessType !== 'free' ? () => handleLockedPracticeClick(practice) : undefined)} 
                                                starsRequired={practice?.starsRequired || 0}
                                                duration={practice?.duration || 0}
                                            />
                                        ))
                                    }
                                </>
                            )
                        }
                    </div>
                </div>
            </UserLayout>

            {/* Модальное окно для платных записей эфиров */}
            <ClientSubscriptionDynamicModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                content={content}
                accessType={accessType}
            />

            {isPaidModalOpen && selectedPractice && (
                <ClientPaidDynamicModal
                    isOpen={isPaidModalOpen}
                    onClose={handleClosePaidModal}
                    item={selectedPractice}
                    contentType="broadcast-recording"
                    userBalance={userData?.balance ?? 0}
                    onPurchaseSuccess={handlePurchaseSuccess}
                />
            )}

            {/* Модальное окно подтверждения покупки */}
            {selectedPractice && (
                <ClientPurchaseConfirmModal
                    isOpen={isPurchaseModalOpen}
                    onClose={handleClosePurchaseModal}
                    contentId={selectedPractice._id}
                    contentType="broadcast-recording"
                    contentTitle={selectedPractice.title}
                    contentDescription={selectedPractice.shortDescription || ''}
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

