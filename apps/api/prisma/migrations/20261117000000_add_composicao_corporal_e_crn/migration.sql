-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "crn" TEXT;

-- AlterTable
ALTER TABLE "medidas"
  ADD COLUMN "protocolo_composicao" TEXT,
  ADD COLUMN "dobra_triceps" DOUBLE PRECISION,
  ADD COLUMN "dobra_subescapular" DOUBLE PRECISION,
  ADD COLUMN "dobra_peitoral" DOUBLE PRECISION,
  ADD COLUMN "dobra_axilar_media" DOUBLE PRECISION,
  ADD COLUMN "dobra_suprailiaca" DOUBLE PRECISION,
  ADD COLUMN "dobra_abdominal" DOUBLE PRECISION,
  ADD COLUMN "dobra_coxa" DOUBLE PRECISION,
  ADD COLUMN "percentual_gordura" DOUBLE PRECISION,
  ADD COLUMN "massa_magra_kg" DOUBLE PRECISION,
  ADD COLUMN "massa_gorda_kg" DOUBLE PRECISION,
  ADD COLUMN "massa_muscular_kg" DOUBLE PRECISION,
  ADD COLUMN "agua_corporal_pct" DOUBLE PRECISION,
  ADD COLUMN "gordura_visceral" DOUBLE PRECISION,
  ADD COLUMN "taxa_metabolica_bia" DOUBLE PRECISION,
  ADD COLUMN "idade_metabolica" INTEGER,
  ADD COLUMN "observacoes" TEXT;

