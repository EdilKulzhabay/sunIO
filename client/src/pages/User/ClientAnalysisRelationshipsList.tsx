import { UserLayout } from "../../components/User/UserLayout";
import { useState, useEffect, useRef } from "react";
import api from "../../api";
import { MiniVideoCard } from "../../components/User/MiniVideoCard";
import { VideoCard } from "../../components/User/VideoCard";
import { ClientSubscriptionDynamicModal } from "../../components/User/ClientSubscriptionDynamicModal";
import { ClientPurchaseConfirmModal } from "../../components/User/ClientPurchaseConfirmModal";
import { ClientInsufficientBonusModal } from "../../components/User/ClientInsufficientBonusModal";
import inBothDirections from "../../assets/inBothDirections.png";

export const ClientAnalysisRelationshipsList = () => {
    const [analysisRelationshipss, setULAnalysisLRelationshipss] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isInsufficientBonusModalOpen, setIsInsufficientBonusModalOpen] = useState(false);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const [subscriptionContent, setSubscriptionContent] = useState<string>('');
    const [starsContent, setStarsContent] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [accessType, setAccessType] = useState<string>('');
    const [userData, setUserData] = useState<any>(null);
    const [selectedULAnalysisLRelationships, setSelectedULAnalysisLRelationships] = useState<any>(null);
    const [progresses, setProgresses] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

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

        fetchULAnalysisLRelationshipss();
        fetchContent();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (analysisRelationshipss.length > 0 && userData?._id) {
            fetchProgresses();
        }
    }, [analysisRelationshipss, userData]);

    const fetchUserData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user._id) {
                const response = await api.get(`/api/user/${user._id}`);
                const userData = response.data.data;
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
    }

    const fetchULAnalysisLRelationshipss = async () => {
        try {
            const response = await api.get('/api/analysis-relationships');
            setULAnalysisLRelationshipss(response.data.data);
        } catch (error) {
            console.error('Ошибка загрузки мастерской отношений:', error);
        } finally {
            setLoading(false);
        }
    }

    const fetchProgresses = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) return;

            const contentIds = analysisRelationshipss.map((rw: any) => rw._id);
            if (contentIds.length === 0) return;

            const response = await api.post(`/api/video-progress/batch/${user._id}/analysis-relationships`, {
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

    const handleLockedULAnalysisLRelationshipsClick = (analysisRelationships: any) => {
        const accessType = analysisRelationships.accessType;
        
        if (hasAccessToContent(analysisRelationships._id)) {
            return;
        }
        
        if (accessType === 'stars') {
            if (!userData?.emailConfirmed) {
                setAccessType(accessType);
                setContent(starsContent);
                setIsModalOpen(true);
                return;
            }

            const starsRequired = analysisRelationships.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                setSelectedULAnalysisLRelationships(analysisRelationships);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            setSelectedULAnalysisLRelationships(analysisRelationships);
            setIsPurchaseModalOpen(true);
            return;
        }

        setAccessType(accessType);
        if (accessType === 'subscription') {
            setContent(subscriptionContent);
        }
        setIsModalOpen(true);
    }
    
    const handleLockedULAnalysisLRelationshipsClickSubscription = (analysisRelationships: any) => {
        const accessType = analysisRelationships.accessType;
        
        if (hasAccessToContentSubscription()) {
            return;
        }
        
        if (accessType === 'stars') {
            if (!userData?.emailConfirmed) {
                setAccessType(accessType);
                setContent(starsContent);
                setIsModalOpen(true);
                return;
            }

            const starsRequired = analysisRelationships.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                setSelectedULAnalysisLRelationships(analysisRelationships);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            setSelectedULAnalysisLRelationships(analysisRelationships);
            setIsPurchaseModalOpen(true);
            return;
        }

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
        setSelectedULAnalysisLRelationships(null);
    }

    const handleCloseInsufficientBonusModal = () => {
        setIsInsufficientBonusModalOpen(false);
        setSelectedULAnalysisLRelationships(null);
    }

    const handlePurchaseSuccess = async () => {
        await fetchUserData();
        await fetchULAnalysisLRelationshipss();
    }

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
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
            <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-semibold ml-2">Разборы — Отношения</h1>
                    </div>
                    <div className="md:hidden">
                        <button 
                            onClick={scrollRight}
                            className="flex items-center justify-center w-8 h-8 border border-[#00C5AE] rounded-full cursor-pointer hover:bg-[#00C5AE] transition-colors"
                        >
                            <img 
                                src={inBothDirections}
                                alt="inBothDirections"
                                className="w-5 h-5"
                            />
                        </button>
                    </div>
                </div>

                <div className="px-4 mt-2 pb-10 bg-[#031F23]">
                    <div ref={cardsContainerRef} className="flex overflow-x-auto gap-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {analysisRelationshipss.length > 0 ? (
                            analysisRelationshipss.filter((analysisRelationships: any) => analysisRelationships.location === 'top').sort((a: any, b: any) => a.order - b.order).map((analysisRelationships: any) => (
                                <div 
                                    key={analysisRelationships._id} 
                                    data-card
                                    className="flex-shrink-0 w-[45vw] sm:w-[35vw] lg:w-[25vw] h-[210px] sm:h-[275px] lg:h-[330px]"
                                >
                                    <MiniVideoCard 
                                        title={analysisRelationships.title} 
                                        image={analysisRelationships.imageUrl} 
                                        link={analysisRelationships.redirectToPage?.trim() || `/client/analysis-relationships/${analysisRelationships._id}`} 
                                        progress={progresses[analysisRelationships._id] || 0} 
                                        accessType={hasAccessToContent(analysisRelationships._id) ? 'free' : analysisRelationships.accessType} 
                                        onLockedClick={hasAccessToContentSubscription() ? undefined : (analysisRelationships.accessType !== 'free' ? () => handleLockedULAnalysisLRelationshipsClickSubscription(analysisRelationships) : undefined)}
                                        duration={analysisRelationships?.duration || 0}
                                        starsRequired={analysisRelationships?.starsRequired || 0}
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">Нет контента</p>
                        )}
                    </div>

                    <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                        { analysisRelationshipss.length > 0 ? (
                            <>
                                {
                                    analysisRelationshipss.filter((analysisRelationships: any) => analysisRelationships.location === 'bottom').sort((a: any, b: any) => a.order - b.order).map((analysisRelationships: any) => (
                                        <VideoCard 
                                            key={analysisRelationships._id} 
                                            title={analysisRelationships.title} 
                                            description={analysisRelationships.shortDescription} 
                                            image={analysisRelationships.imageUrl} 
                                            link={analysisRelationships.redirectToPage?.trim() || `/client/analysis-relationships/${analysisRelationships._id}`} 
                                            accessType={hasAccessToContent(analysisRelationships._id) ? 'free' : analysisRelationships.accessType} 
                                            progress={progresses[analysisRelationships._id] || 0} 
                                            onLockedClick={hasAccessToContent(analysisRelationships._id) ? undefined : (analysisRelationships.accessType !== 'free' ? () => handleLockedULAnalysisLRelationshipsClick(analysisRelationships) : undefined)} 
                                            starsRequired={analysisRelationships?.starsRequired || 0}
                                            duration={analysisRelationships?.duration || 0}
                                        />
                                    ))
                                }
                            </>
                        ) : (
                            <p className="text-center text-gray-500 lg:col-span-2">Нет контента</p>
                        )}
                    </div>
                </div>
            </UserLayout>

            <ClientSubscriptionDynamicModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                content={content}
                accessType={accessType}
            />

            {selectedULAnalysisLRelationships && (
                <ClientPurchaseConfirmModal
                    isOpen={isPurchaseModalOpen}
                    onClose={handleClosePurchaseModal}
                    contentId={selectedULAnalysisLRelationships._id}
                    contentType="analysis-relationships"
                    contentTitle={selectedULAnalysisLRelationships.title}
                    starsRequired={selectedULAnalysisLRelationships.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    onPurchaseSuccess={handlePurchaseSuccess}
                />
            )}

            {selectedULAnalysisLRelationships && (
                <ClientInsufficientBonusModal
                    isOpen={isInsufficientBonusModalOpen}
                    onClose={handleCloseInsufficientBonusModal}
                    starsRequired={selectedULAnalysisLRelationships.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    contentTitle={selectedULAnalysisLRelationships.title}
                />
            )}
        </div>
    )
}
