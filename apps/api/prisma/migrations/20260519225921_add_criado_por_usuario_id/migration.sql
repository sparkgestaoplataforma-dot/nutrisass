/*
  Warnings:

  - Added the required column `criado_por_usuario_id` to the `agendamentos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN     "criado_por_usuario_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "agendamentos_criado_por_usuario_id_idx" ON "agendamentos"("criado_por_usuario_id");

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_criado_por_usuario_id_fkey" FOREIGN KEY ("criado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
