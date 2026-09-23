import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

type BattleResponse = {
  opponentVerse: string;
  playerScore: number;
  opponentScore: number;
  commentary: string;
  hypeChange: number;
};

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const numberValue =
    typeof value === 'number'
      ? value
      : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(min, Math.round(numberValue))
  );
}

function createFallbackResponse(
  roundNumber: unknown
): BattleResponse {
  const round =
    typeof roundNumber === 'number' ||
    typeof roundNumber === 'string'
      ? String(roundNumber)
      : '1';

  return {
    opponentVerse:
      `Dhoti aale ke aage koi bol sakta hai kya? ` +
      `Round ${round} me tu hil gaya beta, ` +
      `swag mera sabse top pe chha gaya!`,

    playerScore: 8,

    opponentScore: 9,

    commentary:
      'Arey baap re! Dono taraf se aag lag gayi stadium me! Hype meter 100%!',

    hypeChange: 15,
  };
}

function normalizeBattleResponse(
  data: unknown,
  fallback: BattleResponse
): BattleResponse {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const value = data as Record<string, unknown>;

  const opponentVerse =
    typeof value.opponentVerse === 'string' &&
    value.opponentVerse.trim()
      ? value.opponentVerse.trim()
      : fallback.opponentVerse;

  const commentary =
    typeof value.commentary === 'string' &&
    value.commentary.trim()
      ? value.commentary.trim()
      : fallback.commentary;

  return {
    opponentVerse,

    playerScore: clampNumber(
      value.playerScore,
      1,
      10,
      fallback.playerScore
    ),

    opponentScore: clampNumber(
      value.opponentScore,
      1,
      10,
      fallback.opponentScore
    ),

    commentary,

    hypeChange: clampNumber(
      value.hypeChange,
      5,
      20,
      fallback.hypeChange
    ),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      mode,
      userVerse,
      roundNumber,
      opponentName,
      userScore,
      opponentScore,
    } = body ?? {};

    const fallback = createFallbackResponse(roundNumber);

    /*
     * ---------------------------------------------------------
     * Validate request
     * ---------------------------------------------------------
     */

    const cleanMode =
      typeof mode === 'string' && mode.trim()
        ? mode.trim()
        : 'Battle';

    const cleanVerse =
      typeof userVerse === 'string'
        ? userVerse.trim()
        : '';

    const cleanOpponentName =
      typeof opponentName === 'string' &&
      opponentName.trim()
        ? opponentName.trim()
        : 'Dhoti aale AI Champion';

    const cleanRoundNumber =
      typeof roundNumber === 'number' ||
      typeof roundNumber === 'string'
        ? String(roundNumber)
        : '1';

    /*
     * ---------------------------------------------------------
     * Gemini API key
     * ---------------------------------------------------------
     */

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    /*
     * No Gemini key:
     * return a safe local fallback.
     */

    if (!apiKey) {
      return NextResponse.json(fallback);
    }

    /*
     * ---------------------------------------------------------
     * Google GenAI client
     * ---------------------------------------------------------
     */

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    /*
     * ---------------------------------------------------------
     * Battle prompt
     * ---------------------------------------------------------
     */

    const prompt = `
You are the Dhoti Aale Battle Referee and Opponent Generator.

Battle Mode:
${cleanMode}

Round:
${cleanRoundNumber}

Opponent:
${cleanOpponentName}

Player's Current Line:
"${cleanVerse || 'Player has not provided a line.'}"

Previous Player Score:
${clampNumber(userScore, 0, 1000, 0)}

Previous Opponent Score:
${clampNumber(opponentScore, 0, 1000, 0)}

Your job:

1. Write a sharp, rhythmic and witty counter-verse for the opponent.
2. Use natural Hinglish/Hindi.
3. Keep the counter-verse between 2 and 4 short lines.
4. Make it catchy, funny and competitive.
5. Do not use hateful, discriminatory or threatening language.
6. Fairly score both the player and opponent from 1 to 10.
7. Judge based on:
   - rhyme
   - wit
   - flow
   - creativity
   - punch
8. Give one short referee commentary sentence.
9. Set hypeChange between 5 and 20.
10. Return ONLY valid JSON matching the requested schema.

Important:
Do not include Markdown.
Do not include code fences.
Do not add explanations outside JSON.
`;

    /*
     * ---------------------------------------------------------
     * Gemini request
     * ---------------------------------------------------------
     */

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',

      contents: prompt,

      config: {
        responseMimeType: 'application/json',

        responseSchema: {
          type: Type.OBJECT,

          properties: {
            opponentVerse: {
              type: Type.STRING,
            },

            playerScore: {
              type: Type.INTEGER,
            },

            opponentScore: {
              type: Type.INTEGER,
            },

            commentary: {
              type: Type.STRING,
            },

            hypeChange: {
              type: Type.INTEGER,
            },
          },

          required: [
            'opponentVerse',
            'playerScore',
            'opponentScore',
            'commentary',
            'hypeChange',
          ],
        },
      },
    });

    /*
     * ---------------------------------------------------------
     * Parse Gemini response safely
     * ---------------------------------------------------------
     */

    const rawText =
      typeof response.text === 'string'
        ? response.text.trim()
        : '';

    if (!rawText) {
      return NextResponse.json(fallback);
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      /*
       * Sometimes a model can still return surrounding
       * whitespace or unexpected text. Try to extract the
       * first JSON object.
       */

      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');

      if (
        firstBrace >= 0 &&
        lastBrace > firstBrace
      ) {
        const possibleJson =
          rawText.slice(
            firstBrace,
            lastBrace + 1
          );

        try {
          parsed = JSON.parse(possibleJson);
        } catch {
          parsed = null;
        }
      } else {
        parsed = null;
      }
    }

    /*
     * ---------------------------------------------------------
     * Normalize and validate AI output
     * ---------------------------------------------------------
     */

    const result = normalizeBattleResponse(
      parsed,
      fallback
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(
      'Battle API error:',
      error
    );

    /*
     * Always return valid battle JSON instead of
     * exposing internal server errors to the client.
     */

    return NextResponse.json(
      createFallbackResponse(1),
      {
        status: 200,
      }
    );
  }
}