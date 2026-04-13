import { useEffect, useState } from 'react';
import { UserLayout } from '../../components/User/UserLayout';
import api from '../../api';
import { openExternalLink } from '../../utils/telegramWebApp';

export const ClientWelcome2 = () => {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const fetchContent = async () => {
            try {
                const response = await api.get(`/api/welcome`);
                setContent(response.data.data[0]);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        }
        fetchContent();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400/90" />
        </div>
    }

    return (
        <UserLayout>
            <div className='bg-[#031F23]'>
                <div className='-mt-8 lg:w-[700px] lg:mx-auto bg-[#031F23]'>
                    <div className='relative'>
                        {content?.image && (
                            <div className="relative flex justify-center items-center">
                                <img 
                                    src={`${import.meta.env.VITE_API_URL}${content?.image}`} 
                                    alt={content?.title} 
                                    className='w-full h-auto rounded-lg object-top z-10' 
                                />
                            </div>
                        )}
                        <div 
                            className="absolute inset-0 z-10 lg:hidden"
                            style={{
                                background: 'linear-gradient(to top, #031F2300 75%, #031F23 99%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0 z-10 lg:hidden"
                            style={{
                                background: 'linear-gradient(to bottom, #031F2300 70%, #031F23 100%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0 z-10 hidden lg:block"
                            style={{
                                background: 'linear-gradient(to right, #031F2300 70%, #031F23 100%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0 z-10 hidden lg:block"
                            style={{
                                background: 'linear-gradient(to left, #031F2300 70%, #031F23 100%)',
                            }}
                        />
                    </div>
                    <div className='px-4 pt-4 pb-10 bg-[#031F23]'>
                        <div 
                            className={`relative lg:w-[700px] lg:mx-auto z-20`}
                        >
                            <h1 className="text-2xl font-bold">{content?.title}</h1>
                            <p className="mt-4" dangerouslySetInnerHTML={{ __html: content?.content }} />
                            <button 
                                className='w-full mt-4 bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full' 
                                onClick={() => openExternalLink('https://psylife.io/main')}
                            >
                                Официальный сайт
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    )
}