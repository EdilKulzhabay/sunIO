import bgGar from '../../assets/bgGar.png';
import { MyLink } from '../../components/User/MyLink';
import easeLaunch from '../../assets/easeLaunch.png';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
import api from '../../api';

export const EaseLaunch = () => {
    const [screenHeight, setScreenHeight] = useState<number>(0);
    const [dinamycLink, setDinamycLink] = useState<string>('');

    const fetchDinamycLink = async () => {
        const response = await api.get(`/api/dynamic-content/name/ease-launch-download-instruction`);
        if (response.data.success) {
            setDinamycLink(response.data.data);
        }
    }

    useEffect(() => {
        const updateScreenHeight = () => {
            // window.innerHeight - высота окна браузера в пикселях (это то же самое, что h-screen)
            const height = window.innerHeight;
            setScreenHeight(height);
            console.log('Высота экрана (h-screen):', height, 'px');
        };

        // Получаем высоту при монтировании компонента
        updateScreenHeight();
        fetchDinamycLink();

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
            <div style={{ height: `${screenHeight/3}px` }}>
                <img src={logo} alt="logo" className='w-[104px] h-[40px] mt-10' />
            </div>
            <div className='flex-1'>
                <h1 className='text-[48px] font-semibold text-white leading-12'>Важная информация</h1>
                <p className='text-white'>Для удобства запусков приложения Солнце его нужно добавить на экран телефона, нажав на три точки в правом верхнем углу экрана. Сделайте это прямо сейчас!</p>
                <div className='mt-4'>
                    <img src={easeLaunch} alt="Ease Launch" className='w-full h-auto object-cover sm:w-3/4 sm:mx-auto' />
                </div>
                <p className='text-white mt-4'>Подробная инструкция по созданию ярлыка Приложения содержится в Инструкции ниже.</p>
            </div>
            
            <div className='bg-[#031F23]'>
                <a 
                    href={dinamycLink || 'https://drive.google.com/file/d/1mvJtPzDEQQCcDBlbiFNgLb2U2ArlcPZp/view?usp=sharing'}
                    target="_blank"
                    className='w-full mt-4 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                >Открыть инструкцию</a>
                <MyLink to="/client-performance" text="Далее" className='w-full mt-4' color='red'/>
            </div>
        </div>
    );
};