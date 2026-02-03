import mongoose from 'mongoose';
import 'dotenv/config';

const HoroscopeSchema = new mongoose.Schema(
  {
    startDate: String,
    endDate: String,
    title: String,
    subtitle: String,
    image: String,
    lines: [
      {
        title: String,
        content: String,
      }
    ],
    accessType: String,
  },
  {
    timestamps: true,
  }
);

const Horoscope = mongoose.model('Horoscope', HoroscopeSchema);

async function migrateHoroscopeDates() {
    try {
        console.log('Подключение к MongoDB...');
        await mongoose.connect(process.env.MONGOURL);
        console.log('Подключено к MongoDB');

        const horoscopes = await Horoscope.find();
        console.log(`Найдено ${horoscopes.length} гороскопов`);

        let updated = 0;
        let skipped = 0;

        for (const horoscope of horoscopes) {
            const needsConversion = 
                typeof horoscope.startDate !== 'string' ||
                horoscope.startDate.length > 5 ||
                typeof horoscope.endDate !== 'string' ||
                horoscope.endDate.length > 5;

            if (needsConversion) {
                try {
                    const startDate = new Date(horoscope.startDate);
                    const endDate = new Date(horoscope.endDate);
                    
                    const newStartDate = `${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                    const newEndDate = `${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

                    await Horoscope.findByIdAndUpdate(
                        horoscope._id,
                        {
                            startDate: newStartDate,
                            endDate: newEndDate
                        },
                        { runValidators: false }
                    );
                    
                    updated++;
                    console.log(`✓ Обновлен: ${horoscope.title} (${newStartDate} - ${newEndDate})`);
                } catch (error) {
                    console.log(`✗ Ошибка обновления ${horoscope.title}:`, error.message);
                }
            } else {
                skipped++;
                console.log(`- Пропущен: ${horoscope.title} (уже в правильном формате)`);
            }
        }

        console.log('\n=== Миграция завершена ===');
        console.log(`Обновлено: ${updated}`);
        console.log(`Пропущено: ${skipped}`);
        console.log(`Всего: ${horoscopes.length}`);

        await mongoose.disconnect();
        console.log('Отключено от MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Ошибка миграции:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateHoroscopeDates();
