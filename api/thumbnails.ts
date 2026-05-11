import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureDevice(deviceId: string) {
  return prisma.device.upsert({
    where: { id: deviceId },
    update: {},
    create: { id: deviceId },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
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
      await ensureDevice(deviceId);

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

  if (req.method === "PATCH") {
    const { id, deviceId, title, thumbnail } = req.body;
    const submissionId = Number(id);

    if (!Number.isInteger(submissionId)) {
      return res.status(400).json({ error: "A valid submission ID is required." });
    }

    if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
      return res.status(400).json({ error: "A device ID is required." });
    }

    const data: { title?: string; thumbnail?: string } = {};

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

      return res.status(200).json(updatedSubmission);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to update thumbnail submission." });
    }
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  return res.status(405).json({ error: "Method not allowed." });
}
