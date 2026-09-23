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
      text: 'राम राम भाईसाहब! हमारे रिवॉर्ड्स (Rewards) पेज पर हर भाई को 100 फ्री इंस्टाग्राम रील्स व्यूज मिलते हैं! बस अपनी इंस्टाग्राम रील का लिंक डालो, 15 सेकंड का स्पॉन्सर ऐड देखो और क्लेम करो। एक रील पर 3 घंटे का कूलडाउन रहता है, लेकिन आप अलग-अलग रील्स पर अनलिमिटेड बार 100-100 व्यूज बढ़ा सकते हो भाईसाहब! वहीं लाइव ट्रैकर और लीडरबोर्ड भी मौजूद है!',
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
      text: 'भाईसाहब, अगर आपने रील्स व्यूज का ऑर्डर लगाया है तो रिवॉर्ड्स पेज पर जाकर "Live Order Tracker" में अपनी रील का लिंक डालो और "Track Status" दबाओ! हमारा सिस्टम सीधे सर्वर से आपके ऑर्डर का लाइव स्टेटस (Pending, In Progress, Completed) तुरंत दिखा देगा!',
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
      text: 'राम राम भाईसाहब! रिवॉर्ड्स पेज के नीचे रियल-टाइम लाइव लीडरबोर्ड चल रहा है। आज किस-किस भाई ने 100-100 व्यूज क्लेम किए हैं, सबका लाइव रिकॉर्ड वहाँ दिखता है। आप भी अपना नाम लिस्ट में ला सकते हो!',
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
    q.includes('मुकाबला') ||
    q.includes('pizza') ||
    q.includes('chole') ||
    q.includes('bhature')
  ) {
    const battles = Array.from(contentStore.battles.values());
    const active = battles.find((b) => !b.isEnded && (!b.endsAt || Date.now() < b.endsAt));
    if (active) {
      const total = (active.optionA.votes || 0) + (active.optionB.votes || 0);
      const pctA = total > 0 ? Math.round(((active.optionA.votes || 0) / total) * 100) : 50;
      const pctB = total > 0 ? 100 - pctA : 50;
      const leader = (active.optionA.votes || 0) >= (active.optionB.votes || 0) ? active.optionA.label : active.optionB.label;
      const winPct = Math.max(pctA, pctB);
      const margin = Math.abs((active.optionA.votes || 0) - (active.optionB.votes || 0));

      return {
        text: `राम राम भाईसाहब! अखाड़े का लाइव हाल सुनिए: मुकाबला चल रहा है "${active.title}" का! इसमें "${leader}" ${margin} वोटों की बढ़त के साथ ${winPct}% जीतने की संभावना पर आगे चल रहा है! आप भी तुरंत अखाड़े में जाकर अपने पसंदीदा को वोट दो भाईसाहब!`,
        toolCalls: [{ id: 'tc-battle', name: 'navigateTab', args: { tab: 'battle' } }],
      };
    }

    return {
      text: 'राम राम भाईसाहब! अखाड़े में जोरदार मुकाबले चल रहे हैं! आप अखाड़ा पेज पर जाकर लाइव वोटिंग कर सकते हैं और जीतने पर धोती सिक्के कमा सकते हैं!',
      toolCalls: [{ id: 'tc-battle', name: 'navigateTab', args: { tab: 'battle' } }],
    };
  }

  // 5. Site Owner / Admin / Rohit Dhakad / Blue Tick
  if (
    q.includes('owner') ||
    q.includes('admin') ||
    q.includes('rohit') ||
    q.includes('dhakad') ||
    q.includes('kiska') ||
    q.includes('kiski') ||
    q.includes('malik') ||
    q.includes('मालिक') ||
    q.includes('एडमिन') ||
    q.includes('रोहित') ||
    q.includes('ब्लू टिक') ||
    q.includes('blue tick')
  ) {
    return {
      text: 'राम राम भाईसाहब! हमारी इस DHOTI AALE वेबसाइट के सुपर एडमिन और ओनर रोहित धाकड़ (Rohit Dhakad, rohitdhakaddhoti143@gmail.com) हैं 👑। वही गाँव के इस पूरे डिजिटल मंच के कर्ता-धर्ता हैं! ब्लू टिक भी सिर्फ रोहित भाई की स्वीकृति से मिलता है, और विश्व चौपाल में मुझे (DHOTI AALE AI) हमेशा वेरिफाइड ब्लू टिक हासिल है!',
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
      text: 'राम राम भाईसाहब! विश्व चौपाल 24/7 खुली है! गाँव-देहात के भाई लाइव जुड़े हुए हैं और देसी स्टिकर्स व संदेशों के साथ गपशप चल रही है। मोबाइल पर चैट बॉक्स नीचे हमेशा चालू रहता है। आइए, चौपाल में बात करते हैं!',
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
    q.includes('पैसे') ||
    q.includes('कम')
  ) {
    return {
      text: 'भाईसाहब, धोती सिक्के (Dhoti Coins) कमाना बड़ा आसान है: नया खाता बनाते ही 50 सिक्के वेलकम बोनस! अखाड़े में मुकाबला जीतने या वोट करने पर +100 सिक्के! डेली क्विज पर +20, और चौपाल में बातचीत पर +5 सिक्के मिलते हैं। इन सिक्कों से आपकी रैंक Resident से Crown King 👑 तक बढ़ती है!',
    };
  }

  // 8. Sounds / Hype
  if (q.includes('dhol') || q.includes('ढोल')) {
    return {
      text: 'लीजिए भाईसाहब, अखाड़े का देसी ढोल बज गया! 🥁 पूरा माहौल बन गया है!',
      toolCalls: [{ id: 'tc-dhol', name: 'playHypeSound', args: { soundType: 'dhol' } }],
    };
  }
  if (q.includes('horn') || q.includes('airhorn') || q.includes('हॉर्न') || q.includes('बिगुल')) {
    return {
      text: 'ये लो भाई, अखाड़े का बिगुल फूँक दिया! 📯 सिस्टम हैंग कर दिया!',
      toolCalls: [{ id: 'tc-horn', name: 'playHypeSound', args: { soundType: 'airhorn' } }],
    };
  }
  if (q.includes('seeti') || q.includes('whistle') || q.includes('सीटी')) {
    return {
      text: 'वाह भाईसाहब! ये बजी अखाड़े की कड़क सीटी! 🎺',
      toolCalls: [{ id: 'tc-whistle', name: 'playHypeSound', args: { soundType: 'whistle' } }],
    };
  }

  // 9. Shayari / Roast
  if (
    q.includes('shayari') ||
    q.includes('roast') ||
    q.includes('शायरी') ||
    q.includes('रोस्ट') ||
    q.includes('शेर')
  ) {
    return {
      text: 'सुनो भाईसाहब कड़क चौपाल की शायरी: "खेतों की मिट्टी का मान रखेंगे, धोती का देसी गुमान रखेंगे! अरे शहर की चमक क्या टिकेगी आगे, हम चौपाल में सिस्टम का तूफान रखेंगे!" जय हो भाईसाहब!',
    };
  }

  // 10. Navigation requests
  if (q.includes('akhade') || q.includes('akhada')) {
    return {
      text: 'चलिए भाईसाहब, आपको सीधे अखाड़ा मुकाबले में ले चलता हूँ!',
      toolCalls: [{ id: 'tc-nav-b', name: 'navigateTab', args: { tab: 'battle' } }],
    };
  }
  if (q.includes('home') || q.includes('होम')) {
    return {
      text: 'लीजिए भाईसाहब, हम मुख्य चौपाल होमपेज पर आ गए हैं!',
      toolCalls: [{ id: 'tc-nav-h', name: 'navigateTab', args: { tab: 'home' } }],
    };
  }

  // Default Comprehensive Answer
  return {
    text: 'राम राम भाईसाहब! मैं हूँ DHOTI AALE — आपका देसी AI भाई। मुझे इस वेबसाइट की हर एक चीज़ पता है — रिवॉर्ड्स पेज पर 100 फ्री इंस्टाग्राम रील्स व्यूज कैसे पाएं, अखाड़े में कौन आगे है, चौपाल का हाल, धोती सिक्के और हमारे सुपर एडमिन रोहित धाकड़ जी के बारे में। हुक्म करो भाईसाहब, क्या सेवा करें आपकी?',
  };
}

