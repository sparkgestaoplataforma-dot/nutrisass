-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem_lida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
