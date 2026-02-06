import { useNavigate } from 'react-router-dom';
import lock from '../../assets/lock.png';
import arrowRight from '../../assets/arrowRight.png';
import star from '../../assets/star.png';
import needMoney from '../../assets/needMoney.png';

export const VideoCard = ({ title, description, image, link, accessType, progress, onLockedClick, starsRequired, duration }: { title: string, description: string, image: string, link: string, accessType: string, progress: number, onLockedClick?: () => void, starsRequired?: number, duration?: number }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        if (accessType === 'free') {
            navigate(link);
        } else {
            onLockedClick?.();
        }
    }

    return (
        <button onClick={handleClick} className="w-full text-left bg-[#114E50] rounded-lg flex gap-x-3 items-stretch cursor-pointer min-h-[120px] md:h-[160px] lg:h-[180px]">
            <div className="basis-[40%] relative flex-shrink-0 overflow-hidden rounded-l-lg">
                <img 
                    src={`${import.meta.env.VITE_API_URL}${image}`} 
                    alt={title} 
                    className="w-full h-full rounded-lg object-cover" 
                />
                {accessType !== 'free' && (
                    <>
                        <div className="absolute inset-0 bg-black/40 rounded-l-lg" />
                        <img
                            src={lock}
                            alt="lock"
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 z-10"
                        />
                    </>
                )}
            </div>
            <div className="basis-[60%] p-4 pl-0 flex flex-col justify-between min-w-0">
                <div className="flex-1 min-h-0 flex flex-col">
                    <p className="font-medium line-clamp-1 flex-shrink-0">{title}</p>
                    <p
                        className="text-sm mt-1 line-clamp-2 flex-shrink-0"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {description}
                    </p>
                </div>
                <div className="mt-auto pt-2 flex items-center justify-between flex-shrink-0">
                    <div className='w-[40%]'>
                        <div className='flex items-center justify-between'>
                            <p className='text-[10px] font-medium'>{progress}%</p>
                            <p className='text-[10px] font-medium'>{duration} мин.</p>
                        </div>
                        <div className='w-full h-1.5 bg-white/40 rounded-full mt-1'>
                            <div className='h-full bg-white rounded-full' style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    {accessType === 'free' && (
                        <div className="w-[55%] flex items-center justify-center px-3 py-1.5 border border-[#00C5AE] rounded-full cursor-pointer">
                            <p className="text-[12px] text-[#00C5AE]">Перейти</p>
                            <img
                                src={arrowRight}
                                alt="arrow-right"
                                className="w-[14px] h-[14px] ml-2"
                            />
                        </div>
                    )}
                    {accessType === 'stars' && (
                        <div className="w-[55%] flex items-center justify-center px-3 py-1.5 border border-[#00C5AE] rounded-full cursor-pointer">
                            <p className="text-[12px] text-[#00C5AE]">{starsRequired}</p>
                            <img
                                src={star}
                                alt="star"
                                className="w-[14px] h-[14px] ml-3"
                            />
                        </div>
                    )}
                    {accessType === 'subscription' && (
                        <div className="w-[55%] flex items-center justify-center px-3 py-1.5 border border-[#00C5AE] rounded-full cursor-pointer">
                            <img
                                src={needMoney}
                                alt="needMoney"
                                className="w-[14px] h-[14px]"
                            />
                        </div>
                    )}
                </div>
            </div>
            
        </button>
    );
};