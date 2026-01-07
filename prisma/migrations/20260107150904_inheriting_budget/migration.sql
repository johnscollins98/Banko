/*
  Warnings:

  - A unique constraint covering the columns `[userId,category,date]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "category_user_id_unique";

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00 +00:00';

-- CreateIndex
CREATE UNIQUE INDEX "budget_category_user_id_date_unique" ON "Budget"("userId", "category", "date");
