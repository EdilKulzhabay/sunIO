import { useEffect, useState } from "react";
import { UserLayout } from "../../components/User/UserLayout"
import api from "../../api";
import { BackNav } from "../../components/User/BackNav";
import { MobileAccordionList } from "../../components/User/MobileAccordionList";
import { MyLink } from "../../components/User/MyLink";

export const ClientFAQ = () => {
    const [faqs, setFaqs] = useState<{ title: string, content: string }[]>([]);
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
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

        fetchFaqs();
    }, []);

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

    const fetchFaqs = async () => {
        try {
            const response = await api.get('/api/faq');
            setFaqs(response.data.list);
        } catch (error) {
            console.error('Ошибка загрузки FAQ:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#161616]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <UserLayout>
            <div className="flex flex-col bg-[#161616]">
                <BackNav title="Часто задаваемые вопросы" />
                <div 
                    className="flex flex-col justify-between mt-2 px-4 pb-10 flex-1 bg-[#161616]"
                    style={{ minHeight: `${screenHeight - (64 + safeAreaTop + safeAreaBottom)}px` }}
                >
                    <div className="">
                        {faqs && faqs.length > 0 && (
                            <div className="">
                                <MobileAccordionList items={faqs.map((faq: any) => ({ title: faq.question, content: faq.answer }))} />
                            </div>
                        )}
                    </div>
                    <div className="mt-4">
                        <a 
                            href="https://drive.google.com/file/d/1PGDJqtSnqy-18dgNsw3pnWMNtvMAcXAf/view?usp=share_link"
                            target="_blank"
                            className='w-full mt-4 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                        >Открыть инструкцию</a>
                        <MyLink to="/client/contactus" text="Связаться с нами" className='w-full mt-3' color='red'/>
                    </div>
                </div>
            </div> 
        </UserLayout>
    )
}