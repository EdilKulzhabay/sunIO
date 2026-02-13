import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import api from "../../api";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { RedButton } from "../../components/User/RedButton";
import { useNavigate } from "react-router-dom";
import { Switch } from "../../components/User/Switch";

const toEmbedUrl = (url: string): string => {
    if (!url) return "";

    // Уже embed — используем как есть
    if (url.includes("/play/embed/") || url.includes("/embed/")) return url;

    // RuTube: обычная ссылка → embed
    if (url.includes("rutube.ru")) {
        const privateMatch = url.match(/rutube\.ru\/video\/private\/([^\/\?]+)\/?\??(.*)$/);
        if (privateMatch) {
            const id = privateMatch[1];
            const qs = privateMatch[2];
            return qs ? `https://rutube.ru/play/embed/${id}/?${qs}` : `https://rutube.ru/play/embed/${id}`;
        }
        const videoMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9_-]+)/);
        if (videoMatch) return `https://rutube.ru/play/embed/${videoMatch[1]}`;
    }

    // YouTube: обычная ссылка → embed
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        const embedMatch = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
        if (embedMatch) videoId = embedMatch[1];
        else {
            const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            if (watchMatch) videoId = watchMatch[1];
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Kinescope или неизвестный — как есть
    return url;
};

export const ClientBegginingJourney = () => {
    const [content, setContent] = useState<any>(null);
    const navigate = useNavigate();
    const [locatedInRussia, setLocatedInRussia] = useState(true);
    const hasFetched = useRef(false);

    const fetchUserData = useCallback(async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const response = await api.get(`/api/user/${storedUser._id}`);
            if (response.data.success) {
                setLocatedInRussia(response.data.data.locatedInRussia);
                if (response.data.data && response.data.data.isBlocked && response.data.data.role !== "admin") {
                    window.location.href = "/client/blocked-user";
                }
            }
        } catch (error) {
            console.error("Ошибка загрузки данных пользователя:", error);
        }
    }, []);

    const updateUserData = async (field: string, value: boolean) => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        await api.put(`/api/user/${storedUser._id}`, { [field]: value });
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

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchContent = async () => {
            try {
                const response = await api.get(`/api/beggining-journey`);
                if (response.data.success) {
                    setContent(response.data.data);
                }
            } catch (error) {
                console.error("Ошибка загрузки контента:", error);
            }
        };

        fetchContent();
        fetchUserData();
    }, []);

    const embedUrl = useMemo(() => {
        const mainUrl = content?.video?.mainUrl || "";
        const reserveUrl = content?.video?.reserveUrl || "";
        if (!mainUrl && !reserveUrl) return "";

        const isMainYouTube = mainUrl.includes("youtube.com") || mainUrl.includes("youtu.be");
        const url = (isMainYouTube && locatedInRussia && reserveUrl) ? reserveUrl : mainUrl;
        return toEmbedUrl(url);
    }, [content?.video?.mainUrl, content?.video?.reserveUrl, locatedInRussia]);

    return (
        <UserLayout>
            <div className="flex flex-col flex-1 min-h-screen">
                <BackNav title="Начало путешествия" />
                <div className="px-4 mt-2 pb-10 bg-[#031F23] flex-1 flex flex-col justify-between">
                    <div>
                        <p dangerouslySetInnerHTML={{ __html: content?.title }}></p>
                        <p dangerouslySetInnerHTML={{ __html: content?.firstText }}></p>
                        {embedUrl && (
                            <div className="mt-4 relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                <iframe
                                    key={embedUrl}
                                    src={embedUrl}
                                    title="Video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                                />
                            </div>
                        )}
                        <p className="mt-4" dangerouslySetInnerHTML={{ __html: content?.secondText }}></p>

                        {content?.video?.reserveUrl && (
                            <div className="mt-4 flex items-center justify-between">
                                <div>Просмотр видео в РФ без VPN</div>
                                <Switch checked={locatedInRussia} onChange={handleLocatedInRussiaChange} />
                            </div>
                        )}
                    </div>
                    <div>
                        <RedButton 
                            text={'Далее'} 
                            onClick={() => navigate('/client/ease-launch')} 
                            className='w-full mt-4'
                        />
                    </div>
                </div>
            </div>
        </UserLayout>
    );
};
