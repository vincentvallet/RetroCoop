ALTER TABLE "User"
  ADD COLUMN "leaveEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "SessionParticipant"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "EmailDelivery" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "providerId" TEXT,
  "status" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountSecurityEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailDelivery_idempotencyKey_key" ON "EmailDelivery"("idempotencyKey");
CREATE INDEX "EmailDelivery_eventType_status_createdAt_idx" ON "EmailDelivery"("eventType", "status", "createdAt");
CREATE INDEX "EmailDelivery_userId_createdAt_idx" ON "EmailDelivery"("userId", "createdAt");
CREATE INDEX "EmailDelivery_sessionId_createdAt_idx" ON "EmailDelivery"("sessionId", "createdAt");
CREATE INDEX "AccountSecurityEvent_userId_action_createdAt_idx" ON "AccountSecurityEvent"("userId", "action", "createdAt");
CREATE INDEX "AccountSecurityEvent_ipHash_action_createdAt_idx" ON "AccountSecurityEvent"("ipHash", "action", "createdAt");

ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountSecurityEvent" ADD CONSTRAINT "AccountSecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
