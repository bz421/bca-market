/*
  Warnings:

  - You are about to alter the column `liquidity` on the `Market` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,6)` to `Integer`.
  - You are about to alter the column `sharesOutstanding` on the `Outcome` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,6)` to `Integer`.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Market" ALTER COLUMN "liquidity" SET DEFAULT 50,
ALTER COLUMN "liquidity" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Outcome" ALTER COLUMN "sharesOutstanding" SET DEFAULT 0,
ALTER COLUMN "sharesOutstanding" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "outcomeId" INTEGER NOT NULL,
    "shares" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "avgCost" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Position_userId_idx" ON "Position"("userId");

-- CreateIndex
CREATE INDEX "Position_userId_marketId_idx" ON "Position"("userId", "marketId");

-- CreateIndex
CREATE INDEX "Position_outcomeId_idx" ON "Position"("outcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_outcomeId_key" ON "Position"("userId", "outcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
