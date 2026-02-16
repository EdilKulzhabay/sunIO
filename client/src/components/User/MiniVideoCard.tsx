import lock from '../../assets/lock.png';
import star from '../../assets/star.png';
import { useNavigate } from 'react-router-dom';

export const MiniVideoCard = ({ title, image, link, progress, accessType, onLockedClick, duration, starsRequired }: { title: string, image: string, link: string, progress: number, accessType: string, onLockedClick?: () => void, duration?: number, starsRequired?: number }) => {
    const navigate = useNavigate();
    return (
        <>
        {accessType === 'free' ? (
            <button onClick={() => navigate(link)} className="rounded-xl bg-[#114E50] w-full h-full flex flex-col">
                <div className="relative h-[98px] sm:h-[142px] lg:h-[197px]">
                    <img src={`${import.meta.env.VITE_API_URL}${image}`} alt={title} className="w-full h-full rounded-lg object-cover" />
                </div>

                <div className='w-full p-4 pt-3 text-left flex-1 flex flex-col'>
                    <p
                        className="font-medium line-clamp-2 min-h-[44px]"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: '44px', // 2 lines at 22px line-height
                        }}
                    >
                        {title}
                    </p>
                    {duration && duration > 0 ? 
                        <div className="mt-auto">
                            <div className='w-full flex items-center justify-between'>
                                <p className='text-sm font-medium'>{progress}%</p>
                                <p className='text-sm font-medium'>{duration} мин.</p>
                            </div>
                            <div className='w-full h-1.5 bg-white/40 rounded-full mt-1'>
                                <div className='h-full bg-white rounded-full' style={{ width: `${progress}%` }} />
                            </div>
                        </div> : <div className="mt-auto"></div>
                        }
                    
                </div>
            </button>
        ) : (
            <button onClick={onLockedClick} className="rounded-xl bg-[#114E50] w-full h-full flex-1 flex flex-col">
                <div className="relative h-[98px] sm:h-[142px] lg:h-[197px]">
                    <img src={`${import.meta.env.VITE_API_URL}${image}`} alt={title} className="w-full h-full rounded-lg object-cover" />
                    <div className="absolute inset-0 bg-black/40 rounded-lg" />
                    <img
                        src={lock}
                        alt="lock"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 z-10"
                    />
                </div>

                <div className='w-full p-4 pt-3 text-left flex-1 flex flex-col rounded-xl'>
                    <p
                        className="font-medium line-clamp-2 min-h-[44px]"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: '44px', // 2 lines at 22px line-height
                        }}
                    >
                        {title}
                    </p>
                    <div className="mt-auto flex items-center gap-x-3">
                        {duration && duration > 0 ? 
                            <div className='w-[50%]'>
                                <div className='w-full flex items-center justify-between'>
                                    <p className='text-sm font-medium'>{progress}%</p>
                                    <p className='text-sm font-medium'>{duration} мин.</p>
                                </div>
                                <div className='w-full h-1.5 bg-white/40 rounded-full mt-1'>
                                    <div className='h-full bg-white rounded-full' style={{ width: `${progress}%` }} />
                                </div>
                            </div>    
                            : <div className='w-[50%]'></div>
                        }
                        <div className='self-stretch flex-1'>
                            <div className='flex h-full w-full items-center justify-center gap-x-2 border border-[#00C5AE] rounded-full'>
                                <p className='text-sm font-medium text-[#00C5AE]'>{starsRequired}</p>
                                <img
                                    src={star}
                                    alt="star"
                                    className="w-[14px] h-[14px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </button>
        )}
        </>
    )
}