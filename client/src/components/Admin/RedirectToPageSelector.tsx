import { useState, useEffect } from 'react';
import api from '../../api';
import { CONTENT_CATEGORY_OPTIONS } from '../../constants/contentCategoryOptions';
import { REDIRECT_TO_PAGE_OPTIONS } from '../../constants/redirectToPageOptions';

interface RedirectToPageSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

type LinkMode = 'none' | 'page' | 'content' | 'external';

function detectInitialMode(value: string): LinkMode {
    if (!value) return 'none';
    if (value.startsWith('http://') || value.startsWith('https://')) return 'external';
    const isContentLink = CONTENT_CATEGORY_OPTIONS.some(
        (opt) => value.startsWith(opt.clientPath + '/')
    );
    if (isContentLink) return 'content';
    const isPageLink = REDIRECT_TO_PAGE_OPTIONS.some(
        (opt) => opt.value && opt.value === value
    );
    if (isPageLink) return 'page';
    if (value.startsWith('/')) return 'page';
    return 'none';
}

export const RedirectToPageSelector = ({ value, onChange }: RedirectToPageSelectorProps) => {
    const [mode, setMode] = useState<LinkMode>(() => detectInitialMode(value));
    const [contentItems, setContentItems] = useState<{ _id: string; title: string }[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [localCategory, setLocalCategory] = useState('');

    // Синхронизация режима при загрузке значения из родителя (например, при открытии рассылки)
    useEffect(() => {
        setMode(detectInitialMode(value));
    }, [value]);

    const categoryOption = CONTENT_CATEGORY_OPTIONS.find(
        (opt) => value?.startsWith(opt.clientPath + '/')
    );
    const selectedCategory = categoryOption?.apiPath || localCategory;
    const selectedItemId = categoryOption
        ? value?.replace(categoryOption.clientPath + '/', '') || ''
        : '';

    useEffect(() => {
        if (mode !== 'content' || !selectedCategory) {
            setContentItems([]);
            return;
        }
        const fetchItems = async () => {
            setLoadingContent(true);
            try {
                const response = await api.get(selectedCategory);
                const data = response.data?.data;
                setContentItems(Array.isArray(data) ? data : []);
            } catch {
                setContentItems([]);
            } finally {
                setLoadingContent(false);
            }
        };
        fetchItems();
    }, [mode, selectedCategory]);

    const handleModeChange = (newMode: LinkMode) => {
        setMode(newMode);
        setLocalCategory('');
        setContentItems([]);
        if (newMode === 'none') {
            onChange('');
        } else if (newMode === 'external') {
            if (mode !== 'external') onChange('');
        } else if (newMode === 'page') {
            onChange('');
        } else if (newMode === 'content') {
            onChange('');
        }
    };

    const handlePageChange = (page: string) => {
        onChange(page);
    };

    const handleCategoryChange = (apiPath: string) => {
        setLocalCategory(apiPath);
        onChange('');
    };

    const handleItemChange = (itemId: string) => {
        const opt = CONTENT_CATEGORY_OPTIONS.find((o) => o.apiPath === selectedCategory);
        const link = opt && itemId ? `${opt.clientPath}/${itemId}` : '';
        onChange(link);
    };

    const handleExternalLinkChange = (url: string) => {
        onChange(url);
    };

    return (
        <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Ссылка перехода</label>

            <select
                value={mode}
                onChange={(e) => handleModeChange(e.target.value as LinkMode)}
                className="w-full p-2 rounded-md border border-gray-300"
            >
                <option value="none">Не перенаправлять</option>
                <option value="page">На раздел</option>
                <option value="content">На контент раздела</option>
                <option value="external">Внешняя ссылка</option>
            </select>

            {mode === 'page' && (
                <div>
                    <label className="block text-sm font-medium mb-1">Страница</label>
                    <select
                        value={value}
                        onChange={(e) => handlePageChange(e.target.value)}
                        className="w-full p-2 rounded-md border border-gray-300"
                    >
                        <option value="">Выберите страницу</option>
                        {REDIRECT_TO_PAGE_OPTIONS.filter((opt) => opt.value).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.title}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {mode === 'content' && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-1">Категория</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full p-2 rounded-md border border-gray-300"
                        >
                            <option value="">Выберите категорию</option>
                            {CONTENT_CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.apiPath} value={opt.apiPath}>
                                    {opt.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedCategory && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Контент</label>
                            <select
                                value={selectedItemId}
                                onChange={(e) => handleItemChange(e.target.value)}
                                className="w-full p-2 rounded-md border border-gray-300"
                                disabled={loadingContent}
                            >
                                <option value="">{loadingContent ? 'Загрузка...' : 'Выберите контент'}</option>
                                {contentItems.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.title || item._id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}

            {mode === 'external' && (
                <div>
                    <label className="block text-sm font-medium mb-1">URL</label>
                    <input
                        type="url"
                        value={value || ''}
                        onChange={(e) => handleExternalLinkChange(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 rounded-md border border-gray-300"
                    />
                </div>
            )}

            <p className="text-xs text-gray-500">
                {mode === 'none' && 'При нажатии на карточку откроется страница контента'}
                {mode === 'page' && 'При нажатии на карточку откроется выбранная страница со списком контента'}
                {mode === 'content' && 'При нажатии на карточку откроется конкретный контент из выбранной категории'}
                {mode === 'external' && 'При нажатии на карточку откроется внешняя ссылка в браузере'}
            </p>
        </div>
    );
};
