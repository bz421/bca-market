-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('WIN', 'LOSS', 'REFUND');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "resolutionType" "ResolutionType";
