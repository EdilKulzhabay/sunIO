import { Telegraf } from 'telegraf';
import 'dotenv/config';
import axios from 'axios';
import { executeUserOperation } from './queue.js';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Экспортируем бота для использования в других модулях
export default bot;

bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id;
  const telegramUserName = ctx.from.username;

  console.log("chatId:", chatId);
  console.log("telegramUserName:", telegramUserName);
  
  // Получаем реферальный ID из параметра start
  const startParam = ctx.startParam || (ctx.message?.text?.split(' ')[1] || null);
  console.log("startParam (referral ID):", startParam);
  
  // Удаляем menu button, чтобы остался только inline
  // setChatMenuButton изменяет состояние, поэтому используем очередь
  try {
    await executeUserOperation(async () => {
      return await bot.telegram.setChatMenuButton({
      chatId,
      menuButton: { type: "default" }
      });
    });
  } catch (error) {
    console.log("Ошибка при удалении menu button:", error);
  }
  
  // Получаем фото профиля пользователя
  // getUserProfilePhotos и getFile - информационные методы, но лучше через очередь для согласованности
  let profilePhotoUrl = null;
  try {
    const photos = await executeUserOperation(async () => {
      return await bot.telegram.getUserProfilePhotos(telegramId, { limit: 1 });
    });
    
    if (photos.total_count > 0 && photos.photos.length > 0) {
      // Берем фото максимального качества (последний элемент в массиве размеров)
      const largestPhoto = photos.photos[0][photos.photos[0].length - 1];
      const fileId = largestPhoto.file_id;
      
      // Получаем file_path через getFile
      const file = await executeUserOperation(async () => {
        return await bot.telegram.getFile(fileId);
      });
      
      // Формируем URL аватара
      profilePhotoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
      console.log("profilePhotoUrl:", profilePhotoUrl);
    } else {
      console.log("Фото профиля не найдено");
    }
  } catch (error) {
    console.log("Ошибка при получении фото профиля:", error.message);
    // Продолжаем работу, даже если не удалось получить фото
  }
  
  // Отправляем данные на backend
  try {
    await axios.post(`${process.env.API_URL}/api/user/create`, {
      telegramId: telegramId,
      telegramUserName: telegramUserName,
      referralTelegramId: startParam || null,
      profilePhotoUrl: profilePhotoUrl
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log("Пользователь успешно создан на backend");
  } catch (error) {
    console.error("Ошибка при создании пользователя на backend:", error.message);
  }

  // Отправляем сообщение с inline кнопкой для запуска WebApp
  // ctx.reply - это sendMessage, изменяет состояние, поэтому используем очередь
  try {
    await executeUserOperation(async () => {
      return await ctx.reply(
    `Портал .li активирован.\nЖми кнопку запуска👇`,
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 Открыть Портал .li',
            web_app: {
                  url: `https://portal.tochkali.com/main/?telegramId=${telegramId}&telegramUserName=${telegramUserName}`
            }
          }
        ]]
      }
    }
  );
    });
  } catch (error) {
    // Обрабатываем ошибку, если пользователь заблокировал бота
    if (error.response?.error_code === 403) {
      console.log(`⚠️ Пользователь ${telegramId} заблокировал бота. Сообщение не отправлено.`);
      // Не бросаем ошибку дальше, так как это нормальная ситуация
      return;
    }
    // Для других ошибок логируем и продолжаем
    console.error(`Ошибка отправки сообщения пользователю ${telegramId}:`, error.message);
  }
});

// Команда для удаления menu button (запустите /removemenu один раз)
bot.command('removemenu', async (ctx) => {
  try {
    // setChatMenuButton и ctx.reply изменяют состояние, поэтому используем очередь
    await executeUserOperation(async () => {
      return await bot.telegram.setChatMenuButton({
      menuButton: { type: "default" }
      });
    });
    await executeUserOperation(async () => {
      return await ctx.reply('✅ Menu button удалён глобально');
    });
  } catch (error) {
    try {
      await executeUserOperation(async () => {
        return await ctx.reply('❌ Ошибка при удалении menu button');
      });
    } catch (replyError) {
      console.error('Ошибка отправки сообщения об ошибке:', replyError);
    }
  }
});

// Бот запускается из server.js, поэтому здесь не запускаем
