ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

DO $$ BEGIN
  CREATE TYPE "SessionVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "GameSession"
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "visibility" "SessionVisibility" NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE "SessionParticipant" DROP CONSTRAINT IF EXISTS "SessionParticipant_sessionId_fkey";
ALTER TABLE "SessionParticipant"
  ADD CONSTRAINT "SessionParticipant_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SessionParticipant" ("sessionId", "userId", "status", "joinedAt", "updatedAt")
SELECT session."id", session."hostId", 'JOINED'::"ParticipantStatus", session."createdAt", CURRENT_TIMESTAMP
FROM "GameSession" session
ON CONFLICT ("sessionId", "userId") DO UPDATE
SET "status" = 'JOINED', "updatedAt" = CURRENT_TIMESTAMP;
