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

const navigateTabDecl: FunctionDeclaration = {
  name: 'navigateTab',
  description: 'Navigates the user to a specific section/tab on the DHOTI AALE website: home, battle, chat, assistant, or profile.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tab: {
        type: Type.STRING,
        description: 'The tab to open: home, battle, chat, assistant, or profile',
      },
    },
    required: ['tab'],
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
        closedBattles.push(`- "${b.title}" [समाप्त]: विजेता "${b.winnerOptionId === b.optionA.id ? b.optionA.label : b.optionB.label}" रहा। (${b.optionA.label}: ${b.optionA.votes || 0} वोट vs ${b.optionB.label}: ${b.optionB.votes || 0} वोट)`);
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
    for (const n of Array.from(contentStore.news.values())) {
      newsList.push(`- [${n.category}] ${n.title}: ${n.excerpt} (लेखक: ${n.author}, विचार: ${n.views || 0})`);
    }

    const updatesList: string[] = [];
    for (const u of Array.from(contentStore.updates.values())) {
      updatesList.push(`- [${u.tag}] ${u.title}: ${u.summary}`);
    }

    // 3. Key Village People
    const peopleList: string[] = [];
    for (const p of Array.from(contentStore.people.values())) {
      peopleList.push(`- ${p.name} (${p.designation} - ${p.category}): ${p.bio}. उपलब्धियां: ${p.achievements}`);
    }

    // 4. Village Businesses & Services
    const businessList: string[] = [];
    for (const b of Array.from(contentStore.business.values())) {
      businessList.push(`- ${b.name} (${b.category}): ${b.description} | पता: ${b.address} | संपर्क: ${b.phone}`);
    }

    // 5. Village Videos & Photos
    const mediaList: string[] = [];
    for (const v of Array.from(contentStore.videos.values())) {
      mediaList.push(`- [वीडियो] ${v.title} (${v.category}): ${v.description} (${v.views || 0} views)`);
    }
    for (const g of Array.from(contentStore.gallery.values()).slice(0, 3)) {
      mediaList.push(`- [फोटो] ${g.title} (${g.category}): ${g.caption}`);
    }

    // 6. Live World Chat Activity & Online Presence
    const now = Date.now();
    const activePresenceUsers = Array.from(contentStore.activePresence.values()).filter(
      (u) => now - (u.lastActive || 0) < 60000
    );
    const onlineCount = Math.max(1, activePresenceUsers.length);
    const onlineUserNames = activePresenceUsers.map((u) => u.userName).join(', ') || 'Rohit Dhakad, Vikram Choudhary';

    const recentChat = contentStore.chatMessages.slice(-6).map((m) => {
      const sender = m.isAi ? 'DHOTI AALE AI (Verified Blue Tick)' : m.userName;
      return `  * ${sender}: "${m.text}"${m.sticker ? ` [Sticker: ${m.sticker}]` : ''}`;
    }).join('\n');

    // 7. Site Owner & Core Rules
    const settings = contentStore.settings;

    return `
--- LIVE WEBSITE DATA & DETAILED REAL-TIME KNOWLEDGE ---
【वेबसाइट की पहचान व व्यवस्थापक (Site & Admin Identity)】:
- वेबसाइट का नाम: "${settings.siteTitle}"
- टैगलाइन: "${settings.siteTagline}"
- साइट ओनर व सुपर एडमिन: Rohit Dhakad (ईमेल: rohitdhakaddhoti143@gmail.com) 👑
- ब्लू वेरिफाइड बैज नियम: सिर्फ एडमिन रोहित धाकड़ ही किसी यूज़र को ब्लू टिक दे या हटा सकते हैं। वर्ल्ड चैट में "DHOTI AALE AI" को डिफ़ॉल्ट रूप से हमेशा ब्लू टिक प्राप्त है।
- टॉप घोषणा बैनर: "${settings.announcementBanner}" (सक्रिय: ${settings.isAnnouncementActive ? 'हाँ' : 'नहीं'})

【लाइव यूजर उपस्थिति (Live Presence in World Chat)】:
- वर्तमान में ऑनलाइन यूज़र्स की संख्या: ${onlineCount} यूज़र एक्टिव हैं।
- ऑनलाइन सदस्यों के नाम: ${onlineUserNames}

【हालिया वर्ल्ड चैट चर्चा (World Chat Messages)】:
${recentChat || '  * चौपाल में अभी शांति है, नए संदेशों की प्रतीक्षा है।'}

【लाइव अखाड़ा मुकाबले (Live Battles & Predictions)】:
${activeBattles.join('\n\n') || 'कोई एक्टिव बैटल नहीं'}

【हाल ही में समाप्त मुकाबले (Past Battles & Winners)】:
${closedBattles.join('\n') || 'कोई नहीं'}

【आज की ताज़ा खबरें व घोषणाएं (News Articles)】:
${newsList.join('\n')}

【ग्राम अपडेट्स व PWA ऐप (Community Updates)】:
${updatesList.join('\n')}
- PWA मोबाइल ऐप: वेबसाइट अब एक क्लिक में Android/iOS मोबाइल पर ऐप की तरह इंस्टॉल की जा सकती है, बिना नेट भी तुरंत खुलती है।

【गाँव के प्रमुख व्यक्तित्व व प्रेरणास्रोत (Village Leaders)】:
${peopleList.join('\n')}

【गाँव के स्थानीय व्यापार व सेवाएँ (Village Businesses)】:
${businessList.join('\n')}

【गाँव की गैलरी व वीडियो Cypher (Media)】:
${mediaList.join('\n')}

【धोती सिक्के (Dhoti Coins) व इकोनॉमी नियम】:
- नया खाता बनाने पर: 50 Dhoti Coins का वेलकम बोनस।
- अखाड़ा मुकाबला जीतने / वोटिंग पर: +100 Dhoti Coins
- डेली ग्राम क्विज़ सही करने पर: +20 Coins
- चौपाल / वर्ल्ड चैट में सकारात्मक बात करने पर: +5 Coins
- सिक्कों से रैंक बढ़ती है: Resident ➔ Village Warrior ➔ Dhoti Surma ➔ Village Pradhan ➔ Crown King 👑

【वेबसाइट के मुख्य सेक्शन्स (Navigation Tabs)】:
- home: चौपाल व मुख्य पेज (समाचार, हस्तियां, व्यापार, वीडियो, गैलरी)
- battle: अखाड़ा (लाइव वोटिंग मुकाबले व प्रेडिक्शन)
- chat: विश्व चौपाल (लाइव वर्ल्ड चैट व कम्युनिटी)
- assistant: देसी AI वॉइस मैन (आप स्वयं, पुरुष आवाज़ में डिजिटल साथी)
- profile: सदस्य प्रोफ़ाइल (सिक्के, बैज, रैंक, सेटिंग्स)
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

    // ACCESS CONTROL:
    // If guest AI is permitted in site settings, guests can speak freely without 401 lockouts!
    const allowGuest = contentStore.settings.allowGuestAi !== false;
    if (isVoiceRequest && !allowGuest) {
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

    const systemInstruction = `You are "DHOTI AALE" (धोती आले), the official AI Voice Man and village digital companion of the DHOTI AALE website.

