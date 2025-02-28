/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_owner_uuid_fkey";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_uploader_uuid_fkey";

-- DropTable
DROP TABLE "users";
