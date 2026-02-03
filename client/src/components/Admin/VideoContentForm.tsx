import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { RichTextEditor } from './RichTextEditor';
import { MyInput } from './MyInput';
import { MyButton } from './MyButton';
import { ImageUpload } from './ImageUpload';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

interface VideoContentFormProps {
    contentType: 'practice' | 'meditation' | 'video-lesson';
    title: string;
    listRoute: string;
}

interface FormData {
    title: string;
    shortDescription: string;
    fullDescription: string;
    imageUrl: string;
    videoUrl: string;
    ruTubeUrl: string;
    duration: string;
    order: number;
    accessType: string;
    starsRequired: number;
    allowRepeatBonus: boolean;
    location: string;
}

export const VideoContentForm = ({ contentType, title, listRoute }: VideoContentFormProps) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const toAccusativeSingle = (word: string) => {
        if (word.endsWith('ия')) return `${word.slice(0, -2)}ию`;
        if (word.endsWith('я')) return `${word.slice(0, -1)}ю`;
        if (word.endsWith('а')) return `${word.slice(0, -1)}у`;
        return word;
    };

    const toAccusativePhrase = (phrase: string) => {
        const normalized = phrase.trim().toLowerCase() === "видео урок" ? "видео" : phrase.trim().toLowerCase();
        if (!normalized) return normalized;
        const parts = normalized.split(/\s+/);
        parts[0] = toAccusativeSingle(parts[0]);
        return parts.join(' ');
    };

    const actionTitle = toAccusativePhrase(title);
    
    const [formData, setFormData] = useState<FormData>({
        title: '',
        shortDescription: '',
        fullDescription: '',
        imageUrl: '',
        videoUrl: '',
        ruTubeUrl: '',
        duration: '',
        order: 0,
        accessType: 'free',
        starsRequired: 0,
        allowRepeatBonus: false,
        location: 'bottom',
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchContent();
        } else {
            fetchContentForOrder();
        }
    }, [id]);

    const fetchContentForOrder = async () => {
        try {
            const response = await api.get(`/api/${contentType}`);
            if (response.data && response.data.data) {
                const contentCount = response.data.data.length || 0;
                setFormData(prev => ({
                    ...prev,
                    order: contentCount
                }));
            }
        } catch (error) {
            console.error(`Ошибка загрузки ${contentType} для определения порядка:`, error);
        }
    };

    const fetchContent = async () => {
        try {
            const response = await api.get(`/api/${contentType}/${id}`);
            const content = response.data.data;
            setFormData({
                ...content,
                duration: content.duration?.toString() || '',
                order: content.order || 0,
                starsRequired: content.starsRequired || 0,
                allowRepeatBonus: content.allowRepeatBonus || false,
                location: content.location || 'bottom',
            });
        } catch (error) {
            toast.error(`Ошибка загрузки ${title.toLowerCase()}`);
            navigate(listRoute);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend = {
                ...formData,
                duration: formData.duration ? parseInt(formData.duration) : undefined,
                order: formData.order ? parseInt(formData.order.toString()) : 0,
            };
            
            if (isEdit) {
                await api.put(`/api/${contentType}/${id}`, dataToSend);
                toast.success(`${title} обновлен${contentType === 'practice' ? 'а' : contentType === 'meditation' ? 'а' : ''}`);
            } else {
                await api.post(`/api/${contentType}`, dataToSend);
                toast.success(`${title} создан${contentType === 'practice' ? 'а' : contentType === 'meditation' ? 'а' : ''}`);
            }
            navigate(listRoute);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(listRoute)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к списку
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? `Редактировать ${actionTitle}` : `Добавить ${actionTitle}`}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <MyInput
                                label="Название"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Введите название"
                                required
                            />

                            <MyInput
                                label="Длительность (мин)"
                                type="text"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="45"
                            />

                            <MyInput
                                label="Порядок"
                                type="text"
                                value={formData.order.toString()}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />

                            <div>
                                <label className="block text-sm font-medium mb-2">Тип доступа</label>
                                <select
                                    value={formData.accessType}
                                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="free">Бесплатно</option>
                                    <option value="paid">Платно</option>
                                    <option value="subscription">Подписка</option>
                                    <option value="stars">Звёзды</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Расположение</label>
                            <select
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="p-2 border rounded-md"
                            >
                                <option value="top">Сверху</option>
                                <option value="bottom">Снизу</option>
                            </select>
                        </div>

                        {formData.accessType === 'stars' && (
                            <MyInput
                                label="Количество звёзд для доступа"
                                type="text"
                                value={formData.starsRequired.toString()}
                                onChange={(e) => setFormData({ ...formData, starsRequired: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="allowRepeatBonus"
                                checked={formData.allowRepeatBonus}
                                onChange={(e) => setFormData({ ...formData, allowRepeatBonus: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="allowRepeatBonus" className="text-sm font-medium text-gray-700">
                                Повторное добавление звёзд за просмотры
                            </label>
                        </div>

                        <ImageUpload
                            label={`Обложка ${title.toLowerCase()}`}
                            value={formData.imageUrl}
                            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                        />

                        <MyInput
                            label="URL видео"
                            type="text"
                            value={formData.videoUrl}
                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                            placeholder="https://example.com/video.mp4"
                        />

                        <MyInput
                            label="RuTube URL"
                            type="text"
                            value={formData.ruTubeUrl}
                            onChange={(e) => setFormData({ ...formData, ruTubeUrl: e.target.value })}
                            placeholder="https://rutube.ru/video/..."
                        />

                        <div>
                            <label className="block text-sm font-medium mb-2">Краткое описание</label>
                            <textarea
                                value={formData.shortDescription}
                                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                rows={3}
                                maxLength={500}
                                placeholder="До 500 символов"
                            />
                            <span className="text-xs text-gray-500">{formData.shortDescription.length}/500</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Полное описание</label>
                            <RichTextEditor
                                value={formData.fullDescription}
                                onChange={(value) => setFormData({ ...formData, fullDescription: value })}
                                placeholder="Введите полное описание"
                                height="400px"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate(listRoute)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
            </div>
        </AdminLayout>
    );
};
