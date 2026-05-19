/*
  Warnings:

  - You are about to drop the column `usuario_id` on the `agendamentos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_usuario_id_fkey";

-- DropIndex
DROP INDEX "agendamentos_usuario_id_idx";

-- AlterTable
ALTER TABLE "agendamentos" DROP COLUMN "usuario_id";
