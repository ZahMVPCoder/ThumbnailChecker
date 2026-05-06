import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
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

      return res.status(200).json(submissions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to load thumbnail submissions." });
    }
  }

  if (req.method === "POST") {
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

      return res.status(201).json(submission);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to save thumbnail submission." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed." });
}
