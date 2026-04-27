import { PwaBackButton } from "./PwaBackButton";

export const BackNav = ({ title }: { title: string }) => {
    return (
        <div className="flex items-center justify-between gap-3 p-4">
            <h1 className="text-2xl font-semibold flex-1 min-w-0">{title}</h1>
            <PwaBackButton />
        </div>
    );
};