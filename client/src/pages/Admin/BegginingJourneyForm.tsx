import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const BegginingJourneyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        firstText: '',
        secondText: '',
        video: {
            mainUrl: '',
            reserveUrl: '',
            duration: 0,
            points: 0,
        },
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchBegginingJourney();
        }
    }, [id]);

    const fetchBegginingJourney = async () => {
        try {
            if (id) {
                // Получаем все записи и находим нужную по id
                const response = await api.get('/api/beggining-journey/all');
                const data = response.data.data.find((item: any) => item._id === id);
                if (data) {
                    setFormData({
                        title: data.title || '',
                        firstText: data.firstText || '',
                        secondText: data.secondText || '',
                        video: {
                            mainUrl: data.video?.mainUrl || '',
                            reserveUrl: data.video?.reserveUrl || '',
                            duration: data.video?.duration ?? 0,
                            points: data.video?.points ?? 0,
                        },
                    });
                } else {
                    toast.error('Запись не найдена');
                    navigate('/admin/beggining-journey');
                }
            }
        } catch (error: any) {
            toast.error('Ошибка загрузки данных');
            navigate('/admin/beggining-journey');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit && id) {
                await api.put(`/api/beggining-journey/${id}`, {
                    id,
                    updateData: formData,
                });
                toast.success('Запись обновлена');
            } else {
                await api.post('/api/beggining-journey', formData);
                toast.success('Запись создана');
            }
            navigate('/admin/beggining-journey');
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
                        onClick={() => navigate('/admin/beggining-journey')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к началу путешествия
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать запись' : 'Создать запись'} - Начало путешествия
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <MyInput
                            label="Заголовок"
                            type="text"
                            value={formData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Введите заголовок"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium mb-2">Первый текст</label>
                            <RichTextEditor
                                value={formData.firstText}
                                onChange={(value) => setFormData({ ...formData, firstText: value })}
                                placeholder="Введите первый текст"
                                height="200px"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Второй текст</label>
                            <RichTextEditor
                                value={formData.secondText}
                                onChange={(value) => setFormData({ ...formData, secondText: value })}
                                placeholder="Введите второй текст"
                                height="200px"
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Видео</h3>
                            
                            <MyInput
                                label="Основная ссылка на видео"
                                type="text"
                                value={formData.video.mainUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setFormData({ 
                                        ...formData, 
                                        video: { ...formData.video, mainUrl: e.target.value } 
                                    })
                                }
                                placeholder="https://..."
                            />

                            <MyInput
                                label="Резервная ссылка на видео"
                                type="text"
                                value={formData.video.reserveUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setFormData({ 
                                        ...formData, 
                                        video: { ...formData.video, reserveUrl: e.target.value } 
                                    })
                                }
                                placeholder="https://..."
                            />

                            <MyInput
                                label="Длительность видео (мин)"
                                type="number"
                                value={String(formData.video.duration ?? 0)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setFormData({ 
                                        ...formData, 
                                        video: { ...formData.video, duration: Number(e.target.value) || 0 } 
                                    })
                                }
                                placeholder="0"
                            />

                            <MyInput
                                label="Баллы за просмотр"
                                type="number"
                                value={String(formData.video.points ?? 0)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setFormData({ 
                                        ...formData, 
                                        video: { ...formData.video, points: Number(e.target.value) || 0 } 
                                    })
                                }
                                placeholder="0"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/beggining-journey')}
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
