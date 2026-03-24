import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { openExternalLink } from "../../utils/telegramWebApp";
import { toast } from "react-toastify";
import { Check, ChevronDown } from "lucide-react";
import { CONTENT_CATEGORY_OPTIONS } from "../../constants/contentCategoryOptions";

const isExternalLink = (url: string) => url.startsWith("http://") || url.startsWith("https://");

type StepRow = {
    stepDescription: string;
    contentLink: string;
    userControlled: boolean;
    completed: boolean;
};

function getCategoryTitle(link: string): string {
    const t = (link || "").trim();
    if (!t) return "Задание";
    if (t.startsWith("http")) return "Внешняя ссылка";
    for (const opt of CONTENT_CATEGORY_OPTIONS) {
        if (t.startsWith(opt.clientPath + "/") || t === opt.clientPath) {
            return opt.title;
        }
    }
    if (t.includes("/client/diary")) return "Дневник";
    if (t.includes("/client/schedule")) return "Расписание";
    if (t.startsWith("/client/")) return "Приложение";
    return "Контент";
}

function truncatePathLabel(text: string, max = 14): string {
    const s = (text || "").trim();
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
}

const PATH_COLOR_DONE = "#00C5AE";
const PATH_COLOR_CURRENT = "#C4841D";
const PATH_COLOR_TODO = "#9AA5A7";
const DOT_R = 4;

