import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Загружаем переменные окружения из server/.env
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import PurposeEnergy from "../Models/PurposeEnergy.js";
import Meditation from "../Models/Meditation.js";
import Practice from "../Models/Practice.js";
import VideoLesson from "../Models/VideoLesson.js";

/**
 * Скрипт миграции структуры content
 * 
 * Старая структура:
 * content: [{ mainUrl, reserveUrl, text, image }]
 * 
 * Новая структура:
 * content: [{ video: { mainUrl, reserveUrl, duration }, text, image }]
 * 
 * Для duration берём значение из поля duration модели (в минутах)
 */

const migrateCollection = async (Model, collectionName) => {
    console.log(`\n📦 Миграция коллекции: ${collectionName}`);
    console.log("=".repeat(50));

    try {
        // Получаем все документы без строгой валидации
        const documents = await Model.find({}).lean();
        console.log(`📋 Найдено документов: ${documents.length}`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const doc of documents) {
            try {
                const content = doc.content || [];
                const durationMinutes = doc.duration || 0;

                // Проверяем, нужна ли миграция
                // Если хотя бы у одного элемента есть mainUrl/reserveUrl на верхнем уровне (не в video)
                const needsMigration = content.some(item => 
                    (item.mainUrl !== undefined || item.reserveUrl !== undefined) && 
                    !item.video
                );

                if (!needsMigration) {
                    skipped++;
                    continue;
                }

                // Преобразуем структуру content
                const newContent = content.map((item, index) => {
                    // Если уже в новом формате - оставляем как есть
                    if (item.video) {
                        return item;
                    }

                    // Миграция из старого формата
                    const hasVideo = Boolean(item.mainUrl || item.reserveUrl);
                    
                    return {
                        video: {
                            mainUrl: item.mainUrl || null,
                            reserveUrl: item.reserveUrl || null,
                            // Для первого видео берём duration из модели (в минутах), для остальных 0
                            duration: hasVideo && index === 0 ? durationMinutes : 0,
                        },
                        text: item.text || null,
                        image: item.image || null,
                    };
                });

                // Обновляем документ
                await Model.updateOne(
                    { _id: doc._id },
                    { $set: { content: newContent } },
                    { runValidators: false }
                );

                migrated++;
                console.log(`✓ Мигрирован: ${doc.title}`);
            } catch (itemError) {
                errors++;
                console.error(`✗ Ошибка миграции "${doc.title}":`, itemError.message);
            }
        }

        console.log(`\n📊 Результат для ${collectionName}:`);
        console.log(`   ✓ Мигрировано: ${migrated}`);
        console.log(`   ○ Пропущено (уже в новом формате): ${skipped}`);
        console.log(`   ✗ Ошибок: ${errors}`);

        return { migrated, skipped, errors };
    } catch (error) {
        console.error(`❌ Ошибка обработки коллекции ${collectionName}:`, error.message);
        return { migrated: 0, skipped: 0, errors: 1 };
    }
};

const runMigration = async () => {
    console.log("🚀 Запуск миграции структуры content...\n");
    console.log("Подключение к MongoDB...");

    try {
        await mongoose.connect(process.env.MONGOURL);
        console.log("✅ Подключено к MongoDB\n");

        const results = {
            purposeEnergy: await migrateCollection(PurposeEnergy, "PurposeEnergy"),
            meditation: await migrateCollection(Meditation, "Meditation"),
            practice: await migrateCollection(Practice, "Practice"),
            videoLesson: await migrateCollection(VideoLesson, "VideoLesson"),
        };

        // Общая статистика
        console.log("\n" + "=".repeat(50));
        console.log("📈 ОБЩАЯ СТАТИСТИКА МИГРАЦИИ");
        console.log("=".repeat(50));

        let totalMigrated = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const [name, result] of Object.entries(results)) {
            totalMigrated += result.migrated;
            totalSkipped += result.skipped;
            totalErrors += result.errors;
        }

        console.log(`✓ Всего мигрировано: ${totalMigrated}`);
        console.log(`○ Всего пропущено: ${totalSkipped}`);
        console.log(`✗ Всего ошибок: ${totalErrors}`);

        if (totalErrors === 0) {
            console.log("\n✅ Миграция завершена успешно!");
        } else {
            console.log("\n⚠️ Миграция завершена с ошибками");
        }

    } catch (error) {
        console.error("❌ Ошибка миграции:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Отключено от MongoDB");
        process.exit(0);
    }
};

runMigration();
