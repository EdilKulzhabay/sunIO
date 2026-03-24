import { Telegraf, Input } from 'telegraf';
import 'dotenv/config';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeUserOperation } from './queue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESTART_IMAGE_PATH = path.join(__dirname, 'assets', 'restart.jpg');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Экспортируем бота для использования в других модулях
export default bot;

// Храним startParam для каждого пользователя, чтобы передать после согласия
const pendingStartParams = new Map();

// Deep link из подсказки с restart.jpg — не реферал, только повторный /start
const RESTART_HINT_START_PARAM = 'reopen';

bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id;

  const startParam = ctx.startParam || (ctx.message?.text?.split(' ')[1] || null);
  if (startParam && startParam !== RESTART_HINT_START_PARAM) {
    pendingStartParams.set(String(telegramId), startParam);
  }

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

  const consentText =
`Здравствуй! В Приложении «Солнце» ты сможешь пройти активацию сознания и узнать больше о проекте «Исцеление осознанием» Константина и Марины Павловых.

Чтобы мы продолжили, нам нужно твоё согласие – у нас тут всё по любви и по закону:

– <a href="https://psylife.io/privacy">Политика конфиденциальности</a>
– <a href="https://psylife.io/eula">Пользовательское соглашение</a>
– <a href="https://psylife.io/oferta">Оферта</a>
– <a href="https://psylife.io/mailing">Согласие на получение информационных и рекламных сообщений</a>
– <a href="https://psylife.io/gdpr">Согласие на обработку персональных данных</a>

Нажимая на кнопку «Да, принимаю», ты подтверждаешь своё согласие с документами выше и после этого сможешь подключиться к Приложению «Солнце».`;

  try {
    await executeUserOperation(async () => {
      return await ctx.reply(consentText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            { text: 'Да, принимаю', callback_data: 'consent_accept' }
          ]]
        }
      });
    });
  } catch (error) {
    if (error.response?.error_code === 403) {
      console.log(`⚠️ Пользователь ${telegramId} заблокировал бота.`);
      return;
    }
    console.error(`Ошибка отправки согласия пользователю ${telegramId}:`, error.message);
  }
});

bot.action('consent_accept', async (ctx) => {
  const telegramId = ctx.from.id;
  const telegramUserName = ctx.from.username;

  try {
    await ctx.answerCbQuery();
  } catch (e) { /* ignore */ }

  const startParam = pendingStartParams.get(String(telegramId)) || null;
  pendingStartParams.delete(String(telegramId));

  let profilePhotoUrl = null;
  try {
    const photos = await executeUserOperation(async () => {
      return await bot.telegram.getUserProfilePhotos(telegramId, { limit: 1 });
    });

    if (photos.total_count > 0 && photos.photos.length > 0) {
      const largestPhoto = photos.photos[0][photos.photos[0].length - 1];
      const file = await executeUserOperation(async () => {
        return await bot.telegram.getFile(largestPhoto.file_id);
      });
      profilePhotoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    }
  } catch (error) {
    console.log("Ошибка при получении фото профиля:", error.message);
  }

  try {
    await axios.post(`${process.env.API_URL}/api/user/create`, {
      telegramId,
      telegramUserName,
      referralTelegramId: startParam,
      profilePhotoUrl
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log("Пользователь успешно создан на backend");
  } catch (error) {
    console.error("Ошибка при создании пользователя на backend:", error.message);
  }

  try {
    await executeUserOperation(async () => {
      return await ctx.reply(
        `Солнце активировано.\nЖми кнопку запуска 👇`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '☀️ Открыть Солнце',
                web_app: {
                  url: `${process.env.APP_URL}/main/?telegramId=${telegramId}&telegramUserName=${telegramUserName}`
                }
              }
            ]]
          }
        }
      );
    });

    const chatId = ctx.chat.id;
    setTimeout(() => {
      (async () => {
        try {
          const me = await bot.telegram.getMe();
          const botUsername = me.username || process.env.BOT_USERNAME;
          if (!botUsername) {
            console.error('Не задан username бота: укажите BOT_USERNAME в .env или проверьте токен.');
            return;
          }
          const startHref = `https://t.me/${botUsername}?start=${RESTART_HINT_START_PARAM}`;
          const caption =
            'Если получено такое сообщение с ошибкой, то тебе необходимо нажать ' +
            `<a href="${startHref}">/start</a>` +
            ', а затем снова принять комплект документов и повторить регистрацию по кнопке ☀️ Открыть Солнце';

          await executeUserOperation(async () => {
            return await bot.telegram.sendPhoto(chatId, Input.fromLocalFile(RESTART_IMAGE_PATH), {
              caption,
              parse_mode: 'HTML'
            });
          });
        } catch (err) {
          if (err.response?.error_code === 403) {
            console.log(`⚠️ Пользователь ${telegramId} заблокировал бота (отложенное сообщение с restart.jpg).`);
            return;
          }
          console.error(`Ошибка отложенного сообщения с restart.jpg пользователю ${telegramId}:`, err.message);
        }
      })();
    }, 2 * 60 * 1000);
  } catch (error) {
    if (error.response?.error_code === 403) {
      console.log(`⚠️ Пользователь ${telegramId} заблокировал бота.`);
      return;
    }
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
