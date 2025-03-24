/*
  Warnings:

  - You are about to drop the column `mission_uuid` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the `missions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_mission_uuid_fkey";

-- AlterTable
ALTER TABLE "assets" DROP COLUMN "mission_uuid",
ADD COLUMN     "flight_uuid" TEXT;

-- DropTable
DROP TABLE "missions";

-- CreateTable
CREATE TABLE "flights" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "aircraft" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flights_pkey" PRIMARY KEY ("uuid")
);

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_flight_uuid_fkey" FOREIGN KEY ("flight_uuid") REFERENCES "flights"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
