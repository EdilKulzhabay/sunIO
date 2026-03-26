import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useState, useEffect, useCallback, useMemo, useRef, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { openExternalLink } from "../../utils/telegramWebApp";
import { toast } from "react-toastify";
import { Check, ChevronDown } from "lucide-react";
import { CONTENT_CATEGORY_OPTIONS } from "../../constants/contentCategoryOptions";
import arrowDown from "../../assets/arrowDown.png";

const isExternalLink = (url: string) => url.startsWith("http://") || url.startsWith("https://");

type ContentItemRow = {
    stepDescription: string;
    contentLink: string;
    userControlled: boolean;
    completed: boolean;
};

type StepRow = {
    description: string;
    contents: ContentItemRow[];
};

function mapStepsFromApi(raw: unknown): StepRow[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((s: any) => ({
        description: typeof s?.description === "string" ? s.description : "",
        contents: Array.isArray(s?.contents)
            ? s.contents.map((c: any) => ({
                  stepDescription: c?.stepDescription || "",
                  contentLink: c?.contentLink || "",
                  userControlled: !!c?.userControlled,
                  completed: !!c?.completed,
              }))
            : [],
    }));
}

function getStepDotStatus(step: StepRow): "done" | "partial" | "none" {
    const items = step.contents || [];
    if (items.length === 0) return "none";
    const done = items.filter((c) => c.completed).length;
    if (done === 0) return "none";
    if (done === items.length) return "done";
    return "partial";
}

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

const PATH_LABEL_LINE_MAX = 15;

/**
 * Две строки подписи на карте: у каждой не больше PATH_LABEL_LINE_MAX символов,
 * перенос по пробелам (слова не режем). Если текста больше — «…» в конце второй строки.
 */
function pathLabelLines(text: string, maxPerLine = PATH_LABEL_LINE_MAX): string[] {
    const s = (text || "").trim();
    if (!s) return [""];

    const words = s.split(/\s+/).filter(Boolean);

    function greedyLine(ws: string[]): { line: string; rest: string[] } {
        if (ws.length === 0) return { line: "", rest: [] };
        if (ws[0].length > maxPerLine) {
            return { line: ws[0], rest: ws.slice(1) };
        }
        let line = ws[0];
        let i = 1;
        while (i < ws.length) {
            const next = `${line} ${ws[i]}`;
            if (next.length <= maxPerLine) {
                line = next;
                i++;
            } else break;
        }
        return { line, rest: ws.slice(i) };
    }

    const { line: line1, rest: rest1 } = greedyLine(words);
    if (rest1.length === 0) return [line1];

    const { line: line2, rest: rest2 } = greedyLine(rest1);
    if (rest2.length === 0) return [line1, line2];

    const ellipsis = "…";
    const parts = line2.split(/\s+/).filter(Boolean);
    const stack = [...parts];
    let line2WithMore = "";
    while (stack.length > 0) {
        const cand = `${stack.join(" ")}${ellipsis}`;
        if (cand.length <= maxPerLine) {
            line2WithMore = cand;
            break;
        }
        stack.pop();
    }
    if (!line2WithMore) {
        line2WithMore = line2;
    }
    return [line1, line2WithMore];
}

const PATH_COLOR_DONE = "#00C5AE";
const PATH_COLOR_CURRENT = "#C4841D";
const PATH_COLOR_TODO = "#9AA5A7";
const DOT_R = 4;

