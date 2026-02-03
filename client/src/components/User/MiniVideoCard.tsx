import { Link } from 'react-router-dom';
import lock from '../../assets/lock.png';

export const MiniVideoCard = ({ title, image, link, progress, accessType, onLockedClick, duration }: { title: string, image: string, link: string, progress: number, accessType: string, onLockedClick?: () => void, duration?: number }) => {
    return (
        <>
        {accessType === 'free' ? (
            <Link to={link} className="rounded-lg w-full h-full flex flex-col">
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
                    <div className="mt-auto">
                        <div className='w-full flex items-center justify-between'>
                            <p className='text-sm font-medium'>{progress}%</p>
                            <p className='text-sm font-medium'>{duration} мин.</p>
                        </div>
                        <div className='w-full h-1.5 bg-white/40 rounded-full mt-1'>
                            <div className='h-full bg-white rounded-full' style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>
            </Link>
        ) : (
            <button onClick={onLockedClick} className="rounded-lg w-full h-full flex-1 flex flex-col">
                <div className="relative h-[98px] sm:h-[142px] lg:h-[197px]">
                    <img src={`${import.meta.env.VITE_API_URL}${image}`} alt={title} className="w-full h-full rounded-lg object-cover" />
                    <div className="absolute inset-0 bg-black/40 rounded-lg" />
                    <img
                        src={lock}
                        alt="lock"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 z-10"
                    />
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
                    <div className="mt-auto">
                        <div className='w-full flex items-center justify-between'>
                            <p className='text-sm font-medium'>{progress}%</p>
                            <p className='text-sm font-medium'>{duration} мин.</p>
                        </div>
                        <div className='w-full h-1.5 bg-white/40 rounded-full mt-1'>
                            <div className='h-full bg-white rounded-full' style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>
            </button>
        )}
        </>
    )
}