import { UserLayout } from "../../components/User/UserLayout";
import { useState, useEffect, useRef } from "react";
import api from "../../api";
import { MiniVideoCard } from "../../components/User/MiniVideoCard";
import { VideoCard } from "../../components/User/VideoCard";
import { ClientSubscriptionDynamicModal } from "../../components/User/ClientSubscriptionDynamicModal";
import { ClientPurchaseConfirmModal } from "../../components/User/ClientPurchaseConfirmModal";
import { ClientInsufficientBonusModal } from "../../components/User/ClientInsufficientBonusModal";
import inBothDirections from "../../assets/inBothDirections.png";

export const ClientVideoLessonsList = () => {
    // const navigate = useNavigate();
    const [videoLessons, setVideoLessons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isInsufficientBonusModalOpen, setIsInsufficientBonusModalOpen] = useState(false);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState<string>('');
    const [subscriptionContent, setSubscriptionContent] = useState<string>('');
    const [starsContent, setStarsContent] = useState<string>('');
    const [accessType, setAccessType] = useState<string>('');
    const [userData, setUserData] = useState<any>(null);
    const [selectedVideoLesson, setSelectedVideoLesson] = useState<any>(null);
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

        fetchVideoLessons();
        fetchContent();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (videoLessons.length > 0 && userData?._id) {
            fetchProgresses();
        }
    }, [videoLessons, userData]);

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
    }

    const fetchContent = async () => {
        const responseSubscription = await api.get('/api/dynamic-content/name/video-subscription');
        setSubscriptionContent(responseSubscription.data.data.content);
        const responseStars = await api.get('/api/dynamic-content/name/video-stars');
        setStarsContent(responseStars.data.data.content);
    }

    const fetchVideoLessons = async () => {
        try {
            const response = await api.get('/api/video-lesson');
            setVideoLessons(response.data.data);
        } catch (error) {
            console.error('Ошибка загрузки видео-уроков:', error);
        } finally {
            setLoading(false);
        }
    }

    const fetchProgresses = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) return;

            const contentIds = videoLessons.map((vl: any) => vl._id);
            if (contentIds.length === 0) return;

            const response = await api.post(`/api/video-progress/batch/${user._id}/videoLesson`, {
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

    const handleLockedVideoLessonClick = (videoLesson: any) => {
        const accessType = videoLesson.accessType;
        
        // Проверяем, есть ли уже доступ к контенту
        if (hasAccessToContent(videoLesson._id)) {
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
            const starsRequired = videoLesson.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                // Недостаточно бонусов, показываем модальное окно о недостатке бонусов
                setSelectedVideoLesson(videoLesson);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            // Достаточно бонусов, показываем модальное окно подтверждения покупки
            setSelectedVideoLesson(videoLesson);
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
    const handleLockedVideoLessonClickSubscription = (videoLesson: any) => {
        const accessType = videoLesson.accessType;
        
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
            const starsRequired = videoLesson.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                // Недостаточно бонусов, показываем модальное окно о недостатке бонусов
                setSelectedVideoLesson(videoLesson);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            // Достаточно бонусов, показываем модальное окно подтверждения покупки
            setSelectedVideoLesson(videoLesson);
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
        setSelectedVideoLesson(null);
    }

    const handleCloseInsufficientBonusModal = () => {
        setIsInsufficientBonusModalOpen(false);
        setSelectedVideoLesson(null);
    }

    const handlePurchaseSuccess = async () => {
        // Обновляем данные пользователя после покупки
        await fetchUserData();
        await fetchVideoLessons();
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
                        <h1 className="text-2xl font-semibold ml-4">Видео уроки</h1>
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
                        {videoLessons.length > 0 ? (
                            videoLessons.filter((videoLesson: any) => videoLesson.location === 'top').sort((a: any, b: any) => a.order - b.order).map((videoLesson: any) => (
                                <div 
                                    key={videoLesson._id} 
                                    data-card
                                    className="flex-shrink-0 w-[45vw] sm:w-[35vw] lg:w-[25vw] h-[210px] sm:h-[275px] lg:h-[330px]"
                                >
                                    <MiniVideoCard 
                                        title={videoLesson.title} 
                                        image={videoLesson.imageUrl} 
                                        link={`/client/video-lesson/${videoLesson._id}`} 
                                        progress={progresses[videoLesson._id] || 0} 
                                        accessType={hasAccessToContentSubscription() ? 'free' : videoLesson.accessType}
                                        onLockedClick={hasAccessToContentSubscription() ? undefined : (videoLesson.accessType !== 'free' ? () => handleLockedVideoLessonClickSubscription(videoLesson) : undefined)}
                                        duration={videoLesson?.duration || 0}
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">Нет видео уроков</p>
                        )}
                    </div>

                    <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                        { videoLessons.length > 0 ? (
                            <>
                                {
                                    videoLessons.filter((videoLesson: any) => videoLesson.location === 'bottom').sort((a: any, b: any) => a.order - b.order).map((videoLesson: any) => (
                                        <VideoCard 
                                            key={videoLesson._id} 
                                            title={videoLesson.title} 
                                            description={videoLesson.shortDescription} 
                                            image={videoLesson.imageUrl} 
                                            link={`/client/video-lesson/${videoLesson._id}`} 
                                            accessType={hasAccessToContent(videoLesson._id) ? 'free' : videoLesson.accessType} 
                                            progress={progresses[videoLesson._id] || 0} 
                                            onLockedClick={hasAccessToContent(videoLesson._id) ? undefined : (videoLesson.accessType !== 'free' ? () => handleLockedVideoLessonClick(videoLesson) : undefined)} 
                                            starsRequired={videoLesson?.starsRequired || 0}
                                            duration={videoLesson?.duration || 0}
                                        />
                                    ))
                                }
                                {/* {
                                    videoLessons.filter((videoLesson: any) => videoLesson.accessType === 'free').map((videoLesson: any) => (
                                        <VideoCard 
                                            key={videoLesson._id} 
                                            title={videoLesson.title} 
                                            description={videoLesson.shortDescription} 
                                            image={videoLesson.imageUrl} 
                                            link={`/client/video-lesson/${videoLesson._id}`} 
                                            accessType={hasAccessToContent(videoLesson._id) ? 'free' : videoLesson.accessType} 
                                            progress={progresses[videoLesson._id] || 0} 
                                            onLockedClick={hasAccessToContent(videoLesson._id) ? undefined : (videoLesson.accessType !== 'free' ? () => handleLockedVideoLessonClick(videoLesson) : undefined)} 
                                            starsRequired={videoLesson?.starsRequired || 0}
                                            duration={videoLesson?.duration || 0}
                                        />
                                    ))
                                } */}
                            </>
                        ) : (
                            <p className="text-center text-gray-500 lg:col-span-2">Нет видео уроков</p>
                        )}
                    </div>
                </div>
            </UserLayout>

            {/* Модальное окно для платных видео уроков */}
            <ClientSubscriptionDynamicModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                content={content}
                accessType={accessType}
            />

            {/* Модальное окно подтверждения покупки */}
            {selectedVideoLesson && (
                <ClientPurchaseConfirmModal
                    isOpen={isPurchaseModalOpen}
                    onClose={handleClosePurchaseModal}
                    contentId={selectedVideoLesson._id}
                    contentType="video-lesson"
                    contentTitle={selectedVideoLesson.title}
                    starsRequired={selectedVideoLesson.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    onPurchaseSuccess={handlePurchaseSuccess}
                />
            )}

            {/* Модальное окно недостаточного количества бонусов */}
            {selectedVideoLesson && (
                <ClientInsufficientBonusModal
                    isOpen={isInsufficientBonusModalOpen}
                    onClose={handleCloseInsufficientBonusModal}
                    starsRequired={selectedVideoLesson.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    contentTitle={selectedVideoLesson.title}
                />
            )}
        </div>
    )
}

