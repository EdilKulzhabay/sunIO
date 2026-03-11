import bgGar from '../../assets/bgGar.png';
import sunWithHands from '../../assets/sunWithHands.png';

export const RobokassaSuccess = () => {
    return (
        <div 
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            className='px-4 pb-6 flex flex-col justify-between lg:justify-start'
        >
            <div className='flex justify-center items-end mt-5'>
                <img src={sunWithHands} alt="Sun with Hands" className='object-cover h-[175px] w-[175px] mb-5' />
            </div>
            <div className='flex-1 lg:flex-0 lg:w-[700px] lg:mx-auto'>
                <h1 className='text-[48px] font-semibold text-white leading-12'>Оплата успешна!</h1>
                <p className='mt-5 text-white'>
                Благодарим за пополнение баланса Приложения! Ваш платёж успешно обработан.
                </p>
            </div>
        </div>
    );
};