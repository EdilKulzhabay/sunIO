import bgGar from '../../assets/bgGar.png';
import { useState, useEffect } from 'react';
// import { RedButton } from '../../components/User/RedButton';
import sunWithHands from '../../assets/sunWithHands.png';
import connectErrorImage from '../../assets/connectErrorImage.png';

export const ClientConnectError = () => {
    const [screenHeight, setScreenHeight] = useState<number>(0);
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
            <div style={{ height: `${screenHeight/3}px` }} className='flex justify-center items-end'>
                <img src={sunWithHands} alt="Sun with Hands" className='object-cover h-[175px] w-[175px] mb-5' />
            </div>
            <div className='flex-1'>
                <h1 className='text-[48px] font-semibold text-white leading-12'>Ошибка подключения</h1>
                <p className='text-white mt-2'>Вам необходимо закрыть приложение и открыть заново через кнопку Открыть Солнце в диалоге с Telegram-ботом</p>
                <img src={connectErrorImage} alt="Connect Error Image" className='w-[80%] h-auto object-cover mt-4 rounded-lg' />
            </div>

            <div className='bg-[#031F23]'>
                {/* <Link
                    to="/client/contactus"
                    className='w-full mt-4 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                >
                    Связаться с нами
                </Link> */}
                {/* <RedButton
                    text="Закрыть"
                    onClick={() => {window.close()}}
                    className='w-full mt-4'
                /> */}
            </div>
        </div>
    );
};