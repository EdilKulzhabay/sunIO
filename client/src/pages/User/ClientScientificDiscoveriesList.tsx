import { UserLayout } from "../../components/User/UserLayout";
import { useState, useEffect, useRef } from "react";
import api from "../../api";
import { MiniVideoCard } from "../../components/User/MiniVideoCard";
import { VideoCard } from "../../components/User/VideoCard";
import { ClientSubscriptionDynamicModal } from "../../components/User/ClientSubscriptionDynamicModal";
import { ClientPurchaseConfirmModal } from "../../components/User/ClientPurchaseConfirmModal";
import { ClientInsufficientBonusModal } from "../../components/User/ClientInsufficientBonusModal";
import inBothDirections from "../../assets/inBothDirections.png";
import { useAutoScrollPreview } from "../../hooks/useAutoScrollPreview";

const API_PATH = '/api/scientific-discoveries';
const CLIENT_PATH = '/client/scientific-discoveries';
const CONTENT_TYPE = 'scientific-discoveries';
const TITLE = 'Научные открытия';

export const ClientScientificDiscoveriesList = () => {
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isInsufficientBonusModalOpen, setIsInsufficientBonusModalOpen] = useState(false);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const [subscriptionContent, setSubscriptionContent] = useState<string>('');
    const [starsContent, setStarsContent] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [accessType, setAccessType] = useState<string>('');
    const [userData, setUserData] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [progresses, setProgresses] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [dinamycContent, setDinamycContent] = useState<string>('');

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
        fetchItems();
        fetchContent();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (items.length > 0 && userData?._id) {
            fetchProgresses();
        }
    }, [items, userData]);

    const fetchUserData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user._id) {
                const response = await api.get(`/api/user/${user._id}`);
                const data = response.data.data;
                if (data && data.isBlocked && data.role !== 'admin') {
                    window.location.href = '/client/blocked-user';
                    return;
                }
                setUserData(data);
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
        const responseDinamycContent = await api.get('/api/dynamic-content/scientific-discoveries-list');
        setDinamycContent(responseDinamycContent.data.data.content);
    };

    const fetchItems = async () => {
        try {
            const response = await api.get(API_PATH);
            setItems(response.data.data);
        } catch (error) {
            console.error('Ошибка загрузки научных открытий:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgresses = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) return;
            const contentIds = items.map((item: any) => item._id);
            if (contentIds.length === 0) return;
            const response = await api.post(`/api/video-progress/batch/${user._id}/${CONTENT_TYPE}`, { contentIds });
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
    };

    const handleLockedClick = (item: any) => {
        const at = item.accessType;
        if (hasAccessToContent(item._id)) return;
        if (at === 'stars') {
            if (!userData?.emailConfirmed) {
                setAccessType(at);
                setContent(starsContent);
                setIsModalOpen(true);
                return;
            }
            const starsRequired = item.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                setSelectedItem(item);
                setIsInsufficientBonusModalOpen(true);
                return;
            }
            setSelectedItem(item);
            setIsPurchaseModalOpen(true);
            return;
        }
        setAccessType(at);
        if (at === 'subscription') setContent(subscriptionContent);
        setIsModalOpen(true);
    };

    const handleLockedClickSubscription = (item: any) => {
        const at = item.accessType;
        if (hasAccessToContentSubscription()) return;
        if (at === 'stars') {
            if (!userData?.emailConfirmed) {
                setAccessType(at);
                setContent(starsContent);
                setIsModalOpen(true);
                return;
            }
            const starsRequired = item.starsRequired || 0;
            if (userData.bonus < starsRequired) {
                setSelectedItem(item);
                setIsInsufficientBonusModalOpen(true);
                return;
            }
            setSelectedItem(item);
            setIsPurchaseModalOpen(true);
            return;
        }
        setAccessType(at);
        if (at === 'subscription') setContent(subscriptionContent);
        setIsModalOpen(true);
    };

    const hasAccessToContent = (contentId: string): boolean => {
        if (!userData?.products) return false;
        return userData.products.some((p: any) => p.productId === contentId && p.type === 'one-time' && p.paymentStatus === 'paid');
    };

    const hasAccessToContentSubscription = (): boolean => {
        return !!(userData?.hasPaid && userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date());
    };

    const topItemsCount = items.filter((item: any) => item.location === 'top' && item.visibility).length;
    useAutoScrollPreview(cardsContainerRef, topItemsCount, !loading);

    const scrollRight = () => {
        const container = cardsContainerRef.current;
        if (!container) return;
        const firstCard = container.querySelector('[data-card]') as HTMLElement | null;
        const styles = window.getComputedStyle(container);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
        const scrollAmount = (firstCard?.offsetWidth || 300) + gap;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        const isAtEnd = container.scrollLeft >= maxScrollLeft - 1;
        container.scrollTo({ left: isAtEnd ? 0 : Math.min(maxScrollLeft, container.scrollLeft + scrollAmount), behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const topItems = items.filter((item: any) => item.location === 'top' && item.visibility).sort((a: any, b: any) => a.order - b.order);
    const bottomItems = items.filter((item: any) => item.location === 'bottom' && item.visibility).sort((a: any, b: any) => a.order - b.order);

    return (
        <div>
            <UserLayout>
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-2xl font-semibold">{TITLE}</h1>
                    <div className="md:hidden">
                        <button onClick={scrollRight} className="flex items-center justify-center w-8 h-8 border border-[#00C5AE] rounded-full cursor-pointer hover:bg-[#00C5AE] transition-colors">
                            <img src={inBothDirections} alt="scroll" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="px-4 mt-2" dangerouslySetInnerHTML={{ __html: dinamycContent }} />
                <div className="px-4 mt-2 pb-10 bg-[#031F23]">
                    <div ref={cardsContainerRef} className="flex overflow-x-auto gap-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {topItems.length > 0 ? topItems.map((item: any) => (
                            <div key={item._id} data-card className="flex-shrink-0 w-[45vw] sm:w-[35vw] lg:w-[25vw] h-[210px] sm:h-[275px] lg:h-[330px]">
                                <MiniVideoCard title={item.title} image={item.imageUrl} link={item.redirectToPage?.trim() || `${CLIENT_PATH}/${item._id}`} progress={progresses[item._id] || 0} accessType={hasAccessToContent(item._id) ? 'free' : item.accessType} onLockedClick={hasAccessToContentSubscription() ? undefined : (item.accessType !== 'free' ? () => handleLockedClickSubscription(item) : undefined)} duration={item?.duration || 0} starsRequired={item?.starsRequired || 0} />
                            </div>
                        )) : <p className="text-center text-gray-500">Нет контента</p>}
                    </div>
                    <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                        {bottomItems.length > 0 ? bottomItems.map((item: any) => (
                            <VideoCard key={item._id} title={item.title} description={item.shortDescription} image={item.imageUrl} link={item.redirectToPage?.trim() || `${CLIENT_PATH}/${item._id}`} accessType={hasAccessToContent(item._id) ? 'free' : item.accessType} progress={progresses[item._id] || 0} onLockedClick={hasAccessToContent(item._id) ? undefined : (item.accessType !== 'free' ? () => handleLockedClick(item) : undefined)} starsRequired={item?.starsRequired || 0} duration={item?.duration || 0} />
                        )) : <p className="text-center text-gray-500 lg:col-span-2">Нет контента</p>}
                    </div>
                </div>
            </UserLayout>
            <ClientSubscriptionDynamicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} content={content} accessType={accessType} />
            {selectedItem && (
                <>
                    <ClientPurchaseConfirmModal isOpen={isPurchaseModalOpen} onClose={() => { setIsPurchaseModalOpen(false); setSelectedItem(null); }} contentId={selectedItem._id} contentType={CONTENT_TYPE} contentTitle={selectedItem.title} starsRequired={selectedItem.starsRequired || 0} userBonus={userData?.bonus || 0} onPurchaseSuccess={async () => { await fetchUserData(); await fetchItems(); }} />
                    <ClientInsufficientBonusModal isOpen={isInsufficientBonusModalOpen} onClose={() => { setIsInsufficientBonusModalOpen(false); setSelectedItem(null); }} starsRequired={selectedItem.starsRequired || 0} userBonus={userData?.bonus || 0} contentTitle={selectedItem.title} />
                </>
            )}
        </div>
    );
};
