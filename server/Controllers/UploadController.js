import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем папку uploads если её нет
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        // Определяем префикс в зависимости от типа загрузки (если указан в query параметре)
        const prefix = req.query.type === 'profile' ? 'profile-' : 'cover-';
        cb(null, prefix + uniqueSuffix + ext);
    }
});

// Фильтр для проверки типов файлов
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Недопустимый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WEBP)'), false);
    }
};

// Настройка multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Максимум 5MB
    }
});

// Контроллер для загрузки изображения
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Файл не был загружен'
            });
        }

        // Формируем URL для доступа к изображению
        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Изображение успешно загружено',
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при загрузке изображения'
        });
    }
};

// Контроллер для удаления изображения
export const deleteImage = async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Не указано имя файла'
            });
        }

        const filePath = path.join(uploadsDir, filename);

        // Проверяем существует ли файл
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({
                success: true,
                message: 'Изображение успешно удалено'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Файл не найден'
            });
        }
    } catch (error) {
        console.error('Ошибка при удалении изображения:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении изображения'
        });
    }
};

