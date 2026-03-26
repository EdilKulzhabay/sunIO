// import { UserLayout } from "../../components/User/UserLayout"
// import { BackNav } from "../../components/User/BackNav"
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import taskInActiveSun from "../../assets/taskInActiveSun.png";
import taskActiveSun from "../../assets/taskActiveSun.png";
import level1 from "../../assets/level1.png";
import level2 from "../../assets/level2.png";
import level3 from "../../assets/level3.png";
import level4 from "../../assets/level4.png";
import level5 from "../../assets/level5.png";
import level6 from "../../assets/level6.png";
import { openExternalLink } from "../../utils/telegramWebApp";

const isExternalLink = (url: string) => url.startsWith('http://') || url.startsWith('https://');

const THIN_ACTIVATION_KEYS = [
    'ethericBodyActivation',
    'astralBodyActivation',
    'mentalBodyActivation',
    'karmicBodyActivation',
    'buddhicBodyActivation',
    'atmicBodyActivation',
] as const;

function countThinActivations(u: Record<string, unknown> | null | undefined): number {
    if (!u) return 0;
    return THIN_ACTIVATION_KEYS.filter((k) => Boolean(u[k])).length;
}

const LEVEL_IMAGES = [level1, level2, level3, level4, level5, level6];

export const ClientTasks = () => {
    const navigate = useNavigate();
    // const [content, setContent] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activationLinks, setActivationLinks] = useState<any[]>([]);
    const [levels, setLevels] = useState<Array<{ _id: string; title: string; level: number; mainContent?: string; content?: string }>>([]);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user && user.isBlocked && user.role !== 'admin') {
                        navigate('/client/blocked-user');
                        return;
                    }
                } catch (e) {
                    console.error('Ошибка парсинга user из localStorage:', e);
                }
            }

            setLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user._id) {
                    const response = await api.get(`/api/user/${user._id}`);
                    if (!cancelled) setUserData(response.data.data);
                }
                const linksRes = await api.get('/api/activation-link');
                if (!cancelled) setActivationLinks(linksRes.data.data || []);

                const levelsRes = await api.get('/api/levels');
                const list = levelsRes.data?.data ?? levelsRes.data?.list ?? [];
                if (!cancelled) setLevels(Array.isArray(list) ? list : []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [navigate]);

    // Разрешаем копирование и вставку на странице дневника
    useEffect(() => {
        // Функция для проверки, находится ли элемент на странице дневника
        const isDiaryPageElement = (element: HTMLElement | null): boolean => {
            if (!element) return false;
            // Проверяем, находится ли элемент внутри контейнера дневника
            const diaryContainer = element.closest('[data-diary-page]');
            return diaryContainer !== null;
        };

        // Переопределяем выделение текста - разрешаем на странице дневника
        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем выделение на странице дневника
                return;
            }
        };

        // Переопределяем копирование - разрешаем на странице дневника
        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем копирование на странице дневника
                return;
            }
        };

        // Переопределяем вставку - разрешаем на странице дневника
        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем вставку на странице дневника
                return;
            }
        };

        // Переопределяем вырезание - разрешаем на странице дневника
        const handleCut = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем вырезание на странице дневника
                return;
            }
        };

        // Переопределяем горячие клавиши - разрешаем на странице дневника
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Разрешаем Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A на странице дневника
                if (e.ctrlKey || e.metaKey) {
                    const key = e.key.toLowerCase();
                    if (['c', 'v', 'x', 'a'].includes(key)) {
                        // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                        e.stopImmediatePropagation();
                        // Разрешаем операцию
                        return;
                    }
                }
            }
        };

        // Добавляем обработчики с capture фазой для приоритета над UserLayout
        // Используем { capture: true, passive: false } для возможности вызова stopImmediatePropagation
        document.addEventListener('selectstart', handleSelectStart, { capture: true });
        document.addEventListener('copy', handleCopy, { capture: true });
        document.addEventListener('paste', handlePaste, { capture: true });
        document.addEventListener('cut', handleCut, { capture: true });
        document.addEventListener('keydown', handleKeyDown, { capture: true });

        // Очистка обработчиков при размонтировании
        return () => {
            document.removeEventListener('selectstart', handleSelectStart, { capture: true });
            document.removeEventListener('copy', handleCopy, { capture: true });
            document.removeEventListener('paste', handlePaste, { capture: true });
            document.removeEventListener('cut', handleCut, { capture: true });
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, []);

    // const fetchContent = async () => {
    //     const response = await api.get('/api/dynamic-content/name/tasks-desc');
    //     setContent(response.data.data);
    // };

    const thinCount = countThinActivations(userData);
    const levelRow = levels.find((l) => l.level === thinCount);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            {/* <UserLayout> */}
                {/* <BackNav title="Задания" /> */}
                <div 
                    className="px-4 -mt-2 bg-[#031F23]" 
                    data-diary-page
                    style={{
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        msUserSelect: 'text',
                        WebkitTouchCallout: 'default'
                    }}
                >
                    {/* <p dangerouslySetInnerHTML={{ __html: content?.content }}>
                    </p> */}

                    <div className="mt-4 grid grid-cols-4 justify-between items-center w-full -ml-3">
                        {[
                            { title: 'Активация тела', label: 'Активация \n тела', active: userData?.bodyActivation },
                            { title: 'Активация здоровья', label: 'Активация \n здоровья', active: userData?.heartActivation },
                            { title: 'Активация Рода', label: 'Активация \n Рода', active: userData?.healingFamily },
                            { title: 'Пробуждение Духа', label: 'Пробуждение \n Духа', active: userData?.awakeningSpirit },
                        ].map((item) => (
                            <button key={item.title} onClick={() => {
                                const found = activationLinks.find((l: any) => l.title === item.title);
                                if (found?.link) {
                                    if (isExternalLink(found.link)) {
                                        openExternalLink(found.link);
                                    } else {
                                        navigate(found.link);
                                    }
                                }
                            }} className="col-span-1 flex flex-col items-center justify-center">
                                <img src={item.active ? taskActiveSun : taskInActiveSun} alt={item.title} className="w-10 h-10" />
                                <p className="mt-1 text-center text-white whitespace-pre-line">{item.label}</p>
                            </button>
                        ))}
                    </div>

                    {levelRow && (
                    <div className="mt-4 bg-[#114E50] rounded-lg p-4">
                        <div className="text-white text-lg font-medium">
                            Твой уровень — {levelRow?.title ?? '—'}
                        </div>
                        {levelRow?.mainContent ? (
                            <div
                                className="text-white text-sm mt-2 prose prose-invert prose-sm max-w-none [&_a]:text-cyan-300"
                                dangerouslySetInnerHTML={{ __html: levelRow.mainContent }}
                            />
                        ) : null}

                        <div className="flex items-center justify-between gap-1 mt-4">
                            {LEVEL_IMAGES.map((src, idx) => {
                                const step = idx + 1;
                                const unlocked = thinCount >= step;
                                return (
                                    <div key={step} className="relative w-[44px] h-[62px] shrink-0">
                                        <img
                                            src={src}
                                            alt={'Уровень ' + step}
                                            className="w-full h-full object-contain transition-opacity duration-300"
                                            style={{ opacity: unlocked ? 1 : 0.3 }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {levelRow?.content ? (
                            <div
                                className="text-white text-sm mt-3 prose prose-invert prose-sm max-w-none [&_a]:text-cyan-300"
                                dangerouslySetInnerHTML={{ __html: levelRow.content }}
                            />
                        ) : null}
                    </div>
                    )}

                    {/* <div className="mt-6">
                        <p className="text-white">Позже здесь появятся задания, которые помогут вам пройти по оптимальному пути Активации.</p>
                    </div> */}
                </div>
            {/* </UserLayout> */}
        </div>
    )
}