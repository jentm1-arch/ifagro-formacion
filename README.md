# IF Agro — Microformaciones agrícolas en audio

Prototipo de producto: un técnico sube un PDF, la plataforma lo convierte en **3 píldoras formativas de audio** y las envía por **Telegram** al móvil de los agricultores.

**Cómo funciona:** PDF.js (lee el PDF en el navegador) → Claude (adapta el contenido) → ElevenLabs (le pone voz) → Telegram Bot API (lo entrega).

Las claves de API viven **solo en el servidor** (Vercel), así que cualquier persona puede probar la demo sin configurar nada.

---

## Guía de puesta en marcha (unos 30 minutos, sin programar)

### 0. Qué vas a necesitar

| Servicio | Para qué | Coste |
|---|---|---|
| GitHub | Guardar el código | Gratis |
| Vercel | Publicar la web y ocultar las claves | Gratis (plan Hobby) |
| Anthropic (Claude) | Generar las píldoras | De pago por uso: basta con cargar 5 $. Cada prueba cuesta alrededor de 1 céntimo |
| ElevenLabs | Poner voz a las píldoras | Plan gratuito (unos 10.000 créditos al mes) |
| Telegram | Entregar la formación | Gratis |

---

### 1. Consigue las claves de API

**Claude (Anthropic)**
1. Entra en https://console.anthropic.com y crea una cuenta.
2. En *Billing*, carga crédito (el mínimo es suficiente).
3. **Recomendado:** en *Limits*, pon un límite de gasto mensual (por ejemplo, 5 $). Así una demo pública nunca te dará sustos.
4. En *API Keys*, pulsa *Create Key* y copia la clave (empieza por `sk-ant-`). Guárdala: solo se muestra una vez.

**ElevenLabs**
1. Entra en https://elevenlabs.io y crea una cuenta gratuita.
2. Ve a tu perfil y abre *API Keys*. Crea una clave y cópiala.
3. *(Opcional)* En *Voices* elige una voz que suene bien en español y copia su **Voice ID**. Si no lo haces, se usa una voz por defecto.

---

### 2. Crea el bot y el canal de Telegram

Así es como la formación le llega a **cualquier persona**, y no solo a ti: la gente se une a un canal, y el bot publica en él.

1. En Telegram, busca **@BotFather**, escribe `/newbot` y sigue los pasos. Al final te da un **token** (algo como `123456789:AAE...`). Ese es tu `TELEGRAM_BOT_TOKEN`.
   - Si ya tienes el bot de la prueba anterior, puedes reutilizarlo. Si perdiste el token, escribe `/mybots` en @BotFather, elige el bot y pulsa *API Token*.
2. Crea un **canal**: pulsa el lápiz o *Nuevo* → *Nuevo canal*. Ponle un nombre (por ejemplo, «IF Agro · Formación»).
3. Hazlo **público** y elige un enlace, por ejemplo `t.me/ifagro_formacion`.
4. Entra en el canal y ve a *Administradores* → *Añadir administrador*. Busca tu bot por su nombre de usuario y dale permiso para **publicar mensajes**.

Anota estos dos valores:
- `TELEGRAM_CHAT_ID` = `@ifagro_formacion` (con @)
- `TELEGRAM_CHANNEL_URL` = `https://t.me/ifagro_formacion`

---

### 3. Sube el código a GitHub

1. Crea una cuenta en https://github.com si no la tienes.
2. Pulsa **New repository**. Llámalo `ifagro-formacion`, déjalo en **Public** y pulsa *Create repository*.
3. En la página del repositorio vacío, pulsa **uploading an existing file**.
4. Descomprime el ZIP en tu ordenador y **arrastra todo su contenido** a la ventana: `index.html`, `package.json`, `README.md`, `ejemplo-formacion.pdf` y la carpeta `api` completa.
   - Ojo: la carpeta `api` debe quedar en la raíz del repositorio, no dentro de otra carpeta.
5. Pulsa **Commit changes**.

---

### 4. Publica la web en Vercel

1. Entra en https://vercel.com y regístrate con **Continue with GitHub**.
2. Pulsa **Add New… → Project** e importa el repositorio `ifagro-formacion`.
3. En *Framework Preset*, deja **Other**. No cambies nada más de la configuración de build.
4. Despliega **Environment Variables** y añade una por una:

