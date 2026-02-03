import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
    darkMode?: boolean;
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '800px', darkMode = false }: ModalProps) => {
    if (!isOpen) return null;

    const textColor = darkMode ? 'text-white' : 'text-gray-900';
    const borderColor = darkMode ? 'border-gray-600' : 'border-gray-200';
    const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                {/* Overlay */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div 
                    className={`relative inline-block align-bottom ${bgClass} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle`}
                    style={{ maxWidth, width: '100%' }}
                >
                    <div className={`${bgClass} px-6 py-4 border-b ${borderColor}`}>
                        <div className="flex items-center justify-between">
                            <h3 className={`text-xl font-semibold ${textColor}`}>
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className={darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-500"}
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <div className={`${bgClass} px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

