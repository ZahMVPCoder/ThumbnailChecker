const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const rateLimitWindowMs = 60 * 60 * 1000;
const maxAnalysesPerWindow = 5;
const analysisRateLimits = new Map<string, { count: number; resetAt: number }>();

const coachPrompt =
  "You are an expert YouTube strategist and thumbnail coach. Analyze this video thumbnail and title as if the creator wants maximum CTR from Browse/Home traffic. Give direct, honest, practical advice. Focus on whether the thumbnail is readable at small size, whether the title creates curiosity, whether the idea is clickable, and what should be changed. Do not be generic.";

const thumbnailCoachSchema = {
  type: "OBJECT",
  properties: {
    overallClickabilityScore: {
      type: "NUMBER",
      description: "Overall clickability score from 1 to 10.",
    },
    thumbnailReadability: { type: "STRING" },
    titleStrength: { type: "STRING" },
    curiosityClickAppeal: { type: "STRING" },
    mobileVisibility: { type: "STRING" },
    suggestedImprovements: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Three to six practical improvements.",
    },
    betterTitleIdeas: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Exactly three stronger title ideas.",
    },
    thumbnailTextSuggestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Three to five short thumbnail text options.",
    },
  },
  required: [
    "overallClickabilityScore",
    "thumbnailReadability",
    "titleStrength",
    "curiosityClickAppeal",
    "mobileVisibility",
    "suggestedImprovements",
    "betterTitleIdeas",
    "thumbnailTextSuggestions",
  ],
  propertyOrdering: [
    "overallClickabilityScore",
    "thumbnailReadability",
    "titleStrength",
    "curiosityClickAppeal",
    "mobileVisibility",
    "suggestedImprovements",
    "betterTitleIdeas",
    "thumbnailTextSuggestions",
  ],
};

function parseDataUrl(thumbnail: string) {
  const match = thumbnail.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return {
      mimeType: "image/png",
      data: thumbnail,
    };
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function extractGeminiText(data: any) {
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("");

  if (!text) {
    throw new Error("Gemini did not return text output.");
  }

  return text;
}

function checkRateLimit(deviceId: string) {
  const now = Date.now();
  const currentLimit = analysisRateLimits.get(deviceId);

  if (!currentLimit || currentLimit.resetAt <= now) {
    analysisRateLimits.set(deviceId, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return null;
  }

  if (currentLimit.count >= maxAnalysesPerWindow) {
    return Math.ceil((currentLimit.resetAt - now) / 60000);
  }

  currentLimit.count += 1;
  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { deviceId, title, thumbnail } = req.body;

  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    return res.status(400).json({ error: "A device ID is required." });
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "A video title is required." });
  }

  if (typeof thumbnail !== "string" || thumbnail.trim().length === 0) {
    return res.status(400).json({ error: "A thumbnail image is required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  const retryAfterMinutes = checkRateLimit(deviceId);

  if (retryAfterMinutes !== null) {
    return res.status(429).json({
      error: `AI analysis limit reached. Try again in about ${retryAfterMinutes} minutes.`,
    });
  }

  const image = parseDataUrl(thumbnail);

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${coachPrompt}\n\nVideo title: ${title.trim()}`,
                },
                {
                  inlineData: {
                    mimeType: image.mimeType,
                    data: image.data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: thumbnailCoachSchema,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return res.status(502).json({
        error: `Gemini returned ${geminiResponse.status}. ${errorText}`,
      });
    }

    const data = await geminiResponse.json();
    return res.status(200).json(JSON.parse(extractGeminiText(data)));
  } catch (error) {
    console.error(error);
    return res.status(503).json({
      error: "Unable to analyze this thumbnail with Gemini right now.",
    });
  }
}
