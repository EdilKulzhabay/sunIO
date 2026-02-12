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

const getYouTubeEmbedUrl = (url: string): string => {
    const info = getVideoInfo(url);
    if (info.type === "youtube") {
        return `https://www.youtube.com/embed/${info.id}`;
    }
    return url;
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
    const [locatedInRussia, setLocatedInRussia] = useState(false);
    
    // Состояние для хранения прогресса каждого видео
    const videoProgressMapRef = useRef<Map<string, VideoProgress>>(new Map());
    const saveProgressTimeoutRef = useRef<number | null>(null);
    const bonusAwardedRef = useRef(false);

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

    // Начисление бонуса (один раз за весь контент)
    const awardBonusOnPlay = useCallback(async () => {
        if (bonusAwardedRef.current) return;
        bonusAwardedRef.current = true;
        
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            if (!storedUser._id || !id) return;

            await api.post("/api/video-progress/award-bonus", {
                contentType,
                contentId: id,
                userId: storedUser._id,
            });
        } catch (error) {
            console.error("Ошибка при начислении бонуса:", error);
        }
    }, [contentType, id]);

    // Обработчик для YouTube/RuTube - сразу 100%
    const handleYouTubeRuTubeLoad = useCallback((videoKey: string, estimatedDuration: number = 60) => {
        // YouTube/RuTube считаем сразу просмотренными на 100%
        updateVideoProgress(videoKey, estimatedDuration, estimatedDuration);
        awardBonusOnPlay();
    }, [updateVideoProgress, awardBonusOnPlay]);

    // Обработчик прогресса для Kinescope
    const createKinescopeProgressHandler = useCallback((videoKey: string) => {
        return (progress: number, duration?: number) => {
            const durationSeconds = duration || 60;
            const currentTime = (progress / 100) * durationSeconds;
            updateVideoProgress(videoKey, currentTime, durationSeconds);
        };
    }, [updateVideoProgress]);

    // Обработчик для Kinescope когда получена длительность
    const createKinescopeDurationHandler = useCallback((videoKey: string) => {
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
                                            className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                        >
                                            {lb.linkButtonText}
                                        </a>
                                    ) : (
                                        <Link
                                            to={lb.linkButtonLink}
                                            className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
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
                                        onPlay={awardBonusOnPlay}
                                        onProgressUpdate={createKinescopeProgressHandler(videoKey)}
                                        onDurationChange={createKinescopeDurationHandler(videoKey)}
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
                                                <iframe
                                                    src={`${getYouTubeEmbedUrl(mainUrl)}?enablejsapi=1`}
                                                    title={`YouTube video player ${index + 1}`}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                    onLoad={() => handleYouTubeRuTubeLoad(videoKey, videoDurationSeconds)}
                                                />
                                            </div>
                                        </div>
                                        </div>
                                    );
                                }
                                return null;
                            }

                            return (
                                <div key={itemKey}>
                                <div className="mt-6">
                                    <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                        <iframe
                                            src={rutubeEmbedUrl}
                                            title={`RuTube video player ${index + 1}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                            onLoad={() => handleYouTubeRuTubeLoad(videoKey, videoDurationSeconds)}
                                        />
                                    </div>
                                </div>
                                </div>
                            );
                        }

                        // YouTube по умолчанию
                        return (
                            <div key={itemKey}>
                            <div className="mt-6">
                                <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                    <iframe
                                        src={`${getYouTubeEmbedUrl(videoUrl)}?enablejsapi=1`}
                                        title={`YouTube video player ${index + 1}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                                        onLoad={() => handleYouTubeRuTubeLoad(videoKey, videoDurationSeconds)}
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
