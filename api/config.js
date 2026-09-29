// Datos públicos que necesita la página (nunca claves).
import { getBotUsername } from './_lib.js';

export default async function handler(req, res) {
  const bot = await getBotUsername();
  res.setHeader('Cache-Control', 's-maxage=300');
  res.status(200).json({
    telegramUrl: process.env.TELEGRAM_CHANNEL_URL || '',
    botUsername: bot,
    botUrl: bot ? `https://t.me/${bot}` : '',
  });
}
