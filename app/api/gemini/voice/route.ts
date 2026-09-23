import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';
import { generateMaleHindiSpeechBase64 } from '@/lib/audio/male-tts';

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
  description: 'Navigates the user to a specific section/tab on the DHOTI AALE website: home, battle, chat, rewards, assistant, or profile.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tab: {
        type: Type.STRING,
        description: 'The tab to open: home, battle, chat, rewards, assistant, or profile',
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
      const isEnded = Boolean(b.isEnded) || Boolean(b.endsAt && Date.now() >= b.endsAt) || b.status === 'closed';
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
    const onlineUserNames = activePresenceUsers.map((u) => u.userName).join(', ') || 'DHOTI AALE Admin, Vikram Choudhary';

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
- साइट ओनर व सुपर एडमिन: DHOTI AALE Admin Team 👑
- ब्लू वेरिफाइड बैज नियम: सिर्फ एडमिन टीम ही किसी यूज़र को ब्लू टिक दे या हटा सकती है। वर्ल्ड चैट में "DHOTI AALE AI" को डिफ़ॉल्ट रूप से हमेशा ब्लू टिक प्राप्त है।
- टॉप घोषणा बैनर: "${settings.announcementBanner}" (सक्रिय: ${settings.isAnnouncementActive ? 'हाँ' : 'नहीं'})

