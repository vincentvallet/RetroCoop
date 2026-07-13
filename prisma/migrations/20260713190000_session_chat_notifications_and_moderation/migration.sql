ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "chatMutedUntil" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "joinEmailEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "SessionMessage" ("id" TEXT NOT NULL,"sessionId" TEXT NOT NULL,"authorId" TEXT NOT NULL,"content" TEXT NOT NULL,"contentHash" TEXT NOT NULL,"clientRequestId" TEXT,"suspicious" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,"deletedAt" TIMESTAMP(3),"deletedById" TEXT,"moderationReason" TEXT,CONSTRAINT "SessionMessage_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "SessionMessage_clientRequestId_key" ON "SessionMessage"("clientRequestId");
CREATE INDEX "SessionMessage_sessionId_createdAt_idx" ON "SessionMessage"("sessionId","createdAt");
CREATE INDEX "SessionMessage_authorId_createdAt_idx" ON "SessionMessage"("authorId","createdAt");
CREATE INDEX "SessionMessage_sessionId_authorId_contentHash_createdAt_idx" ON "SessionMessage"("sessionId","authorId","contentHash","createdAt");

CREATE TABLE "MessageReport" ("id" TEXT NOT NULL,"messageId" TEXT NOT NULL,"reporterId" TEXT NOT NULL,"reason" TEXT NOT NULL,"details" TEXT,"status" TEXT NOT NULL DEFAULT 'OPEN',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "MessageReport_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "MessageReport_messageId_reporterId_key" ON "MessageReport"("messageId","reporterId");
CREATE INDEX "MessageReport_status_createdAt_idx" ON "MessageReport"("status","createdAt");

CREATE TABLE "ModerationLog" ("id" TEXT NOT NULL,"actorId" TEXT,"targetUserId" TEXT,"messageId" TEXT,"action" TEXT NOT NULL,"reason" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id"));
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt");
CREATE INDEX "ModerationLog_targetUserId_createdAt_idx" ON "ModerationLog"("targetUserId","createdAt");

CREATE TABLE "ChatRateLimitEvent" ("id" TEXT NOT NULL,"sessionId" TEXT NOT NULL,"userId" TEXT,"ipHash" TEXT NOT NULL,"outcome" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ChatRateLimitEvent_pkey" PRIMARY KEY ("id"));
CREATE INDEX "ChatRateLimitEvent_userId_sessionId_createdAt_idx" ON "ChatRateLimitEvent"("userId","sessionId","createdAt");
CREATE INDEX "ChatRateLimitEvent_ipHash_createdAt_idx" ON "ChatRateLimitEvent"("ipHash","createdAt");

CREATE TABLE "Notification" ("id" TEXT NOT NULL,"recipientId" TEXT NOT NULL,"actorId" TEXT,"sessionId" TEXT,"type" TEXT NOT NULL,"title" TEXT NOT NULL,"body" TEXT NOT NULL,"readAt" TIMESTAMP(3),"emailStatus" TEXT NOT NULL DEFAULT 'DISABLED',"emailSentAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Notification_recipientId_readAt_createdAt_idx" ON "Notification"("recipientId","readAt","createdAt");
CREATE INDEX "Notification_sessionId_actorId_type_createdAt_idx" ON "Notification"("sessionId","actorId","type","createdAt");

ALTER TABLE "SessionMessage" ADD CONSTRAINT "SessionMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionMessage" ADD CONSTRAINT "SessionMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionMessage" ADD CONSTRAINT "SessionMessage_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SessionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SessionMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatRateLimitEvent" ADD CONSTRAINT "ChatRateLimitEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatRateLimitEvent" ADD CONSTRAINT "ChatRateLimitEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
