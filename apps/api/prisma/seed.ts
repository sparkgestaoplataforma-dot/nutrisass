import bcrypt from "bcryptjs";
import { prisma } from "../src/shared/providers/prisma";

async function main() {
  const senhaHash = await bcrypt.hash("123456", 10);

  // Criar clínica demo
  const clinica = await prisma.clinica.upsert({
    where: { cnpj: "00000000000100" },
    update: {},
    create: {
      nome: "Clínica Demo",
      cnpj: "00000000000100",
      email: "demo@nutricao.com",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "admin@nutricao.com" },
    update: {},
    create: {
      clinicaId: clinica.id,
      nome: "Administrador",
      email: "admin@nutricao.com",
      senha: senhaHash,
      perfil: "ADMIN",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "nutri@nutricao.com" },
    update: {},
    create: {
      clinicaId: clinica.id,
      nome: "Dr(a). Nutricionista",
      email: "nutri@nutricao.com",
      senha: senhaHash,
      perfil: "NUTRICIONISTA",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "secretaria@nutricao.com" },
    update: {},
    create: {
      clinicaId: clinica.id,
      nome: "Secretária",
      email: "secretaria@nutricao.com",
      senha: senhaHash,
      perfil: "SECRETARIA",
    },
  });

  const convenio = await prisma.convenio.upsert({
    where: { id: "particular" },
    update: {},
    create: {
      id: "particular",
      clinicaId: clinica.id,
      nome: "Particular",
    },
  });

  // Pacientes de teste (cria apenas se não existirem)
  const existentes = await prisma.paciente.findMany({
    where: { clinicaId: clinica.id },
    select: { cpf: true },
  });
  const cpfsExistentes = new Set(existentes.map((p) => p.cpf));

  let paciente1Id: string | undefined;
  let paciente2Id: string | undefined;

  if (!cpfsExistentes.has("11111111111")) {
    const p1 = await prisma.paciente.create({
      data: {
        clinicaId: clinica.id,
        nome: "Isabela Ataide Rosendo",
        email: "isabela@hotmail.com",
        cpf: "11111111111",
        telefone: "(83) 99051-1262",
        profissao: "Servidora Pública",
        sexo: "FEMININO",
        dataNascimento: new Date("1983-07-11"),
        endereco: "Rua Joaquim Chule, 385",
        bairro: "Bessa",
        municipio: "João Pessoa",
        uf: "PB",
        convenioId: convenio.id,
      },
    });
    paciente1Id = p1.id;
  }

  if (!cpfsExistentes.has("22222222222")) {
    const p2 = await prisma.paciente.create({
      data: {
        clinicaId: clinica.id,
        nome: "Olimpia de Lourdes Correia Cunha",
        email: "olimpiacunha@uol.com.br",
        cpf: "22222222222",
        telefone: "(83) 3243-0475",
        profissao: "Empresária",
        sexo: "FEMININO",
        dataNascimento: new Date("1941-08-13"),
        endereco: "Monteiro Lobato, 538",
        bairro: "Tambaú",
        municipio: "João Pessoa",
        uf: "PB",
        convenioId: convenio.id,
      },
    });
    paciente2Id = p2.id;
  }

  if (!cpfsExistentes.has("33333333333")) {
    await prisma.paciente.create({
      data: {
        clinicaId: clinica.id,
        nome: "Carlos Eduardo Silva",
        email: "carlos.silva@gmail.com",
        cpf: "33333333333",
        telefone: "(83) 98877-6543",
        profissao: "Engenheiro Civil",
        sexo: "MASCULINO",
        dataNascimento: new Date("1990-03-22"),
        endereco: "Av. Epitácio Pessoa, 1200",
        bairro: "Manaíra",
        municipio: "João Pessoa",
        uf: "PB",
        convenioId: convenio.id,
      },
    });
  }

  // Evoluções clínicas para Isabela
  if (paciente1Id) {
    await prisma.evolucaoClinica.create({
      data: {
        pacienteId: paciente1Id,
        estadoClinico:
          "Objetivo = reeducação alimentar, estuda para concurso. Na TPM fica enjoada e com dor de barriga, rinite, unhas fortes, cabelo normais, alérgica a poeira, problemas com cheiros fortes.\ndia 17/12 = teve crise alérgica, teve asma.\ndia 19/01/11 = não\ndia 20/06/11 = super bem.",
        aparelhoDigestivo:
          "Intestino funciona bem\nazia de vez em quando\ndia 20/06/11 = bem, azia não\ndia 23/1/14 = está bem\ndia 07/04/14 = está bem",
        antecedentesMorbidos: "irmão mais velho diabético",
        medicamentos:
          "anticoncepcional - adoless\ndia 20/12 = ácido fólico\nta com óvulo de progesterona.\nomega tres\ndia 06/03/15 = nactalle (anticoncepcional) contínuo",
        outros:
          "Está fazendo personal com Serginho\ndia 20/12 = Dra Renata\ncontinua Renata Gadelha",
      },
    });
  }

  // Evoluções clínicas para Olimpia
  if (paciente2Id) {
    await prisma.evolucaoClinica.create({
      data: {
        pacienteId: paciente2Id,
        estadoClinico:
          "labirintite, objetivos - anemia, dor na coluna, Tg alto, ureia e glicose, dorme bem, roncando muito, não dores nas pernas, tem refluxo, intestino com gases.\ndia 13/03/201 = está muito bem, melhor das dores.\ndia 02/07 = herpes.",
        aparelhoDigestivo:
          "Intestino constipado\ncascara sagrada\ndia 13/03 = melhor\ndia 10/10 = intestino super constipado\ndia 12/11 = mais ou menos e dificuldade de deglição",
        antecedentesMorbidos: "irmão mais velho diabético",
        medicamentos:
          "Omega Sea- 2 ao dia (forever)\nGTF cromo\nGlucosamina\n1 x semana actonel\nLivial\ndia 05/06 = lecitina de soja",
        outros:
          "vai fazer a musculação\nmusculação 3 x semana\n2 x caminha\ndia 25/9/25 = voltou a semana passada",
      },
    });
  }

  console.log("Seed executado com sucesso!");
  console.log(`Clínica: ${clinica.nome} (${clinica.id})`);
  console.log(
    "Usuarios: admin@nutricao.com / nutri@nutricao.com / secretaria@nutricao.com",
  );
  console.log("Senha padrão: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