/** Точки на одной горизонтали; линия — плавные дуги (квадратичные Безье). Точки 8×8px (r=4). */
function PathProgress({ steps }: { steps: StepRow[] }) {
    const n = steps.length;
    if (n === 0) return null;

    const currentIdx = useMemo(() => {
        const i = steps.findIndex((s) => !s.completed);
        if (i === -1) return -1;
        return i;
    }, [steps]);

    const w = 320;
    const h = 100;
    const pad = 24;
    const yLine = h / 2;
    /** Нечётные шаги (1,3,5…) — подпись над точкой; чётные (2,4,6…) — под. */
    const labelOffsetY = DOT_R + 15;

    const points = useMemo(() => {
        const arr: { x: number; y: number }[] = [];
        for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0.5 : i / (n - 1);
            const x = pad + t * (w - pad * 2);
            arr.push({ x, y: yLine });
        }
        return arr;
    }, [n, w, pad, yLine]);

    const pathD = useMemo(() => {
        if (points.length < 2) return "";
        let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            const bump = i % 2 === 0 ? -22 : 22;
            const cy = yLine + bump;
            d += ` Q ${midX.toFixed(1)} ${cy.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
        }
        return d;
    }, [points, yLine]);

    return (
        <div className="w-full py-1 px-5">
            <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto block w-full" aria-hidden>
                {pathD ? (
                    <path
                        d={pathD}
                        fill="none"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth="1.5"
                        strokeDasharray="4 5"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                ) : null}
                {points.map((p, i) => {
                    const done = steps[i]?.completed;
                    const isCurrent = currentIdx !== -1 && i === currentIdx && !done;
                    const isDone = !!done;
                    const fill = isDone ? PATH_COLOR_DONE : isCurrent ? PATH_COLOR_CURRENT : PATH_COLOR_TODO;
                    const labelAbove = i % 2 === 0;
                    const labelY = labelAbove ? p.y - labelOffsetY : p.y + labelOffsetY;
                    return (
                        <g key={i}>
                            <text
                                x={p.x}
                                y={labelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="rgba(255,255,255,0.72)"
                                fontSize="9"
                                fontWeight="500"
                            >
                                {truncatePathLabel(steps[i]?.stepDescription ?? "", 14)}
                            </text>
                            <circle cx={p.x} cy={p.y} r={DOT_R} fill={fill} />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export const ClientNewTask = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [assignments, setAssignments] = useState<Array<{ _id: string; request: string }>>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [steps, setSteps] = useState<StepRow[]>([]);
    const [introHtml, setIntroHtml] = useState<string>("");
    const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({});

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
        const loadIntro = async () => {
            try {
                const res = await api.get("/api/dynamic-content/name/tasks-desc");
                const html = res.data?.data?.content;
                if (typeof html === "string") setIntroHtml(html);
            } catch {
                /* нет блока — покажем запасной текст ниже */
            }
        };
        loadIntro();
    }, []);

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

    useEffect(() => {
        const next: Record<number, boolean> = {};
        steps.forEach((_, i) => {
            next[i] = i < 3;
        });
        setOpenSteps(next);
    }, [selectedId, steps.length]);

    const openStepToggle = (index: number) => {
        setOpenSteps((prev) => ({ ...prev, [index]: !prev[index] }));
    };

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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400/80" />
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="Задания" />
                <div
                    className="px-4 -mt-1 pb-12 bg-[#031F23] min-h-[60vh]"
                    data-diary-page
                    style={{
                        userSelect: "text",
                        WebkitUserSelect: "text",
                        MozUserSelect: "text",
                        msUserSelect: "text",
                        WebkitTouchCallout: "default",
                    }}
                >
                    {introHtml ? (
                        <div
                            className="mt-2 text-white/90 text-sm leading-relaxed [&_a]:text-teal-300 [&_p]:mb-3"
                            dangerouslySetInnerHTML={{ __html: introHtml }}
                        />
                    ) : (
                        <p className="mt-2 text-white/85 text-sm leading-relaxed">
                            Здесь собраны задания — пошаговая инструкция по приложению «СОЛНЦЕ». Выполняй шаги и
                            получай Солнца, которые можно обменять на материалы клуба.
                        </p>
                    )}

                    {assignments.length === 0 ? (
                        <p className="text-white/70 text-sm mt-6">Пока нет доступных заданий.</p>
                    ) : (
                        <>
                            <div className="mt-6">
                                <label className="block text-sm text-white/60 mb-2">
                                    Выбери свой запрос
                                </label>
                                <div className="rounded-full border pr-5 border-white/40">
                                    <select
                                        value={selectedId}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                        className="w-full bg-transparent text-white px-4 py-3.5 outline-none cursor-pointer"
                                        style={{ backgroundImage: "none" }}
                                    >
                                        {assignments.map((a) => (
                                            <option key={a._id} value={a._id} className="bg-[#114E50] text-white">
                                                {a.request}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-16">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400/80" />
                                </div>
                            ) : (
                                <>
                                    {steps.length > 0 && (
                                        <div className="">
                                            <PathProgress steps={steps} />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {steps.map((step, index) => {
                                            const open = openSteps[index] ?? index < 3;
                                            const category = getCategoryTitle(step.contentLink);
                                            return (
                                                <div
                                                    key={`${selectedId}-${index}`}
                                                    className="rounded-2xl bg-[#114E50] border border-white/10 overflow-hidden shadow-md"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => openStepToggle(index)}
                                                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                                                    >
                                                        <span className="text-white font-medium text-lg">
                                                            Шаг {index + 1}
                                                        </span>
                                                        <ChevronDown
                                                            className={`w-5 h-5 text-white/80 shrink-0 transition-transform duration-200 ${
                                                                open ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                    </button>

                                                    {open && (
                                                        <div className="px-4 pb-4 pt-0 space-y-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (step.userControlled) return;
                                                                    openStepLink(step.contentLink);
                                                                }}
                                                                className="w-full flex items-center gap-3 text-left rounded-xl p-3 border border-white/10"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-[11px] tracking-wide text-white/45 mb-1">
                                                                        {category}
                                                                    </div>
                                                                    <div className="text-white text-[15px] leading-snug font-medium">
                                                                        {step.stepDescription}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="shrink-0 pt-0.5"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {step.userControlled ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                toggleUserStep(index, !step.completed)
                                                                            }
                                                                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                                                                                step.completed
                                                                                    ? "border-teal-400 bg-teal-500/90 text-[#031F23]"
                                                                                    : "border-white/35 bg-transparent"
                                                                            }`}
                                                                            aria-label={
                                                                                step.completed
                                                                                    ? "Выполнено"
                                                                                    : "Отметить выполненным"
                                                                            }
                                                                        >
                                                                            {step.completed ? (
                                                                                <Check className="w-5 h-5 stroke-[3]" />
                                                                            ) : null}
                                                                        </button>
                                                                    ) : (
                                                                        <div
                                                                            className={`flex h-4 w-4 items-center justify-center rounded-[6px] ${
                                                                                step.completed
                                                                                    ? "bg-[#C4841D] text-white"
                                                                                    : "border-white/60 border-[2px] bg-transparent"
                                                                            }`}
                                                                            title={
                                                                                step.completed
                                                                                    ? "Выполнено"
                                                                                    : "Откройте контент и досмотрите видео"
                                                                            }
                                                                        >
                                                                            {step.completed ? (
                                                                                <Check className="w-[16px] h-[14px]" />
                                                                            ) : null}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </UserLayout>
        </div>
    );
};
