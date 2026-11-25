-- CreateIndex
CREATE INDEX "planos_alimentares_clinica_id_is_template_idx" ON "planos_alimentares"("clinica_id", "is_template");

-- AddCheckConstraint
ALTER TABLE "planos_alimentares"
  ADD CONSTRAINT "planos_alimentares_template_paciente_chk"
  CHECK (
    ("is_template" = true AND "paciente_id" IS NULL)
    OR ("is_template" = false AND "paciente_id" IS NOT NULL)
  );
