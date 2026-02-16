import { useEffect, useState } from 'react';
import { UserLayout } from '../../components/User/UserLayout';
import api from '../../api';
import { MobileAccordionList } from '../../components/User/MobileAccordionList';
import { RedButton } from '../../components/User/RedButton';
import { MyLink } from '../../components/User/MyLink';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
// import { Switch } from '../../components/User/Switch';

export const About = () => {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [dinamycContent, setDinamycContent] = useState<any>(null);
    // const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    // const [showPaymentModal, setShowPaymentModal] = useState(false);
    // const [familiatizaedWithOffer, setFamiliatizaedWithOffer] = useState(false);
    const navigate = useNavigate();

    const handleJoinClub = () => {
        const telegramId = localStorage.getItem('telegramId');
        if (!telegramId) {
            toast.error('Ошибка: не найден telegramId');
            navigate(-1);
            return;
        }
        const fetchUser = async () => {
            try {
                const response = await api.get(`/api/user/telegram/${telegramId}`);
                if (response.data.success && response.data.user) {
                    if (response.data.user.bodyActivation || response.data.user.heartActivation || response.data.user.healingFamily || response.data.user.awakeningSpirit) {
                        window.location.href = 'https://t.me/+PPXcfaTFVYJlNWIy';
                    } else {
                        setModalOpen(true);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }

        fetchUser();
    }

    // const handleSkip = () => {
    //     const user = JSON.parse(localStorage.getItem('user') || '{}');
    //     const windowWidth = window.innerWidth;
    //     if ((!user || !user.fullName || user.fullName.trim() === '') && windowWidth < 1024) {
    //         navigate("/client/ease-launch");
    //     } else if ((!user || !user.fullName || user.fullName.trim() === '') && windowWidth >= 1024) {
    //         navigate("/client-performance");
    //     } else {
    //         navigate("/main");
    //     }
    // }

    const fetchDinamycContent = async () => {
        const response = await api.get(`/api/dynamic-content/name/about-club`);
        if (response.data.success) {
            setDinamycContent(response.data.data);
        }
    }

    useEffect(() => {
        setLoading(true);
        const fetchContent = async () => {
            try {
                const response = await api.get(`/api/about-club`);
                setContent(response.data.data[0]);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        }
        fetchContent();
        fetchDinamycContent();
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
            <div className='bg-[#031F23]'>
                <div className='relative lg:w-[700px] lg:mx-auto -mt-3'>
                    {content?.image && (
                        <img 
                            src={`${import.meta.env.VITE_API_URL}${content?.image}`} 
                            alt={content?.title} 
                            className='w-full h-auto rounded-lg object-cover z-10' 
                        />
                    )}
                    <div 
                        className="absolute inset-0 z-20 lg:hidden"
                        style={{
                            background: 'linear-gradient(to top, #031F2300 70%, #031F23 99%)',
                        }}
                    />
                    <div 
                        className="absolute inset-0 z-20 lg:hidden"
                        style={{
                            background: 'linear-gradient(to bottom, #031F2300 60%, #031F23 100%)',
                        }}
                    />
                    <div 
                        className="absolute inset-0 z-20 hidden lg:block"
                        style={{
                            background: 'linear-gradient(to right, #031F2300 70%, #031F23 100%)',
                        }}
                    />
                    <div 
                        className="absolute inset-0 z-20 hidden lg:block"
                        style={{
                            background: 'linear-gradient(to left, #031F2300 70%, #031F23 100%)',
                        }}
                    />
                </div>
                <div className='px-4 pb-10 bg-[#031F23] z-20'>
                    <div className='relative lg:w-[700px] lg:mx-auto z-20'>
                        <h1 className="text-2xl font-bold mt-4">{content?.title}</h1>
                        <p className="mt-4" dangerouslySetInnerHTML={{ __html: content?.content }} />
                        <h2 className="text-xl font-medium mt-4">Что входит в подписку</h2>
                        {content?.list.length > 0 && (
                            <div className='mt-4'>
                                <MobileAccordionList items={content?.list} />
                            </div>
                        )}
                        {/* <button 
                            className='bg-white/10 block text-white py-2.5 text-center font-medium rounded-full w-full mt-4 cursor-pointer'
                            onClick={handleSkip}
                        >
                            Пропустить
                        </button> */}
                        <RedButton text="Вступить в Сообщество" onClick={handleJoinClub} className='w-full mt-4 cursor-pointer'/>
                    </div>
                </div>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        {/* Мобильная версия: модальное окно снизу */}
                        <div className="flex items-end justify-center min-h-screen sm:hidden">
                            {/* Overlay */}
                            <div 
                                className="fixed inset-0 bg-black/60 transition-opacity z-20"
                                onClick={() => setModalOpen(false)}
                            />

                            {/* Modal - снизу на мобильных */}
                            <div 
                                className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="absolute top-[26px] right-5 cursor-pointer"
                                >
                                    <X size={24} />
                                </button>
                                
                                <div className="">
                                    <h3 className="text-xl font-bold mb-4">Вступить в Сообщество</h3>
                                    <p className="mb-6 text-gray-300" dangerouslySetInnerHTML={{ __html: dinamycContent?.content }}>
                                    </p>
                                    <MyLink 
                                        to="/client/contactus" 
                                        text="Связаться с нами" 
                                        className='w-full' 
                                        color='red'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Десктопная версия: модальное окно по центру */}
                        <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                            {/* Overlay */}
                            <div 
                                className="fixed inset-0 bg-black/60 transition-opacity"
                                onClick={() => setModalOpen(false)}
                            />

                            {/* Modal - по центру на десктопе */}
                            <div 
                                className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                                style={{ maxWidth: '500px', width: '100%' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="absolute top-8 right-8 cursor-pointer"
                                >
                                    <X size={32} />
                                </button>
                                
                                <div className="mt-4">
                                    <h3 className="text-xl font-bold mb-4">Вступить в Сообщество</h3>
                                    <p className="mb-6 text-gray-300 text-lg">
                                    Клуб доступен только для выпускников 4-х дневных тренингов. Свяжитесь с нами и мы поможем вам стать частью нашего Сообщества
                                    </p>
                                    <MyLink 
                                        to="/client/contactus" 
                                        text="Связаться с нами" 
                                        className='w-full' 
                                        color='red'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    )
}