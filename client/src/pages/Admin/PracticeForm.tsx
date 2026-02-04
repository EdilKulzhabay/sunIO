import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ImageUpload } from '../../components/Admin/ImageUpload';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';
import { REDIRECT_TO_PAGE_OPTIONS } from '../../constants/redirectToPageOptions';

interface ContentItem {
    type: 'video' | 'text' | 'image';
    video?: {
        mainUrl: string;
        reserveUrl: string;
        duration: number;
    };
    text?: string;
    image?: string;
}

interface FormData {
    title: string;
    shortDescription: string;
    imageUrl: string;
    accessType: string;
    starsRequired: number;
    duration: number;
    order: number;
    allowRepeatBonus: boolean;
    location: 'top' | 'bottom';
    redirectToPage: string;
    content: ContentItem[];
}

export const PracticeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        shortDescription: '',
        imageUrl: '',
        accessType: 'free',
        starsRequired: 0,
        duration: 0,
        order: 0,
        allowRepeatBonus: false,
        location: 'bottom',
        redirectToPage: '',
        content: [],
    });

    useEffect(() => {
        if (id) {
            fetchItem();
        }
    }, [id]);

    const fetchItem = async () => {
        try {
            const response = await api.get(`/api/practice/${id}`);
            const data = response.data.data;
            const mappedContent: ContentItem[] = (data.content || []).map((item: any) => {
                const hasVideo = Boolean(item?.video?.mainUrl || item?.video?.reserveUrl);
                const hasText = Boolean(item?.text);
                const hasImage = Boolean(item?.image);
                const resolvedType: ContentItem['type'] = hasVideo
                    ? 'video'
                    : hasText
                        ? 'text'
                        : hasImage
                            ? 'image'
                            : 'video';

                return {
                    type: resolvedType,
                    video: {
                        mainUrl: item?.video?.mainUrl || '',
                        reserveUrl: item?.video?.reserveUrl || '',
                        duration: item?.video?.duration || 0,
                    },
                    text: item?.text || '',
                    image: item?.image || '',
                };
            });
            setFormData({
                title: data.title || '',
                shortDescription: data.shortDescription || '',
                imageUrl: data.imageUrl || '',
                content: mappedContent,
                accessType: data.accessType || 'free',
                starsRequired: data.starsRequired ?? 0,
                duration: data.duration ?? 0,
                order: data.order ?? 0,
                allowRepeatBonus: data.allowRepeatBonus ?? false,
                location: data.location || 'bottom',
                redirectToPage: data.redirectToPage || '',
            });
        } catch (error) {
            toast.error('Ошибка загрузки практики');
            navigate('/admin/practice');
        }
    };

    const handleVideoChange = (index: number, field: 'mainUrl' | 'reserveUrl' | 'duration', value: string | number) => {
        setFormData(prev => {
            const newContent = [...prev.content];
            newContent[index] = {
                ...newContent[index],
                video: {
                    ...newContent[index].video!,
                    [field]: value
                }
            };
            return { ...prev, content: newContent };
        });
    };

    const handleContentChange = (index: number, field: 'text' | 'image', value: string) => {
        setFormData(prev => {
            const newContent = [...prev.content];
            newContent[index] = {
                ...newContent[index],
                [field]: value
            };
            return { ...prev, content: newContent };
        });
    };

    const handleTypeChange = (index: number, newType: ContentItem['type']) => {
        setFormData(prev => {
            const newContent = [...prev.content];
            newContent[index] = {
                ...newContent[index],
                type: newType
            };
            return { ...prev, content: newContent };
        });
    };

    const addContentItem = (type: ContentItem['type']) => {
        setFormData(prev => ({
            ...prev,
            content: [...prev.content, { 
                type, 
                video: { mainUrl: '', reserveUrl: '', duration: 0 },
                text: '', 
                image: '' 
            }]
        }));
        setShowTypePicker(false);
    };

    const removeContentItem = (index: number) => {
        setFormData(prev => {
            const newContent = [...prev.content];
            newContent.splice(index, 1);
            return { ...prev, content: newContent };
        });
    };

    const moveContentItem = (fromIndex: number, toIndex: number) => {
        setFormData(prev => {
            if (toIndex < 0 || toIndex >= prev.content.length) {
                return prev;
            }
            const newContent = [...prev.content];
            const [movedItem] = newContent.splice(fromIndex, 1);
            newContent.splice(toIndex, 0, movedItem);
            return { ...prev, content: newContent };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                await api.put(`/api/practice/${id}`, formData);
                toast.success('Практика обновлена');
            } else {
                await api.post('/api/practice', formData);
                toast.success('Практика создана');
            }
            navigate('/admin/practice');
        } catch (error) {
            toast.error('Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/practice')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {id ? 'Редактировать практику' : 'Добавить практику'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900">Основной контент</h2>

                        <MyInput
                            label="Название"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Введите название"
                        />

                        <MyInput
                            label="Краткое описание"
                            type="text"
                            value={formData.shortDescription}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                            placeholder="Введите краткое описание"
                        />

                        <ImageUpload
                            value={formData.imageUrl}
                            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                            label="Обложка"
                        />

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Тип доступа</label>
                            <select
                                value={formData.accessType}
                                onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                                className="w-full p-2 rounded-md border border-gray-300"
                            >
                                <option value="free">Бесплатно</option>
                                <option value="paid">Платно</option>
                                <option value="subscription">Подписка</option>
                                <option value="stars">Звёзды</option>
                            </select>
                        </div>

                        {formData.accessType === 'stars' && (
                            <MyInput
                                label="Стоимость в звёздах"
                                type="number"
                                value={String(formData.starsRequired)}
                                onChange={(e) => setFormData({ ...formData, starsRequired: Number(e.target.value) || 0 })}
                                min="0"
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* <MyInput
                                label="Длительность (мин)"
                                type="number"
                                value={String(formData.duration)}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) || 0 })}
                                min="0"
                            /> */}
                            <MyInput
                                label="Порядок"
                                type="number"
                                value={String(formData.order)}
                                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })}
                                min="0"
                            />
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Расположение</label>
                                <select
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value as FormData['location'] })}
                                    className="w-full p-2 rounded-md border border-gray-300"
                                >
                                    <option value="top">Сверху</option>
                                    <option value="bottom">Снизу</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Ссылка перехода</label>
                            <select value={formData.redirectToPage} onChange={(e) => setFormData({ ...formData, redirectToPage: e.target.value })} className="w-full p-2 rounded-md border border-gray-300">
                                {REDIRECT_TO_PAGE_OPTIONS.map((opt) => (
                                    <option key={opt.value || 'empty'} value={opt.value}>{opt.title}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">Если выбрана страница — при нажатии на карточку откроется она вместо страницы контента</p>
                        </div>

                        <div className="-mt-2">
                            <div className="flex items-center gap-3 pt-6">
                                <input
                                    type="checkbox"
                                    checked={formData.allowRepeatBonus}
                                    onChange={(e) => setFormData({ ...formData, allowRepeatBonus: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <span className="text-sm">Добавление бонусов за повторные просмотры</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Элементы контента</h2>
                        </div>

                        <div className="space-y-4">
                            {formData.content.map((item, index) => (
                                <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            Элемент {index + 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => moveContentItem(index, index - 1)}
                                                disabled={index === 0}
                                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Вверх
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveContentItem(index, index + 1)}
                                                disabled={index === formData.content.length - 1}
                                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Вниз
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeContentItem(index)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Тип контента</label>
                                            <select
                                                value={item.type}
                                                onChange={(e) => handleTypeChange(index, e.target.value as ContentItem['type'])}
                                                className="w-full p-2 rounded-md border border-gray-300"
                                            >
                                                <option value="video">Видео</option>
                                                <option value="text">Текст</option>
                                                <option value="image">Изображение</option>
                                            </select>
                                        </div>

                                        {item.type === 'video' && (
                                            <>
                                                <MyInput
                                                    label="Основная ссылка на видео"
                                                    type="text"
                                                    value={item.video?.mainUrl || ''}
                                                    onChange={(e) => handleVideoChange(index, 'mainUrl', e.target.value)}
                                                    placeholder="https://..."
                                                />
                                                <MyInput
                                                    label="Резервная ссылка на видео"
                                                    type="text"
                                                    value={item.video?.reserveUrl || ''}
                                                    onChange={(e) => handleVideoChange(index, 'reserveUrl', e.target.value)}
                                                    placeholder="https://..."
                                                />
                                                <MyInput
                                                    label="Длительность видео (мин)"
                                                    type="number"
                                                    value={String(item.video?.duration || 0)}
                                                    onChange={(e) => handleVideoChange(index, 'duration', Number(e.target.value) || 0)}
                                                    min="0"
                                                />
                                            </>
                                        )}

                                        {item.type === 'image' && (
                                            <ImageUpload
                                                value={item.image || ''}
                                                onChange={(url) => handleContentChange(index, 'image', url)}
                                                label="Изображение"
                                            />
                                        )}

                                        {item.type === 'text' && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Текст</label>
                                                <RichTextEditor
                                                    value={item.text || ''}
                                                    onChange={(value) => handleContentChange(index, 'text', value)}
                                                    placeholder="Введите текст"
                                                    height="200px"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {formData.content.length === 0 && (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                    Нет элементов контента. Нажмите "Добавить элемент", чтобы начать.
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            {showTypePicker && (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => addContentItem('video')}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Ссылка на видео
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addContentItem('text')}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Текст
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addContentItem('image')}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Изображение
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => addContentItem('video')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={16} />
                                Добавить элемент
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end bg-white rounded-lg shadow-sm p-6">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/practice')}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Отмена
                        </button>
                        <MyButton
                            text={loading ? 'Сохранение...' : 'Сохранить'}
                            type="submit"
                            disabled={loading}
                        />
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};