/** Точки на одной горизонтали; линия — плавные дуги (квадратичные Безье). Точки 8×8px (r=4). */
function PathProgress({
    steps,
    onStepClick,
}: {
    steps: StepRow[];
    onStepClick?: (index: number) => void;
}) {
    const n = steps.length;
    if (n === 0) return null;

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
        <div className="w-full touch-pan-y py-1 px-5">
            {/*
              pointer-events-none на svg: жесты скролла не «липнут» ко всей области графика (Telegram WebView).
              Кликабельны только группы с pointer-events-auto + touch-pan-y.
            */}
            <svg
                viewBox={`0 0 ${w} ${h}`}
                className="pointer-events-none mx-auto block w-full"
                aria-label="Маршрут по шагам"
            >
                {pathD ? (
                    <path
                        d={pathD}
                        fill="none"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth="1.5"
                        strokeDasharray="4 5"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                    />
                ) : null}
                {points.map((p, i) => {
                    const status = getStepDotStatus(steps[i]);
                    const fill =
                        status === "done"
                            ? PATH_COLOR_DONE
                            : status === "partial"
                              ? PATH_COLOR_CURRENT
                              : PATH_COLOR_TODO;
                    const labelAbove = i % 2 === 0;
                    const labelY = labelAbove ? p.y - labelOffsetY : p.y + labelOffsetY;
                    const handleKey = (e: KeyboardEvent<SVGGElement>) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onStepClick?.(i);
                        }
                    };
                    return (
                        <g
                            key={i}
                            role={onStepClick ? "button" : undefined}
                            tabIndex={onStepClick ? 0 : undefined}
                            className="pointer-events-auto touch-pan-y outline-none focus:outline-none"
                            style={{
                                cursor: onStepClick ? "pointer" : "default",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                            }}
                            onClick={() => onStepClick?.(i)}
                            onKeyDown={onStepClick ? handleKey : undefined}
                        >
                            <text
                                x={p.x}
                                y={labelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="rgba(255,255,255,0.72)"
                                fontSize="9"
                                fontWeight="500"
                            >
                                {pathLabelLines(steps[i]?.description ?? "").map((line, li) => (
                                    <tspan key={li} x={p.x} dy={li === 0 ? 0 : "1.15em"}>
                                        {line}
                                    </tspan>
                                ))}
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
    const stepSectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
                rows.sort((a: any, b: any) => {
                    const oa = Number(a?.order) || 0;
                    const ob = Number(b?.order) || 0;
                    if (oa !== ob) return oa - ob;
                    return (
                        new Date(b?.updatedAt || 0).getTime() -
                        new Date(a?.updatedAt || 0).getTime()
                    );
                });
                setAssignments(rows.map((a: any) => ({ _id: a._id, request: a.request })));
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
                setSteps(mapStepsFromApi(d.steps));
            }
        } catch {
            toast.error("Не удалось загрузить задание");
            setSteps([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!selectedId) {
            setSteps([]);
            setLoading(false);
            return;
        }
        loadProgress(selectedId);
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
            next[i] = false;
        });
        setOpenSteps(next);
    }, [selectedId, steps.length]);

    const focusStepFromPath = useCallback((index: number) => {
        if (index < 0 || index >= steps.length) return;
        flushSync(() => {
            setOpenSteps(() => {
                const next: Record<number, boolean> = {};
                steps.forEach((_, i) => {
                    next[i] = i === index;
                });
                return next;
            });
        });
        const scrollToStep = () => {
            const el = stepSectionRefs.current[index];
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        requestAnimationFrame(() => {
            requestAnimationFrame(scrollToStep);
        });
    }, [steps]);

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

    const toggleUserContent = async (stepIndex: number, contentIndex: number, completed: boolean) => {
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
                `/api/assignments/${selectedId}/user-progress/${userId}/steps/${stepIndex}/contents/${contentIndex}/toggle`,
                { completed }
            );
            const d = res.data?.data;
            if (d?.steps) {
                setSteps(mapStepsFromApi(d.steps));
            }
        } catch {
            toast.error("Не удалось сохранить");
        }
    };

    const PLACEHOLDER_REQUEST = "Нажми на поле и выбери путь";

    const selectedRequestLabel = useMemo(
        () => assignments.find((a) => a._id === selectedId)?.request ?? "",
        [assignments, selectedId]
    );

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
                                <div className="relative flex min-h-[52px] items-stretch rounded-full border border-white/40 overflow-hidden">
                                    {/* Видимая строка: клики не ловим — только отображение */}
                                    <div className="flex min-w-0 flex-1 items-center px-4 py-3.5 pointer-events-none">
                                        <span
                                            className={`w-full truncate text-left text-base ${
                                                selectedId ? "text-white" : "text-white/55"
                                            }`}
                                        >
                                            {selectedId ? selectedRequestLabel : PLACEHOLDER_REQUEST}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 items-center pr-5 pointer-events-none">
                                        <img src={arrowDown} alt="" className="h-4 w-4" />
                                    </div>
                                    {/* Нативный select на весь блок — в WebView открывается по тапу везде, в т.ч. по иконке */}
                                    <select
                                        id="assignment-request-select"
                                        value={selectedId}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                        className="absolute inset-0 z-10 h-full min-h-[52px] w-full cursor-pointer opacity-0 appearance-none text-base"
                                        style={{
                                            WebkitAppearance: "none",
                                            MozAppearance: "none",
                                            backgroundImage: "none",
                                        }}
                                        aria-label="Выбери свой запрос"
                                    >
                                        <option value="" className="bg-[#114E50] text-white/80">
                                            {PLACEHOLDER_REQUEST}
                                        </option>
                                        {assignments.map((a) => (
                                            <option key={a._id} value={a._id} className="bg-[#114E50] text-white">
                                                {a.request}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedId && loading ? (
                                <div className="flex justify-center py-16">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400/80" />
                                </div>
                            ) : selectedId ? (
                                <>
                                    {steps.length > 0 && (
                                        <div className="">
                                            <PathProgress steps={steps} onStepClick={focusStepFromPath} />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {steps.map((step, index) => {
                                            const open = openSteps[index] ?? false;
                                            return (
                                                <div
                                                    key={`${selectedId}-${index}`}
                                                    ref={(el) => {
                                                        stepSectionRefs.current[index] = el;
                                                    }}
                                                    className="scroll-mt-3 rounded-2xl bg-[#114E50] border border-white/10 overflow-hidden shadow-md"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => openStepToggle(index)}
                                                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                                                    >
                                                        <span className="text-white font-medium text-lg min-w-0 text-left">
                                                            <span className="block">Шаг {index + 1}</span>
                                                            {step.description ? (
                                                                <span className="block text-sm font-normal text-white/70 mt-0.5 line-clamp-2">
                                                                    {step.description}
                                                                </span>
                                                            ) : null}
                                                        </span>
                                                        <ChevronDown
                                                            className={`w-5 h-5 text-white/80 shrink-0 transition-transform duration-200 ${
                                                                open ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                    </button>

                                                    {open && (
                                                        <div className="px-4 pb-4 pt-0 space-y-3">
                                                            {step.contents.map((item, contentIndex) => {
                                                                const category = getCategoryTitle(item.contentLink);
                                                                const rowClass =
                                                                    "w-full flex items-center gap-3 text-left rounded-xl p-3 border border-white/10";
                                                                const rowInner = (
                                                                    <>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-[11px] tracking-wide text-white/45 mb-1">
                                                                                {category}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-white text-[15px] leading-snug font-medium">
                                                                                    {item.stepDescription}
                                                                                </div>
                                                                                {item.userControlled && (
                                                                                    <div className="text-[11px] tracking-wide text-[#00C5AE]">
                                                                                        После выполнения сделай отметку
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="shrink-0 pt-0.5">
                                                                            {item.userControlled ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        toggleUserContent(
                                                                                            index,
                                                                                            contentIndex,
                                                                                            !item.completed
                                                                                        )
                                                                                    }
                                                                                    className={`flex h-4 w-4 items-center justify-center rounded-[6px] ${
                                                                                        item.completed
                                                                                            ? "bg-[#C4841D] text-white"
                                                                                            : "border-white/60 border-[2px] bg-transparent"
                                                                                    }`}
                                                                                    aria-label={
                                                                                        item.completed
                                                                                            ? "Выполнено"
                                                                                            : "Отметить выполненным"
                                                                                    }
                                                                                >
                                                                                    {item.completed ? (
                                                                                        <Check className="w-5 h-5 stroke-[3]" />
                                                                                    ) : null}
                                                                                </button>
                                                                            ) : (
                                                                                <div
                                                                                    className={`flex h-4 w-4 items-center justify-center rounded-[6px] ${
                                                                                        item.completed
                                                                                            ? "bg-[#C4841D] text-white"
                                                                                            : "border-white/60 border-[2px] bg-transparent"
                                                                                    }`}
                                                                                    title={
                                                                                        item.completed
                                                                                            ? "Выполнено"
                                                                                            : "Откройте контент и досмотрите видео"
                                                                                    }
                                                                                >
                                                                                    {item.completed ? (
                                                                                        <Check className="w-[16px] h-[14px]" />
                                                                                    ) : null}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                );
                                                                return item.userControlled ? (
                                                                    <div
                                                                        key={contentIndex}
                                                                        className={`${rowClass} cursor-default`}
                                                                    >
                                                                        {rowInner}
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        key={contentIndex}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openStepLink(item.contentLink)
                                                                        }
                                                                        className={rowClass}
                                                                    >
                                                                        {rowInner}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : null}
                        </>
                    )}
                </div>
            </UserLayout>
        </div>
    );
};
