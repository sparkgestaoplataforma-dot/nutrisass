-- AlterTable
ALTER TABLE "planos_alimentares"
  ALTER COLUMN "paciente_id" DROP NOT NULL,
  ADD COLUMN "is_template" BOOLEAN NOT NULL DEFAULT false;

