import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const VideoLessonSchema = new mongoose.Schema(
  {
    title: String,
    shortDescription: String,
    fullDescription: String,
    imageUrl: String,
    videoUrl: String,
    ruTubeUrl: String,
    accessType: String,
    starsRequired: Number,
    duration: Number,
    order: Number,
    allowRepeatBonus: Boolean,
    location: String,
    content: [
      {
        mainUrl: String,
        reserveUrl: String,
        text: String,
        image: String,
      }
    ]
  },
  {
    timestamps: true,
  }
);

const VideoLesson = mongoose.model('VideoLessonMigration', VideoLessonSchema, 'videolessons');

async function migrateVideoLessonsToContent() {
    try {
        console.log('Подключение к MongoDB...');
        await mongoose.connect(process.env.MONGOURL);
        console.log('Подключено к MongoDB');

        const videoLessons = await VideoLesson.find();
        console.log(`Найдено ${videoLessons.length} видео уроков`);

        let updated = 0;
        let skipped = 0;

        for (const videoLesson of videoLessons) {
            const videoUrl = videoLesson.videoUrl;
            const ruTubeUrl = videoLesson.ruTubeUrl;
            const fullDescription = videoLesson.fullDescription;
            const existingContent = Array.isArray(videoLesson.content) ? [...videoLesson.content] : [];

            const hasVideoFields = Boolean(videoUrl || ruTubeUrl);
            const hasTextField = Boolean(fullDescription);
            const hasExistingVideoItem = existingContent.some((item) =>
                (item?.mainUrl && item.mainUrl === videoUrl) ||
                (item?.reserveUrl && item.reserveUrl === ruTubeUrl)
            );
            const hasExistingTextItem = existingContent.some((item) => item?.text === fullDescription);

            if (!hasVideoFields && !hasTextField) {
                skipped++;
                continue;
            }

            const newContent = [...existingContent];

            if (hasVideoFields && !hasExistingVideoItem) {
                newContent.push({
                    mainUrl: videoUrl || null,
                    reserveUrl: ruTubeUrl || null,
                    text: null,
                    image: null,
                });
            }

            if (hasTextField && !hasExistingTextItem) {
                newContent.push({
                    mainUrl: null,
                    reserveUrl: null,
                    text: fullDescription,
                    image: null,
                });
            }

            await VideoLesson.updateOne(
                { _id: videoLesson._id },
                {
                    $set: { content: newContent },
                    $unset: { videoUrl: 1, ruTubeUrl: 1, fullDescription: 1 },
                },
                { runValidators: false }
            );

            updated++;
            console.log(`✓ Обновлен: ${videoLesson.title}`);
        }

        console.log('\n=== Миграция завершена ===');
        console.log(`Обновлено: ${updated}`);
        console.log(`Пропущено: ${skipped}`);
        console.log(`Всего: ${videoLessons.length}`);

        await mongoose.disconnect();
        console.log('Отключено от MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Ошибка миграции:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateVideoLessonsToContent();
