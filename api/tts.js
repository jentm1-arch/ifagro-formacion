// Convierte el texto de una píldora en audio MP3 con ElevenLabs.
import { rateLimit, onlyPost, missingEnv } from './_lib.js';

// Flash v2.5 habla español y consume la mitad de créditos que multilingual_v2,
// lo que duplica las pruebas posibles con el plan gratuito.
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';
const VOICE = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
// Tope por píldora para proteger los créditos (versión completa: ~2200)
const MAX_CHARS = Number(process.env.TTS_MAX_CHARS || 900);

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  if (missingEnv(res, ['ELEVENLABS_API_KEY'])) return;

  const limit = rateLimit(req, 'tts', Number(process.env.TTS_PER_HOUR || 12), 60 * 60 * 1000);
  if (!limit.ok) {
    return res.status(429).json({ error: 'Límite de audios alcanzado', fallback: true });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Falta el texto.' });
  }

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.slice(0, MAX_CHARS),
        model_id: MODEL,
        language_code: 'es',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('ElevenLabs', r.status, detail);
      // fallback: el navegador leerá el texto con su propia voz
      return res.status(502).json({ error: 'Servicio de voz no disponible', fallback: true });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error generando el audio', fallback: true });
  }
}
