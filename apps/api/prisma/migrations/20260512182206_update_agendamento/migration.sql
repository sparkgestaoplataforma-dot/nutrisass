/*
  Warnings:

  - Added the required column `nutricionista_id` to the `agendamentos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN     "nutricionista_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "agendamentos_nutricionista_id_idx" ON "agendamentos"("nutricionista_id");

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_nutricionista_id_fkey" FOREIGN KEY ("nutricionista_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
