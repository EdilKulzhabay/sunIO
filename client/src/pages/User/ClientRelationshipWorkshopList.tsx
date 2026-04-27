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

export const ClientRelationshipWorkshopList = () => {
    const [relationshipWorkshops, setRelationshipWorkshops] = useState([]);
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
    const [selectedRelationshipWorkshop, setSelectedRelationshipWorkshop] = useState<any>(null);
    const [progresses, setProgresses] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);

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

        fetchRelationshipWorkshops();
        fetchContent();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (relationshipWorkshops.length > 0 && userData?._id) {
            fetchProgresses();
        }
    }, [relationshipWorkshops, userData]);

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
        const responsePaidContent = await api.get('/api/dynamic-content/name/paid-content');
        setPaidContent(responsePaidContent.data.data.content);
    }

    const fetchRelationshipWorkshops = async () => {
        try {
            const response = await api.get('/api/relationship-workshop');
            setRelationshipWorkshops(response.data.data);
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

            const contentIds = relationshipWorkshops.map((rw: any) => rw._id);
            if (contentIds.length === 0) return;

            const response = await api.post(`/api/video-progress/batch/${user._id}/relationship-workshop`, {
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

    const handleLockedRelationshipWorkshopClick = (relationshipWorkshop: any) => {
        const accessType = relationshipWorkshop.accessType;
        
        if (hasAccessToContent(relationshipWorkshop._id)) {
            return;
        }
        
        if (accessType === 'stars') {
            if (!userData?.emailConfirmed) {
                setAccessType(accessType);
                setContent(starsContent);
                setIsModalOpen(true);
                return;
            }

            const starsRequired = relationshipWorkshop.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                setSelectedRelationshipWorkshop(relationshipWorkshop);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            setSelectedRelationshipWorkshop(relationshipWorkshop);
            setIsPurchaseModalOpen(true);
            return;
        }

        setAccessType(accessType);
        if (accessType === 'subscription') {
            setContent(subscriptionContent);
            setIsModalOpen(true);
        }
        if (accessType === 'paid') {
            setSelectedRelationshipWorkshop(relationshipWorkshop);
            setContent(paidContent);
            setIsPaidModalOpen(true);
        }
    }
    
    const handleLockedRelationshipWorkshopClickSubscription = (relationshipWorkshop: any) => {
        const accessType = relationshipWorkshop.accessType;
        
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

            const starsRequired = relationshipWorkshop.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                setSelectedRelationshipWorkshop(relationshipWorkshop);
                setIsInsufficientBonusModalOpen(true);
                return;
            }

            setSelectedRelationshipWorkshop(relationshipWorkshop);
            setIsPurchaseModalOpen(true);
            return;
        }

        setAccessType(accessType);
        if (accessType === 'subscription') {
            setContent(subscriptionContent);
            setIsModalOpen(true);
        }
        if (accessType === 'paid') {
            setSelectedRelationshipWorkshop(relationshipWorkshop);
            setContent(paidContent);
            setIsPaidModalOpen(true);
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    const handleClosePurchaseModal = () => {
        setIsPurchaseModalOpen(false);
        setSelectedRelationshipWorkshop(null);
    }

    const handleCloseInsufficientBonusModal = () => {
        setIsInsufficientBonusModalOpen(false);
        setSelectedRelationshipWorkshop(null);
    }

    const handleClosePaidModal = () => {
        setIsPaidModalOpen(false);
        setSelectedRelationshipWorkshop(null);
    }

    const handlePurchaseSuccess = async () => {
        await fetchUserData();
        await fetchRelationshipWorkshops();
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

    const topItemsCount = relationshipWorkshops.filter((r: any) => r.location === 'top').length;
    useAutoScrollPreview(cardsContainerRef, topItemsCount, !loading);

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
                        <h1 className="text-2xl font-semibold">Мастерская отношений</h1>
                    </div>
                    <PwaBackButton />
                </div>

                <div className="px-4 mt-2 pb-10 bg-[#031F23]">
                    <div ref={cardsContainerRef} className="flex overflow-x-auto gap-4 scrollbar-hide pl-4 pr-4 -mx-4" style={{ scrollbarWidth: 'none' }}>
                        {relationshipWorkshops.filter((relationshipWorkshop: any) => relationshipWorkshop.location === 'top' && relationshipWorkshop.visibility).sort((a: any, b: any) => a.order - b.order).map((relationshipWorkshop: any) => (
                                <div 
                                    key={relationshipWorkshop._id} 
                                    data-card
                                    className="flex-shrink-0 w-[44vw] sm:w-[35vw] lg:w-[25vw] h-[210px] sm:h-[275px] lg:h-[330px]"
                                >
                                    <MiniVideoCard 
                                        title={relationshipWorkshop.title} 
                                        image={relationshipWorkshop.imageUrl} 
                                        link={relationshipWorkshop.redirectToPage?.trim() || `/client/relationship-workshop/${relationshipWorkshop._id}`} 
                                        progress={progresses[relationshipWorkshop._id] || 0} 
                                        accessType={hasAccessToContent(relationshipWorkshop._id) ? 'free' : relationshipWorkshop.accessType} 
                                        onLockedClick={hasAccessToContentSubscription() ? undefined : (relationshipWorkshop.accessType !== 'free' ? () => handleLockedRelationshipWorkshopClickSubscription(relationshipWorkshop) : undefined)}
                                        duration={relationshipWorkshop?.duration || 0}
                                        starsRequired={relationshipWorkshop?.starsRequired || 0}
                                    />
                                </div>
                            ))}
                    </div>

                    <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                        {relationshipWorkshops.filter((relationshipWorkshop: any) => relationshipWorkshop.location === 'bottom' && relationshipWorkshop.visibility).sort((a: any, b: any) => a.order - b.order).map((relationshipWorkshop: any) => (
                                        <VideoCard 
                                            key={relationshipWorkshop._id} 
                                            title={relationshipWorkshop.title} 
                                            description={relationshipWorkshop.shortDescription} 
                                            image={relationshipWorkshop.imageUrl} 
                                            link={relationshipWorkshop.redirectToPage?.trim() || `/client/relationship-workshop/${relationshipWorkshop._id}`} 
                                            accessType={hasAccessToContent(relationshipWorkshop._id) ? 'free' : relationshipWorkshop.accessType} 
                                            progress={progresses[relationshipWorkshop._id] || 0} 
                                            onLockedClick={hasAccessToContent(relationshipWorkshop._id) ? undefined : (relationshipWorkshop.accessType !== 'free' ? () => handleLockedRelationshipWorkshopClick(relationshipWorkshop) : undefined)} 
                                            starsRequired={relationshipWorkshop?.starsRequired || 0}
                                            duration={relationshipWorkshop?.duration || 0}
                                        />
                                    ))}
                    </div>
                </div>
            </UserLayout>

            <ClientSubscriptionDynamicModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                content={content}
                accessType={accessType}
            />

            {isPaidModalOpen && selectedRelationshipWorkshop && (
                <ClientPaidDynamicModal
                    isOpen={isPaidModalOpen}
                    onClose={handleClosePaidModal}
                    item={selectedRelationshipWorkshop}
                    contentType="relationship-workshop"
                    userBalance={userData?.balance ?? 0}
                    onPurchaseSuccess={handlePurchaseSuccess}
                />
            )}

            {selectedRelationshipWorkshop && (
                <ClientPurchaseConfirmModal
                    isOpen={isPurchaseModalOpen}
                    onClose={handleClosePurchaseModal}
                    contentId={selectedRelationshipWorkshop._id}
                    contentType="relationship-workshop"
                    contentTitle={selectedRelationshipWorkshop.title}
                    starsRequired={selectedRelationshipWorkshop.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    onPurchaseSuccess={handlePurchaseSuccess}
                />
            )}

            {selectedRelationshipWorkshop && (
                <ClientInsufficientBonusModal
                    isOpen={isInsufficientBonusModalOpen}
                    onClose={handleCloseInsufficientBonusModal}
                    starsRequired={selectedRelationshipWorkshop.starsRequired || 0}
                    userBonus={userData?.bonus || 0}
                    contentTitle={selectedRelationshipWorkshop.title}
                />
            )}
        </div>
    )
}
