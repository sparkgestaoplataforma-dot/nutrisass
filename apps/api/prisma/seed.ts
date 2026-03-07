import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@nutricao.com' },
    update: {},
    create: {
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
      nome: 'Secretária',
      email: 'secretaria@nutricao.com',
      senha: senhaHash,
      perfil: 'SECRETARIA',
    },
  });

  const particular = await prisma.convenio.upsert({
    where: { id: 'particular' },
    update: {},
    create: {
      id: 'particular',
      nome: 'Particular',
    },
  });

  console.log('Seed executado com sucesso!');
  console.log('Usuarios criados: admin@nutricao.com / nutri@nutricao.com / secretaria@nutricao.com');
  console.log('Senha padrão: 123456');
  console.log(`Convenio: ${particular.nome}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