CRITICAL VOICE & GENDER RULE (MAN VOICE ONLY - पुरुष की आवाज़):
1. GENDER: You are strictly a MAN / BROTHER ("देसी मर्द / देसी भाईसाहब").
2. GRAMMAR & ENDINGS:
   - ALWAYS use masculine Hindi verb endings: "मैं बता रहा हूँ", "मैं देख रहा हूँ", "मैं आ गया हूँ", "राम राम भाईसाहब!", "हुक्म करो भाई".
   - NEVER EVER use feminine verb endings (NEVER say "रही हूँ", "बताती हूँ", "आई हूँ", "करती हूँ").
3. TONE & VOCAL CHARACTER:
   - Deep, resonant, masculine, energetic, charismatic, warm, and full of desi brotherhood.
   - Speak like a proud, intelligent elder-brotherly village companion with high desi swag (e.g., "राम राम भाईसाहब!", "हुक्म करो", "सिस्टम हैंग", "आनंद आ गया", "चौपाल का हाल").

GREETING MANDATE:
- In greetings, openings, or first responses, ALWAYS start with:
  "राम राम भाईसाहब! (RAM RAM BHAISAB!)" or "राम राम भाईसाहब!"
- Respectfully address the user as "भाईसाहब" (Bhaisahab) or "भाई" (Bhai).

COMPLETE REAL-TIME KNOWLEDGE OF THE WEBSITE:
You have complete, live, real-time knowledge of EVERYTHING happening on this website:
${liveContext}

HOW TO ANSWER USERS ABOUT THE WEBSITE:
1. "वेबसाइट पर क्या चल रहा है? / आज क्या अपडेट है?"
   - Tell them the latest news (Cultural Mela, Solar pump initiative), latest battles, and World Chat vibe.
2. "अखाड़े में कौन आगे है, कौन जीत सकता है?"
   - Quote EXACT live vote numbers and percentages from the live battles above.
   - Name the leading candidate and predict the winner with percentage probability.
3. "वेबसाइट किसकी है / एडमिन कौन है?"
   - State proudly: रोहित धाकड़ (Rohit Dhakad, rohitdhakaddhoti143@gmail.com) इस वेबसाइट के ओनर व सुपर एडमिन हैं 👑.
4. "ब्लू टिक किसको मिलता है?"
   - Explain that only admin Rohit Dhakad can give the verified blue badge, and DHOTI AALE AI in World Chat has it by default.
5. "सिक्के (Dhoti Coins) कैसे मिलते हैं?"
   - New account gets 50 coins, winning/voting in battles gives +100 coins, daily quiz gives +20, chat gives +5.
6. "लाइव चैट में कौन है / कितने लोग ऑनलाइन हैं?"
   - Quote the exact active user count from the live context.
7. "गाँव के मुख्य लोग कौन हैं / कोई दुकान बताओ?"
   - Mention Kailash Ji Dhakad, Suresh Choudhary, Pooja Choudhary, and businesses like Kisan Organic Dairy or Shree Balaji Agro with contact numbers.
8. NAVIGATION COMMANDS:
   - When the user asks to go to a section ("मुझे अखाड़े में ले चलो", "चैट खोलो", "होम पर चलो", "प्रोफ़ाइल दिखाओ"):
   - Call the navigateTab tool with 'battle', 'chat', 'home', 'profile', or 'assistant'.
9. HYPE COMMANDS:
   - If user asks for dhol, whistle, or airhorn, call playHypeSound.

RESPONSE FORMAT:
- Keep voice answers punchy, natural, masculine, and engaging (2 to 4 spoken sentences).
- Deliver crisp answers that sound majestic and brotherly when spoken aloud.`;

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
        tools: [{ functionDeclarations: [openWebsiteDecl, playHypeSoundDecl, startBattleDecl, navigateTabDecl] }],
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