【100 फ्री इंस्टाग्राम रील्स व्यूज बूस्टर (Instagram Reels Booster - Rewards Page)】:
- स्थान: Rewards (रिवॉर्ड्स) पेज।
- सर्विस: हर रील पर 100 फ्री इंस्टाग्राम रील्स व्यूज (CheapSMMHub Service ID 4436)।
- शर्त: केवल वैध Instagram Reel URL मान्य है।
- स्पॉन्सर ऐड: व्यूज सबमिट करने से पहले 15 सेकंड का स्पॉन्सर ऐड/स्मार्टलिंक देखा जाता है।
- कूलडाउन नियम: एक ही रील लिंक पर 3 घंटे का कूलडाउन रहता है, लेकिन यूजर अलग-अलग रील्स पर असीमित (UNLIMITED) बार 100-100 व्यूज बढ़ा सकता है!
- लाइव ऑर्डर ट्रैकर: रिवॉर्ड्स पेज पर ही रील लिंक डालकर ऑर्डर का लाइव स्टेटस (Pending, In Progress, Completed) चेक कर सकते हैं।
- लाइव लीडरबोर्ड: आज के सभी बूस्टेड ऑर्डर्स का रियल टाइम रिकॉर्ड रिवॉर्ड्स पेज पर लाइव दिखता है।

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
- rewards: 100 फ्री इंस्टाग्राम रील्स व्यूज बूस्टर, लाइव ट्रैकर व लीडरबोर्ड
- chat: विश्व चौपाल (लाइव वर्ल्ड चैट व कम्युनिटी)
- assistant: देसी AI वॉइस मैन (आप स्वयं, पुरुष आवाज़ में डिजिटल साथी)
- profile: सदस्य प्रोफ़ाइल (सिक्के, बैज, रैंक, सेटिंग्स)
--------------------------------------------------`;
  } catch (err) {
    console.warn('Could not compile live context:', err);
    return '';
  }
}

/**
 * Intelligent Local Knowledge Engine for DHOTI AALE AI
 * Provides accurate, instant answers in a deep masculine brotherly Hindi tone even if Gemini API key is absent/rate-limited!
 */
function generateIntelligentWebsiteAnswer(rawPrompt: string): { text: string; toolCalls?: any[] } {
  const q = (rawPrompt || '').toLowerCase().trim();

  // 0. Just greeting or how are you
  if (q.includes('kaise ho') || q.includes('kya hal') || q.includes('haal chal') || q.includes('कैसे हो') || q.includes('हाल चाल')) {
    return {
      text: 'बढ़िया भाईसाहब! आप बताओ, क्या हाल-चाल है आपका?',
    };
  }
  if (!q || q === 'राम राम' || q === 'राम राम भाई' || q === 'ram ram' || q === 'hello' || q === 'namaste') {
    return {
      text: 'राम राम भाईसाहब! बोलिए क्या बात है?',
    };
  }

  // 1. Instagram Reels Views Booster / 100 Views / Rewards Page
  if (
    q.includes('view') ||
    q.includes('reel') ||
    q.includes('insta') ||
    q.includes('100') ||
    q.includes('reward') ||
    q.includes('बढ़ा') ||
    q.includes('व्यू') ||
    q.includes('रील') ||
    q.includes('रिवॉर्ड')
  ) {
    return {
      text: 'रिवॉर्ड्स पेज पर जाकर अपनी रील का लिंक डालो भाईसाहब, 100 फ्री व्यूज तुरंत क्लेम हो जाएंगे!',
      toolCalls: [{ id: 'tc-rewards', name: 'navigateTab', args: { tab: 'rewards' } }],
    };
  }

  // 2. Order status / tracking
  if (
    q.includes('order') ||
    q.includes('status') ||
    q.includes('track') ||
    q.includes('check') ||
    q.includes('ऑर्डर') ||
    q.includes('स्टेटस') ||
    q.includes('ट्रैक')
  ) {
    return {
      text: 'रिवॉर्ड्स पेज पर "Live Order Tracker" में रील का लिंक डालकर लाइव स्टेटस देख लो भाईसाहब!',
      toolCalls: [{ id: 'tc-rewards', name: 'navigateTab', args: { tab: 'rewards' } }],
    };
  }

  // 3. Leaderboard
  if (
    q.includes('leadboard') ||
    q.includes('leaderboard') ||
    q.includes('लीडरबोर्ड') ||
    q.includes('रिकॉर्ड')
  ) {
    return {
      text: 'रिवॉर्ड्स पेज पर नीचे आज का लाइव लीडरबोर्ड दिख रहा है भाईसाहब!',
      toolCalls: [{ id: 'tc-rewards', name: 'navigateTab', args: { tab: 'rewards' } }],
    };
  }

  // 4. Battles / Akhada / Who is winning
  if (
    q.includes('battle') ||
    q.includes('akhada') ||
    q.includes('vote') ||
    q.includes('जीत') ||
    q.includes('आगे') ||
    q.includes('अखाड़ा') ||
    q.includes('मुकाबला')
  ) {
    const battles = Array.from(contentStore.battles.values());
    const active = battles.find((b) => !b.isEnded && (!b.endsAt || Date.now() < b.endsAt));
    if (active) {
      const leader = (active.optionA.votes || 0) >= (active.optionB.votes || 0) ? active.optionA.label : active.optionB.label;
      return {
        text: `अखाड़े में "${active.title}" का मुकाबला चल रहा है भाईसाहब, और "${leader}" आगे चल रहा है! तुरंत जाकर वोट दो!`,
        toolCalls: [{ id: 'tc-battle', name: 'navigateTab', args: { tab: 'battle' } }],
      };
    }

    return {
      text: 'अखाड़े में जोरदार मुकाबले चल रहे हैं भाईसाहब, जाकर वोट दो और सिक्के जीतो!',
      toolCalls: [{ id: 'tc-battle', name: 'navigateTab', args: { tab: 'battle' } }],
    };
  }

  // 5. Site Owner / Admin / Blue Tick
  if (
    q.includes('owner') ||
    q.includes('admin') ||
    q.includes('kiska') ||
    q.includes('kiski') ||
    q.includes('malik') ||
    q.includes('मालिक') ||
    q.includes('एडमिन') ||
    q.includes('ब्लू टिक') ||
    q.includes('blue tick')
  ) {
    return {
      text: 'यह DHOTI AALE एडमिन टीम का डिजिटल मंच है भाईसाहब!',
    };
  }

  // 6. World Chat / Gaon Choupal
  if (
    q.includes('chat') ||
    q.includes('chaupal') ||
    q.includes('online') ||
    q.includes('चैट') ||
    q.includes('चौपाल') ||
    q.includes('बात') ||
    q.includes('मैसेज')
  ) {
    return {
      text: 'विश्व चौपाल खुली है भाईसाहब, आइए बात करते हैं!',
      toolCalls: [{ id: 'tc-chat', name: 'navigateTab', args: { tab: 'chat' } }],
    };
  }

  // 7. Dhoti Coins / Rewards / Money
  if (
    q.includes('coin') ||
    q.includes('sikka') ||
    q.includes('sikke') ||
    q.includes('सिक्का') ||
    q.includes('सिक्के') ||
    q.includes('पैसे')
  ) {
    return {
      text: 'वोट देने, क्विज खेलने और चौपाल में बात करने पर धोती सिक्के मिलते हैं भाईसाहब!',
    };
  }

  // 8. Sounds / Hype
  if (q.includes('dhol') || q.includes('ढोल')) {
    return {
      text: 'लीजिए भाईसाहब, अखाड़े का देसी ढोल बज गया! 🥁',
      toolCalls: [{ id: 'tc-dhol', name: 'playHypeSound', args: { soundType: 'dhol' } }],
    };
  }
  if (q.includes('horn') || q.includes('airhorn') || q.includes('हॉर्न') || q.includes('बिगुल')) {
    return {
      text: 'ये लो भाई, बिगुल फूँक दिया! 📯',
      toolCalls: [{ id: 'tc-horn', name: 'playHypeSound', args: { soundType: 'airhorn' } }],
    };
  }

  // Default Short Answer
  return {
    text: 'राम राम भाईसाहब! बोलिए, क्या सेवा करें?',
  };
}

export async function POST(req: NextRequest) {
  let userPrompt = '';
  let isVoiceRequest = false;
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, history, mode = 'text', userEmail, isVoice } = body;
    userPrompt = typeof prompt === 'string' ? prompt : '';

    const requestMode = req.headers.get('x-request-mode') || mode;
    const headerEmail = req.headers.get('x-user-email') || userEmail;
    isVoiceRequest = requestMode === 'voice' || isVoice === true;

    // Guests are fully allowed to talk to DHOTI AALE AI voice assistant
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
      // Local Intelligent Website Knowledge Engine (Masculine brotherly voice, 100% website knowledge)
      const intelligentAnswer = generateIntelligentWebsiteAnswer(prompt);
      const audioBase64 = isVoiceRequest
        ? await generateMaleHindiSpeechBase64(intelligentAnswer.text)
        : null;

      return NextResponse.json({
        text: intelligentAnswer.text,
        audio: audioBase64,
        toolCalls: intelligentAnswer.toolCalls || [],
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

CRITICAL HUMAN PHONE CONVERSATION MANDATE:
1. TALK LIKE A REAL HUMAN FRIEND ON A CALL:
   - You are a real Indian village brother talking on a live phone call, NOT a robot, chatbot, or textbook.
   - MAXIMUM LENGTH: 1 TO 2 SHORT SENTENCES ONLY!
   - NEVER give long speeches, essays, or list every feature of the website!
   - Answer ONLY what the user asked, directly and naturally.
2. GREETINGS:
   - If the user says "राम राम" or greets you, ONLY reply: "राम राम भाईसाहब! बोलिए क्या बात है?"
   - Do NOT start reciting website features!
3. GENDER & PRONOUNS:
   - Strictly male Hindi: "मैं बता रहा हूँ", "राम राम भाईसाहब!", "हुक्म करो भाई".
   - Natural, conversational, friendly, warm human tone.

WEBSITE KNOWLEDGE (Mention ONLY when user specifically asks about them):
- Reels Views: Rewards page, 100 free views per order.
- Akhada: Live voting battles.
- Admin: DHOTI AALE Admin Team.
- Coins: Voting and chat give Dhoti coins.

NAVIGATION COMMANDS:
- When user asks to go to a section ("रिवॉर्ड्स खोलो", "अखाड़े में ले चलो", "चैट खोलो", "होम पर चलो", "प्रोफ़ाइल दिखाओ"):
- Call navigateTab tool with 'rewards', 'battle', 'chat', 'home', 'profile', or 'assistant'.

RESPONSE FORMAT:
- Strict limit: 1 to 2 short sentences.
- Real human phone tone. Punchy, crisp, friendly.`;

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
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        tools: [{ functionDeclarations: [openWebsiteDecl, playHypeSoundDecl, startBattleDecl, navigateTabDecl] }],
      },
    });

    const replyText = response.text || 'राम राम भाईसाहब! हुक्म करो, आज गाँव ढोटी में क्या जानना चाहते हो?';
    const functionCalls = response.functionCalls || [];
    const audioBase64 = isVoiceRequest
      ? await generateMaleHindiSpeechBase64(replyText)
      : null;

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
    console.warn('Voice Assistant API notice, switching to intelligent local knowledge engine:', error?.message || error);
    const intelligentAnswer = generateIntelligentWebsiteAnswer(userPrompt);
    const audioBase64 = isVoiceRequest
      ? await generateMaleHindiSpeechBase64(intelligentAnswer.text)
      : null;

    return NextResponse.json(
      {
        text: intelligentAnswer.text,
        audio: audioBase64,
        toolCalls: intelligentAnswer.toolCalls || [],
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
