// Publica la formación en el canal de Telegram.
// Recibe un mensaje por llamada: la cabecera de la formación o una píldora (con su audio).
import { rateLimit, onlyPost, missingEnv } from './_lib.js';

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function tg(method, body, isForm = false) {
  const r = await fetch(`${API()}/${method}`, {
    method: 'POST',
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
    body: isForm ? body : JSON.stringify(body),
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.description || 'Error de Telegram');
  return data;
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  if (missingEnv(res, ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'])) return;

  const limit = rateLimit(req, 'telegram', Number(process.env.TG_PER_HOUR || 20), 60 * 60 * 1000);
  if (!limit.ok) {
    return res.status(429).json({ error: `Límite de envíos alcanzado. Prueba en ${limit.retryMin} min.` });
  }

  const chat_id = process.env.TELEGRAM_CHAT_ID;
  const { type, title, pillTitle, text, index, total, audioBase64 } = req.body || {};

  try {
    if (type === 'intro') {
      await tg('sendMessage', {
        chat_id,
        parse_mode: 'HTML',
        text: `🌱 <b>Nueva formación: ${esc(String(title || '').slice(0, 200))}</b>\n\n` +
          `Te llegan ${Number(total) || 3} píldoras de audio. Escúchalas cuando puedas, en el campo o en el tractor.`,
      });
      return res.status(200).json({ ok: true });
    }

    if (type === 'pill') {
      const head = `<b>Píldora ${Number(index) || 1} · ${esc(String(pillTitle || '').slice(0, 150))}</b>`;
      const body = esc(String(text || ''));
      const full = `${head}\n\n${body}`;
      // El pie de un audio admite 1024 caracteres: si no cabe, el texto va en un mensaje aparte
      const fits = full.length <= 1024;

      if (audioBase64) {
        const buf = Buffer.from(audioBase64, 'base64');
        const form = new FormData();
        form.append('chat_id', chat_id);
        form.append('parse_mode', 'HTML');
        form.append('caption', fits ? full : head);
        form.append('title', String(pillTitle || `Píldora ${index}`).slice(0, 60));
        form.append('performer', 'IF Agro');
        form.append('audio', new Blob([buf], { type: 'audio/mpeg' }), `pildora-${index}.mp3`);
        await tg('sendAudio', form, true);
        if (!fits) await tg('sendMessage', { chat_id, parse_mode: 'HTML', text: body.slice(0, 4000) });
      } else {
        // sin audio (se agotaron los créditos de voz): se envía solo el texto
        await tg('sendMessage', { chat_id, parse_mode: 'HTML', text: `${head}\n\n${body}`.slice(0, 4000) });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Tipo de mensaje no válido.' });
  } catch (e) {
    console.error('Telegram', e);
    return res.status(502).json({ error: 'No se pudo publicar en Telegram: ' + e.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};
