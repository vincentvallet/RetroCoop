/*
  Warnings:

  - You are about to drop the column `coverBlurData` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `coverJpegPath` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `coverSourceName` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `coverSourceUrl` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `coverWebpPath` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `sourceConfidence` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `teamPlayerCompatible` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_platformId_fkey";

-- DropForeignKey
ALTER TABLE "GameMedia" DROP CONSTRAINT "GameMedia_gameId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "coverBlurData",
DROP COLUMN "coverJpegPath",
DROP COLUMN "coverSourceName",
DROP COLUMN "coverSourceUrl",
DROP COLUMN "coverWebpPath",
DROP COLUMN "sourceConfidence",
DROP COLUMN "teamPlayerCompatible";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "city";

-- CreateIndex
CREATE INDEX "Game_platformId_sortTitle_idx" ON "Game"("platformId", "sortTitle");

-- CreateIndex
CREATE INDEX "Game_platformId_releaseYear_idx" ON "Game"("platformId", "releaseYear");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameMedia" ADD CONSTRAINT "GameMedia_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
