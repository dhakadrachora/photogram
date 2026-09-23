import { NextRequest, NextResponse } from 'next/server';
import { generateMaleHindiSpeechBase64 } from '@/lib/audio/male-tts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text : '';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    const audioBase64 = await generateMaleHindiSpeechBase64(text);

    return NextResponse.json(
      {
        audio: audioBase64,
        voice: 'hi-IN-MadhurNeural',
        gender: 'male',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.warn('TTS API notice:', error?.message || error);
    return NextResponse.json(
      { error: 'TTS generation failed', audio: null },
      { status: 500 }
    );
  }
}
