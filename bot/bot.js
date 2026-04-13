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

/**
 * После /start до нажатия «Да, принимаю»: реферал и/или целевая страница приложения.
 * Deep link с страницей: t.me/bot?start=page_<base64url(utf8 пути)>, путь вида /client/profile
 * (в payload /start допустимы только A–Z, a–z, 0–9, _ и -).
 */
const pendingStartData = new Map();

// Deep link из подсказки с restart.jpg — не реферал, только повторный /start
const RESTART_HINT_START_PARAM = 'reopen';

function parseDeepLinkStart(startParam) {
  if (startParam == null || startParam === '') return {};
  const trimmed = String(startParam).trim();
  if (trimmed === RESTART_HINT_START_PARAM) return {};
  if (trimmed.startsWith('page_')) {
    const b64 = trimmed.slice(5);
    if (!b64) return {};
    try {
      const path = Buffer.from(b64, 'base64url').toString('utf8').trim();
      if (path.startsWith('/') && !path.startsWith('//') && !path.includes('..')) {
        return { pagePath: path };
      }
      console.warn('[start] page_: небезопасный или пустой путь после декодирования');
    } catch (e) {
      console.warn('[start] page_: ошибка base64url:', e.message);
    }
    return {};
  }
  return { referralTelegramId: trimmed };
}

function buildOpenSunWebAppUrl(telegramId, telegramUserName, pagePath) {
  const base = (process.env.APP_URL || '').replace(/\/$/, '');
  const u = new URL(`${base}/main/`);
  u.searchParams.set('telegramId', String(telegramId));
  if (telegramUserName) u.searchParams.set('telegramUserName', String(telegramUserName));
  if (pagePath && String(pagePath).trim()) {
    const p = String(pagePath).trim();
    u.searchParams.set('page', p.startsWith('/') ? p : `/${p}`);
  }
  return u.toString();
}

bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id;

  const startParam = ctx.startParam || (ctx.message?.text?.split(' ')[1] || null);
  const parsed = parseDeepLinkStart(startParam);
  if (Object.keys(parsed).length > 0) {
    pendingStartData.set(String(telegramId), parsed);
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

  const pending = pendingStartData.get(String(telegramId)) || {};
  pendingStartData.delete(String(telegramId));
  const { referralTelegramId, pagePath } = pending;

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
      referralTelegramId: referralTelegramId || undefined,
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
                  url: buildOpenSunWebAppUrl(telegramId, telegramUserName, pagePath)
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
          const userResp = await axios.get(
            `${process.env.API_URL}/api/user/telegram/${telegramId}`
          );
          const user = userResp.data?.user;
          if (user?.fullName && String(user.fullName).trim()) {
            return;
          }

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
    }, 15 * 60 * 1000);

    const FULLNAME_CHECK_BROADCAST_ID = '69900c3ea695ff7fbab477ac';
    setTimeout(() => {
      (async () => {
        try {
          const userResp = await axios.get(
            `${process.env.API_URL}/api/user/telegram/${telegramId}`
          );
          const user = userResp.data?.user;
          if (!user || (user.fullName && user.fullName.trim())) return;

          const bcResp = await axios.get(
            `${process.env.API_URL}/api/broadcast/${FULLNAME_CHECK_BROADCAST_ID}`
          );
          const bc = bcResp.data?.data;
          if (!bc || !bc.content) return;

          let content = bc.content
            .replace(/<\/div>\s*<div>/gi, '\n\n')
            .replace(/<\/?div>/gi, '');

          const mainAppRow = [
            {
              text: '☀️ Открыть Солнце',
              web_app: {
                url: `${process.env.APP_URL}/main/?telegramId=${telegramId}&telegramUserName=${encodeURIComponent(telegramUserName || '')}`,
              },
            },
          ];

          const msgOpts = { parse_mode: 'HTML' };
          const extraRows = [];
          if (bc.buttonText && bc.buttonUrl) {
            const appUrl = process.env.APP_URL || '';
            const isExternal =
              bc.buttonUrl &&
              (bc.buttonUrl.startsWith('http://') ||
                bc.buttonUrl.startsWith('https://') ||
                bc.buttonUrl.startsWith('t.me/')) &&
              !bc.buttonUrl.startsWith(appUrl);

            if (isExternal) {
              const btnUrl = bc.buttonUrl.startsWith('http') ? bc.buttonUrl : `https://${bc.buttonUrl}`;
              extraRows.push([{ text: bc.buttonText, url: btnUrl }]);
            } else {
              let webAppUrl = `${appUrl}/?telegramId=${telegramId}`;
              if (bc.buttonUrl) {
                let path = bc.buttonUrl.startsWith(appUrl)
                  ? bc.buttonUrl.slice(appUrl.length)
                  : bc.buttonUrl;
                if (path && path !== '/') {
                  webAppUrl += `&redirectTo=${encodeURIComponent(path)}`;
                }
              }
              extraRows.push([{ text: bc.buttonText, web_app: { url: webAppUrl } }]);
            }
          }
          msgOpts.reply_markup = {
            inline_keyboard: [mainAppRow, ...extraRows],
          };

          if (bc.imgUrl) {
            const fullImageUrl = bc.imgUrl.startsWith('http')
              ? bc.imgUrl
              : `${process.env.API_URL}${bc.imgUrl}`;
            const CAPTION_LIMIT = 1024;
            if (content && content.length > CAPTION_LIMIT) {
              await executeUserOperation(async () => {
                return await bot.telegram.sendPhoto(telegramId, fullImageUrl);
              });
              await executeUserOperation(async () => {
                return await bot.telegram.sendMessage(telegramId, content, msgOpts);
              });
            } else {
              await executeUserOperation(async () => {
                return await bot.telegram.sendPhoto(telegramId, fullImageUrl, {
                  caption: content,
                  parse_mode: 'HTML',
                  ...(msgOpts.reply_markup && { reply_markup: msgOpts.reply_markup }),
                });
              });
            }
          } else {
            await executeUserOperation(async () => {
              return await bot.telegram.sendMessage(telegramId, content, msgOpts);
            });
          }
          console.log(`[fullName-check] Рассылка отправлена пользователю ${telegramId} (fullName не заполнен через 1 час)`);
        } catch (err) {
          if (err.response?.status === 404 || err.response?.error_code === 403) return;
          console.error(`[fullName-check] Ошибка для пользователя ${telegramId}:`, err.message);
        }
      })();
    }, 60 * 60 * 1000);
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
