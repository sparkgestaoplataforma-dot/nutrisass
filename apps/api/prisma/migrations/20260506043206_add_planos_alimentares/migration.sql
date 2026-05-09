-- CreateTable
CREATE TABLE "planos_alimentares" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_alimentares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_refeicoes" (
    "id" TEXT NOT NULL,
    "plano_alimentar_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_refeicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_alimentos" (
    "id" TEXT NOT NULL,
    "plano_refeicao_id" TEXT NOT NULL,
    "alimento" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT NOT NULL,
    "calorias" DOUBLE PRECISION,
    "proteinas" DOUBLE PRECISION,
    "carboidratos" DOUBLE PRECISION,
    "gorduras" DOUBLE PRECISION,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_alimentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planos_alimentares_clinica_id_idx" ON "planos_alimentares"("clinica_id");

-- CreateIndex
CREATE INDEX "planos_alimentares_paciente_id_idx" ON "planos_alimentares"("paciente_id");

-- CreateIndex
CREATE INDEX "planos_alimentares_usuario_id_idx" ON "planos_alimentares"("usuario_id");

-- CreateIndex
CREATE INDEX "planos_refeicoes_plano_alimentar_id_idx" ON "planos_refeicoes"("plano_alimentar_id");

-- CreateIndex
CREATE INDEX "planos_alimentos_plano_refeicao_id_idx" ON "planos_alimentos"("plano_refeicao_id");

-- AddForeignKey
ALTER TABLE "planos_alimentares" ADD CONSTRAINT "planos_alimentares_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_alimentares" ADD CONSTRAINT "planos_alimentares_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_alimentares" ADD CONSTRAINT "planos_alimentares_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_refeicoes" ADD CONSTRAINT "planos_refeicoes_plano_alimentar_id_fkey" FOREIGN KEY ("plano_alimentar_id") REFERENCES "planos_alimentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_alimentos" ADD CONSTRAINT "planos_alimentos_plano_refeicao_id_fkey" FOREIGN KEY ("plano_refeicao_id") REFERENCES "planos_refeicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
