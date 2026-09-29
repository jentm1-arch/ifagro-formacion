// Utilidades compartidas por las funciones del servidor.
// Los archivos que empiezan por "_" dentro de /api no se publican como rutas.

// Límite de uso sencillo en memoria, por IP.
// Es una protección básica para la demo pública: cada instancia del servidor
// guarda su propio contador, así que no es exacto, pero frena el abuso casual.
const buckets = new Map();

export function rateLimit(req, key, max, windowMs) {
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'anon';
  const id = `${key}:${ip}`;
  const now = Date.now();
  const hits = (buckets.get(id) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(id, hits);
    const retryMin = Math.ceil((windowMs - (now - hits[0])) / 60000);
    return { ok: false, retryMin };
  }
  hits.push(now);
  buckets.set(id, hits);
  return { ok: true };
}

// Nombre de usuario del bot (para invitar a hacer preguntas).
// Se pide una vez a Telegram con el token y se guarda en memoria.
let botUsername = null;
export async function getBotUsername() {
  if (botUsername) return botUsername;
  if (process.env.TELEGRAM_BOT_USERNAME) return (botUsername = process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, ''));
  if (!process.env.TELEGRAM_BOT_TOKEN) return '';
  try {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
    const d = await r.json();
    if (d.ok && d.result?.username) botUsername = d.result.username;
  } catch {}
  return botUsername || '';
}

export function onlyPost(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido' });
    return false;
  }
  return true;
}

export function missingEnv(res, names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    res.status(500).json({
      error: `Falta configurar en el servidor: ${missing.join(', ')}`,
    });
    return true;
  }
  return false;
}
