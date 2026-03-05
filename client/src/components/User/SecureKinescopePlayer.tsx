import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../api';
import { isTelegramWebView } from '../../utils/telegramWebApp';

interface SecureKinescopePlayerProps {
    videoId: string;
    poster?: string;
    title?: string;
    onPosterClick?: () => void;
    showPoster?: boolean;
    contentType: 
        | 'meditation' 
        | 'practice'
        | 'parables-of-life'
        | 'scientific-discoveries' 
        | 'videoLesson'
        | 'health-lab'
        | 'relationship-workshop'
        | 'spirit-forge'
        | 'masters-tower'
        | 'femininity-gazebo'
        | 'consciousness-library'
        | 'product-catalog'
        | 'analysis-health'
        | 'analysis-relationships'
        | 'analysis-realization'
        | 'psychodiagnostics';
    contentId: string;
    duration?: number; // Длительность в минутах из данных контента
    onProgressUpdate?: (progress: number, duration?: number) => void; // progress в %, duration в секундах
    onDurationChange?: (durationSeconds: number) => void; // Callback при получении реальной длительности видео
    accessType?: 'free' | 'paid' | 'subscription' | 'stars'; // Тип доступа к контенту
    aspectRatio?: number; // Соотношение сторон (по умолчанию 16:9 = 56.25%)
    onPlay?: () => void; // Callback при воспроизведении видео
    disableProgressSave?: boolean; // Отключить автоматическое сохранение прогресса на сервер (для агрегированного подсчёта)
}

// Типы для Kinescope IFrame API
interface IframePlayerFactory {
    create(elementId: string, options: {
        url: string;
        size?: { width?: string | number; height?: string | number };
        autoplay?: boolean;
        muted?: boolean;
        loop?: boolean;
        controls?: boolean;
        time?: number;
        [key: string]: any;
    }): Promise<IframePlayerApi>;
}

interface IframePlayerApi {
    Events: {
        Ready: 'ready';
        Playing: 'playing';
        Pause: 'pause';
        Ended: 'ended';
        TimeUpdate: 'timeupdate';
        DurationChange: 'durationchange';
        FullscreenChange: 'fullscreenchange';
        [key: string]: string;
    };
    on(type: string, listener: (event: any) => void): this;
    once(type: string, listener: (event: any) => void): this;
    off(type: string, listener: (event: any) => void): this;
    getCurrentTime(): Promise<number>;
    getDuration(): Promise<number>;
    seekTo(time: number): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    isPaused(): Promise<boolean>;
    destroy(): Promise<void>;
}

declare global {
    interface Window {
        onKinescopeIframeAPIReady?: (playerFactory: IframePlayerFactory) => void;
        KinescopeIframePlayerFactory?: IframePlayerFactory;
    }
}

let kinescopeApiPromise: Promise<IframePlayerFactory> | null = null;

const loadKinescopeApi = (): Promise<IframePlayerFactory> => {
    if (window.KinescopeIframePlayerFactory) {
        return Promise.resolve(window.KinescopeIframePlayerFactory);
    }

    if (kinescopeApiPromise) {
        return kinescopeApiPromise;
    }

    kinescopeApiPromise = new Promise((resolve, reject) => {
        window.onKinescopeIframeAPIReady = (playerFactory) => {
            resolve(playerFactory);
        };

        const existingScript = document.querySelector('script[src*="iframe.player.js"]');
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://player.kinescope.io/latest/iframe.player.js';
            script.async = true;
            script.onload = () => {
                if (window.KinescopeIframePlayerFactory) {
                    resolve(window.KinescopeIframePlayerFactory);
                }
            };
            script.onerror = () => {
                reject(new Error('Ошибка загрузки Kinescope IFrame API'));
            };
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode?.insertBefore(script, firstScript);
        }
    });

    return kinescopeApiPromise;
};

/**
 * Безопасный компонент для встраивания Kinescope видео
 * Использует официальный IFrame API для управления плеером и отслеживания прогресса
 */
