ALTER TABLE "Game"
  ADD COLUMN "descriptionSourceType" TEXT,
  ADD COLUMN "descriptionSourceUrl" TEXT,
  ADD COLUMN "descriptionSourceLanguage" TEXT,
  ADD COLUMN "descriptionAdaptedToFrench" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "descriptionVerifiedPlatform" TEXT;

ALTER TABLE "GameMedia"
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "verifiedPlatform" TEXT,
  ADD COLUMN "verifiedTitle" TEXT,
  ADD COLUMN "region" TEXT,
  ADD COLUMN "commercialCover" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "prototypeVisual" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "GameSession" (
  "id" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  "hostId" TEXT NOT NULL,
  "startsAtUtc" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "timezoneAtCreation" TEXT NOT NULL,
  "locationType" TEXT NOT NULL,
  "privateJoinUrl" TEXT,
  "minPlayers" INTEGER NOT NULL,
  "maxPlayers" INTEGER NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessionParticipant" (
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ParticipantStatus" NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("sessionId", "userId")
);

CREATE TABLE "ImportIssue" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceLine" INTEGER,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GameSession_gameId_startsAtUtc_status_idx" ON "GameSession"("gameId", "startsAtUtc", "status");
CREATE INDEX "GameSession_hostId_startsAtUtc_idx" ON "GameSession"("hostId", "startsAtUtc");
CREATE INDEX "SessionParticipant_userId_status_idx" ON "SessionParticipant"("userId", "status");
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
