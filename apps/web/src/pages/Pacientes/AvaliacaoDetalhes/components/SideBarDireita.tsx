import styles from "../AvaliacaoDetalhesPage.module.scss";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Calculator01Icon,
  DocumentCodeFreeIcons,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { ExcluirAvaliacaoModal } from "@/pages/Pacientes/AvaliacaoDetalhes/components/ExcluirAvaliacaoModal";
import { useState } from "react";
interface SidebarDireitaProps {
  avaliacao: any;
  handleDeleteAvaliacao: () => void;
}
export function SidebarDireita({
  avaliacao,
  handleDeleteAvaliacao,
}: SidebarDireitaProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      <div className={styles.rightCard}>
        {isModalOpen && (
          <ExcluirAvaliacaoModal
            closeModal={closeModal}
            handleDeleteAvaliacao={handleDeleteAvaliacao}
          />
        )}
        <h4 className={styles.rightTitle}>Resumo da avaliação</h4>

        <div className={styles.sideNavTopic}>
          <div className={styles.sideNavIcon}>
            <HugeiconsIcon icon={Calendar01Icon} size={16} />
          </div>
          <div className={styles.topicContent}>
            <div className={styles.topicTitle}>Data</div>
            <div className={styles.topicDescription}>
              {avaliacao?.dataRealizacao
                ? new Date(avaliacao.dataRealizacao).toLocaleDateString("pt-BR")
                : "Nenhuma selecionada"}
            </div>
          </div>
        </div>

        <div className={styles.sideNavTopic}>
          <div className={styles.sideNavIcon}>
            <HugeiconsIcon icon={Calculator01Icon} size={16} />
          </div>
          <div className={styles.topicContent}>
            <div className={styles.topicTitle}>Somatório</div>
            <div className={styles.topicDescription}>
              {avaliacao?.scoreTotal ?? "Nenhuma selecionada"}
            </div>
          </div>
        </div>

        <div className={styles.sideNavTopic}>
          <div className={styles.sideNavIcon}>
            <HugeiconsIcon icon={DocumentCodeFreeIcons} size={16} />
          </div>
          <div className={styles.topicContent}>
            <div className={styles.topicTitle}>Observação</div>
            <div className={styles.topicDescription}>
              {avaliacao?.regraInterpretacao ?? "Nenhuma selecionada"}
            </div>
          </div>
        </div>
        <button className={styles.sideNavItem} onClick={openModal}>
          <div className={styles.sideNavIcon}>
            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.8} />
          </div>
          <span>Excluir Avaliação</span>
        </button>
      </div>
    </>
  );
}
