import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { UserLayout } from "./UserLayout";
import { BackNav } from "./BackNav";
import { SecureKinescopePlayer } from "./SecureKinescopePlayer";
import { Switch } from "./Switch";

type ContentType = 
    | "videoLesson" 
    | "practice" 
    | "meditation"
    | "parables-of-life"
    | "scientific-discoveries"
    | "health-lab"
    | "relationship-workshop"
    | "spirit-forge"
    | "masters-tower"
    | "femininity-gazebo"
    | "consciousness-library"
    | "product-catalog"
    | "analysis-health"
    | "analysis-relationships"
    | "analysis-realization"
    | "psychodiagnostics";

interface NormalizedContent {
    title: string;
    shortDescription: string;
    content: any[];
    duration?: number;
    accessType?: "free" | "stars" | "paid" | "subscription";
}

interface UnifiedVideoContentPageProps {
    contentType: ContentType;
    fetchPath: string;
    normalizeContent?: (data: any) => NormalizedContent;
    id: string;
}

interface VideoProgress {
    currentTime: number;
    duration: number;
}

const getVideoInfo = (url: string): { type: "kinescope" | "youtube" | "rutube" | "unknown"; id: string; privateParam?: string } => {
    if (!url) return { type: "unknown", id: "" };

    if (url.includes("kinescope.io")) {
        const match = url.match(/kinescope\.io\/(?:embed\/|video\/)?([a-zA-Z0-9_-]+)/);
        if (match) {
            return { type: "kinescope", id: match[1] };
        }
    }

    if (url.includes("rutube.ru")) {
        const privateMatch = url.match(/rutube\.ru\/video\/private\/([^\/\?]+)\/?\?([^#]*)/);
        if (privateMatch) {
            const videoId = privateMatch[1];
            const queryString = privateMatch[2];
            const pMatch = queryString.match(/[&?]p=([^&\n?#]+)/);
            const privateParam = pMatch ? pMatch[1] : undefined;
            return { type: "rutube", id: videoId, privateParam };
        }

        const embedPrivateMatch = url.match(/rutube\.ru\/play\/embed\/([^\/\?]+)\/?\?([^#]*)/);
        if (embedPrivateMatch) {
            const videoId = embedPrivateMatch[1];
            const queryString = embedPrivateMatch[2];
            const pMatch = queryString.match(/[&?]p=([^&\n?#]+)/);
            const privateParam = pMatch ? pMatch[1] : undefined;
            return { type: "rutube", id: videoId, privateParam };
        }

        const embedMatch = url.match(/rutube\.ru\/play\/embed\/([^\/\?&]+)/);
        if (embedMatch) {
            return { type: "rutube", id: embedMatch[1] };
        }

        const videoMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9_-]+)/);
        if (videoMatch) {
            return { type: "rutube", id: videoMatch[1] };
        }
    }

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";

        if (url.includes("youtube.com/embed/")) {
            const match = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
            if (match) videoId = match[1];
        } else {
            const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            if (watchMatch) videoId = watchMatch[1];
        }

        if (videoId) {
            return { type: "youtube", id: videoId };
        }
    }

    return { type: "unknown", id: url };
};

const getRuTubeEmbedUrl = (url: string): string => {
    const info = getVideoInfo(url);
    if (info.type === "rutube" && info.id && info.id !== "private" && info.id.length > 0) {
        if (info.privateParam) {
            return `https://rutube.ru/play/embed/${info.id}/?p=${info.privateParam}`;
        }
        return `https://rutube.ru/play/embed/${info.id}`;
    }
    return url;
};

/** RuTube плеер: как YouTube — 100% и баллы при нажатии воспроизведения (player:changeState → playing) */
const RuTubePlayerWithProgress = ({
    embedUrl,
    onFirstPlay,
    className,
    title,
}: {
    embedUrl: string;
    onFirstPlay: () => void;
    className?: string;
    title?: string;
}) => {
    const playedRef = useRef(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== "https://rutube.ru" && !event.origin.includes("rutube.ru")) return;
            try {
                const msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                if (!msg?.type) return;

                if (msg.type === "player:changeState" && msg.data?.state === "playing" && !playedRef.current) {
                    playedRef.current = true;
                    onFirstPlay();
                }
            } catch {
                // ignore parse errors
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [onFirstPlay]);

    return (
        <iframe
            src={embedUrl}
            title={title || "RuTube video player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={className}
        />
    );
};

declare global {
    interface Window {
        YT?: { Player: any; PlayerState?: { PLAYING: number } };
        onYouTubeIframeAPIReady?: () => void;
    }
}

/** YouTube плеер: 100% и баллы только при реальном воспроизведении (onStateChange → PLAYING), не при загрузке страницы */
const YouTubePlayerWithProgress = ({
    videoId,
    onFirstPlay,
    className,
    style,
    title,
}: {
    videoId: string;
    onFirstPlay: () => void;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playedRef = useRef(false);

    useEffect(() => {
        if (!videoId || !containerRef.current) return;

        const initPlayer = () => {
            if (!window.YT?.Player || !containerRef.current) return;
            const YT = window.YT;
            const container = containerRef.current;
            if (container.querySelector('iframe')) return;

            new YT.Player(container, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: { enablejsapi: 1 },
                events: {
                    onStateChange: (e: { data: number }) => {
                        if (e.data === (YT.PlayerState?.PLAYING ?? 1) && !playedRef.current) {
                            playedRef.current = true;
                            onFirstPlay();
                        }
                    },
                },
            });
        };

        if (window.YT?.Player) {
            initPlayer();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prevReady?.();
            initPlayer();
        };
        if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            window.onYouTubeIframeAPIReady = prevReady;
            initPlayer();
            return;
        }
        document.head.appendChild(script);
        return () => {
            window.onYouTubeIframeAPIReady = prevReady;
        };
    }, [videoId, onFirstPlay]);

    return (
        <div ref={containerRef} className={className} style={style} title={title} />
    );
};

const defaultNormalizeContent = (data: any): NormalizedContent => {
    const content = data?.content || [];
    return {
        title: data?.title || "",
        shortDescription: data?.shortDescription || "",
        content,
        duration: data?.duration || 0,
        accessType: data?.accessType || "subscription",
    };
};

export const UnifiedVideoContentPage = ({
    contentType,
    fetchPath,
    normalizeContent = defaultNormalizeContent,
    id
}: UnifiedVideoContentPageProps) => {
    const [content, setContent] = useState<NormalizedContent | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [locatedInRussia, setLocatedInRussia] = useState(true);
    
    // Состояние для хранения прогресса каждого видео
    const videoProgressMapRef = useRef<Map<string, VideoProgress>>(new Map());
    const saveProgressTimeoutRef = useRef<number | null>(null);
    const awardedVideoIndicesRef = useRef<Set<number>>(new Set());

    const fetchUserData = useCallback(async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const response = await api.get(`/api/user/${storedUser._id}`);
            if (response.data.success) {
                setUser(response.data.data);
                setLocatedInRussia(response.data.data.locatedInRussia);
                if (response.data.data && response.data.data.isBlocked && response.data.data.role !== "admin") {
                    window.location.href = "/client/blocked-user";
                }
            }
        } catch (error) {
            console.error("Ошибка загрузки данных пользователя:", error);
        }
    }, []);

    const fetchContent = useCallback(async () => {
        try {
            if (!id) return;
            const response = await api.get(`${fetchPath}/${id}`);
            const normalized = normalizeContent(response.data.data);
            setContent(normalized);
        } catch (error) {
            console.error("Ошибка загрузки контента:", error);
        } finally {
            setLoading(false);
        }
    }, [fetchPath, id, normalizeContent]);

    useEffect(() => {
        fetchUserData();
        fetchContent();
    }, [fetchContent, fetchUserData]);

    // Функция для расчёта и сохранения общего прогресса
    const calculateAndSaveProgress = useCallback(async () => {
        const progressMap = videoProgressMapRef.current;
        if (progressMap.size === 0) return;
        
        let totalDuration = 0;
        let totalWatched = 0;
        
        progressMap.forEach(({ currentTime, duration }) => {
            totalDuration += duration;
            totalWatched += currentTime;
        });
        
        if (totalDuration === 0) return;
        
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            if (!storedUser._id || !id) return;

            await api.post("/api/video-progress", {
                contentType,
                contentId: id,
                currentTime: Math.round(totalWatched * 100) / 100,
                duration: Math.round(totalDuration * 100) / 100,
                userId: storedUser._id,
            });
        } catch (error) {
            console.error("Ошибка при сохранении прогресса:", error);
        }
    }, [contentType, id]);

    // Функция для обновления прогресса конкретного видео с дебаунсом
    const updateVideoProgress = useCallback((videoKey: string, currentTime: number, duration: number) => {
        videoProgressMapRef.current.set(videoKey, { currentTime, duration });
        
        // Дебаунс сохранения прогресса
        if (saveProgressTimeoutRef.current) {
            clearTimeout(saveProgressTimeoutRef.current);
        }
        saveProgressTimeoutRef.current = window.setTimeout(() => {
            calculateAndSaveProgress();
        }, 2000);
    }, [calculateAndSaveProgress]);

    // Начисление баллов за конкретное видео (YouTube/RuTube — при воспроизведении, Kinescope — при достижении 90%)
    const awardPointsForVideo = useCallback(async (videoIndex: number) => {
        if (awardedVideoIndicesRef.current.has(videoIndex)) return;
        awardedVideoIndicesRef.current.add(videoIndex);

        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            if (!storedUser._id || !id) return;

            await api.post("/api/video-progress/award-points-for-video", {
                contentType,
                contentId: id,
                userId: storedUser._id,
                videoIndex,
            });
        } catch (error) {
            console.error("Ошибка при начислении баллов за видео:", error);
            awardedVideoIndicesRef.current.delete(videoIndex);
        }
    }, [contentType, id]);

    // Обработчик для YouTube/RuTube — при загрузке (воспроизведении) начисляем баллы
    const handleYouTubeRuTubeLoad = useCallback((videoKey: string, videoIndex: number, estimatedDuration: number = 60) => {
        updateVideoProgress(videoKey, estimatedDuration, estimatedDuration);
        awardPointsForVideo(videoIndex);
    }, [updateVideoProgress, awardPointsForVideo]);

    // Обработчик прогресса для Kinescope — начисляем баллы при достижении 90%
    const createKinescopeProgressHandler = useCallback((videoKey: string, videoIndex: number) => {
        return (progress: number, duration?: number) => {
            const durationSeconds = duration || 60;
            const currentTime = (progress / 100) * durationSeconds;
            updateVideoProgress(videoKey, currentTime, durationSeconds);
            if (progress >= 90) {
                awardPointsForVideo(videoIndex);
            }
        };
    }, [updateVideoProgress, awardPointsForVideo]);

    // Обработчик для Kinescope когда получена длительность
    const createKinescopeDurationHandler = useCallback((videoKey: string, _videoIndex: number) => {
        return (durationSeconds: number) => {
            const currentProgress = videoProgressMapRef.current.get(videoKey);
            if (currentProgress) {
                // Обновляем с реальной длительностью
                updateVideoProgress(videoKey, currentProgress.currentTime, durationSeconds);
            } else {
                // Инициализируем с нулевым прогрессом
                updateVideoProgress(videoKey, 0, durationSeconds);
            }
        };
    }, [updateVideoProgress]);

    const updateUserData = async (field: string, value: boolean) => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const response = await api.put(`/api/user/${storedUser._id}`, { [field]: value });
        if (response.data.success) {
            setUser(response.data.user);
        }
    };

    const handleLocatedInRussiaChange = async () => {
        try {
            await updateUserData("locatedInRussia", !locatedInRussia);
            setLocatedInRussia(!locatedInRussia);
            window.location.reload();
        } catch (error) {
            console.error("Ошибка при изменении просмотра видео в РФ без VPN:", error);
        }
    };

    // Сохраняем прогресс при размонтировании
    useEffect(() => {
        return () => {
            if (saveProgressTimeoutRef.current) {
                clearTimeout(saveProgressTimeoutRef.current);
            }
            // Финальное сохранение
            calculateAndSaveProgress();
        };
    }, [calculateAndSaveProgress]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23] text-white">
                Контент не найден
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title={content.title} />
                <div className="px-4 mt-4 pb-10 bg-[#031F23]">
                    <p dangerouslySetInnerHTML={{ __html: content.shortDescription }}></p>
                    {content.content.length > 0 && content.content.map((item: any, index: number) => {
                        const itemKey = item?._id || `item-${index}`;
                        const videoKey = `${id}-${itemKey}`;
                        const lb = item?.linkButton;
                        const hasLinkButton = lb?.linkButtonText && lb?.linkButtonLink;

                        const renderLinkButtonBlock = () =>
                            hasLinkButton ? (
                                <div className="mt-4">
                                    {lb.linkButtonType === "external" ? (
                                        <a
                                            href={lb.linkButtonLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center py-2 bg-[#C4841D] text-white font-medium rounded-full hover:cursor-pointer transition-colors"
                                        >
                                            {lb.linkButtonText}
                                        </a>
                                    ) : (
                                        <Link
                                            to={lb.linkButtonLink}
                                            className="block w-full text-center py-2 bg-[#C4841D] text-white font-medium rounded-full hover:cursor-pointer transition-colors"
                                        >
                                            {lb.linkButtonText}
                                        </Link>
                                    )}
                                </div>
                            ) : null;

                        // Кнопка-ссылка (отдельный тип контента)
                        const hasVideo = item?.video?.mainUrl || item?.video?.reserveUrl;
                        const hasText = item.text !== null && item.text !== undefined && item.text !== "";
                        const hasImage = item.image !== null && item.image !== undefined && item.image !== "";
                        if (hasLinkButton && !hasVideo && !hasText && !hasImage) {
                            return (
                                <div key={itemKey}>
                                    {renderLinkButtonBlock()}
                                </div>
                            );
                        }

                        // Текстовый контент
                        if (hasText) {
                            return (
                                <div key={itemKey}>
                                    <p className="mt-6" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                                </div>
                            );
                        }

                        // Изображение
                        if (hasImage) {
                            return (
                                <div key={itemKey}>
                                    <img src={`${import.meta.env.VITE_API_URL}${item.image}`} alt={content.title} className="mt-6" />
                                </div>
                            );
                        }
                        
                        // Видео контент (новая структура: item.video.mainUrl, item.video.reserveUrl, item.video.duration)
                        const mainUrl = item.video?.mainUrl || "";
                        const reserveUrl = item.video?.reserveUrl || "";
                        const videoDurationMinutes = item.video?.duration || 1; // В минутах
                        const videoDurationSeconds = videoDurationMinutes * 60; // Преобразуем в секунды для прогресса
                        
                        if (!mainUrl && !reserveUrl) {
                            return null; // Нет видео URL
                        }
                        
                        const originalVideoInfo = getVideoInfo(mainUrl);
                        const shouldUseRuTube = originalVideoInfo.type === "youtube" && user?.locatedInRussia && reserveUrl;
                        const videoUrl = shouldUseRuTube ? reserveUrl : mainUrl;
                        const videoInfo = getVideoInfo(videoUrl);

                        if (videoInfo.type === "kinescope") {
                            return (
                                <div key={itemKey}>
                                    <div className="mt-6 w-full">
                                        <SecureKinescopePlayer
                                        videoId={videoInfo.id}
                                        title={`${content.title} - ${index + 1}`}
                                        showPoster={false}
                                        contentType={contentType}
                                        contentId={videoKey}
                                        duration={videoDurationMinutes}
                                        accessType={content.accessType || "subscription"}
                                        onProgressUpdate={createKinescopeProgressHandler(videoKey, index)}
                                        onDurationChange={createKinescopeDurationHandler(videoKey, index)}
                                        disableProgressSave={true}
                                    />
                                    </div>
                                </div>
                            );
                        }

                        if (videoInfo.type === "rutube") {
                            const rutubeEmbedUrl = getRuTubeEmbedUrl(videoUrl);
                            if (!rutubeEmbedUrl || !videoInfo.id || videoInfo.id === "private" || videoInfo.id.length === 0) {
                                if (originalVideoInfo.type === "youtube") {
                                    return (
                                        <div key={itemKey}>
                                            <div className="mt-6">
                                                <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                                    <YouTubePlayerWithProgress
                                                        videoId={originalVideoInfo.id}
                                                        onFirstPlay={() => handleYouTubeRuTubeLoad(videoKey, index, videoDurationSeconds)}
                                                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
                                                        title={`YouTube video player ${index + 1}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }

                            // RuTube: прогресс и баллы через postMessage API (player:changeState, player:currentTime)
                            return (
                                <div key={itemKey}>
                                    <div className="mt-6">
                                        <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                            <RuTubePlayerWithProgress
                                                embedUrl={rutubeEmbedUrl}
                                                onFirstPlay={() => handleYouTubeRuTubeLoad(videoKey, index, videoDurationSeconds)}
                                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                title={`RuTube video player ${index + 1}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // YouTube по умолчанию — 100% и баллы только при реальном воспроизведении
                        return (
                            <div key={itemKey}>
                                <div className="mt-6">
                                    <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                        <YouTubePlayerWithProgress
                                            videoId={videoInfo.id}
                                            onFirstPlay={() => handleYouTubeRuTubeLoad(videoKey, index, videoDurationSeconds)}
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                            style={{ left: 0, top: 0, width: '100%', height: '100%' }}
                                            title={`YouTube video player ${index + 1}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {(() => {
                        const items = Array.isArray(content.content) ? content.content : [];
                        const hasMainUrl = items.some((item: any) => Boolean(item?.video?.mainUrl));
                        const allHaveReserveUrl = items
                            .filter((item: any) => Boolean(item?.video?.mainUrl))
                            .every((item: any) => Boolean(item?.video?.reserveUrl));
                        const shouldShowToggle = hasMainUrl && allHaveReserveUrl;

                        return shouldShowToggle ? (
                            <div className="mt-4 flex items-center justify-between">
                                <div>Просмотр видео в РФ без VPN</div>
                                <Switch checked={locatedInRussia} onChange={handleLocatedInRussiaChange} />
                            </div>
                        ) : null;
                    })()}
                </div>
            </UserLayout>
        </div>
    );
};
