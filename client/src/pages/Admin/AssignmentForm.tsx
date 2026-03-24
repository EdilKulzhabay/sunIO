import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

type StepRow = {
    stepDescription: string;
    contentLink: string;
    userControlled: boolean;
};

export const AssignmentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [request, setRequest] = useState('');
    const [steps, setSteps] = useState<StepRow[]>([
        { stepDescription: '', contentLink: '', userControlled: false },
    ]);

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchOne();
        }
    }, [id]);

    const fetchOne = async () => {
        try {
            const response = await api.get(`/api/assignments/${id}`);
            const row = response.data.data;
            setRequest(row.request || '');
            if (Array.isArray(row.steps) && row.steps.length > 0) {
                setSteps(
                    row.steps.map((s: any) => ({
                        stepDescription: s.stepDescription || '',
                        contentLink: s.contentLink || '',
                        userControlled: !!s.userControlled,
                    }))
                );
            }
        } catch {
            toast.error('Ошибка загрузки');
            navigate('/admin/assignments');
        }
    };

    const addStep = () => {
        setSteps([...steps, { stepDescription: '', contentLink: '', userControlled: false }]);
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const updateStep = (index: number, patch: Partial<StepRow>) => {
        setSteps(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request.trim()) {
            toast.error('Укажите запрос');
            return;
        }
        if (steps.length === 0 || steps.some((s) => !s.stepDescription.trim() || !s.contentLink.trim())) {
            toast.error('Заполните описание и ссылку у каждого шага');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                request: request.trim(),
                steps: steps.map((s) => ({
                    stepDescription: s.stepDescription.trim(),
                    contentLink: s.contentLink.trim(),
                    userControlled: s.userControlled,
                })),
            };
            if (isEdit) {
                await api.put(`/api/assignments/${id}`, payload);
                toast.success('Сохранено');
            } else {
                await api.post('/api/assignments', payload);
                toast.success('Создано');
            }
            navigate('/admin/assignments');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/assignments')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать задание' : 'Новое задание'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                    <MyInput
                        label="Запрос (тема / название)"
                        type="text"
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        placeholder="Например: Путь активации"
                        required
                    />

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Шаги</h2>
                            <button
                                type="button"
                                onClick={addStep}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                                <Plus size={18} />
                                Добавить шаг
                            </button>
                        </div>

                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4 space-y-3 relative"
                            >
                                {steps.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeStep(index)}
                                        className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                                        aria-label="Удалить шаг"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="text-sm font-medium text-gray-500">Шаг {index + 1}</div>
                                <MyInput
                                    label="Описание шага"
                                    type="text"
                                    value={step.stepDescription}
                                    onChange={(e) => updateStep(index, { stepDescription: e.target.value })}
                                    placeholder="Кратко, что сделать"
                                    required
                                />
                                <MyInput
                                    label="Ссылка на контент (например /client/practice/...)"
                                    type="text"
                                    value={step.contentLink}
                                    onChange={(e) => updateStep(index, { contentLink: e.target.value })}
                                    placeholder="/client/practice/..."
                                    required
                                />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={step.userControlled}
                                        onChange={(e) =>
                                            updateStep(index, { userControlled: e.target.checked })
                                        }
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Управляется пользователем (отметка вручную)
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/assignments')}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Отмена
                        </button>
                        <MyButton text={loading ? 'Сохранение...' : 'Сохранить'} type="submit" disabled={loading} />
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};
