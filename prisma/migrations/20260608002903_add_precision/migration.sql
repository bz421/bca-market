/*
  Warnings:

  - You are about to alter the column `realizedPnl` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Decimal(18,6)`.
  - You are about to alter the column `cost` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Decimal(18,6)`.
  - You are about to alter the column `money` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,4)` to `Decimal(18,6)`.

*/
-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "realizedPnl" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "Trade" ALTER COLUMN "cost" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "money" SET DATA TYPE DECIMAL(18,6);
