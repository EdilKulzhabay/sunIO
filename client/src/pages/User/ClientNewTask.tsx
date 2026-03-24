import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { openExternalLink } from "../../utils/telegramWebApp";
import { toast } from "react-toastify";

const isExternalLink = (url: string) => url.startsWith("http://") || url.startsWith("https://");

type StepRow = {
    stepDescription: string;
    contentLink: string;
    userControlled: boolean;
    completed: boolean;
};

export const ClientNewTask = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [assignments, setAssignments] = useState<Array<{ _id: string; request: string }>>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [taskTitle, setTaskTitle] = useState("");
    const [steps, setSteps] = useState<StepRow[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== "admin") {
                    navigate("/client/blocked-user");
                    return;
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, [navigate]);

    useEffect(() => {
        const loadList = async () => {
            setListLoading(true);
            try {
                const res = await api.get("/api/assignments");
                const data = res.data?.data ?? res.data?.list ?? [];
                const rows = Array.isArray(data) ? data : [];
                setAssignments(rows.map((a: any) => ({ _id: a._id, request: a.request })));
                if (rows.length && !selectedId) {
                    setSelectedId(rows[0]._id);
                }
            } catch {
                toast.error("Не удалось загрузить список заданий");
            } finally {
                setListLoading(false);
                setLoading(false);
            }
        };
        loadList();
    }, []);

    const loadProgress = useCallback(async (assignmentId: string) => {
        if (!assignmentId) return;
        const userStr = localStorage.getItem("user");
        let userId = "";
        if (userStr) {
            try {
                userId = JSON.parse(userStr)._id || "";
            } catch {
                /* ignore */
            }
        }
        if (!userId) {
            toast.error("Не найден профиль пользователя. Откройте приложение заново.");
            setSteps([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/api/assignments/${assignmentId}/user-progress/${userId}`);
            const d = res.data?.data;
            if (d) {
                setTaskTitle(d.request || "");
                setSteps(
                    (d.steps || []).map((s: any) => ({
                        stepDescription: s.stepDescription || "",
                        contentLink: s.contentLink || "",
                        userControlled: !!s.userControlled,
                        completed: !!s.completed,
                    }))
                );
            }
        } catch {
            toast.error("Не удалось загрузить задание");
            setSteps([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedId) {
            loadProgress(selectedId);
        }
    }, [selectedId, loadProgress]);

    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "visible" && selectedId) {
                loadProgress(selectedId);
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, [selectedId, loadProgress]);

    const openStepLink = (link: string) => {
        const trimmed = link.trim();
        if (!trimmed) return;
        if (isExternalLink(trimmed)) {
            openExternalLink(trimmed);
        } else {
            navigate(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
        }
    };

    const toggleUserStep = async (stepIndex: number, completed: boolean) => {
        if (!selectedId) return;
        const userStr = localStorage.getItem("user");
        let userId = "";
        if (userStr) {
            try {
                userId = JSON.parse(userStr)._id || "";
            } catch {
                /* ignore */
            }
        }
        if (!userId) {
            toast.error("Не найден профиль пользователя");
            return;
        }
        try {
            const res = await api.patch(
                `/api/assignments/${selectedId}/user-progress/${userId}/steps/${stepIndex}/toggle`,
                { completed }
            );
            const d = res.data?.data;
            if (d?.steps) {
                setSteps(
                    d.steps.map((s: any) => ({
                        stepDescription: s.stepDescription || "",
                        contentLink: s.contentLink || "",
                        userControlled: !!s.userControlled,
                        completed: !!s.completed,
                    }))
                );
            }
        } catch {
            toast.error("Не удалось сохранить");
        }
    };

    if (listLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="Задания" />
                <div
                    className="px-4 -mt-2 pb-10 bg-[#031F23]"
                    data-diary-page
                    style={{
                        userSelect: "text",
                        WebkitUserSelect: "text",
                        MozUserSelect: "text",
                        msUserSelect: "text",
                        WebkitTouchCallout: "default",
                    }}
                >
                    {assignments.length === 0 ? (
                        <p className="text-white/80 text-sm mt-4">Пока нет доступных заданий.</p>
                    ) : (
                        <>
                            <div className="mt-2">
                                <label className="block text-xs text-white/70 mb-1">Выберите запрос</label>
                                <select
                                    value={selectedId}
                                    onChange={(e) => setSelectedId(e.target.value)}
                                    className="w-full bg-[#114E50] text-white border border-white/20 rounded-lg px-3 py-2 text-sm"
                                >
                                    {assignments.map((a) => (
                                        <option key={a._id} value={a._id}>
                                            {a.request}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-white font-semibold text-lg mt-6">{taskTitle}</h2>
                                    <ul className="mt-4 space-y-3">
                                        {steps.map((step, index) => (
                                            <li
                                                key={index}
                                                className="bg-[#114E50] rounded-lg p-4 border border-white/10"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-white text-sm font-medium">
                                                            Шаг {index + 1}. {step.stepDescription}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => openStepLink(step.contentLink)}
                                                            className="text-cyan-300 text-xs mt-2 underline text-left break-all"
                                                        >
                                                            {step.contentLink}
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded-full ${
                                                                step.completed
                                                                    ? "bg-emerald-600/40 text-emerald-200"
                                                                    : "bg-white/10 text-white/60"
                                                            }`}
                                                        >
                                                            {step.completed ? "Выполнено" : "Не выполнено"}
                                                        </span>
                                                        {step.userControlled && (
                                                            <label className="flex items-center gap-2 text-white text-xs cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={step.completed}
                                                                    onChange={(e) =>
                                                                        toggleUserStep(index, e.target.checked)
                                                                    }
                                                                    className="rounded border-gray-400"
                                                                />
                                                                Отметить
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-white/50 text-xs mt-6">
                                        Шаги с видео отмечаются автоматически при просмотре больше 80%. Вернитесь на
                                        эту страницу — прогресс обновится.
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </div>
            </UserLayout>
        </div>
    );
};
