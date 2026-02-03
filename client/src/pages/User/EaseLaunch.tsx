import bgGar from '../../assets/bgGar.png';
import { MyLink } from '../../components/User/MyLink';
import easeLaunch from '../../assets/easeLaunch.png';
import { useState, useEffect } from 'react';

export const EaseLaunch = () => {
    const [screenHeight, setScreenHeight] = useState<number>(0);

    useEffect(() => {
        const updateScreenHeight = () => {
            // window.innerHeight - высота окна браузера в пикселях (это то же самое, что h-screen)
            const height = window.innerHeight;
            setScreenHeight(height);
            console.log('Высота экрана (h-screen):', height, 'px');
        };

        // Получаем высоту при монтировании компонента
        updateScreenHeight();

        // Обновляем при изменении размера окна
        window.addEventListener('resize', updateScreenHeight);

        return () => {
            window.removeEventListener('resize', updateScreenHeight);
        };
    }, []);

    return (
        <div 
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            className='min-h-screen px-4 pb-6 flex flex-col justify-between'
        >
            <div style={{ height: `${screenHeight/3}px` }}></div>
            <div className='flex-1'>
                <h1 className='text-[48px] font-semibold text-white leading-12'>Удобство запуска</h1>
                <p className='text-white'>Для удобства последующих запусков Приложения его можно добавить на экран Домой телефона</p>
                <div className='mt-4'>
                    <img src={easeLaunch} alt="Ease Launch" className='w-full h-auto object-cover sm:w-3/4 sm:mx-auto' />
                </div>
            </div>
            
            <div className='bg-[#161616]'>
                <a 
                    href="https://drive.google.com/file/d/1PGDJqtSnqy-18dgNsw3pnWMNtvMAcXAf/view?usp=share_link"
                    target="_blank"
                    className='w-full mt-4 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                >Открыть инструкцию</a>
                <MyLink to="/client-performance" text="Далее" className='w-full mt-4' color='red'/>
            </div>
        </div>
    );
};