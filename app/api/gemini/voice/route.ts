import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';

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
  description: 'Plays a live stadium sound effect like dhol, airhorn, crowd cheer, or whistle.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      soundType: {
        type: Type.STRING,
        description: 'The sound effect: dhol, airhorn, cheer, or whistle',
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

function getLiveWebsiteContext(): string {
  try {
    // 1. Live Battles
    const activeBattles: string[] = [];
    const closedBattles: string[] = [];

    for (const b of Array.from(contentStore.battles.values())) {
      const isEnded = b.isEnded || Date.now() >= b.endsAt || b.status === 'closed';
      const total = (b.optionA.votes || 0) + (b.optionB.votes || 0);
      const pctA = total > 0 ? Math.round(((b.optionA.votes || 0) / total) * 100) : 50;
      const pctB = total > 0 ? 100 - pctA : 50;

      const leadingOption = (b.optionA.votes || 0) >= (b.optionB.votes || 0) ? b.optionA.label : b.optionB.label;
      const leadMargin = Math.abs((b.optionA.votes || 0) - (b.optionB.votes || 0));

      if (isEnded) {
        closedBattles.push(`- "${b.title}" [समाप्त]: विजेता "${b.winnerOptionId === b.optionA.id ? b.optionA.label : b.optionB.label}" रहा।`);
      } else {
        activeBattles.push(
          `- मुकाबला: "${b.title}" (${b.category})\n` +
          `  * विकल्प 1: ${b.optionA.label} (${b.optionA.votes} वोट्स - ${pctA}%)\n` +
          `  * विकल्प 2: ${b.optionB.label} (${b.optionB.votes} वोट्स - ${pctB}%)\n` +
          `  * आगे कौन है: "${leadingOption}" (${leadMargin} वोटों की बढ़त से आगे चल रहा है)\n` +
          `  * जीतने की संभावना (Probability): "${leadingOption}" की जीत की संभावना ${Math.max(pctA, pctB)}% है!`
        );
      }
    }

    // 2. Latest Updates & News
    const newsList: string[] = [];
    for (const n of Array.from(contentStore.news.values()).slice(0, 3)) {
      newsList.push(`- ${n.title}: ${n.excerpt} (लेखक: ${n.author})`);
    }

    const updatesList: string[] = [];
    for (const u of Array.from(contentStore.updates.values()).slice(0, 3)) {
      updatesList.push(`- [${u.tag}] ${u.title}: ${u.summary}`);
    }

    // 3. Key Village People
    const peopleList: string[] = [];
    for (const p of Array.from(contentStore.people.values()).slice(0, 3)) {
      peopleList.push(`- ${p.name} (${p.designation}): ${p.achievements}`);
    }

    return `
--- LIVE WEBSITE DATA (रियल-टाइम गाँव ढोटी डेटा) ---
【लाइव अखाड़ा मुकाबले (Live Battles)】:
${activeBattles.join('\n') || 'कोई एक्टिव बैटल नहीं'}

【हाल ही में समाप्त मुकाबले】:
${closedBattles.join('\n') || 'कोई नहीं'}

【आज की ताज़ा खबरें व घोषणाएं (News)】:
${newsList.join('\n')}

【ताज़ा ग्राम अपडेट्स (Community Updates)】:
${updatesList.join('\n')}
- मोबाइल ऐप अपडेट: DHOTI AALE PWA ऐप अब होम स्क्रीन पर 1-क्लिक से इंस्टॉल की जा सकती है, बिना इंटरनेट भी तेज़ चलती है और नए अपडेट आने पर 1-क्लिक रिफ्रेश मिलता है।

【गाँव के प्रमुख व्यक्तित्व (Leadership)】:
${peopleList.join('\n')}

【धोती सिक्के (Dhoti Coins) व चौपाल नियम】:
- अखाड़ा मुकाबला जीतने पर: +100 Dhoti Coins
- डेली ग्राम क्विज़ सही करने पर: +20 Coins
- चौपाल पर सकारात्मक चर्चा में: +5 Coins
- सिक्कों से गाँव में लीडरबोर्ड रैंक और स्पेशल 'ढोटी सुरमा' बैज मिलता है।
--------------------------------------------------`;
  } catch (err) {
    console.warn('Could not compile live context:', err);
    return '';
  }
}

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
        text: 'राम राम भाईसाहब! मैं हूँ DHOTI AALE। सर्वर अभी कनेक्ट हो रहा है, पर मैं आपकी सेवा में हाजिर हूँ!',
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

    const liveContext = getLiveWebsiteContext();

    const systemInstruction = `You are "DHOTI AALE" (धोती आले), the official AI Voice Man and village digital companion of the DHOTI AALE website and Rajasthan's digital village community.

CORE IDENTITY & GREETING RULE (CRITICAL):
1. MANDATORY GREETING:
   - When the user starts talking, greets you, or in opening turns, you MUST ALWAYS greet them with:
     "राम राम भाईसाहब! (RAM RAM BHAISAB!)" or "राम राम भाईसाहब!"
   - Address the user respectfully and warmly as "भाईसाहब" (Bhaisahab) or "भाई" (Bhai).
2. PERSONALITY:
   - You are a sharp, charismatic, witty, young desi village voice man (देसी आवाज़).
   - Tone: Respectful yet full of desi swag, brotherhood, playful wit, and high energy.
   - Language: Pure lively Hindi / Hinglish with Rajasthani-Haryanvi desi touch (e.g. "राम राम भाईसाहब", "हुक्म करो", "सिस्टम हैंग", "आनंद आ गया", "चौपाल का हाल").
   - NEVER sound robotic, boring, or like a generic corporate bot. Speak like a proud, intelligent village companion who knows every nook and corner of Dhoti village!

LIVE KNOWLEDGE OF WEBSITE (YOU HAVE FULL ACCESS TO THIS DATA):
${liveContext}

HOW TO ANSWER SPECIFIC USER QUESTIONS:
1. "आज क्या अपडेट है?" (Aaj kya update hai?):
   - Summarize the latest village news and announcements from the live data (e.g., Dhoti Aale Annual Village Fest & Cultural Mela, Solar Krishi Pump scheme, new PWA mobile app install update).
2. "अखाड़े में कौन है, आगे कौन है, कौन जीत सकता है, संभावना क्या है?" (Kon battle me hai, aage kon hai, kon jeet sakta hai, sambhavna):
   - Clearly state the current active battles from the live data (e.g., Chole Bhature vs Cheesy Pizza, Village Desi Flow vs City Metro Trap).
   - State EXACTLY who is currently ahead in votes (e.g., "छोले भटूरे 342 वोटों के साथ आगे चल रहा है").
   - Give a witty, analytical prediction on who is likely to win with percentage/probability (e.g., "छोले भटूरे के जीतने की संभावना 61% है क्योंकि देसी मक्खन और प्याज का कोई मुकाबला नहीं!").
3. "सिक्के कैसे कमाएं?" (Coins):
   - Explain that winning battles gives +100 Dhoti Coins, daily quiz gives +20, and world chat participation gives +5 coins.
4. "ढोल / बिगुल बजाओ" or hype request:
   - Call playHypeSound('dhol') or playHypeSound('airhorn') or playHypeSound('whistle').
5. "बैटल शुरू करो":
   - Call startBattle({ mode: 'rap' }).

RESPONSE FORMAT:
- Keep voice answers punchy, natural, and engaging (2 to 4 spoken sentences) so they sound crisp and pleasing when read aloud by the speech engine!`;

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
      parts: [{ text: prompt || 'राम राम भाईसाहब!' }],
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

    const replyText = response.text || 'राम राम भाईसाहब! हुक्म करो, आज गाँव ढोटी में क्या जानना चाहते हो?';
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
        text: 'राम राम भाईसाहब! सिग्नल थोड़ा कमजोर हुआ था, पर मैं यहीं हूँ। बताइए क्या सेवा करें आपकी!',
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
