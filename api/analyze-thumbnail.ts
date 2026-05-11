const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2-vision";

const coachPrompt = `You are an expert YouTube strategist and thumbnail coach. Analyze this video thumbnail and title as if the creator wants maximum CTR from Browse/Home traffic. Give direct, honest, practical advice. Focus on whether the thumbnail is readable at small size, whether the title creates curiosity, whether the idea is clickable, and what should be changed. Do not be generic.

Return only valid JSON in this exact shape:
{
  "overallClickabilityScore": number,
  "thumbnailReadability": string,
  "titleStrength": string,
  "curiosityClickAppeal": string,
  "mobileVisibility": string,
  "suggestedImprovements": string[],
  "betterTitleIdeas": string[],
  "thumbnailTextSuggestions": string[]
}`;

function getBase64Image(thumbnail: string) {
  return thumbnail.includes(",") ? thumbnail.split(",")[1] : thumbnail;
}

function parseJsonResponse(responseText: string) {
  try {
    return JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Ollama did not return valid JSON.");
    }

    return JSON.parse(jsonMatch[0]);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { title, thumbnail } = req.body;

  if (typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "A video title is required." });
  }

  if (typeof thumbnail !== "string" || thumbnail.trim().length === 0) {
    return res.status(400).json({ error: "A thumbnail image is required." });
  }

  try {
    const ollamaResponse = await fetch(`${ollamaHost}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `${coachPrompt}\n\nVideo title: ${title.trim()}`,
        images: [getBase64Image(thumbnail)],
        stream: false,
        format: "json",
      }),
    });

    if (!ollamaResponse.ok) {
      return res.status(502).json({
        error: `Ollama returned ${ollamaResponse.status}. Make sure Ollama is running and the ${ollamaModel} model is installed.`,
      });
    }

    const data = await ollamaResponse.json();
    return res.status(200).json(parseJsonResponse(data.response));
  } catch (error) {
    console.error(error);
    return res.status(503).json({
      error: `Unable to reach Ollama at ${ollamaHost}. Start Ollama and install the ${ollamaModel} model.`,
    });
  }
}