export const SecureKinescopePlayer = ({
    videoId,
    poster,
    title,
    onPosterClick,
    showPoster = false,
    contentType,
    contentId,
    duration: durationMinutes = 0,
    onProgressUpdate,
    onDurationChange,
    accessType = 'subscription',
    onPlay,
    disableProgressSave = false,
}: SecureKinescopePlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<IframePlayerApi | null>(null);
    const playerElementIdRef = useRef<string>(`kinescope-player-${contentId}`);
    const [savedProgress, setSavedProgress] = useState<number>(0);
    const width = window.innerWidth;
    const height = width * 0.5625;
    
    // Рефы для отслеживания прогресса
    const currentTimeRef = useRef<number>(0);
    const durationRef = useRef<number>(durationMinutes * 60 || 0);
    const lastSaveTimeRef = useRef<number>(0);
    const saveIntervalRef = useRef<number | null>(null);
    const isInitializedRef = useRef<boolean>(false);

    // Функция для извлечения ID видео из различных форматов
    const extractVideoId = (id: string): string => {
        if (id.includes('kinescope.io')) {
            const match = id.match(/kinescope\.io\/(?:embed\/|video\/)?([a-zA-Z0-9_-]+)/);
            if (match) {
                return match[1];
            }
        }
        return id;
    };

    // Функция для получения URL видео
    const getVideoUrl = (id: string): string => {
        const extractedId = extractVideoId(id);
        return `https://kinescope.io/${extractedId}`;
    };

    // Функция для сохранения прогресса на сервере
    const saveProgressToServer = useCallback(async (currentTime: number, duration: number) => {
        try {
            if (duration <= 0) {
                return;
            }

            if (currentTime < 0) {
                return;
            }

            const progress = Math.round((currentTime / duration) * 100);
            
            // Обновляем прогресс в родительском компоненте (всегда)
            if (onProgressUpdate) {
                onProgressUpdate(progress, duration);
            }

            // Если сохранение отключено - только передаём через callback
            if (disableProgressSave) {
                return true;
            }

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) {
                return;
            }

            if (!contentType || !contentId) {
                return;
            }

            const requestData = {
                contentType,
                contentId,
                currentTime: Math.round(currentTime * 100) / 100,
                duration: Math.round(duration * 100) / 100,
                userId: user._id
            };

            const response = await api.post('/api/video-progress', requestData);

            if (response.data && response.data.success) {
                return true;
            } else {
                return false;
            }
        } catch (error: any) {
            return false;
        }
    }, [contentType, contentId, onProgressUpdate, disableProgressSave]);

    useEffect(() => {
        const loadProgress = async () => {
            if (disableProgressSave) return;

            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user._id) {
                    return;
                }

                const response = await api.get(`/api/video-progress/${user._id}/${contentType}/${contentId}`);
                
                if (response.data.success && response.data.data) {
                    const progress = response.data.data;
                    const savedTime = progress.currentTime || 0;
                    const savedDuration = progress.duration || 0;
                    
                    setSavedProgress(savedTime);
                    
                    // Обновляем длительность
                    if (savedDuration > 0) {
                        durationRef.current = savedDuration;
                    }
                    
                    currentTimeRef.current = savedTime;
                    
                    if (onProgressUpdate) {
                        onProgressUpdate(progress.progress || 0, savedDuration);
                    }
                    
                    // Уведомляем о длительности
                    if (onDurationChange && savedDuration > 0) {
                        onDurationChange(savedDuration);
                    }
                    
                    console.log(`✅ Прогресс загружен: ${progress.progress}% (${savedTime.toFixed(1)}/${savedDuration.toFixed(1)} сек)`);
                } else {
                    console.log('ℹ️ Сохраненный прогресс не найден, начинаем с начала');
                }
            } catch (error: any) {
                console.error('❌ Ошибка загрузки прогресса:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
            }
        };

        loadProgress();
    }, [contentType, contentId, onProgressUpdate, disableProgressSave]);

    // Инициализация длительности из пропсов
    useEffect(() => {
        if (durationMinutes > 0) {
            durationRef.current = durationMinutes * 60;
            console.log(`📹 Длительность видео установлена: ${durationMinutes} минут (${durationRef.current} секунд)`);
        }
    }, [durationMinutes]);

    // Загрузка Kinescope IFrame API и создание плеера
    useEffect(() => {
        if (showPoster || isInitializedRef.current) return;
        if (!containerRef.current) return;

        // Проверяем, не создан ли уже элемент
        let playerElement = document.getElementById(playerElementIdRef.current);
        if (!playerElement) {
            // Создаем элемент для плеера
            playerElement = document.createElement('div');
            playerElement.id = playerElementIdRef.current;
            playerElement.style.width = '100%';
            playerElement.style.height = '100%';
            playerElement.style.position = 'absolute';
            playerElement.style.top = '0';
            playerElement.style.left = '0';
            playerElement.style.margin = '0';
            playerElement.style.padding = '0';
            playerElement.style.overflow = 'hidden';
            containerRef.current.appendChild(playerElement);
            console.log('📦 Элемент плеера создан:', playerElementIdRef.current);
        } else {
            console.log('📦 Элемент плеера уже существует:', playerElementIdRef.current);
        }
        
        // Добавляем стили для iframe, который создаст Kinescope API
        const styleId = `kinescope-player-styles-${contentId}`;
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #${playerElementIdRef.current} iframe {
                    width: 100% !important;
                    height: 100% !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                }
                #${playerElementIdRef.current} > div {
                    width: 100% !important;
                    height: 100% !important;
                    position: relative !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
            `;
            document.head.appendChild(style);
            console.log('📝 Стили для плеера добавлены');
        }

        // Функция инициализации плеера
        const initializePlayer = (playerFactory: IframePlayerFactory) => {
            if (isInitializedRef.current) {
                console.log('⚠️ Плеер уже инициализирован, пропускаем');
                return;
            }
            
            console.log('🎬 Инициализация Kinescope плеера...');
            console.log('📹 videoId:', videoId);
            
            const videoUrl = getVideoUrl(videoId);
            console.log('🔗 videoUrl:', videoUrl);
            
            const startTime = savedProgress > 0 ? savedProgress : 0;
            console.log('⏱️ startTime:', startTime);
            
            playerFactory
                .create(playerElementIdRef.current, {
                    url: videoUrl,
                    size: { width: '100%', height: '100%' },
                    autoplay: false,
                    muted: false,
                    loop: false,
                    controls: true,
                    time: startTime > 0 ? startTime : undefined
                })
                .then((player: IframePlayerApi) => {
                    console.log('✅ Kinescope плеер создан');
                    playerRef.current = player;
                    isInitializedRef.current = true;
                    
                    // Убираем paddingBottom после создания плеера, чтобы не было отступа
                    if (containerRef.current) {
                        containerRef.current.style.paddingBottom = '0';
                    }

                    // Событие Ready - плеер готов к воспроизведению
                    player.once(player.Events.Ready, (event: any) => {
                        console.log('✅ Плеер готов:', event);
                        
                        if (event.data?.duration) {
                            durationRef.current = event.data.duration;
                            console.log(`📹 Длительность видео: ${durationRef.current} сек`);
                            // Уведомляем родительский компонент о длительности
                            if (onDurationChange) {
                                onDurationChange(event.data.duration);
                            }
                        }
                        
                        if (event.data?.currentTime !== undefined) {
                            currentTimeRef.current = event.data.currentTime;
                        }
                        
                        // Если есть сохраненный прогресс, перематываем на него
                        if (savedProgress > 0 && durationRef.current > 0) {
                            player.seekTo(savedProgress).catch((err) => {
                                console.error('Ошибка перемотки на сохраненную позицию:', err);
                            });
                        }
                    });

                    // Событие Playing - воспроизведение началось
                    player.on(player.Events.Playing, async () => {
                        console.log('▶️ Воспроизведение началось');
                        
                        if (onPlay) {
                            onPlay();
                        }
                        
                        // Kinescope: всегда используем реальный прогресс (не ставим 100% при воспроизведении)
                        if (!saveIntervalRef.current) {
                            saveIntervalRef.current = window.setInterval(async () => {
                                try {
                                    if (playerRef.current && durationRef.current > 0) {
                                        const currentTime = await playerRef.current.getCurrentTime();
                                        currentTimeRef.current = currentTime;
                                        
                                        const progress = Math.round((currentTime / durationRef.current) * 100);
                                        
                                        // Обновляем прогресс в родительском компоненте
                                        if (onProgressUpdate) {
                                            onProgressUpdate(progress, durationRef.current);
                                        }
                                        
                                        // Сохраняем каждые 5 секунд
                                        const now = Date.now();
                                        if (now - lastSaveTimeRef.current > 5000) {
                                            lastSaveTimeRef.current = now;
                                            console.log(`💾 Автосохранение прогресса: ${progress}% (${currentTime.toFixed(1)}/${durationRef.current.toFixed(1)} сек)`);
                                            saveProgressToServer(currentTime, durationRef.current);
                                        }
                                    }
                                } catch (error) {
                                    console.error('Ошибка получения текущего времени:', error);
                                }
                            }, 1000); // Проверяем каждую секунду
                        }
                    });

                    // Событие Pause - пауза
                    player.on(player.Events.Pause, async () => {
                        console.log('⏸️ Воспроизведение приостановлено');
                        
                        // Для бесплатного контента не сохраняем прогресс при паузе
                        if (accessType === 'free') {
                            return;
                        }
                        
                        // Сохраняем прогресс при паузе
                        if (playerRef.current && durationRef.current > 0) {
                            try {
                                const currentTime = await playerRef.current.getCurrentTime();
                                currentTimeRef.current = currentTime;
                                saveProgressToServer(currentTime, durationRef.current);
                            } catch (error) {
                                console.error('Ошибка сохранения прогресса при паузе:', error);
                            }
                        }
                    });

                    // Событие TimeUpdate - обновление времени воспроизведения
                    player.on(player.Events.TimeUpdate, (event: any) => {
                        // Для бесплатного контента не обновляем прогресс
                        if (accessType === 'free') {
                            return;
                        }
                        
                        if (event.data?.currentTime !== undefined) {
                            currentTimeRef.current = event.data.currentTime;
                            
                            if (durationRef.current > 0 && onProgressUpdate) {
                                const progress = Math.round((event.data.currentTime / durationRef.current) * 100);
                                onProgressUpdate(progress, durationRef.current);
                            }
                        }
                    });

                    // Событие DurationChange - изменение длительности
                    player.on(player.Events.DurationChange, (event: any) => {
                        if (event.data?.duration) {
                            durationRef.current = event.data.duration;
                            console.log(`📹 Длительность обновлена: ${durationRef.current} сек`);
                            // Уведомляем родительский компонент о длительности
                            if (onDurationChange) {
                                onDurationChange(event.data.duration);
                            }
                        }
                    });

                    // Событие Ended - окончание воспроизведения
                    player.on(player.Events.Ended, async () => {
                        console.log('🏁 Воспроизведение завершено');
                        
                        // Для бесплатного контента не сохраняем прогресс при завершении
                        if (accessType === 'free') {
                            return;
                        }
                        
                        // Сохраняем прогресс как завершенный
                        if (playerRef.current && durationRef.current > 0) {
                            try {
                                await saveProgressToServer(durationRef.current, durationRef.current);
                            } catch (error) {
                                console.error('Ошибка сохранения прогресса при завершении:', error);
                            }
                        }
                    });

                    // Инициализация Telegram WebApp для полноэкранного режима
                    if (isTelegramWebView() && window.Telegram?.WebApp) {
                        const tg = window.Telegram.WebApp;
                        if (!tg.isExpanded) {
                            tg.expand();
                        }
                    }
                })
                .catch((error) => {
                    console.error('❌ Ошибка создания плеера:', error);
                });
        };

        loadKinescopeApi()
            .then((playerFactory) => {
                initializePlayer(playerFactory);
            })
            .catch((error) => {
                console.error('❌ Ошибка загрузки Kinescope IFrame API:', error);
            });

        return () => {
            // Очистка при размонтировании
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
                saveIntervalRef.current = null;
            }
            
            // Сохраняем прогресс при размонтировании (только для платного контента)
            if (accessType !== 'free' && playerRef.current && durationRef.current > 0 && currentTimeRef.current > 0) {
                saveProgressToServer(currentTimeRef.current, durationRef.current).catch((err) => {
                    console.error('Ошибка сохранения прогресса при размонтировании:', err);
                });
            }
            
            // Уничтожаем плеер
            if (playerRef.current) {
                playerRef.current.destroy().catch((err) => {
                    console.error('Ошибка уничтожения плеера:', err);
                });
                playerRef.current = null;
            }
            
            // Удаляем элемент плеера из DOM
            const playerElement = document.getElementById(playerElementIdRef.current);
            if (playerElement && playerElement.parentNode) {
                playerElement.parentNode.removeChild(playerElement);
            }
            
            // Удаляем добавленные стили
            const styleId = `kinescope-player-styles-${contentId}`;
            const styleElement = document.getElementById(styleId);
            if (styleElement) {
                styleElement.remove();
            }
            
            isInitializedRef.current = false;
        };
    }, [videoId, showPoster, savedProgress, saveProgressToServer, onProgressUpdate, accessType]);

    // Сохранение прогресса при закрытии страницы (только для платного контента)
    useEffect(() => {
        const handleBeforeUnload = async () => {
            // Для бесплатного контента не сохраняем прогресс при закрытии
            if (accessType === 'free') {
                return;
            }
            
            if (playerRef.current && durationRef.current > 0 && currentTimeRef.current > 0) {
                try {
                    // Пытаемся получить актуальное время
                    const currentTime = await playerRef.current.getCurrentTime();
                    await saveProgressToServer(currentTime, durationRef.current);
                } catch (error) {
                    // Если не получилось, сохраняем последнее известное значение
                    saveProgressToServer(currentTimeRef.current, durationRef.current);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
        };
    }, [saveProgressToServer, accessType]);

    // Защита от контекстного меню на контейнере
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        return false;
    };

    // Защита от выделения текста
    useEffect(() => {
        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IFRAME' || target.closest('iframe') || target.closest('[id*="kinescope"]')) {
                return;
            }
            e.preventDefault();
            return false;
        };

        if (containerRef.current) {
            containerRef.current.addEventListener('selectstart', handleSelectStart);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.removeEventListener('selectstart', handleSelectStart);
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            className="relative w-full rounded-lg overflow-hidden"
            style={{ 
                // paddingBottom: `${aspectRatio}%`, // Соотношение сторон (по умолчанию 16:9)
                WebkitTouchCallout: 'default',
                touchAction: 'manipulation',
                margin: 0,
                height: height,
                paddingTop: 0,
                paddingLeft: 0,
                paddingRight: 0
            }}
            onContextMenu={handleContextMenu}
            data-video-id={videoId}
        >
            {showPoster && poster && (
                <div 
                    className="absolute top-0 left-0 w-full h-full cursor-pointer z-10"
                    onClick={onPosterClick}
                    onContextMenu={handleContextMenu}
                >
                    <img 
                        src={poster} 
                        alt={title || 'Video poster'}
                        className="w-full h-full object-cover rounded-lg"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                    />
                    {/* Кнопка воспроизведения */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                            <svg 
                                className="w-8 h-8 text-white ml-1" 
                                fill="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
