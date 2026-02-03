import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const ScheduleForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        eventTitle: '',
        startDate: '',
        endDate: '',
        eventLink: '',
        googleCalendarLink: '',
        appleCalendarLink: '',
        description: '',
        priority: false,
    });

    // Функция для конвертации UTC времени в локальное время Asia/Almaty (UTC+6) для отображения
    const dateToLocalDateTime = (date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        // Конвертируем UTC в Asia/Almaty (UTC+6)
        const localDate = new Date(d.getTime() + (6 * 60 * 60 * 1000)); // Добавляем 6 часов
        const year = localDate.getUTCFullYear();
        const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(localDate.getUTCDate()).padStart(2, '0');
        const hours = String(localDate.getUTCHours()).padStart(2, '0');
        const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchSchedule();
        } else {
            const now = dateToLocalDateTime(new Date());
            setFormData(prev => ({
                ...prev,
                startDate: now,
                endDate: now,
            }));
        }
    }, [id]);

    const fetchSchedule = async () => {
        try {
            const response = await api.get(`/api/schedule/${id}`);
            const schedule = response.data.data;
            setFormData({
                eventTitle: schedule.eventTitle,
                startDate: dateToLocalDateTime(schedule.startDate),
                endDate: dateToLocalDateTime(schedule.endDate),
                eventLink: schedule.eventLink || '',
                googleCalendarLink: schedule.googleCalendarLink || '',
                appleCalendarLink: schedule.appleCalendarLink || '',
                description: schedule.description,
                priority: schedule.priority || false,
            });
        } catch (error: any) {
            toast.error('Ошибка загрузки события');
            navigate('/admin/schedule');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Отправляем datetime-local как есть - сервер интерпретирует его как время в Asia/Almaty
            const submitData = {
                ...formData,
            };

            if (isEdit && id) {
                await api.put(`/api/schedule/${id}`, submitData);
                toast.success('Событие обновлено');
            } else {
                await api.post('/api/schedule', submitData);
                toast.success('Событие создано');
            }
            navigate('/admin/schedule');
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
                        onClick={() => navigate('/admin/schedule')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к расписанию
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать событие' : 'Добавить событие'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <MyInput
                            label="Название события"
                            type="text"
                            value={formData.eventTitle}
                            onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                            placeholder="Введите название"
                        />

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="priority"
                                checked={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                                Приоритетное событие
                            </label>
                        </div>

                        <div className='-mt-5'>
                            <span className='text-xs text-gray-500'>Неприоритетные события отображаются по умолчанию за 7 дней</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <MyInput
                                label="Дата и время начала (по Мск)"
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />

                            <MyInput
                                label="Дата и время окончания (по Мск)"
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>

                        <MyInput
                            label="Ссылка на событие (необязательно)"
                            type="text"
                            value={formData.eventLink}
                            onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
                            placeholder="https://zoom.us/j/..."
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <MyInput
                                label="Ссылка Google Calendar (необязательно)"
                                type="text"
                                value={formData.googleCalendarLink}
                                onChange={(e) => setFormData({ ...formData, googleCalendarLink: e.target.value })}
                                placeholder="https://calendar.google.com/..."
                            />

                            <MyInput
                                label="Ссылка Apple Calendar (необязательно)"
                                type="text"
                                value={formData.appleCalendarLink}
                                onChange={(e) => setFormData({ ...formData, appleCalendarLink: e.target.value })}
                                placeholder="webcal://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Описание</label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                placeholder="Введите описание события"
                                height="400px"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/schedule')}
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
