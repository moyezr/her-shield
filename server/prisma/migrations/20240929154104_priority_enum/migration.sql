/*
  Warnings:

  - Changed the type of `priority` on the `Sos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PriorityEnum" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Sos" DROP COLUMN "priority",
ADD COLUMN     "priority" "PriorityEnum" NOT NULL;
