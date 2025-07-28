/*
  Warnings:

  - You are about to drop the column `category_id` on the `Posts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Posts" DROP CONSTRAINT "Posts_category_id_fkey";

-- AlterTable
ALTER TABLE "Categories" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Posts" DROP COLUMN "category_id",
ADD COLUMN     "topic_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
