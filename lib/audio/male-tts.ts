import crypto from 'crypto';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

function generateSecMsGec(): string {
  const ticks = Math.floor(Date.now() / 1000) + 11644473600;
  const rounded = ticks - (ticks % 300);
  const windowsTicks = rounded * 10000000;
  return crypto
    .createHash('sha256')
    .update(`${windowsTicks}${TRUSTED_CLIENT_TOKEN}`)
    .digest('hex')
    .toUpperCase();
}

/**
 * Server-side Neural Male Hindi Voice Generator
 * Uses Microsoft's premier Indian Male Hindi Voice: "hi-IN-MadhurNeural"
 * Produces 100% authentic, studio-quality Indian male voice across all devices!
 * Implemented using Node's native WebSocket for zero-dependency speed and reliability.
 */
export async function generateMaleHindiSpeechBase64(text: string): Promise<string | null> {
  if (!text || typeof text !== 'string') return null;

  try {
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    if (!cleanText) return null;

    const secMsGec = generateSecMsGec();
    const connectionId = crypto.randomUUID().replace(/-/g, '');
    const url = `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-143.0.3650.96&ConnectionId=${connectionId}`;

    return await new Promise<string | null>((resolve) => {
      let isSettled = false;
      const chunks: Buffer[] = [];
      const requestId = crypto.randomBytes(16).toString('hex');

      let ws: any = null;
      try {
        ws = new (WebSocket as any)(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
            Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
          },
        });
      } catch (err) {
        console.warn('Male TTS WS creation notice:', err);
        return resolve(null);
      }

      const cleanup = () => {
        if (ws) {
          try {
            ws.close();
          } catch {}
          ws = null;
        }
      };

      const timeout = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          console.warn('Male TTS generation timed out after 6s');
          resolve(null);
        }
      }, 6000);

      ws.onopen = () => {
        if (!ws) return;
        // 1. Send speech.config
        const configMsg =
          `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: 'false',
                    wordBoundaryEnabled: 'false',
                  },
                  outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
                },
              },
            },
          });
        ws.send(configMsg);

        // 2. Send SSML request
        const escapedText = cleanText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        const ssml =
          `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN">` +
          `<voice name="hi-IN-MadhurNeural"><prosody pitch="+0Hz" rate="+0%" volume="+0%">${escapedText}</prosody></voice></speak>`;

        const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
        ws.send(ssmlMsg);
      };

      ws.onmessage = async (event: MessageEvent) => {
        if (isSettled) return;
        const data = event.data;

        if (typeof data === 'string') {
          if (data.includes('Path:turn.end')) {
            isSettled = true;
            clearTimeout(timeout);
            cleanup();
            if (chunks.length === 0) {
              resolve(null);
            } else {
              const fullBuffer = Buffer.concat(chunks);
              resolve(fullBuffer.toString('base64'));
            }
          }
        } else if (
          data instanceof ArrayBuffer ||
          (typeof Blob !== 'undefined' && data instanceof Blob) ||
          Buffer.isBuffer(data)
        ) {
          let buffer: Buffer;
          if (typeof Blob !== 'undefined' && data instanceof Blob) {
            buffer = Buffer.from(await data.arrayBuffer());
          } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
          } else {
            buffer = data as Buffer;
          }

          const audioDelim = 'Path:audio\r\n';
          const delimIdx = buffer.indexOf(audioDelim);
          if (delimIdx !== -1) {
            const audioData = buffer.subarray(delimIdx + audioDelim.length);
            if (audioData.length > 0) {
              chunks.push(audioData);
            }
          }
        }
      };

      ws.onerror = (err: any) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeout);
          cleanup();
          console.warn('Male TTS WS notice:', err);
          resolve(null);
        }
      };

      ws.onclose = () => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeout);
          cleanup();
          if (chunks.length > 0) {
            resolve(Buffer.concat(chunks).toString('base64'));
          } else {
            resolve(null);
          }
        }
      };
    });
  } catch (err) {
    console.warn('Male TTS initialization notice:', err);
    return null;
  }
}
