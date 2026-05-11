import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

async function ensureDevice(deviceId) {
  return prisma.device.upsert({
    where: { id: deviceId },
    update: {},
    create: { id: deviceId },
  });
}

function getBase64Image(thumbnail) {
  return thumbnail.includes(",") ? thumbnail.split(",")[1] : thumbnail;
}

function parseJsonResponse(responseText) {
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

app.use(express.json({ limit: "12mb" }));

app.get("/api/thumbnails", async (req, res) => {
  const deviceId = req.query.deviceId;

  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    return res.status(400).json({ error: "A device ID is required." });
  }

  try {
    await ensureDevice(deviceId);

    const submissions = await prisma.thumbnailSubmission.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load thumbnail submissions." });
  }
});

app.post("/api/thumbnails", async (req, res) => {
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

  try {
    await ensureDevice(deviceId);

    const submission = await prisma.thumbnailSubmission.create({
      data: {
        deviceId,
        title: title.trim(),
        thumbnail,
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to save thumbnail submission." });
  }
});

app.patch("/api/thumbnails", async (req, res) => {
  const { id, deviceId, title, thumbnail } = req.body;
  const submissionId = Number(id);

  if (!Number.isInteger(submissionId)) {
    return res.status(400).json({ error: "A valid submission ID is required." });
  }

  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    return res.status(400).json({ error: "A device ID is required." });
  }

  const data = {};

  if (typeof title === "string") {
    if (title.trim().length === 0) {
      return res.status(400).json({ error: "A video title is required." });
    }

    data.title = title.trim();
  }

  if (typeof thumbnail === "string") {
    if (thumbnail.trim().length === 0) {
      return res.status(400).json({ error: "A thumbnail image is required." });
    }

    data.thumbnail = thumbnail;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Nothing was provided to update." });
  }

  try {
    await ensureDevice(deviceId);

    const existingSubmission = await prisma.thumbnailSubmission.findFirst({
      where: {
        id: submissionId,
        deviceId,
      },
    });

    if (!existingSubmission) {
      return res.status(404).json({ error: "Saved thumbnail check not found." });
    }

    const updatedSubmission = await prisma.thumbnailSubmission.update({
      where: { id: submissionId },
      data,
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to update thumbnail submission." });
  }
});

app.post("/api/analyze-thumbnail", async (req, res) => {
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
    res.json(parseJsonResponse(data.response));
  } catch (error) {
    console.error(error);
    res.status(503).json({
      error: `Unable to reach Ollama at ${ollamaHost}. Start Ollama and install the ${ollamaModel} model.`,
    });
  }
});

app.use(express.static(path.join(__dirname, "dist")));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`ThumbnailChecker API running on http://localhost:${port}`);
});
