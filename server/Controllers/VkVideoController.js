import axios from 'axios';

const VK_API_VERSION = '5.199';

const normalizeVideosParam = (raw) => {
    const value = String(raw || '').trim();
    return /^-?\d+_\d+$/.test(value) ? value : '';
};

const normalizeVkPlayerUrl = (playerUrl) => {
    const value = String(playerUrl || '').trim();
    if (!value) return '';

    try {
        const url = new URL(value);
        if (url.hostname === 'vk.com' || url.hostname === 'www.vk.com' || url.hostname === 'm.vk.com') {
            url.hostname = 'vkvideo.ru';
        }
        if (!url.searchParams.has('hd')) {
            url.searchParams.set('hd', '2');
        }
        return url.toString();
    } catch {
        return value;
    }
};

export const getEmbedUrl = async (req, res) => {
    try {
        const videos = normalizeVideosParam(req.query.videos);
        if (!videos) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный параметр videos. Ожидается формат ownerId_videoId',
            });
        }

        const accessToken = process.env.VK_ACCESS_TOKEN;
        if (!accessToken) {
            return res.status(500).json({
                success: false,
                message: 'На сервере не настроен VK_ACCESS_TOKEN',
            });
        }

        const { data } = await axios.get('https://api.vk.com/method/video.get', {
            params: {
                videos,
                access_token: accessToken,
                v: VK_API_VERSION,
            },
            timeout: 10000,
        });

        if (data?.error) {
            console.error('VK video.get error:', data.error);
            return res.status(502).json({
                success: false,
                message: data.error.error_msg || 'VK API не вернул ссылку на плеер',
            });
        }

        const playerUrl = data?.response?.items?.[0]?.player;
        const embedUrl = normalizeVkPlayerUrl(playerUrl);

        if (!embedUrl) {
            return res.status(404).json({
                success: false,
                message: 'VK API не вернул ссылку на встроенный плеер',
            });
        }

        res.json({
            success: true,
            embedUrl,
        });
    } catch (error) {
        console.error('Ошибка получения VK embed URL:', error.message);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения ссылки на встроенный плеер VK',
        });
    }
};
