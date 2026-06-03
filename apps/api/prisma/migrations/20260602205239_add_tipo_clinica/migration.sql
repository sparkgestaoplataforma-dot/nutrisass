-- CreateEnum
CREATE TYPE "TipoClinica" AS ENUM ('AUTONOMO', 'CLINICA');

-- AlterTable
ALTER TABLE "clinicas" ADD COLUMN     "tipo" "TipoClinica" NOT NULL DEFAULT 'CLINICA';
