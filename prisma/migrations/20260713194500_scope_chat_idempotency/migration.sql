DROP INDEX IF EXISTS "SessionMessage_clientRequestId_key";
CREATE UNIQUE INDEX "SessionMessage_sessionId_authorId_clientRequestId_key" ON "SessionMessage"("sessionId","authorId","clientRequestId");
