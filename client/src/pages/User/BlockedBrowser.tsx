import api from '../../api';
import bgGar from '../../assets/bgGar.png';
import { useState, useEffect } from 'react';

export const BlockedBrowser = () => {
    const [screenHeight, setScreenHeight] = useState<number>(0);
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const updateScreenHeight = () => {
            const height = window.innerHeight;
            setScreenHeight(height);
        };

        updateScreenHeight();
        window.addEventListener('resize', updateScreenHeight);

        return () => {
            window.removeEventListener('resize', updateScreenHeight);
        };
    }, []);

    useEffect(() => {
        setLoading(true);
        const fetchContent = async () => {
            try {
                const response = await api.get('/api/dynamic-content/blocked-browser');
                setContent(response.data.data ? response.data.data : null);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        }
        fetchContent();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#161616]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div 
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            className='min-h-screen px-4 pb-6 flex flex-col'
        >
            <div style={{ height: `${screenHeight/3}px` }}></div>
            <div className=''>
                <h1 className='text-[48px] font-semibold text-white leading-12 mb-4'>
                    Приложение доступно только через Telegram
                </h1>
                {/* <p className='text-white text-lg mb-2'>
                    Это приложение можно открыть только через Telegram WebApp.
                </p> */}
                <p className='text-white text-lg mt-10'>
                    Пожалуйста, откройте приложение через бота в Telegram.
                </p>
            </div>

            <div className='bg-[#161616] rounded-lg p-4 pl-0'>
                <div className='text-white text-lg mb-4'>
                    <p className='mb-2'>Как открыть приложение:</p>
                    <ol className='list-decimal list-inside space-y-1 ml-2'>
                        <li>Откройте Telegram</li>
                        <li>Найдите бота <a href={content?.link?.content} target='_blank' className='text-red-500'>{content?.title?.content}</a></li>
                        <li>Нажмите кнопку {content?.buttonText?.content}</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

