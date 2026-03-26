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

type ValidationErrors = {
    request: boolean;
    stepDescription: Record<number, boolean>;
    contentStepDescription: Record<string, boolean>;
    contentLink: Record<string, boolean>;
};

const emptyValidation = (): ValidationErrors => ({
    request: false,
    stepDescription: {},
    contentStepDescription: {},
    contentLink: {},
});

const contentErrKey = (stepIndex: number, contentIndex: number) => `${stepIndex}-${contentIndex}`;

export const AssignmentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [request, setRequest] = useState('');
    const [assignmentDescription, setAssignmentDescription] = useState('');
    const [order, setOrder] = useState(0);
    const [steps, setSteps] = useState<StepBlock[]>([
        { description: '', contents: [emptyContent()] },
    ]);
    const [fieldErrors, setFieldErrors] = useState<ValidationErrors>(() => emptyValidation());

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
            setOrder(typeof row.order === 'number' && Number.isFinite(row.order) ? row.order : 0);
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
        setFieldErrors(emptyValidation());
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
        setFieldErrors(emptyValidation());
    };

    const updateStep = (index: number, patch: Partial<StepBlock>) => {
        setSteps(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
        setFieldErrors((prev) => ({
            ...prev,
            stepDescription: { ...prev.stepDescription, [index]: false },
        }));
    };

    const addContent = (stepIndex: number) => {
        setSteps(
            steps.map((s, i) =>
                i === stepIndex ? { ...s, contents: [...s.contents, emptyContent()] } : s
            )
        );
        setFieldErrors(emptyValidation());
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
        setFieldErrors(emptyValidation());
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
        const k = contentErrKey(stepIndex, contentIndex);
        setFieldErrors((prev) => ({
            ...prev,
            contentStepDescription: { ...prev.contentStepDescription, [k]: false },
            contentLink: { ...prev.contentLink, [k]: false },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const next = emptyValidation();
        let hasAny = false;
        if (!request.trim()) {
            next.request = true;
            hasAny = true;
        }
        steps.forEach((s, i) => {
            if (!s.description.trim()) {
                next.stepDescription[i] = true;
                hasAny = true;
            }
            s.contents.forEach((c, j) => {
                const k = contentErrKey(i, j);
                if (!c.stepDescription.trim()) {
                    next.contentStepDescription[k] = true;
                    hasAny = true;
                }
                if (!c.contentLink.trim()) {
                    next.contentLink[k] = true;
                    hasAny = true;
                }
            });
        });
        if (hasAny) {
            setFieldErrors(next);
            toast.error('Заполните все обязательные поля');
            return;
        }
        setFieldErrors(emptyValidation());

        setLoading(true);
        try {
            const payload = {
                request: request.trim(),
                description: assignmentDescription.trim(),
                order: Number.isFinite(Number(order)) ? Number(order) : 0,
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
                        onChange={(e) => {
                            setRequest(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, request: false }));
                        }}
                        placeholder="Например: Путь активации"
                        required
                        hasError={fieldErrors.request}
                    />

                    <MyInput
                        label="Порядок в списке (меньше — выше)"
                        type="number"
                        value={String(order)}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === '' || v === '-') {
                                setOrder(0);
                                return;
                            }
                            const n = parseInt(v, 10);
                            setOrder(Number.isNaN(n) ? 0 : n);
                        }}
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
                        <h2 className="text-lg font-semibold text-gray-900">Шаги</h2>

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
                                    hasError={!!fieldErrors.stepDescription[stepIndex]}
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
                                    {step.contents.map((c, contentIndex) => {
                                        const ck = contentErrKey(stepIndex, contentIndex);
                                        return (
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
                                                hasError={!!fieldErrors.contentStepDescription[ck]}
                                            />
                                            <div className="pt-1">
                                                <RedirectToPageSelector
                                                    value={c.contentLink}
                                                    onChange={(val) =>
                                                        updateContent(stepIndex, contentIndex, { contentLink: val })
                                                    }
                                                    hasError={!!fieldErrors.contentLink[ck]}
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
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addStep}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                            <Plus size={18} />
                            Добавить шаг
                        </button>
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
