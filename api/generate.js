// Genera 3 píldoras formativas con Claude a partir del texto del PDF.
import { rateLimit, onlyPost, missingEnv } from './_lib.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
// Palabras por píldora en la demo (~40 s de audio). Con servicios de pago: 250–300.
const WORDS = process.env.PILL_WORDS || '80 y 100';
const MAX_INPUT_CHARS = 6000;

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  if (missingEnv(res, ['ANTHROPIC_API_KEY'])) return;

  const limit = rateLimit(req, 'generate', Number(process.env.GEN_PER_HOUR || 4), 60 * 60 * 1000);
  if (!limit.ok) {
    return res.status(429).json({
      error: `Has alcanzado el límite de pruebas de la demo. Vuelve a intentarlo en ${limit.retryMin} min.`,
    });
  }

  const { title, text } = req.body || {};
  if (!title || !text || typeof title !== 'string' || typeof text !== 'string') {
    return res.status(400).json({ error: 'Faltan el título o el contenido.' });
  }

  const prompt = `Eres un experto en formación agrícola. A partir del siguiente contenido, crea exactamente 3 píldoras formativas de audio para agricultores.

Título de la formación: "${title.slice(0, 200)}"

Contenido base:
${text.slice(0, MAX_INPUT_CHARS)}

---
INSTRUCCIONES:
- Cada píldora debe tener entre ${WORDS} palabras${process.env.PILL_WORDS ? '' : ' (es una versión de demostración, más corta de lo habitual)'}.
- Usa un lenguaje claro, cercano y práctico, como si hablaras con un agricultor en el campo. Evita la jerga técnica.
- Cada píldora tiene un título propio y desarrolla un aspecto diferente del contenido.
- Deben ser educativas, no publicitarias.
- No transcribas el contenido tal cual: reformúlalo para que sea fácil de escuchar.
- Escribe para ser leído en voz alta: sin listas, viñetas, emojis ni símbolos.

Responde ÚNICAMENTE con un array JSON, sin markdown ni texto adicional:
[{"titulo": "...", "texto": "..."}, {"titulo": "...", "texto": "..."}, {"titulo": "...", "texto": "..."}]`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('Claude API', r.status, data);
      return res.status(502).json({ error: 'El servicio de IA no respondió correctamente. Inténtalo de nuevo.' });
    }

    const raw = (data.content || []).map((b) => b.text || '').join('');
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Respuesta sin JSON');
    const capsulas = JSON.parse(match[0])
      .filter((c) => c && c.titulo && c.texto)
      .slice(0, 3)
      .map((c) => ({ titulo: String(c.titulo), texto: String(c.texto) }));
    if (capsulas.length === 0) throw new Error('JSON vacío');

    return res.status(200).json({ capsulas });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'No se pudieron generar las píldoras. Inténtalo de nuevo.' });
  }
}
