// Datos públicos que necesita la página (nunca claves).
export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300');
  res.status(200).json({
    telegramUrl: process.env.TELEGRAM_CHANNEL_URL || '',
  });
}
