/*
  Warnings:

  - You are about to alter the column `phoneNo` on the `User` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `VarChar(10)`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phoneNo" SET DATA TYPE VARCHAR(10);
