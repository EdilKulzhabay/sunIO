import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { UserLayout } from "./UserLayout";
import { BackNav } from "./BackNav";
import { SecureKinescopePlayer } from "./SecureKinescopePlayer";
import { Switch } from "./Switch";
import { ClientPurchaseConfirmModal } from "./ClientPurchaseConfirmModal";
import { ClientInsufficientBonusModal } from "./ClientInsufficientBonusModal";
import { ClientPaidDynamicModal } from "./ClientPaidDynamicModal";
import { ClientSubscriptionDynamicModal } from "./ClientSubscriptionDynamicModal";
import { X } from "lucide-react";
import { openExternalLink } from "../../utils/telegramWebApp";

type ContentType = 
    | "videoLesson" 
    | "practice" 
    | "meditation"
    | "parables-of-life"
    | "neuromeditations"
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
    | "psychodiagnostics"
    | "broadcast-recording";

interface NormalizedContent {
    title: string;
    shortDescription: string;
    content: any[];
    duration?: number;
    accessType?: "free" | "stars" | "paid" | "subscription";
    starsRequired?: number;
    price?: number;
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

/** Ссылки из админки/API иногда приходят с &amp; или без схемы. */
const sanitizeVideoUrlInput = (raw: string): string =>
    String(raw || "")
        .trim()
        .replace(/&amp;/gi, "&")
        .replace(/&#0*38;/g, "&");

/** Встраиваемый плеер VK: video_ext.php на доменах VK. */
const isVkVideoExtUrl = (url: string): boolean => {
    const u = url.toLowerCase();
    if (!u.includes("video_ext.php")) return false;
    return u.includes("vkvideo.ru") || u.includes("vk.com") || u.includes("vk.ru");
};

/** Исправляет ttps:// и относительные URL перед разбором через URL(). */
const normalizeProtocolForUrlParse = (s: string): string => {
    let t = s.trim();
    if (/^ttps:\/\//i.test(t)) t = `https://${t.slice(7)}`;
    if (t.startsWith("//")) t = `https:${t}`;
    if (!/^https?:\/\//i.test(t)) t = `https://${t.replace(/^\/+/, "")}`;
    return t;
};

/** Собирает канонический embed URL, если парсер URL не справился. */
const buildVkVideoEmbedFromQueryString = (s: string): string => {
    const idx = s.indexOf("?");
    const qs = idx >= 0 ? s.slice(idx + 1).split("#")[0] : s;
    const sp = new URLSearchParams(qs.replace(/&amp;/gi, "&"));
    let oid = sp.get("oid");
    let id = sp.get("id");
    if (!oid || !id) {
        const o = s.match(/[?&]oid=([^&#]+)/i);
        const i = s.match(/[?&]id=([^&#]+)/i);
        oid = o ? decodeURIComponent(o[1]) : null;
        id = i ? decodeURIComponent(i[1]) : null;
    }
    if (!oid || !id) return "";
    let hashVal = sp.get("hash");
    if (!hashVal) {
        const hm = s.match(/[?&]hash=([^&#]+)/i);
        if (hm?.[1]) {
            try {
                hashVal = decodeURIComponent(hm[1].replace(/\+/g, " "));
            } catch {
                hashVal = hm[1];
            }
        }
    }
    const hd = sp.get("hd") || s.match(/[?&]hd=([^&#]+)/i)?.[1] || "2";
    const out = new URL("https://vkvideo.ru/video_ext.php");
    out.searchParams.set("oid", oid);
    out.searchParams.set("id", id);
    if (hashVal) out.searchParams.set("hash", hashVal);
    out.searchParams.set("hd", hd);
    return out.toString();
};

const getVideoInfo = (url: string): { type: "kinescope" | "youtube" | "rutube" | "vkvideo" | "unknown"; id: string; privateParam?: string } => {
    url = sanitizeVideoUrlInput(url);
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

    if (isVkVideoExtUrl(url)) {
        return { type: "vkvideo", id: url };
    }

    // VK Video page URL: vkvideo.ru/video-OID_ID or vk.com/video-OID_ID
    if (url.includes("vkvideo.ru") || url.includes("vk.com/video")) {
        const match = url.match(/video(-?\d+_\d+)/);
        if (match) {
            return { type: "vkvideo", id: match[1] };
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

const getVkVideoEmbedUrl = (oidId: string): string => {
    // oidId format: "-211095106_456239712" — встраивание через vkvideo.ru (как в официальном iframe VK Видео)
    const parts = oidId.split("_");
    if (parts.length !== 2) return "";
    return `https://vkvideo.ru/video_ext.php?oid=${parts[0]}&id=${parts[1]}&hd=2`;
};

/** Полный src iframe из VK (с hash) или короткий owner_video_id — без hash VK часто отдаёт «Video not found». */
const resolveVkVideoEmbedUrl = (idOrUrl: string): string => {
    const s = sanitizeVideoUrlInput(idOrUrl);
    if (!s) return "";
    if (!s.toLowerCase().includes("video_ext.php")) {
        return getVkVideoEmbedUrl(s);
    }
    const withProtocol = normalizeProtocolForUrlParse(s);
    try {
        const u = new URL(withProtocol);
        if (!u.pathname.toLowerCase().includes("video_ext.php")) {
            const fb = buildVkVideoEmbedFromQueryString(withProtocol);
            return fb || "";
        }
        const h = u.hostname.toLowerCase();
        if (
            h === "vk.com" ||
            h === "www.vk.com" ||
            h === "m.vk.com" ||
            h === "vk.ru" ||
            h === "www.vk.ru" ||
            h === "m.vk.ru"
        ) {
            u.hostname = "vkvideo.ru";
        }
        if (!u.searchParams.has("hd")) {
            u.searchParams.set("hd", "2");
        }
        return u.toString();
    } catch {
        return buildVkVideoEmbedFromQueryString(withProtocol) || "";
    }
};

const vkVideoEmbedMissingHash = (embedUrl: string): boolean => {
    try {
        const u = new URL(normalizeProtocolForUrlParse(sanitizeVideoUrlInput(embedUrl)));
        if (!u.pathname.toLowerCase().includes("video_ext.php")) return true;
        const hash = u.searchParams.get("hash");
        return !hash?.trim();
    } catch {
        const s = sanitizeVideoUrlInput(embedUrl);
        const m = s.match(/[?&]hash=([^&#]+)/i);
        return !m?.[1]?.trim();
    }
};

/** Ключ для VK API video.get: ownerId_videoId, например -211095106_456239712 */
const getVkVideosKey = (idOrUrl: string): string => {
    const s = sanitizeVideoUrlInput(idOrUrl);
    if (/^-?\d+_\d+$/.test(s)) return s;
    if (s.toLowerCase().includes("video_ext.php")) {
        try {
            const u = new URL(normalizeProtocolForUrlParse(s));
            const oid = u.searchParams.get("oid");
            const vid = u.searchParams.get("id");
            if (oid != null && oid !== "" && vid != null && vid !== "") return `${oid}_${vid}`;
        } catch {
            /* fall through */
        }
        const fb = buildVkVideoEmbedFromQueryString(normalizeProtocolForUrlParse(s));
        if (fb) {
            try {
                const u2 = new URL(fb);
                const oid = u2.searchParams.get("oid");
                const vid = u2.searchParams.get("id");
                if (oid && vid) return `${oid}_${vid}`;
            } catch {
                return "";
            }
        }
        return "";
    }
    const m = s.match(/video(-?\d+_\d+)/);
    return m ? m[1] : "";
};

const vkResolveInitialPhase = (
    initialEmbedUrl: string,
    videosKey: string
): "resolving" | "done" | "error" => {
    if (!vkVideoEmbedMissingHash(initialEmbedUrl)) return "done";
    if (!videosKey) return "error";
    return "resolving";
};

/**
 * Подставляет в iframe URL с hash через сервер (VK video.get).
 * Если в ссылке уже есть hash — запрос не делается.
 */
const VkVideoPlayerResolved = ({
    videosKey,
    initialEmbedUrl,
    onFirstPlay,
    className,
    title,
}: {
    videosKey: string;
    initialEmbedUrl: string;
    onFirstPlay: () => void;
    className?: string;
    title?: string;
}) => {
    const [embedUrl, setEmbedUrl] = useState(initialEmbedUrl);
    const [phase, setPhase] = useState<"resolving" | "done" | "error">(() =>
        vkResolveInitialPhase(initialEmbedUrl, videosKey)
    );

    useEffect(() => {
        const hasHash = !vkVideoEmbedMissingHash(initialEmbedUrl);
        if (hasHash) {
            setEmbedUrl(initialEmbedUrl);
            setPhase("done");
            return;
        }
        if (!videosKey) {
            setPhase("error");
            return;
        }

        let cancelled = false;
        setPhase("resolving");
        (async () => {
            try {
                const { data } = await api.get("/api/vk-video/embed-url", {
                    params: { videos: videosKey },
                });
                if (cancelled) return;
                if (data?.success && typeof data.embedUrl === "string" && data.embedUrl.length > 0) {
                    setEmbedUrl(data.embedUrl);
                    setPhase("done");
                } else {
                    setPhase("error");
                }
            } catch {
                if (!cancelled) setPhase("error");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [initialEmbedUrl, videosKey]);

    if (phase === "resolving") {
        return (
            <div className={`absolute inset-0 flex items-center justify-center bg-[#031F23] rounded-lg ${className}`}>
                <span className="text-white/70 text-sm">Подключение плеера VK…</span>
            </div>
        );
    }

    if (phase === "error") {
        return (
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#031F23] rounded-lg px-4 ${className}`}>
                <p className="text-white/80 text-sm text-center">
                    Не удалось загрузить встроенный плеер VK. Проверьте на сервере переменную окружения{" "}
                    <code className="text-white/90">VK_ACCESS_TOKEN</code> (ключ приложения VK с доступом к видео) и
                    обновите страницу.
                </p>
            </div>
        );
    }

    return (
        <VkVideoPlayerWithProgress
            embedUrl={embedUrl}
            onFirstPlay={onFirstPlay}
            className={className}
            title={title}
        />
    );
};

/** VK Video плеер: 100% и баллы при нажатии Play (overlay-подход, т.к. у VK нет postMessage API) */
const VkVideoPlayerWithProgress = ({
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
    const [played, setPlayed] = useState(false);

    const handleClick = () => {
        if (!played) {
            setPlayed(true);
            onFirstPlay();
        }
    };

    return (
        <div className="relative" style={{ width: "100%", height: "100%" }}>
            <iframe
                key={embedUrl}
                src={embedUrl}
                title={title || "VK Video player"}
                width="100%"
                height="100%"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
                allowFullScreen
                className={className}
                style={{ border: 0, width: "100%", height: "100%" }}
            />
            {!played && (
                <div
                    onClick={handleClick}
                    className="absolute inset-0 cursor-pointer z-10"
                    style={{ background: "transparent" }}
                />
            )}
        </div>
    );
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
        starsRequired: data?.starsRequired || 0,
        price: data?.price || 0,
    };
};

export const UnifiedVideoContentPage = ({
    contentType,
    fetchPath,
    normalizeContent = defaultNormalizeContent,
    id
}: UnifiedVideoContentPageProps) => {
    const navigate = useNavigate();
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

    const hasAccess = useMemo(() => {
        if (!content || !user) return true;
        const accessType = content.accessType;
        if (!accessType || accessType === 'free') return true;

        if (accessType === 'stars' || accessType === 'paid') {
            if (user.products?.some(
                (p: any) => p.productId === id && p.type === 'one-time' && p.paymentStatus === 'paid'
            )) return true;
        }

        if (accessType === 'subscription' || accessType === 'paid') {
            if (user.hasPaid && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()) return true;
        }

        return false;
    }, [content, user, id]);

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showInsufficientBonusModal, setShowInsufficientBonusModal] = useState(false);
    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

    const [showPaidModal, setShowPaidModal] = useState(false);
    const [clubLockedHtml, setClubLockedHtml] = useState("");
    const [lockedOfferModal, setLockedOfferModal] = useState<{
        open: boolean;
        accessType: "subscription" | "stars";
    }>({ open: false, accessType: "subscription" });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get("/api/dynamic-content/name/content-suns");
                const html = res.data?.data?.content;
                if (typeof html === "string") setClubLockedHtml(html);
            } catch {
                /* текст из админки необязателен — кнопки в модалке всё равно есть */
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (loading || !content || !user || hasAccess) return;
        const accessType = content.accessType;
        if (accessType === 'stars' && user.emailConfirmed) {
            const starsNeeded = content.starsRequired || 0;
            if ((user.bonus || 0) >= starsNeeded) {
                setShowPurchaseModal(true);
            } else {
                setShowInsufficientBonusModal(true);
            }
        } else if (accessType === 'paid' && (content.price ?? 0) > 0) {
            setShowPaidModal(true);
        } else {
            setShowAccessDeniedModal(true);
        }
    }, [loading, content, user, hasAccess]);

    const handleAccessClose = () => {
        navigate('/main', { replace: true });
    };

    const handleAccessDeniedBuy = useCallback(() => {
        if (!content) return;
        const at = content.accessType;
        if (at === "subscription") {
            setShowAccessDeniedModal(false);
            setLockedOfferModal({ open: true, accessType: "subscription" });
            return;
        }
        if (at === "paid") {
            setShowAccessDeniedModal(false);
            setShowPaidModal(true);
            return;
        }
        if (at === "stars" && !user?.emailConfirmed) {
            setShowAccessDeniedModal(false);
            setLockedOfferModal({ open: true, accessType: "stars" });
        }
    }, [content, user?.emailConfirmed]);

    const handleLockedOfferModalClose = () => {
        setLockedOfferModal((m) => ({ ...m, open: false }));
        setShowAccessDeniedModal(true);
    };

    const handlePaidModalClose = () => {
        setShowPaidModal(false);
        setShowAccessDeniedModal(true);
    };

    const handlePurchaseSuccess = async () => {
        setShowPurchaseModal(false);
        setShowPaidModal(false);
        setShowAccessDeniedModal(false);
        setLockedOfferModal((m) => ({ ...m, open: false }));
        await fetchUserData();
        await fetchContent();
    };

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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400/90" />
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

    if (!hasAccess) {
        const accessType = content.accessType;
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23] text-white">
                {accessType === 'stars' && user?.emailConfirmed && (
                    <>
                        <ClientPurchaseConfirmModal
                            isOpen={showPurchaseModal}
                            onClose={handleAccessClose}
                            contentId={id}
                            contentType={contentType}
                            contentTitle={content.title}
                            contentDescription={content.shortDescription || ''}
                            starsRequired={content.starsRequired || 0}
                            userBonus={user?.bonus || 0}
                            onPurchaseSuccess={handlePurchaseSuccess}
                            closeOnPurchaseSuccess={false}
                        />
                        <ClientInsufficientBonusModal
                            isOpen={showInsufficientBonusModal}
                            onClose={handleAccessClose}
                            starsRequired={content.starsRequired || 0}
                            userBonus={user?.bonus || 0}
                            contentTitle={content.title}
                        />
                    </>
                )}

                {accessType === "paid" && showPaidModal && content && (
                    <ClientPaidDynamicModal
                        isOpen={showPaidModal}
                        onClose={handlePaidModalClose}
                        item={{
                            _id: id,
                            title: content.title,
                            shortDescription: content.shortDescription,
                            price: content.price,
                        }}
                        contentType={contentType}
                        userBalance={user?.balance ?? 0}
                        onPurchaseSuccess={handlePurchaseSuccess}
                        closeOnPurchaseSuccess={false}
                    />
                )}

                <ClientSubscriptionDynamicModal
                    isOpen={lockedOfferModal.open}
                    onClose={handleLockedOfferModalClose}
                    content={clubLockedHtml}
                    accessType={lockedOfferModal.accessType}
                />

                {showAccessDeniedModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen sm:hidden">
                            <div className="fixed inset-0 bg-black/60 transition-opacity z-20" />
                            <div
                                className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={handleAccessClose} className="absolute top-[26px] right-5 cursor-pointer">
                                    <X size={24} />
                                </button>
                                <div className="text-xl font-semibold mb-2">{content.title}</div>
                                <div className="text-white mt-2 space-y-2">
                                    {accessType === "subscription" && (
                                        <p>Этот контент доступен только по подписке. Нажмите «Купить», чтобы перейти к оформлению.</p>
                                    )}
                                    {accessType === "paid" && (
                                        <p>
                                            Контент можно приобрести за баланс в приложении. Нажмите «Купить», чтобы оплатить и
                                            открыть просмотр.
                                        </p>
                                    )}
                                    {accessType === "stars" && !user?.emailConfirmed && (
                                        <p>Для доступа нужна регистрация и Солнца. Нажмите «Купить», чтобы перейти к регистрации.</p>
                                    )}
                                </div>
                                <div className="mt-4 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={handleAccessDeniedBuy}
                                        className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full transition-colors"
                                    >
                                        Купить
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAccessClose}
                                        className="w-full py-3 border border-white/50 text-white font-medium rounded-full transition-colors"
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                            <div className="fixed inset-0 bg-black/60 transition-opacity" />
                            <div
                                className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                                style={{ maxWidth: "500px", width: "100%" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={handleAccessClose} className="absolute top-8 right-8 cursor-pointer">
                                    <X size={32} />
                                </button>
                                <div className="text-xl font-semibold mb-2">{content.title}</div>
                                <div className="text-white mt-2 space-y-2">
                                    {accessType === "subscription" && (
                                        <p>Этот контент доступен только по подписке. Нажмите «Купить», чтобы перейти к оформлению.</p>
                                    )}
                                    {accessType === "paid" && (
                                        <p>
                                            Контент можно приобрести за баланс в приложении. Нажмите «Купить», чтобы оплатить и
                                            открыть просмотр.
                                        </p>
                                    )}
                                    {accessType === "stars" && !user?.emailConfirmed && (
                                        <p>Для доступа нужна регистрация и Солнца. Нажмите «Купить», чтобы перейти к регистрации.</p>
                                    )}
                                </div>
                                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={handleAccessClose}
                                        className="w-full sm:w-auto min-w-[140px] py-3 border border-white/50 text-white font-medium rounded-full transition-colors px-6"
                                    >
                                        Закрыть
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAccessDeniedBuy}
                                        className="w-full sm:w-auto min-w-[140px] py-3 bg-[#C4841D] text-white font-medium rounded-full transition-colors px-6"
                                    >
                                        Купить
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                                        <button
                                            onClick={() => openExternalLink(lb.linkButtonLink)}
                                            className="block w-full text-center py-2 bg-[#C4841D] text-white font-medium rounded-full hover:cursor-pointer transition-colors"
                                        >
                                            {lb.linkButtonText}
                                        </button>
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
                        const videoUrl = shouldUseRuTube ? reserveUrl : mainUrl || reserveUrl;
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

                        // VK Video: URL с hash с сервера (video.get) или уже полная ссылка из контента
                        if (videoInfo.type === "vkvideo") {
                            const vkEmbedUrl = resolveVkVideoEmbedUrl(videoInfo.id);
                            const vkVideosKey = getVkVideosKey(videoInfo.id);
                            if (vkEmbedUrl) {
                                return (
                                    <div key={itemKey}>
                                        <div className="mt-6">
                                            <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                                <VkVideoPlayerResolved
                                                    videosKey={vkVideosKey}
                                                    initialEmbedUrl={vkEmbedUrl}
                                                    onFirstPlay={() => handleYouTubeRuTubeLoad(videoKey, index, videoDurationSeconds)}
                                                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                    title={`VK Video player ${index + 1}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
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
