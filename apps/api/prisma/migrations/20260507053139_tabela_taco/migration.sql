-- AlterTable
ALTER TABLE "planos_alimentos" ADD COLUMN     "alimento_id" TEXT,
ADD COLUMN     "medida_caseira_id" TEXT;

-- CreateTable
CREATE TABLE "alimentos" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "grupo" TEXT,
    "calorias" DOUBLE PRECISION,
    "proteinas" DOUBLE PRECISION,
    "carboidratos" DOUBLE PRECISION,
    "gorduras" DOUBLE PRECISION,
    "fibra" DOUBLE PRECISION,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medidas_caseiras" (
    "id" TEXT NOT NULL,
    "alimento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade_em_gramas" DOUBLE PRECISION NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medidas_caseiras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alimentos_clinica_id_idx" ON "alimentos"("clinica_id");

-- CreateIndex
CREATE INDEX "medidas_caseiras_alimento_id_idx" ON "medidas_caseiras"("alimento_id");

-- CreateIndex
CREATE INDEX "planos_alimentos_alimento_id_idx" ON "planos_alimentos"("alimento_id");

-- CreateIndex
CREATE INDEX "planos_alimentos_medida_caseira_id_idx" ON "planos_alimentos"("medida_caseira_id");

-- AddForeignKey
ALTER TABLE "planos_alimentos" ADD CONSTRAINT "planos_alimentos_alimento_id_fkey" FOREIGN KEY ("alimento_id") REFERENCES "alimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_alimentos" ADD CONSTRAINT "planos_alimentos_medida_caseira_id_fkey" FOREIGN KEY ("medida_caseira_id") REFERENCES "medidas_caseiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alimentos" ADD CONSTRAINT "alimentos_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medidas_caseiras" ADD CONSTRAINT "medidas_caseiras_alimento_id_fkey" FOREIGN KEY ("alimento_id") REFERENCES "alimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
