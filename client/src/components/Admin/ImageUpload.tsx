import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

export const ImageUpload = ({ value, onChange, label = "Обложка" }: ImageUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string>(value || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            toast.error('Пожалуйста, выберите изображение');
            return;
        }

        // Проверка размера файла (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Размер файла не должен превышать 5MB');
            return;
        }

        setUploading(true);

        try {
            // Создаем FormData для отправки файла
            const formData = new FormData();
            formData.append('image', file);

            // Отправляем файл на сервер
            const response = await api.post('/api/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const imageUrl = response.data.imageUrl;
                // Формируем полный URL для превью
                const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${imageUrl}`;
                setPreview(fullUrl);
                onChange(imageUrl); // Сохраняем относительный путь
                toast.success('Изображение успешно загружено');
            } else {
                toast.error(response.data.message || 'Ошибка загрузки изображения');
            }
        } catch (error: any) {
            console.error('Ошибка загрузки:', error);
            toast.error(error.response?.data?.message || 'Ошибка загрузки изображения');
        } finally {
            setUploading(false);
            // Очищаем input для возможности загрузки того же файла снова
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        setPreview('');
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Формируем полный URL для отображения превью
    const getFullImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${url}`;
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            <div className="flex gap-3 items-start">
                {/* Превью изображения */}
                {(preview || value) && (
                    <div className="relative group">
                        <img
                            src={getFullImageUrl(preview || value)}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Кнопка загрузки */}
                <div className="flex-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    
                    <button
                        type="button"
                        onClick={handleButtonClick}
                        disabled={uploading}
                        className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                            uploading
                                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                        }`}
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span className="text-gray-600">Загрузка...</span>
                            </>
                        ) : (preview || value) ? (
                            <>
                                <Upload size={20} className="text-gray-600" />
                                <span className="text-gray-700">Изменить обложку</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon size={20} className="text-gray-600" />
                                <span className="text-gray-700">Добавить обложку</span>
                            </>
                        )}
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-2">
                        Поддерживаются: JPG, PNG, GIF, WEBP (макс. 5MB)
                    </p>
                </div>
            </div>
        </div>
    );
};

