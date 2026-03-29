import { useMemo, type KeyboardEvent } from "react";

export type ContentItemRow = {
    stepDescription: string;
    contentLink: string;
    userControlled: boolean;
    completed: boolean;
};

export type StepRow = {
    description: string;
    contents: ContentItemRow[];
};

export function mapStepsFromApi(raw: unknown): StepRow[] {
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

const PATH_LABEL_LINE_MAX = 15;

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

/** Точки на одной горизонтали; линия — плавные дуги (квадратичные Безье). */
export function PathProgress({
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