| Nombre | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | tu clave `sk-ant-...` |
| `ELEVENLABS_API_KEY` | tu clave de ElevenLabs |
| `TELEGRAM_BOT_TOKEN` | el token de @BotFather |
| `TELEGRAM_CHAT_ID` | `@tu_canal` |
| `TELEGRAM_CHANNEL_URL` | `https://t.me/tu_canal` |
| `ELEVENLABS_VOICE_ID` | *(opcional)* el Voice ID elegido |

5. Pulsa **Deploy**. En un minuto tendrás una dirección del tipo `https://ifagro-formacion.vercel.app`. **Ese es el enlace que pones en el CV.**

> Si más adelante cambias alguna variable, tienes que volver a desplegar para que se aplique: *Deployments* → los tres puntos del último despliegue → *Redeploy*.

---

### 5. Prueba tú primero

1. Abre tu enlace de Vercel en el ordenador.
2. Escanea el QR con el móvil y únete al canal.
3. Pulsa **Usar contenido de ejemplo** → **Generar 3 píldoras** → escucha las píldoras → **Enviar por Telegram**.
4. Deberían llegarte al móvil un mensaje de cabecera y tres audios.

Si algo falla, el mensaje de error de la página indica qué falta. En Vercel también puedes ver los detalles en *Project* → *Logs*.

---

## Preguntas de los agricultores (Make)

Las dudas las resuelve un escenario de Make aparte, **IFAgro_Preguntas**: Telegram (mensaje privado al bot) → Claude (redacta la respuesta) → ElevenLabs (la convierte en audio) → Telegram (responde con el audio).

- Tiene un filtro para responder **solo a chats privados**, de modo que no reacciona a lo que se publica en el canal.
- Procesa los mensajes **en orden**, de uno en uno, para no pasarse del límite de audios simultáneos de ElevenLabs.
- Al final de cada formación, la plataforma publica en el canal una invitación a escribirle al bot. La web también muestra un botón «Preguntar al asistente». El nombre del bot se obtiene automáticamente del token.

## Cómo se controla el gasto de la demo

- **Píldoras recortadas:** cada una dura unos 40 segundos (entre 80 y 100 palabras), y la página avisa de ello.
- **Voz más barata:** se usa el modelo `eleven_flash_v2_5` de ElevenLabs, que habla español y consume la mitad de créditos. Con el plan gratuito salen aproximadamente **10 pruebas completas al mes**.
- **Si se acaban los créditos de voz, la demo no se rompe.** Las píldoras se escuchan con la voz del navegador, a Telegram se envían como texto y la página lo explica.
- **Límite por visitante:** 4 generaciones por hora y por IP.
- **Límite de gasto en Anthropic:** el que pusiste en el paso 1.

## Pasar a la versión completa (píldoras de 2–3 minutos)

Cuando contrates los servicios de pago, basta con añadir estas variables en Vercel y volver a desplegar:

| Variable | Valor |
|---|---|
| `PILL_WORDS` | `250 y 350` |
| `TTS_MAX_CHARS` | `2400` |
| `ELEVENLABS_MODEL` | `eleven_multilingual_v2` *(más calidad; opcional)* |
| `GEN_PER_HOUR` | el límite de generaciones por hora que quieras |

Recuerda también quitar el aviso de «versión de prueba» del principio de `index.html`.

## Otras variables opcionales

- `ANTHROPIC_MODEL`: el modelo de Claude. Por defecto, `claude-sonnet-5`.
- `TTS_PER_HOUR` y `TG_PER_HOUR`: los límites por hora y por IP para los audios y los envíos.

## A tener en cuenta

- **El canal es público:** cualquier persona unida verá las formaciones que envíen los demás visitantes. Para una demo es lo deseable, y como administradora puedes borrar mensajes cuando quieras.
- **El historial se guarda solo en el navegador de cada visitante.**
- **En producción**, cada técnico tendría su propio canal o grupo de agricultores, habría inicio de sesión y las formaciones se guardarían en una base de datos.

## Estructura

```
index.html              La plataforma (la interfaz)
ejemplo-formacion.pdf   PDF de prueba descargable
api/generate.js         Claude → 3 píldoras (JSON)
api/tts.js              ElevenLabs → audio MP3
api/telegram.js         Publica en el canal de Telegram
api/config.js           Enlace público del canal (para el QR)
api/_lib.js             Límites de uso y utilidades
```
