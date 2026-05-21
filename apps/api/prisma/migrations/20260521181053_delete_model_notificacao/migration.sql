/*
  Warnings:

  - You are about to drop the `Notificacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notificacao" DROP CONSTRAINT "Notificacao_clinica_id_fkey";

-- DropForeignKey
ALTER TABLE "Notificacao" DROP CONSTRAINT "Notificacao_usuario_id_fkey";

-- DropTable
DROP TABLE "Notificacao";
