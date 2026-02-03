import bgGar from '../../assets/bgGar.png';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RedButton } from '../../components/User/RedButton';

export const BlockedUser = () => {
    const [screenHeight, setScreenHeight] = useState<number>(0);
    const navigate = useNavigate();
    useEffect(() => {
        const updateScreenHeight = () => {
            // window.innerHeight - высота окна браузера в пикселях (это то же самое, что h-screen)
            const height = window.innerHeight;
            setScreenHeight(height);
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
                <h1 className='text-[48px] font-semibold text-white leading-12'>Доступ заблокирован</h1>
                <p className='text-white'>Администратор заблокировал Вам доступ к приложению за нарушение правил пользования</p>
            </div>

            <div className='bg-[#161616]'>
                {/* <Link
                    to="/client/contactus"
                    className='w-full mt-4 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                >
                    Связаться с нами
                </Link> */}
                <RedButton
                    text="Связаться с нами"
                    onClick={() => {navigate('/client/contactus')}}
                    className='w-full mt-4'
                />
            </div>
        </div>
    );
};