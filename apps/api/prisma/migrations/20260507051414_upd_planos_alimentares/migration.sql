/*
  Warnings:

  - You are about to drop the column `plano_refeicao_id` on the `planos_alimentos` table. All the data in the column will be lost.
  - Added the required column `opcao_refeicao_id` to the `planos_alimentos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ObjetivoPlano" AS ENUM ('EMAGRECIMENTO', 'HIPERTROFIA', 'MANUTENCAO', 'REEDUCACAO_ALIMENTAR', 'OUTRO');

-- DropForeignKey
ALTER TABLE "planos_alimentos" DROP CONSTRAINT "planos_alimentos_plano_refeicao_id_fkey";

-- DropIndex
DROP INDEX "planos_alimentos_plano_refeicao_id_idx";

-- AlterTable
ALTER TABLE "planos_alimentares" ADD COLUMN     "meta_calorias" DOUBLE PRECISION,
ADD COLUMN     "meta_carboidratos" DOUBLE PRECISION,
ADD COLUMN     "meta_gorduras" DOUBLE PRECISION,
ADD COLUMN     "meta_proteinas" DOUBLE PRECISION,
ADD COLUMN     "objetivo" "ObjetivoPlano",
ADD COLUMN     "recomendacao_agua_ml" INTEGER;

-- AlterTable
ALTER TABLE "planos_alimentos" DROP COLUMN "plano_refeicao_id",
ADD COLUMN     "opcao_refeicao_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "planos_opcoes_refeicoes" (
    "id" TEXT NOT NULL,
    "plano_refeicao_id" TEXT NOT NULL,
    "nome" TEXT,
    "ordem" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_opcoes_refeicoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planos_opcoes_refeicoes_plano_refeicao_id_idx" ON "planos_opcoes_refeicoes"("plano_refeicao_id");

-- CreateIndex
CREATE INDEX "planos_alimentos_opcao_refeicao_id_idx" ON "planos_alimentos"("opcao_refeicao_id");

-- AddForeignKey
ALTER TABLE "planos_opcoes_refeicoes" ADD CONSTRAINT "planos_opcoes_refeicoes_plano_refeicao_id_fkey" FOREIGN KEY ("plano_refeicao_id") REFERENCES "planos_refeicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_alimentos" ADD CONSTRAINT "planos_alimentos_opcao_refeicao_id_fkey" FOREIGN KEY ("opcao_refeicao_id") REFERENCES "planos_opcoes_refeicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