export async function POST(req: NextRequest) {
  let userPrompt = '';
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, history, mode = 'text', userEmail, isVoice } = body;
    userPrompt = typeof prompt === 'string' ? prompt : '';

    const requestMode = req.headers.get('x-request-mode') || mode;
    const headerEmail = req.headers.get('x-user-email') || userEmail;
    const isVoiceRequest = requestMode === 'voice' || isVoice === true;

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
      return NextResponse.json({
        text: intelligentAnswer.text,
        audio: null,
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

GREETING MANDATE:
- In greetings, openings, or first responses, ALWAYS start with:
  "राम राम भाईसाहब! (RAM RAM BHAISAB!)" or "राम राम भाईसाहब!"
- Respectfully address the user as "भाईसाहब" (Bhaisahab) or "भाई" (Bhai).

COMPLETE REAL-TIME KNOWLEDGE OF THE WEBSITE:
You have complete, live, real-time knowledge of EVERYTHING happening on this website:
${liveContext}

HOW TO ANSWER USERS ABOUT THE WEBSITE:
1. "100 फ्री इंस्टाग्राम रील्स व्यूज / रिवॉर्ड्स (Instagram Reels Views Booster)":
   - Guide them to the Rewards page (rewards tab).
   - Explain: 100 free Instagram reels views per order (SMM service 4436). Put reel link, watch 15-second sponsor ad, submit!
   - Cooldown: 3-hour cooldown on the same reel link, but UNLIMITED different reels can be boosted!
   - Live Order Tracker & Leaderboard are both active on the Rewards page.
2. "वेबसाइट पर क्या चल रहा है? / आज क्या अपडेट है?"
   - Tell them the latest news, active battles, and World Chat status.
3. "अखाड़े में कौन आगे है, कौन जीत सकता है?"
   - Quote EXACT live vote numbers and percentages from the live battles above.
   - Name the leading candidate and predict the winner with percentage probability.
4. "वेबसाइट किसकी है / एडमिन कौन है?"
   - State proudly: रोहित धाकड़ (Rohit Dhakad, rohitdhakaddhoti143@gmail.com) इस वेबसाइट के ओनर व सुपर एडमिन हैं 👑.
5. "ब्लू टिक किसको मिलता है?"
   - Explain that only admin Rohit Dhakad can give the verified blue badge, and DHOTI AALE AI in World Chat has it by default.
6. "सिक्के (Dhoti Coins) कैसे मिलते हैं?"
   - New account gets 50 coins, winning/voting in battles gives +100 coins, daily quiz gives +20, chat gives +5.
7. "लाइव चैट में कौन है / कितने लोग ऑनलाइन हैं?"
   - Quote the exact active user count from the live context.
8. "गाँव के मुख्य लोग कौन हैं / कोई दुकान बताओ?"
   - Mention Kailash Ji Dhakad, Suresh Choudhary, Pooja Choudhary, and businesses like Kisan Organic Dairy or Shree Balaji Agro.
9. NAVIGATION COMMANDS:
   - When the user asks to go to a section ("रिवॉर्ड्स खोलो", "अखाड़े में ले चलो", "चैट खोलो", "होम पर चलो", "प्रोफ़ाइल दिखाओ"):
   - Call the navigateTab tool with 'rewards', 'battle', 'chat', 'home', 'profile', or 'assistant'.
10. HYPE COMMANDS:
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

    return NextResponse.json(
      {
        text: replyText,
        audio: null,
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
    return NextResponse.json(
      {
        text: intelligentAnswer.text,
        audio: null,
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
