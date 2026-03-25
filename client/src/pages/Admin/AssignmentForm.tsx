import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RedirectToPageSelector } from '../../components/Admin/RedirectToPageSelector';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

type ContentRow = {
    stepDescription: string;
    contentLink: string;
    userControlled: boolean;
};

type StepBlock = {
    description: string;
    contents: ContentRow[];
};

const emptyContent = (): ContentRow => ({
    stepDescription: '',
    contentLink: '',
    userControlled: false,
});

export const AssignmentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [request, setRequest] = useState('');
    const [assignmentDescription, setAssignmentDescription] = useState('');
    const [steps, setSteps] = useState<StepBlock[]>([
        { description: '', contents: [emptyContent()] },
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
            setAssignmentDescription(row.description || '');
            if (Array.isArray(row.steps) && row.steps.length > 0) {
                setSteps(
                    row.steps.map((s: any) => {
                        if (s.contents && Array.isArray(s.contents) && s.contents.length > 0) {
                            return {
                                description: s.description || '',
                                contents: s.contents.map((c: any) => ({
                                    stepDescription: c.stepDescription || '',
                                    contentLink: c.contentLink || '',
                                    userControlled: !!c.userControlled,
                                })),
                            };
                        }
                        return {
                            description: s.description || s.stepDescription || '',
                            contents: [
                                {
                                    stepDescription: s.stepDescription || '',
                                    contentLink: s.contentLink || '',
                                    userControlled: !!s.userControlled,
                                },
                            ],
                        };
                    })
                );
            }
        } catch {
            toast.error('Ошибка загрузки');
            navigate('/admin/assignments');
        }
    };

    const addStep = () => {
        setSteps([...steps, { description: '', contents: [emptyContent()] }]);
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const updateStep = (index: number, patch: Partial<StepBlock>) => {
        setSteps(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const addContent = (stepIndex: number) => {
        setSteps(
            steps.map((s, i) =>
                i === stepIndex ? { ...s, contents: [...s.contents, emptyContent()] } : s
            )
        );
    };

    const removeContent = (stepIndex: number, contentIndex: number) => {
        setSteps(
            steps.map((s, i) => {
                if (i !== stepIndex) return s;
                if (s.contents.length <= 1) return s;
                return {
                    ...s,
                    contents: s.contents.filter((_, j) => j !== contentIndex),
                };
            })
        );
    };

    const updateContent = (stepIndex: number, contentIndex: number, patch: Partial<ContentRow>) => {
        setSteps(
            steps.map((s, i) => {
                if (i !== stepIndex) return s;
                return {
                    ...s,
                    contents: s.contents.map((c, j) => (j === contentIndex ? { ...c, ...patch } : c)),
                };
            })
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request.trim()) {
            toast.error('Укажите запрос');
            return;
        }
        for (const s of steps) {
            if (!s.description.trim()) {
                toast.error('У каждого шага нужно описание (для карты маршрута)');
                return;
            }
            if (s.contents.some((c) => !c.stepDescription.trim() || !c.contentLink.trim())) {
                toast.error('Заполните подпись и ссылку у каждого пункта');
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                request: request.trim(),
                description: assignmentDescription.trim(),
                steps: steps.map((s) => ({
                    description: s.description.trim(),
                    contents: s.contents.map((c) => ({
                        stepDescription: c.stepDescription.trim(),
                        contentLink: c.contentLink.trim(),
                        userControlled: c.userControlled,
                    })),
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание задания
                        </label>
                        <textarea
                            value={assignmentDescription}
                            onChange={(e) => setAssignmentDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Общий текст о задании (необязательно)"
                        />
                    </div>

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

                        {steps.map((step, stepIndex) => (
                            <div
                                key={stepIndex}
                                className="border border-gray-200 rounded-lg p-4 space-y-3 relative"
                            >
                                {steps.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeStep(stepIndex)}
                                        className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                                        aria-label="Удалить шаг"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="text-sm font-medium text-gray-500">Шаг {stepIndex + 1}</div>
                                <MyInput
                                    label="Описание шага (карта маршрута)"
                                    type="text"
                                    value={step.description}
                                    onChange={(e) => updateStep(stepIndex, { description: e.target.value })}
                                    placeholder="Кратко, отображается на схеме"
                                    required
                                />

                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Пункты (ссылки)</span>
                                        <button
                                            type="button"
                                            onClick={() => addContent(stepIndex)}
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Пункт
                                        </button>
                                    </div>
                                    {step.contents.map((c, contentIndex) => (
                                        <div
                                            key={contentIndex}
                                            className="rounded-md border border-gray-100 p-3 space-y-2 relative"
                                        >
                                            {step.contents.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeContent(stepIndex, contentIndex)}
                                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                                    aria-label="Удалить пункт"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <MyInput
                                                label="Подпись пункта"
                                                type="text"
                                                value={c.stepDescription}
                                                onChange={(e) =>
                                                    updateContent(stepIndex, contentIndex, {
                                                        stepDescription: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                            <div className="pt-1">
                                                <RedirectToPageSelector
                                                    value={c.contentLink}
                                                    onChange={(val) =>
                                                        updateContent(stepIndex, contentIndex, { contentLink: val })
                                                    }
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={c.userControlled}
                                                    onChange={(e) =>
                                                        updateContent(stepIndex, contentIndex, {
                                                            userControlled: e.target.checked,
                                                        })
                                                    }
                                                    className="rounded border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    Управляется пользователем (галочка вручную)
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
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
