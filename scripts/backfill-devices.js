import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

await prisma.$executeRawUnsafe(`
  INSERT INTO "Device" ("id", "createdAt", "updatedAt")
  SELECT DISTINCT "deviceId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM "ThumbnailSubmission"
  WHERE "deviceId" IS NOT NULL
  ON CONFLICT ("id") DO NOTHING;
`);

await prisma.$disconnect();

console.log("Device rows are ready.");
