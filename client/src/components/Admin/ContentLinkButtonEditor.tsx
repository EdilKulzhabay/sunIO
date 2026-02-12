import { useState, useEffect } from 'react';
import { MyInput } from './MyInput';
import api from '../../api';
import { CONTENT_CATEGORY_OPTIONS } from '../../constants/contentCategoryOptions';

export interface LinkButtonValue {
    linkButtonText?: string | null;
    linkButtonLink?: string | null;
    linkButtonType?: 'internal' | 'external';
}

interface ContentLinkButtonEditorProps {
    value: LinkButtonValue | null | undefined;
    onChange: (value: LinkButtonValue | null) => void;
    onClear?: () => void;
}

export const ContentLinkButtonEditor = ({ value, onChange, onClear }: ContentLinkButtonEditorProps) => {
    const [contentItems, setContentItems] = useState<{ _id: string; title: string }[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [localCategory, setLocalCategory] = useState('');

    const type = value?.linkButtonType || 'internal';
    const categoryOption = CONTENT_CATEGORY_OPTIONS.find(
        (opt) => value?.linkButtonLink?.startsWith(opt.clientPath + '/')
    );
    const selectedCategory = categoryOption?.apiPath || localCategory;
    const selectedItemId = categoryOption
        ? value?.linkButtonLink?.replace(categoryOption.clientPath + '/', '') || ''
        : '';

    useEffect(() => {
        if (type !== 'internal' || !selectedCategory) {
            setContentItems([]);
            setLocalCategory('');
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
    }, [type, selectedCategory]);

    const handleTypeChange = (newType: 'internal' | 'external') => {
        setLocalCategory('');
        onChange({
            ...value,
            linkButtonType: newType,
            linkButtonLink: newType === 'external' ? value?.linkButtonLink : '',
        });
    };

    const handleTextChange = (text: string) => {
        onChange({ ...value, linkButtonText: text || null });
    };

    const handleExternalLinkChange = (url: string) => {
        onChange({ ...value, linkButtonLink: url || null });
    };

    const handleCategoryChange = (apiPath: string) => {
        setLocalCategory(apiPath);
        onChange({ ...value, linkButtonLink: '' });
    };

    const handleItemChange = (itemId: string) => {
        const opt = CONTENT_CATEGORY_OPTIONS.find((o) => o.apiPath === selectedCategory);
        const link = opt && itemId ? `${opt.clientPath}/${itemId}` : '';
        setLocalCategory('');
        onChange({ ...value, linkButtonLink: link || null });
    };

    return (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Кнопка-ссылка</span>
                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-sm text-red-600 hover:text-red-700"
                    >
                        Убрать кнопку
                    </button>
                )}
            </div>

            <MyInput
                label="Текст кнопки"
                type="text"
                value={value?.linkButtonText || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Текст кнопки"
            />

            <div>
                <label className="block text-sm font-medium mb-2">Тип ссылки</label>
                <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as 'internal' | 'external')}
                    className="w-full p-2 rounded-md border border-gray-300"
                >
                    <option value="internal">Внутренняя</option>
                    <option value="external">Внешняя</option>
                </select>
            </div>

            {type === 'external' && (
                <MyInput
                    label="URL ссылки"
                    type="url"
                    value={value?.linkButtonLink || ''}
                    onChange={(e) => handleExternalLinkChange(e.target.value)}
                    placeholder="https://..."
                />
            )}

            {type === 'internal' && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">Категория контента</label>
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
                            <label className="block text-sm font-medium mb-2">Контент</label>
                            <select
                                value={selectedItemId}
                                onChange={(e) => handleItemChange(e.target.value)}
                                className="w-full p-2 rounded-md border border-gray-300"
                                disabled={loadingContent}
                            >
                                <option value="">Выберите контент</option>
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
        </div>
    );
};
