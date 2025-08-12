/*
  Warnings:

  - Made the column `description` on table `topics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."topics" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL;

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "public"."posts"("created_at");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "public"."users"("created_at");
