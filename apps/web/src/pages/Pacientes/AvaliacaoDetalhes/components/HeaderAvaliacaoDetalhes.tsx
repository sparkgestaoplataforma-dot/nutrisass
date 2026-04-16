import styles from "../AvaliacaoDetalhesPage.module.scss";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router-dom";
import { Paciente } from "@/services/pacientes";

interface HeaderAvaliacaoDetalhesProps {
  paciente: Paciente | null | undefined;
}

export function HeaderAvaliacaoDetalhes({ paciente }: HeaderAvaliacaoDetalhesProps) {
  const nomePaciente = paciente?.nome || "?";
  const navigate = useNavigate();
  function getInitials(nome: string): string {
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return (
    <>
      {" "}
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
        <span>Voltar ao Prontuário</span>
      </button>
      <div className={styles.subViewHeader}>
        <div className={styles.subViewAvatar}>{getInitials(nomePaciente)}</div>{" "}
        <div>
          <h2 className={styles.subViewTitle}>Resultados do Questionário</h2>
        </div>
      </div>
    </>
  );
}
