-- CreateIndex
CREATE UNIQUE INDEX "pacientes_clinica_id_cpf_key" ON "pacientes"("clinica_id", "cpf");
