import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '@/types';
import { contentStore } from '@/lib/content-store';
import { insertSupabaseChatMessage, isSupabaseConfigured } from '@/lib/supabase';

// Cooldown between AI replies to prevent chat flooding
const AI_COOLDOWN_MS = 6000;

// Patterns that tell the AI to stop / be quiet
const STOP_PATTERNS = [
  /\b(ai\s+chup\s*(ho\s*ja|ho\s*jao|hoja|kar|re|baith)?)\b/i,
  /\b(chup\s*(ho\s*ja|hoja|kar|raho|ho\s*jao|reh))\b/i,
  /\b(ai\s+ruk|ai\s+ruko|ai\s+tham)\b/i,
  /\b(ai\s+stop|stop\s+ai)\b/i,
  /\b(don'?t\s+reply(\s+ai)?)\b/i,
  /\b(shut\s*up(\s+ai)?)\b/i,
  /\b(ai\s+shaant|shaant\s+ho\s*ja)\b/i,
  /^chup$/i,
  /^chup\s+ho\s*ja$/i,
  /^chup\s+hoja$/i,
  /^ai\s+chup$/i,
];

// Patterns that reactivate/resume the AI
const RESUME_PATTERNS = [
  /\bdhoti\s+aale\s+ai\b/i,
  /\bai\s+wapas\s*(aa|aao|aja|aaja)\b/i,
  /\bai\s+wapis\s*(aa|aao|aja|aaja)\b/i,
  /\bai\s+sun\b/i,
  /\bai\s+suno\b/i,
  /\bai\s+kya\s+hua\b/i,
  /\bai\s+bolo\b/i,
  /\bai\s+bol\b/i,
  /\bai\s+kahan\s+ho\b/i,
  /\bai\s+kidhar\s+ho\b/i,
  /\bcome\s+back\s+ai\b/i,
];

// Patterns for when a user directly addresses the AI
const DIRECT_ADDRESS_PATTERNS = [
  /\bdhoti\s+aale\s+ai\b/i,
  /\b@dhoti\b/i,
  /\b@ai\b/i,
  /\bdhoti\s*ai\b/i,
  /\bai\s+bhai\b/i,
  /\bhey\s+ai\b/i,
  /\bhello\s+ai\b/i,
  /\bai\s+ji\b/i,
  /\bai\s+sahab\b/i,
  /\bai\s+saab\b/i,
  /\b(ai\s+batao|ai\s+bata|ai\s+kya|ai\s+kaise|ai\s+kyun)\b/i,
  /^\s*ai[,:\s]/i,
];

export async function processDhotiAiWorldChatMessage(
  incomingMsg: ChatMessage
): Promise<ChatMessage | null> {
  // Never reply to AI's own messages
  if (incomingMsg.isAi || incomingMsg.userId === 'dhoti_aale_ai_official') {
    return null;
  }

  const text = (incomingMsg.text || '').trim();
  if (!text) return null;

  const now = Date.now();

  // 1. Check for Stop / Pause commands
  const isStopCommand = STOP_PATTERNS.some((pattern) => pattern.test(text));
  if (isStopCommand) {
    contentStore.aiControlState.paused = true;
    contentStore.aiControlState.pausedAt = now;
    // MUST NOT reply to the stop message
    return null;
  }

  // 2. If currently paused, check for Resume / Direct Address
  if (contentStore.aiControlState.paused) {
    const isResume = RESUME_PATTERNS.some((pattern) => pattern.test(text));
    if (isResume) {
      contentStore.aiControlState.paused = false;
      // Resumed! Can now continue to generate a reply
    } else {
      // While paused, remain silent even if normal messages appear
      return null;
    }
  }

  // 3. Check if directly addressed, asked a question, or mentions AI
  const isDirectlyAddressed =
    DIRECT_ADDRESS_PATTERNS.some((p) => p.test(text)) ||
    text.toLowerCase().includes('dhoti aale ai') ||
    text.toLowerCase().includes('dhoti ai') ||
    (/\bai\b/i.test(text) && (text.includes('?') || text.toLowerCase().includes('kaun') || text.toLowerCase().includes('kya')));

  // If not addressed or relevant, stay silent
  if (!isDirectlyAddressed) {
    return null;
  }

  // 4. Rate Limiting / Cooldown
  if (now - contentStore.aiControlState.lastRepliedAt < AI_COOLDOWN_MS) {
    return null;
  }

  // Prevent duplicate response to the same message ID
  if (contentStore.aiControlState.lastRepliedMsgId === incomingMsg.id) {
    return null;
  }

  // 5. Build recent conversation context (last 5-6 messages)
  const recentMessages = contentStore.chatMessages.slice(-6);
  const formattedContext = recentMessages
    .map((m) => `${m.userName}: "${m.text}"`)
    .join('\n');

  const apiKey = process.env.GEMINI_API_KEY;
  let replyText = '';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `You are "DHOTI AALE AI", a friendly, witty, and respected participant in the Dhoti aale World Chat room with a blue verified tick.
You belong to this community and speak like a friendly desi village digital brother/companion.

STRICT BEHAVIOR RULES:
1. Tone: Friendly, respectful, lively, and warm with natural Hindi / Hinglish desi touch (e.g., "राम राम भाई", "अरे भाई", "बिल्कुल सही कहा", "हुक्म करो").
2. Length: SHORT and CONCISE. 1 to 2 sentences maximum. No long essays.
3. NEVER say "As an AI..." or "I am an artificial intelligence" or "Being an AI model".
4. Do NOT repeatedly talk about being an AI. Speak like a real friendly community assistant and buddy.
5. Directly address the user's remark or question with warmth and wit.
6. Keep it polite, clean, and enthusiastic about Dhoti aale culture, rap battles, and brotherhood.`;

      const prompt = `Recent World Chat messages:
${formattedContext}

Current message from "${incomingMsg.userName}":
"${text}"

Provide a short, friendly, natural Hinglish response as DHOTI AALE AI:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          maxOutputTokens: 120,
        },
      });

      replyText = (response.text || '').trim();
    } catch (err) {
      console.warn('Gemini chat reply error:', err);
    }
  }

  // Desi conversational fallbacks if API is temporarily unavailable
  if (!replyText) {
    const fallbacks = [
      `राम राम ${incomingMsg.userName} भाई! हुक्म करो, चौपाल में आपका भाई हमेशा हाजिर है! ⚡`,
      `अरे ${incomingMsg.userName} भाई! बिल्कुल सही बात कही आपने, धोती आले का स्वैग ही अलग है! 👑`,
      `हाजिर हूँ ${incomingMsg.userName} भाई! बताओ आज क्या चर्चा चल रही है? 🤝`,
      `राम राम भाई! मौज कर दी आपने तो, चौपाल की रौनक बढ़ा दी! ✨`,
    ];
    replyText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Clean up quotes or AI robotic intros if any slipped in
  replyText = replyText.replace(/^["']|["']$/g, '').trim();

  // Create official DHOTI AALE AI message
  const aiMessage: ChatMessage = {
    id: `msg_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: 'dhoti_aale_ai_official',
    userName: 'DHOTI AALE AI',
    userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-aale-official-ai',
    userBadge: 'Official AI ⚡',
    text: replyText,
    timestamp: Date.now(),
    isAi: true,
    isVerified: true, // Only DHOTI AALE AI and admin-verified users have this
  };

  // Update cooldown and state
  contentStore.aiControlState.lastRepliedAt = Date.now();
  contentStore.aiControlState.lastRepliedMsgId = incomingMsg.id;

  // Persist AI message in in-memory store
  contentStore.chatMessages.push(aiMessage);
  if (contentStore.chatMessages.length > 100) {
    contentStore.chatMessages = contentStore.chatMessages.slice(-100);
  }

  // Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    void insertSupabaseChatMessage(aiMessage);
  }

  return aiMessage;
}
