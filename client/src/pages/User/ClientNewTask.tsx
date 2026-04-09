import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { openExternalLink } from "../../utils/telegramWebApp";
import { toast } from "react-toastify";
import { Check, ChevronDown } from "lucide-react";
import { CONTENT_CATEGORY_OPTIONS } from "../../constants/contentCategoryOptions";
import arrowDown from "../../assets/arrowDown.png";
import { PathProgress, mapStepsFromApi, type StepRow } from "../../components/User/AssignmentPathMap";

const isExternalLink = (url: string) => url.startsWith("http://") || url.startsWith("https://");

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

export const ClientNewTask = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [assignments, setAssignments] = useState<Array<{ _id: string; request: string }>>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [steps, setSteps] = useState<StepRow[]>([]);
    const [userLoaded, setUserLoaded] = useState(false);
    const [introHtml, setIntroHtml] = useState<string>("");
    const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({});
    const [assignmentRequestOpen, setAssignmentRequestOpen] = useState(false);
    const stepSectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const assignmentRequestDropdownRef = useRef<HTMLDivElement | null>(null);

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
                const mapped = rows.map((a: any) => ({ _id: a._id, request: a.request }));
                setAssignments(mapped);

                const userStr = localStorage.getItem("user");
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        if (user._id) {
                            const userRes = await api.get(`/api/user/${user._id}`);
                            const savedRequest = userRes.data?.data?.selectedAssignmentRequest;
                            if (savedRequest) {
                                const match = mapped.find((a: any) => a.request === savedRequest);
                                if (match) setSelectedId(match._id);
                            }
                        }
                    } catch { /* ignore */ }
                }
            } catch {
                toast.error("Не удалось загрузить список заданий");
            } finally {
                setListLoading(false);
                setLoading(false);
                setUserLoaded(true);
            }
        };
        loadList();
    }, []);

    useEffect(() => {
        if (!userLoaded) return;
        const requestText = assignments.find((a) => a._id === selectedId)?.request ?? '';
        const userStr = localStorage.getItem("user");
        let userId = "";
        if (userStr) {
            try { userId = JSON.parse(userStr)._id || ""; } catch { /* ignore */ }
        }
        if (userId) {
            api.put("/api/user/profile/update", {
                userId,
                selectedAssignmentRequest: requestText,
            }).catch(() => { /* ignore */ });
        }
    }, [selectedId, assignments, userLoaded]);

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
        if (!assignmentRequestOpen) return;
        const close = (e: PointerEvent) => {
            const el = assignmentRequestDropdownRef.current;
            if (el && !el.contains(e.target as Node)) {
                setAssignmentRequestOpen(false);
            }
        };
        document.addEventListener("pointerdown", close, true);
        return () => document.removeEventListener("pointerdown", close, true);
    }, [assignmentRequestOpen]);

    useEffect(() => {
        if (!assignmentRequestOpen) return;
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") setAssignmentRequestOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [assignmentRequestOpen]);

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
                                <label
                                    htmlFor="assignment-request-select"
                                    className="block text-sm text-white/60 mb-2"
                                >
                                    Выбери свой запрос
                                </label>
                                <div ref={assignmentRequestDropdownRef} className="relative z-20 w-full">
                                    <button
                                        type="button"
                                        id="assignment-request-select"
                                        aria-haspopup="listbox"
                                        aria-expanded={assignmentRequestOpen}
                                        onClick={() => setAssignmentRequestOpen((o) => !o)}
                                        className="relative flex min-h-[52px] w-full cursor-pointer items-stretch rounded-full border border-white/40 bg-transparent text-left outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                                    >
                                        <span className="flex min-w-0 flex-1 items-center px-4 py-3.5">
                                            <span
                                                className={`w-full truncate text-base ${
                                                    selectedId ? "text-white" : "text-white/55"
                                                }`}
                                            >
                                                {selectedId ? selectedRequestLabel : PLACEHOLDER_REQUEST}
                                            </span>
                                        </span>
                                        <span className="flex shrink-0 items-center pr-5">
                                            <span
                                                className={`inline-block transition-transform duration-200 ${
                                                    assignmentRequestOpen ? "rotate-180" : ""
                                                }`}
                                            >
                                                <img src={arrowDown} alt="" className="h-4 w-4" />
                                            </span>
                                        </span>
                                    </button>
                                    {assignmentRequestOpen && (
                                        <div
                                            role="listbox"
                                            aria-labelledby="assignment-request-select"
                                            className="absolute left-0 right-0 top-full z-30 mt-1 flex h-[200px] w-full flex-col overflow-y-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg"
                                        >
                                            <button
                                                type="button"
                                                role="option"
                                                aria-selected={selectedId === ""}
                                                className={`w-full shrink-0 px-4 py-3 text-left text-sm text-[#031F23]/60 hover:bg-black/[0.04] ${
                                                    selectedId === "" ? "bg-black/[0.06] font-medium" : ""
                                                }`}
                                                onClick={() => {
                                                    setSelectedId("");
                                                    setAssignmentRequestOpen(false);
                                                }}
                                            >
                                                {PLACEHOLDER_REQUEST}
                                            </button>
                                            {assignments.map((a) => (
                                                <button
                                                    key={a._id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selectedId === a._id}
                                                    className={`w-full shrink-0 px-4 pt-3 text-left text-sm text-[#031F23] hover:bg-black/[0.04] ${
                                                        selectedId === a._id
                                                            ? "bg-black/[0.06] font-medium"
                                                            : ""
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedId(a._id);
                                                        setAssignmentRequestOpen(false);
                                                    }}
                                                >
                                                    <p>{a.request}</p>
                                                    <div className="w-full h-[1px] bg-black/10 mt-3" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                                                                const textBlock = (
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
                                                                );
                                                                const completionIndicator = item.userControlled ? (
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
                                                                );
                                                                if (item.userControlled) {
                                                                    return (
                                                                        <div
                                                                            key={contentIndex}
                                                                            className={rowClass}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    openStepLink(item.contentLink)
                                                                                }
                                                                                className="flex min-w-0 flex-1 items-center rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                                                                            >
                                                                                {textBlock}
                                                                            </button>
                                                                            <div className="shrink-0 pt-0.5 self-center">
                                                                                {completionIndicator}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <button
                                                                        key={contentIndex}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openStepLink(item.contentLink)
                                                                        }
                                                                        className={rowClass}
                                                                    >
                                                                        {textBlock}
                                                                        <div className="shrink-0 pt-0.5">
                                                                            {completionIndicator}
                                                                        </div>
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
