import { useState, useEffect } from "react";
import styles from "./AvaliacaoDetalhesPage.module.scss";
import { SidebarEsquerda } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SidebarEsquerda";
import { SidebarDireita } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SideBarDireita";
import { MainAvaliacaoDetalhes } from "./components/MainAvaliacaoDetalhes";
import { HeaderAvaliacaoDetalhes } from "./components/HeaderAvaliacaoDetalhes";
import { Avaliacao, getAvaliacoesPorId } from "@/services/avaliacao";
import { getPacientePorId } from "@/services/pacientes";
import { useParams } from "react-router-dom";

const InstrucoesItens = [
  { nota: 0, descricao: "Nunca ou quase nunca teve esse sintoma" },
  { nota: 1, descricao: "Ocasionalmente teve, mas não foi severo" },
  { nota: 2, descricao: "Ocasionalmente teve, efeito severo" },
  { nota: 3, descricao: "Frequentemente teve, efeito não severo" },
  { nota: 4, descricao: "Frequentemente teve, efeito foi severo" },
];

const mockModulos = [
  {
    id: "476a5830-5878-4608-b860-62f51a0012cc",
    nome: "Cabeça",
    ordem: 1,
    questionarioId: "25bc26fe-552f-410b-a386-8ac8522e248a",
    perguntas: [
      {
        id: "799da733-c243-49f5-9b61-6a0778b800db",
        descricao: "dor de cabeça",
        ordem: 1,
        moduloId: "476a5830-5878-4608-b860-62f51a0012cc",
      },
      {
        id: "ea84b6fe-7ba9-4926-b797-478c92ad1a26",
        descricao: "desmaio",
        ordem: 2,
        moduloId: "476a5830-5878-4608-b860-62f51a0012cc",
      },
      {
        id: "8777cb4d-aa58-46a5-a993-c230e417712c",
        descricao: "tonturas",
        ordem: 3,
        moduloId: "476a5830-5878-4608-b860-62f51a0012cc",
      },
      {
        id: "243a6773-3714-40ea-bf70-af6bc9b63e46",
        descricao: "insônia",
        ordem: 4,
        moduloId: "476a5830-5878-4608-b860-62f51a0012cc",
      },
    ],
  },
  {
    id: "0770f8aa-0396-4ad5-9686-3e602bbddf93",
    nome: "Olhos",
    ordem: 2,
    questionarioId: "25bc26fe-552f-410b-a386-8ac8522e248a",
    perguntas: [
      {
        id: "e5ed7033-31a9-4b68-8066-70bb340cdb24",
        descricao: "coceira",
        ordem: 1,
        moduloId: "0770f8aa-0396-4ad5-9686-3e602bbddf93",
      },
      {
        id: "6245afc5-70a9-4759-aff5-e545149cb103",
        descricao: "inchaço",
        ordem: 2,
        moduloId: "0770f8aa-0396-4ad5-9686-3e602bbddf93",
      },
      {
        id: "fd53ae13-45d1-41fd-9ca8-74bf2d834d10",
        descricao: "olheiras",
        ordem: 3,
        moduloId: "0770f8aa-0396-4ad5-9686-3e602bbddf93",
      },
      {
        id: "bbbcff67-d553-4eb2-9689-42fa6597d756",
        descricao: "visão borrada",
        ordem: 4,
        moduloId: "0770f8aa-0396-4ad5-9686-3e602bbddf93",
      },
    ],
  },
  {
    id: "a88b7b3e-bdff-4857-9871-b63a427f813d",
    nome: "Ouvidos",
    ordem: 3,
    questionarioId: "25bc26fe-552f-410b-a386-8ac8522e248a",
    perguntas: [
      {
        id: "99ce6692-dcfa-406d-a7fe-278006040e41",
        descricao: "coceira",
        ordem: 1,
        moduloId: "a88b7b3e-bdff-4857-9871-b63a427f813d",
      },
      {
        id: "21da6b2b-3285-49a5-9d59-c212d87a7ecb",
        descricao: "dores",
        ordem: 2,
        moduloId: "a88b7b3e-bdff-4857-9871-b63a427f813d",
      },
      {
        id: "c0b8d5e4-5813-4dee-a6b3-c06c959be604",
        descricao: "fluido",
        ordem: 3,
        moduloId: "a88b7b3e-bdff-4857-9871-b63a427f813d",
      },
      {
        id: "0346469a-454d-42ca-b6cd-86dd1eca3dbc",
        descricao: "zumbido",
        ordem: 4,
        moduloId: "a88b7b3e-bdff-4857-9871-b63a427f813d",
      },
    ],
  },
];

export function AvaliacaoDetalhesPage() {
  const { avaliacaoId, pacienteId } = useParams();

  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [paciente, setPaciente] = useState<any>(null);
  useEffect(() => {
    const fetchAvaliacao = async () => {
      const avaliacaoData = await getAvaliacoesPorId(avaliacaoId!);
      console.log("Avaliação obtida:", avaliacaoData);
      setAvaliacao(avaliacaoData.data || null);
    };

    const fetchPaciente = async () => {
      const pacienteData = await getPacientePorId(pacienteId!);
      console.log("Paciente obtido:", pacienteData);
      setPaciente(pacienteData);
    };

    fetchAvaliacao();
    fetchPaciente();
  }, [avaliacaoId]);
  const classificacao = avaliacao?.regrasInterpretacao?.find(
    (regra) =>
      avaliacao.scoreTotal >= regra.pontuacaoMin &&
      avaliacao.scoreTotal <= regra.pontuacaoMax,
  )?.classificacao;
  return (
    <div className={styles.page}>
      <HeaderAvaliacaoDetalhes paciente={paciente} />

      <div className={styles.layout}>
        <aside className={styles.sidebarLeft}>
          <SidebarEsquerda mockModulos={mockModulos} />
        </aside>

        <main>
          <MainAvaliacaoDetalhes
            mockModulos={mockModulos}
            InstrucoesItens={InstrucoesItens}
          />
        </main>

        <aside className={styles.sidebarRight}>
          <SidebarDireita avaliacao={avaliacao} classificacao={classificacao} />
        </aside>
      </div>
    </div>
  );
}
