import axios from 'axios';

export const guessImageFilename = (imageUrl) => {
  const m = String(imageUrl).match(/\/([^/?#]+\.(jpe?g|png|gif|webp))(?:\?|#|$)/i);
  return m ? m[1] : 'photo.jpg';
};

/** Скачивание изображения на стороне бота — обход сбоев Telegram при sendPhoto(URL) с внешнего URL. */
export async function downloadImageBufferFromUrl(imageUrl) {
  const res = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 90000,
    maxContentLength: 25 * 1024 * 1024,
    maxBodyLength: 25 * 1024 * 1024,
  });
  const buf = Buffer.from(res.data);
  const ct = String(res.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!ct.startsWith('image/')) {
    throw new Error(`Ожидался image/*, получено: ${ct || 'пусто'}`);
  }
  return buf;
}
