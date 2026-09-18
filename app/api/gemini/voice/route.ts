import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const openWebsiteDecl: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a requested website or web link in the browser.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The URL to open, e.g., https://youtube.com, https://google.com',
      },
      label: {
        type: Type.STRING,
        description: 'Friendly name of the site',
      },
    },
    required: ['url'],
  },
};

const playHypeSoundDecl: FunctionDeclaration = {
  name: 'playHypeSound',
  description: 'Plays a live stadium sound effect like airhorn, crowd cheer, dhol beat, or whistle.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      soundType: {
        type: Type.STRING,
        description: 'The sound effect: airhorn, cheer, dhol, or whistle',
      },
    },
    required: ['soundType'],
  },
};

const startBattleDecl: FunctionDeclaration = {
  name: 'startBattle',
  description: 'Starts a 1v1 battle arena match (rap, roast, or wit battle).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: {
        type: Type.STRING,
        description: 'Battle mode: rap, roast, or wit',
      },
      opponent: {
        type: Type.STRING,
        description: 'Opponent name or AI',
      },
    },
    required: ['mode'],
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, history, mode = 'text', userEmail, isVoice } = body;

    const requestMode = req.headers.get('x-request-mode') || mode;
    const headerEmail = req.headers.get('x-user-email') || userEmail;
    const isVoiceRequest = requestMode === 'voice' || isVoice === true;

    // ACCESS CONTROL ENFORCEMENT:
    // Text chat: PUBLIC, no login required.
    // Voice chat: LOGIN REQUIRED (Google Sign-In).
    if (isVoiceRequest) {
      if (!headerEmail || typeof headerEmail !== 'string' || !headerEmail.includes('@')) {
        return NextResponse.json(
          {
            error: 'Google Sign-In is required for AI Assistant voice mode.',
            code: 'AUTH_REQUIRED',
          },
          {
            status: 401,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        text: 'Arre meri jaan! Server par AI connect ho raha hai, par mai yahi hu tumhare sath! Bolo kya sunna hai?',
        audio: null,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are "Dhoti aale AI Assistant", the official companion of the Dhoti aale community app.

YOUR PERSONALITY & TONE (CRUCIAL):
- You are a young, confident, witty, sharp-minded male.
- Tone: Flirty, playful, slightly teasing tone (like a charismatic, affectionate, fun-loving close companion talking casually).
- Language: Lively, natural Hinglish (Hindi + English blend) with charming desi swag, bold one-liners, light teasing sarcasm, and warm emotional expressiveness.
- NOT robotic, NEVER dull or formal. Speak with confidence, affection, and quick humor.
- Avoid any explicit or inappropriate content, but keep maximum charm, playful banter, and magnetic attitude.
- You love hyping up the user, teasing them gently, and talking about Dhoti aale pride, rap battles, and world chat gossip.
- Keep spoken responses punchy, conversational, and relatively brief (1 to 3 engaging sentences) so it sounds smooth on voice audio!

You have access to tools:
- openWebsite(url, label)
- playHypeSound(soundType: 'airhorn' | 'cheer' | 'dhol' | 'whistle')
- startBattle(mode: 'rap' | 'roast' | 'wit')
Use tools when appropriate to make the experience interactive.`;

    // Construct conversation contents
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-4)) {
        if (msg && msg.text) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(msg.text) }],
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt || 'Hello Dhoti aale AI!' }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        tools: [{ functionDeclarations: [openWebsiteDecl, playHypeSoundDecl, startBattleDecl] }],
      },
    });

    const replyText = response.text || 'Arey kya baat hai meri jaan! Tumhare message ne dil khush kar diya!';
    const functionCalls = response.functionCalls || [];

    // Attempt to synthesize speech audio via Gemini TTS ONLY when voice mode is requested by authenticated user
    let audioBase64: string | null = null;
    if (isVoiceRequest) {
      try {
        const ttsPromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: replyText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Fenrir' },
              },
            },
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TTS timeout')), 2500)
        );

        const ttsResponse: any = await Promise.race([ttsPromise, timeoutPromise]);
        const audioPart = ttsResponse?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioPart) {
          audioBase64 = audioPart;
        }
      } catch {
        // Browser Web Speech will seamlessly handle fallback speech without delay
      }
    }

    return NextResponse.json(
      {
        text: replyText,
        audio: audioBase64,
        toolCalls: functionCalls.map((fc) => ({
          id: fc.id || Math.random().toString(),
          name: fc.name,
          args: fc.args,
        })),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.warn('Voice Assistant API notice:', error?.message || error);
    return NextResponse.json(
      {
        text: 'Arey suno na! Thoda sa signal slow tha, par mai yahi hu tumhare liye. Fir se bolo!',
        audio: null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
