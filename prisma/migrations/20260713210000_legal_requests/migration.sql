CREATE TABLE "LegalRequest" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "requesterName" TEXT,
  "requesterEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "pageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "ipHash" TEXT NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LegalRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LegalRequest_status_createdAt_idx" ON "LegalRequest"("status", "createdAt");
CREATE INDEX "LegalRequest_ipHash_createdAt_idx" ON "LegalRequest"("ipHash", "createdAt");
CREATE INDEX "LegalRequest_userId_createdAt_idx" ON "LegalRequest"("userId", "createdAt");

ALTER TABLE "LegalRequest" ADD CONSTRAINT "LegalRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
