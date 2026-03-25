import styles from "../AvaliacaoDetalhesPage.module.scss";

interface MainAvaliacaoDetalhesProps {
  mockModulos: any;
  InstrucoesItens: { nota: number; descricao: string }[];
}
export function MainAvaliacaoDetalhes({
  mockModulos,
  InstrucoesItens,
}: MainAvaliacaoDetalhesProps) {
  return (
    <>
      <div className={styles.questionarioWrapper}>
        {/* INSTRUÇÕES */}
        <section className={styles.instrucoes}>
          <h3>Instruções de Interpretação</h3>

          <div className={styles.legendaGrid}>
            {InstrucoesItens.map((item) => (
              <div key={item.nota} className={styles.legendaItem}>
                <strong>{item.nota}</strong>
                <span>{item.descricao}</span>
              </div>
            ))}
          </div>
        </section>

        {/* MÓDULOS */}
        {mockModulos.map((modulo: any) => (
          <section
            key={modulo.nome}
            className={styles.moduloCard}
            id={`modulo-${modulo.id}`}
          >
            <h2>{modulo.nome}</h2>

            <div className={styles.perguntas}>
              {modulo.perguntas.map((p: any, index: number) => (
                <article key={index} className={styles.perguntaItem}>
                  <p className={styles.perguntaTexto}>{p.descricao}</p>

                  <div className={styles.notasGrid}>
                    {[0, 1, 2, 3, 4].map((nota) => (
                      <button
                        key={nota}
                        className={`${styles.notaBox} ${
                          p.resposta === nota ? styles.notaSelecionada : ""
                        }`}
                      >
                        {nota}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
