import { BackNav } from "../../components/User/BackNav";
import { UserLayout } from "../../components/User/UserLayout";
import api from "../../api";
import { useState, useEffect } from "react";

const ContactUsBlock = ({ title, content, isLink = false, link = '' }: { title: string, content: string, isLink?: boolean, link?: string }) => {
    return (
        <div className="bg-[#333333] rounded-lg p-4">
            <p className="text-sm text-white/40">{title}</p>
            <p className="mt-1 text-lg font-medium">{isLink ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-white">{content}</a> : content}</p>
        </div>
    );
};

export const ClientContactUs = () => {
    const [content, setContent] = useState<string>('');
    const [text, setText] = useState<string>('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Проверка на блокировку пользователя
        // const userStr = localStorage.getItem('user');
        // if (userStr) {
        //     try {
        //         const user = JSON.parse(userStr);
        //         if (user && user.isBlocked && user.role !== 'admin') {
        //             window.location.href = '/client/blocked-user';
        //             return;
        //         }
        //     } catch (e) {
        //         console.error('Ошибка парсинга user из localStorage:', e);
        //     }
        // }

        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await api.get('/api/dynamic-content/name/version');
            setContent(response.data.data?.content ? response.data.data.content : '');
            const responseText = await api.get('/api/dynamic-content/name/contact-us-text');
            setText(responseText.data.data?.content ? responseText.data.data.content : '');
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
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
        <div>
            <UserLayout>
                <BackNav title="Связаться с нами" />
                <div className='px-4 mt-8 pb-5 flex flex-col justify-between min-h-screen bg-[#161616]'>
                    <div>
                        <div className="space-y-3">
                            <ContactUsBlock title="E-mail" content="support@tochka.li" isLink={true} link="mailto:support@tochka.li" />
                            <ContactUsBlock title="Telegram" content="t.me/tochkaliteam" isLink={true} link="https://t.me/tochkaliteam" />
                            <ContactUsBlock title="Website" content="tochka.li" isLink={true} link="https://tochka.li" />
                            <ContactUsBlock title="YouTube *" content="youtube.com/@tochkali" isLink={true} link="https://youtube.com/@tochkali" />
                            <ContactUsBlock title="Instagram *" content="instagram.com/nurlan_muratkali" isLink={true} link="https://instagram.com/nurlan_muratkali" />
                        </div>
                        <div className="mt-3 ">
                            <p className="text-white/60" dangerouslySetInnerHTML={{ __html: text ? text : '* Запрещённые в РФ социальные сети' }} />
                        </div>
                    </div>
                    <div className="text-center text-white/60 mt-3">Версия приложения {content ? content : ''}</div>
                </div>
            </UserLayout>
        </div>
    );
};