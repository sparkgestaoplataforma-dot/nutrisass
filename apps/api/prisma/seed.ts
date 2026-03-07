import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10);

  // Criar clínica demo
  const clinica = await prisma.clinica.upsert({
    where: { cnpj: '00000000000100' },
    update: {},
    create: {
      nome: 'Clínica Demo',
      cnpj: '00000000000100',
      email: 'demo@nutricao.com',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'admin@nutricao.com' },
    update: {},
    create: {
      clinicaId: clinica.id,
      nome: 'Administrador',
      email: 'admin@nutricao.com',
      senha: senhaHash,
      perfil: 'ADMIN',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'nutri@nutricao.com' },
    update: {},
    create: {
      clinicaId: clinica.id,
      nome: 'Dr(a). Nutricionista',
      email: 'nutri@nutricao.com',
      senha: senhaHash,
      perfil: 'NUTRICIONISTA',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'secretaria@nutricao.com' },
    update: {},
    create: {
      clinicaId: clinica.id,
      nome: 'Secretária',
      email: 'secretaria@nutricao.com',
      senha: senhaHash,
      perfil: 'SECRETARIA',
    },
  });

  await prisma.convenio.upsert({
    where: { id: 'particular' },
    update: {},
    create: {
      id: 'particular',
      clinicaId: clinica.id,
      nome: 'Particular',
    },
  });

  console.log('Seed executado com sucesso!');
  console.log(`Clínica: ${clinica.nome} (${clinica.id})`);
  console.log('Usuarios: admin@nutricao.com / nutri@nutricao.com / secretaria@nutricao.com');
  console.log('Senha padrão: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
