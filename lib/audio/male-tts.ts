import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * Server-side Neural Male Hindi Voice Generator
 * Uses Microsoft's premier Indian Male Hindi Voice: "hi-IN-MadhurNeural"
 * Produces 100% authentic, studio-quality Indian male voice across all devices!
 */
export async function generateMaleHindiSpeechBase64(text: string): Promise<string | null> {
  if (!text || typeof text !== 'string') return null;

  try {
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) return null;

    const tts = new MsEdgeTTS();
    await tts.setMetadata('hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const stream = tts.toStream(cleanText);

    return await new Promise<string | null>((resolve) => {
      const chunks: Buffer[] = [];
      const timeout = setTimeout(() => {
        resolve(null);
      }, 6000);

      stream.audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.audioStream.on('end', () => {
        clearTimeout(timeout);
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString('base64'));
      });

      stream.audioStream.on('error', (err) => {
        clearTimeout(timeout);
        console.warn('Male TTS generation notice:', err?.message || err);
        resolve(null);
      });
    });
  } catch (err) {
    console.warn('Male TTS initialization notice:', err);
    return null;
  }
}
