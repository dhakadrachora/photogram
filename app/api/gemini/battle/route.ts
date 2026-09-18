import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { mode, userVerse, roundNumber, opponentName, userScore, opponentScore } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback generator if no key
      return NextResponse.json({
        opponentVerse: `Dhoti aale ke aage koi bol sakta hai kya? Round ${roundNumber} me tu hil gaya beta, swag mera sabse top pe chha gaya!`,
        playerScore: Math.floor(Math.random() * 3) + 7,
        opponentScore: Math.floor(Math.random() * 3) + 7,
        commentary: 'Arey baap re! Dono taraf se aag lag gayi stadium me! Hype meter 100%!',
        hypeChange: 15,
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

    const prompt = `Battle Mode: ${mode}
Round: ${roundNumber}
Opponent: ${opponentName || 'Dhoti aale AI Champion'}
Player's Line: "${userVerse}"

You are the witty, flirty, sharp-tongued Dhoti aale Battle Referee and Opponent generator.
Task:
1. Provide a sharp, rhythmic, witty counter-verse/punchline for the opponent (in Hinglish/Hindi, 2 to 4 lines, creative and catchy).
2. Fairly score Player (1-10) and Opponent (1-10) for this round based on rhyme, wit, flow, and punch.
3. Provide a 1-sentence hype commentary from the referee.
4. Provide crowd hype change (+5 to +20).

Respond in JSON format with schema:
- opponentVerse: string
- playerScore: number (1-10)
- opponentScore: number (1-10)
- commentary: string
- hypeChange: number (integer)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opponentVerse: { type: Type.STRING },
            playerScore: { type: Type.INTEGER },
            opponentScore: { type: Type.INTEGER },
            commentary: { type: Type.STRING },
            hypeChange: { type: Type.INTEGER },
          },
          required: ['opponentVerse', 'playerScore', 'opponentScore', 'commentary', 'hypeChange'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Battle API error:', err);
    return NextResponse.json({
      opponentVerse: 'Dhoti aale ka style dekh ke sabki bolti band! Aaja beta, abhi to khel shuru hua hai!',
      playerScore: 8,
      opponentScore: 9,
      commentary: 'Stadium me dhol baj gaya! Kya kickass round tha!',
      hypeChange: 15,
    });
  }
}
