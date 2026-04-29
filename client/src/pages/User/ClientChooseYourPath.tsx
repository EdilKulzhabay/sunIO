import bgGar from "../../assets/bgGar.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { RedButton } from "../../components/User/RedButton";
import sunWithHands from "../../assets/sunWithHands.png";
import api from "../../api";
import { toast } from "react-toastify";
import arrowDown from "../../assets/arrowDown.png";
import { PathProgress, mapStepsFromApi, type StepRow } from "../../components/User/AssignmentPathMap";

const LS_KEY_SELECTED_ASSIGNMENT_ID = "clientNewTaskSelectedAssignmentId";

function readStoredSelectedAssignmentId(): string {
    try {
        const v = localStorage.getItem(LS_KEY_SELECTED_ASSIGNMENT_ID);
        return typeof v === "string" ? v : "";
    } catch {
        return "";
    }
}

const PLACEHOLDER_REQUEST = "Нажми на поле и выбери путь";

export const ClientChooseYourPath = () => {
    const navigate = useNavigate();
    const [screenHeight, setScreenHeight] = useState(0);
    const [listLoading, setListLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Array<{ _id: string; request: string }>>([]);
    const [selectedId, setSelectedId] = useState<string>(() => readStoredSelectedAssignmentId());
    const [steps, setSteps] = useState<StepRow[]>([]);
    const [assignmentRequestOpen, setAssignmentRequestOpen] = useState(false);
    const assignmentRequestDropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const updateScreenHeight = () => setScreenHeight(window.innerHeight);
        updateScreenHeight();
        window.addEventListener("resize", updateScreenHeight);
        return () => window.removeEventListener("resize", updateScreenHeight);
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== "admin") {
                    navigate("/client/blocked-user");
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
                rows.sort((a: any, b: any) => {
                    const oa = Number(a?.order) || 0;
                    const ob = Number(b?.order) || 0;
                    if (oa !== ob) return oa - ob;
                    return (
                        new Date(b?.updatedAt || 0).getTime() - new Date(a?.updatedAt || 0).getTime()
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

    useEffect(() => {
        if (listLoading) return;
        if (assignments.length === 0) setSelectedId("");
    }, [listLoading, assignments.length]);

    useEffect(() => {
        if (assignments.length === 0) return;
        setSelectedId((prev) => {
            if (!prev) return prev;
            if (assignments.some((a) => a._id === prev)) return prev;
            try {
                localStorage.removeItem(LS_KEY_SELECTED_ASSIGNMENT_ID);
            } catch {
                /* ignore */
            }
            return "";
        });
    }, [assignments]);

    useEffect(() => {
        try {
            if (selectedId) localStorage.setItem(LS_KEY_SELECTED_ASSIGNMENT_ID, selectedId);
            else localStorage.removeItem(LS_KEY_SELECTED_ASSIGNMENT_ID);
        } catch {
            /* ignore */
        }

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
    }, [selectedId, assignments]);

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
            if (d) setSteps(mapStepsFromApi(d.steps));
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
        if (!assignmentRequestOpen) return;
        const close = (e: PointerEvent) => {
            const el = assignmentRequestDropdownRef.current;
            if (el && !el.contains(e.target as Node)) setAssignmentRequestOpen(false);
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

    const selectedRequestLabel = useMemo(
        () => assignments.find((a) => a._id === selectedId)?.request ?? "",
        [assignments, selectedId]
    );
    
    return (
        <div
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
            }}
            className="pb-10 flex flex-col justify-between relative"
        >
            {listLoading && (
                <div className="absolute px-4 inset-0 z-40 flex items-center justify-center bg-black/30">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400/90" />
                </div>
            )}
            <div style={{ height: `${screenHeight / 3.5}px` }} className="flex justify-center items-end px-4">
                <img src={sunWithHands} alt="" className="object-cover h-[175px] w-[175px] mb-5" />
            </div>
            <div className="flex-1 min-h-0 px-4">
                <h1 className="text-[48px] font-semibold text-white leading-tight">Выберите свой путь движения</h1>
                <p className="text-white mt-2 text-sm leading-relaxed">
                    Чтобы начать свой путь в приложении «Солнце», мы создали для тебя инструкцию в формате заданий.
                    Двигаясь по предложенному маршруту, ты будешь приближаться к реализации запроса, а также сможешь
                    отслеживать прогресс своего движения в разделе Задания
                </p>

                {assignments.length === 0 && !listLoading ? (
                    <p className="text-white/70 text-sm mt-6">Пока нет доступных заданий.</p>
                ) : !listLoading ? (
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
                                                    selectedId === a._id ? "bg-black/[0.06] font-medium" : ""
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
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400/80" />
                            </div>
                        ) : selectedId ? (
                            <div className="mt-4 -mx-2">
                                {steps.length > 0 && (
                                    <PathProgress steps={steps} onStepClick={() => {}} />
                                )}
                            </div>
                        ) : null}
                    </>
                ) : null}
            </div>

            <div className="bg-[#031F23] rounded-t-2xl px-4 pt-3 pb-2 mt-4">
                <RedButton text="Далее" onClick={() => navigate("/main")} className="w-full" />
            </div>
        </div>
    );
};
