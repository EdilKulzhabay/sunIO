import { useState, useRef, useEffect } from "react";
import arrowDown from "../../assets/arrowDown.png";

const AccordionItem = ({ title, content, isOpen, onToggle }: any) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState("0px");

    useEffect(() => {
        if (contentRef.current) {
            setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
        }
    }, [isOpen]);

    return (
        <div className="overflow-hidden">
            <button
                className="w-full flex items-center justify-between py-2.5 px-4 border border-white/40 rounded-xl gap-x-2"
                onClick={onToggle}
            >
                <div className="text-left" dangerouslySetInnerHTML={{ __html: title }}></div>
                <img
                    src={arrowDown}
                    alt="arrow-down"
                    className={`${isOpen ? "rotate-180" : ""} w-4 h-4 transition-transform duration-300`}
                />
            </button>
            <div
                ref={contentRef}
                className="transition-all duration-500 ease-in-out overflow-hidden bg-[#333333] rounded-xl mt-1 px-4"
                style={{ maxHeight }}
            >
                <div className="py-2.5" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        </div>
    );
};

export const MobileAccordionList = ({
    items,
}: {
    items: { title: string; content: string }[];
}) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    content={item.content}
                    isOpen={openIndex === index}
                    onToggle={() =>
                        setOpenIndex(openIndex === index ? null : index)
                    }
                />
            ))}
        </div>
    );
};
