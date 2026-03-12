import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserLayout } from "../../components/User/UserLayout";
import api from "../../api";
import { BackNav } from "../../components/User/BackNav";
import whiteArrowRight from "../../assets/whiteArrowRight.png";
import searchIcon from "../../assets/search.png";

export const ClientContentSearch = () => {
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState<string>('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== 'admin') {
                    window.location.href = '/client/blocked-user';
                    return;
                }
            } catch (e) {
                console.error('Ошибка парсинга user из localStorage:', e);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const updateScreenHeight = () => {
            setScreenHeight(window.innerHeight);
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const safeTop = computedStyle.getPropertyValue('--tg-safe-top') || '0px';
            const safeBottom = computedStyle.getPropertyValue('--tg-safe-bottom') || '0px';
            const topValue = parseInt(safeTop.replace('px', '')) || 0;
            const bottomValue = parseInt(safeBottom.replace('px', '')) || 0;
            const addPadding = topValue > 0 ? 40 : 0;
            setSafeAreaTop(topValue + addPadding);
            setSafeAreaBottom(bottomValue);
        };
        updateScreenHeight();
        window.addEventListener('resize', updateScreenHeight);
        return () => window.removeEventListener('resize', updateScreenHeight);
    }, []);

    const handleSearch = async () => {
        const query = search.trim();
        if (!query) {
            setResults([]);
            setSearched(false);
            return;
        }
        setSearchLoading(true);
        setSearched(true);
        try {
            const response = await api.get('/api/content-search', { params: { q: query } });
            setResults(response.data?.data ?? []);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            setResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
        );
    }

    return (
        <UserLayout>
            <div className="flex flex-col bg-[#031F23]">
                <BackNav title="Поиск контента" />
                <div
                    className="flex flex-col mt-2 px-4 pb-10 flex-1 bg-[#031F23]"
                    style={{ minHeight: `${screenHeight - (64 + safeAreaTop + safeAreaBottom)}px` }}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-x-2 border border-white/40 rounded-full py-2.5 px-4">
                            <div className="shrink-0">
                                <img src={searchIcon} alt="search" className="w-5 h-5 object-cover" />
                            </div>
                            <input
                                type="text"
                                placeholder="Поиск по названию"
                                className="w-full text-white placeholder-white/50 outline-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        
                        {searched && results.length > 0 && (
                            <p className="text-white/60 text-sm mt-2">Результаты поиска</p>
                        )}

                        <div className="mt-4 space-y-3">
                            {searched && results.length === 0 && (
                                <p className="text-white/60 text-center">Ничего не найдено</p>
                            )}
                            
                            {results.map((item) => (
                                <Link
                                    key={item.link}
                                    to={item.link}
                                    className="w-full block border-t border-white/10 py-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-white">{item.title}</p>
                                        <div>
                                            <img src={whiteArrowRight} alt="" className="w-4 h-4 object-cover shrink-0" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-white text-sm">{item.shortDescription}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-white/60 text-sm">{item.categoryLabel}</p>
                                    </div>
                                    
                                </Link>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={searchLoading}
                        className="mt-4 w-full bg-[#C4841D] rounded-xl py-2.5 text-center font-medium text-white disabled:opacity-50"
                    >
                        {searchLoading ? 'Поиск...' : 'Найти'}
                    </button>
                </div>
            </div>
        </UserLayout>
    );
};