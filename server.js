import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "12mb" }));

app.get("/api/thumbnails", async (req, res) => {
  const deviceId = req.query.deviceId;

  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    return res.status(400).json({ error: "A device ID is required." });
  }

  try {
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

app.use(express.static(path.join(__dirname, "dist")));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`ThumbnailChecker API running on http://localhost:${port}`);
});
