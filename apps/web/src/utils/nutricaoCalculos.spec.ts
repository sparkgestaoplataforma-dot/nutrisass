import {
  extrairBasePor100g,
  hidratarAlimentoSalvo,
  criarAlimentoInicial,
  formatarLabelMedidaCaseira,
  recalcularAlimentoPlano,
  calcularTotaisAlimentos,
  calcularTotaisPlano,
  calcularTMB,
  calcularGET,
  calcularDistribuicaoMacrosPorGKg,
  calcularMetricasMacro,
  calcularRecomendacaoAgua,
  calcularIMC,
  classificarIMC,
  calcularFaixaPesoIdeal,
  calcularRCQ,
  calcularRCE,
  calcularPollock3,
  calcularPollock7,
  calcularComposicaoPorBioimpedancia,
  classificarPercentualGordura,
  formatarListaPortugues,
  calcularProgressoAvaliacao,
  validarValoresMedida,
  avaliarResultadoExame,
  duplicarPlanoParaInput,
  gerarRefeicoesPadrao,
} from './nutricaoCalculos';

describe('nutricaoCalculos — Motor Clínico e Correções do Plano Alimentar (TDD)', () => {
  describe('1. Bug #1A — extrairBasePor100g (Edição de Plano Alimentar salvo)', () => {
    it('deve extrair a base nutricional por 100g diretamente de alimentoRel quando presente', () => {
      const itemSalvo = {
        quantidade: 2,
        unidade: 'Colher de sopa cheia',
        medidaCaseiraId: 'mc-1',
        calorias: 64,
        proteinas: 1.25,
        carboidratos: 14.05,
        gorduras: 0.1,
        alimentoRel: {
          calorias: 128,
          proteinas: 2.5,
          carboidratos: 28.1,
          gorduras: 0.2,
          fibra: 1.6,
          medidasCaseiras: [
            { id: 'mc-1', nome: 'Colher de sopa cheia', quantidadeEmGramas: 25 },
          ],
        },
      };

      const base = extrairBasePor100g(itemSalvo);
      expect(base).toEqual({
        cal: 128,
        prot: 2.5,
        carb: 28.1,
        gord: 0.2,
        fibra: 1.6,
      });
    });

    it('deve deduzir proporcionalmente a base por 100g quando alimentoRel for nulo (alimento livre/manual)', () => {
      const itemSemRel = {
        quantidade: 50,
        unidade: 'g',
        medidaCaseiraId: null,
        calorias: 200,
        proteinas: 15,
        carboidratos: 20,
        gorduras: 6,
        alimentoRel: null,
      };

      const base = extrairBasePor100g(itemSemRel);
      expect(base.cal).toBeCloseTo(400, 1);
      expect(base.prot).toBeCloseTo(30, 1);
      expect(base.carb).toBeCloseTo(40, 1);
      expect(base.gord).toBeCloseTo(12, 1);
      expect(base.fibra).toBe(0);
    });

    it('não deve gerar NaN ou Infinity se quantidade for 0', () => {
      const base = extrairBasePor100g({
        quantidade: 0,
        unidade: 'g',
        medidaCaseiraId: null,
        calorias: 0,
        proteinas: 0,
        carboidratos: 0,
        gorduras: 0,
        alimentoRel: null,
      });
      expect(base).toEqual({ cal: 0, prot: 0, carb: 0, gord: 0, fibra: 0 });
    });
  });

  describe('2. Bug #1B & #1C — recalcularAlimentoPlano (Medidas Caseiras × Quantidade)', () => {
    const arrozItemInicial = {
      _uid: 'item-1',
      alimentoId: 'al-arroz',
      medidaCaseiraId: null as string | null,
      alimento: 'Arroz branco cozido',
      quantidade: 100,
      unidade: 'g',
      calorias: 128,
      proteinas: 2.5,
      carboidratos: 28.1,
      gorduras: 0.2,
      fibra: 1.6,
      observacao: null,
      _basePer100: { cal: 128, prot: 2.5, carb: 28.1, gord: 0.2, fibra: 1.6 },
      _medidasCaseiras: [
        { id: 'mc-colher', nome: 'Colher de sopa cheia', quantidadeEmGramas: 25 },
        { id: 'mc-escumadeira', nome: 'Escumadeira cheia', quantidadeEmGramas: 80 },
      ],
    };

    it('ao selecionar uma medida caseira saindo de 100g padrão, deve resetar quantidade para 1 unidade e calcular para o peso de 1 medida (25g)', () => {
      const atualizado = recalcularAlimentoPlano(
        arrozItemInicial,
        'medidaCaseiraId',
        'mc-colher',
      );

      expect(atualizado.medidaCaseiraId).toBe('mc-colher');
      expect(atualizado.unidade).toBe('Colher de sopa cheia');
      expect(atualizado.quantidade).toBe(1); // Não deve manter 100 colheres!
      // 25g = 1/4 de 100g
      expect(atualizado.calorias).toBeCloseTo(32, 1);
      expect(atualizado.proteinas).toBeCloseTo(0.6, 1);
      expect(atualizado.carboidratos).toBeCloseTo(7.0, 1);
      expect(atualizado.gorduras).toBeCloseTo(0.1, 1);
      expect(atualizado.fibra).toBeCloseTo(0.4, 1);
    });

    it('ao alterar a quantidade com medida caseira ativa (ex: de 1 para 4 colheres de 25g), deve calcular para 100g (4 * 25g) e NÃO para 4g', () => {
      const comUmaColher = recalcularAlimentoPlano(
        arrozItemInicial,
        'medidaCaseiraId',
        'mc-colher',
      );
      const comQuatroColheres = recalcularAlimentoPlano(
        comUmaColher,
        'quantidade',
        4,
      );

      expect(comQuatroColheres.quantidade).toBe(4);
      expect(comQuatroColheres.unidade).toBe('Colher de sopa cheia');
      // 4 * 25g = 100g -> 128 kcal
      expect(comQuatroColheres.calorias).toBeCloseTo(128, 1);
      expect(comQuatroColheres.proteinas).toBeCloseTo(2.5, 1);
      expect(comQuatroColheres.carboidratos).toBeCloseTo(28.1, 1);
      expect(comQuatroColheres.gorduras).toBeCloseTo(0.2, 1);
      expect(comQuatroColheres.fibra).toBeCloseTo(1.6, 1);
    });

    it('ao trocar de uma medida caseira (2 colheres = 50g) de volta para gramas (null), deve restaurar unidade="g" e converter quantidade para 50g', () => {
      const comUmaColher = recalcularAlimentoPlano(
        arrozItemInicial,
        'medidaCaseiraId',
        'mc-colher',
      );
      const comDuasColheres = recalcularAlimentoPlano(
        comUmaColher,
        'quantidade',
        2,
      );
      const deVoltaParaGramas = recalcularAlimentoPlano(
        comDuasColheres,
        'medidaCaseiraId',
        null,
      );

      expect(deVoltaParaGramas.medidaCaseiraId).toBeNull();
      expect(deVoltaParaGramas.unidade).toBe('g');
      expect(deVoltaParaGramas.quantidade).toBe(50);
      expect(deVoltaParaGramas.calorias).toBeCloseTo(64, 1);
    });

    it('ao alterar a quantidade em gramas (ex: 150g), deve recalcular todos os macros proporcionalmente', () => {
      const com150g = recalcularAlimentoPlano(arrozItemInicial, 'quantidade', 150);
      expect(com150g.quantidade).toBe(150);
      expect(com150g.unidade).toBe('g');
      expect(com150g.calorias).toBeCloseTo(192, 1);
      expect(com150g.proteinas).toBeCloseTo(3.8, 1);
      expect(com150g.carboidratos).toBeCloseTo(42.2, 1);
      expect(com150g.gorduras).toBeCloseTo(0.3, 1);
      expect(com150g.fibra).toBeCloseTo(2.4, 1);
    });

    it('hidratarAlimentoSalvo deve restaurar _basePer100, calcular fibra e permitir recálculo imediato na edição', () => {
      const salvoDaApi = {
        alimentoId: 'al-arroz',
        medidaCaseiraId: 'mc-colher',
        alimento: 'Arroz branco cozido',
        quantidade: 2,
        unidade: 'Colher de sopa cheia',
        calorias: 64,
        proteinas: 1.3,
        carboidratos: 14.1,
        gorduras: 0.1,
        observacao: null,
        alimentoRel: {
          calorias: 128,
          proteinas: 2.5,
          carboidratos: 28.1,
          gorduras: 0.2,
          fibra: 1.6,
          medidasCaseiras: [
            { id: 'mc-g', nome: 'g', quantidadeEmGramas: 1 },
            { id: 'mc-colher', nome: 'Colher de sopa cheia', quantidadeEmGramas: 25 },
          ],
        },
      };

      const hidratado = hidratarAlimentoSalvo(salvoDaApi, 'uid-teste');
      expect(hidratado._basePer100.cal).toBe(128);
      expect(hidratado.fibra).toBeCloseTo(0.8, 1); // 2 * 25g = 50g => metade de 1.6g
      // Filtra a medida 'g' duplicada da lista de medidas caseiras
      expect(hidratado._medidasCaseiras).toHaveLength(1);
      expect(hidratado._medidasCaseiras[0].id).toBe('mc-colher');

      // Se o nutricionista mudar de 2 para 4 colheres na edição, deve recalcular para 100g (128 kcal)
      const editado = recalcularAlimentoPlano(hidratado, 'quantidade', 4);
      expect(editado.calorias).toBeCloseTo(128, 1);
      expect(editado.fibra).toBeCloseTo(1.6, 1);
    });

    it('criarAlimentoInicial e formatarLabelMedidaCaseira devem tratar líquidos (ml) e exibir gramatura clara', () => {
      const sucoApi = {
        id: 'al-suco',
        nome: 'Suco de Laranja',
        calorias: 45,
        proteinas: 0.7,
        carboidratos: 10.4,
        gorduras: 0.2,
        fibra: 0.2,
        medidasCaseiras: [
          { id: 'mc-g', nome: 'g', quantidadeEmGramas: 1 },
          { id: 'mc-ml', nome: 'ml', quantidadeEmGramas: 1 },
          { id: 'mc-copo', nome: 'Copo (200ml)', quantidadeEmGramas: 200 },
          { id: 'mc-colher', nome: 'Colher de sopa cheia', quantidadeEmGramas: 25 },
        ],
      };

      const novo = criarAlimentoInicial(sucoApi, 'uid-suco');
      expect(novo.quantidade).toBe(100);
      expect(novo.unidade).toBe('ml');
      expect(novo.fibra).toBeCloseTo(0.2, 1);
      // Remove 'g' redundante mas preserva 'ml' e demais medidas
      expect(novo._medidasCaseiras.some((m) => m.nome === 'g')).toBe(false);

      expect(formatarLabelMedidaCaseira({ id: '1', nome: 'Colher de sopa cheia', quantidadeEmGramas: 25 })).toBe(
        'Colher de sopa cheia (25g)',
      );
      expect(formatarLabelMedidaCaseira({ id: '2', nome: 'Copo (200ml)', quantidadeEmGramas: 200 })).toBe(
        'Copo (200ml)',
      );
    });
  });

  describe('3. Bug #2 — calcularTotaisAlimentos e calcularTotaisPlano (Consistência Tela vs PDF)', () => {
    const refeicoesMock = [
      {
        opcoes: [
          {
            alimentos: [
              { calorias: 300, proteinas: 20, carboidratos: 30, gorduras: 10, fibra: 4 },
              { calorias: 100, proteinas: 5, carboidratos: 15, gorduras: 2, fibra: 2 },
            ],
          },
          {
            alimentos: [
              { calorias: 200, proteinas: 15, carboidratos: 20, gorduras: 6, fibra: 3 },
            ],
          },
        ],
      },
      {
        opcoes: [
          {
            alimentos: [
              { calorias: 500, proteinas: 40, carboidratos: 50, gorduras: 15, fibra: 6 },
            ],
          },
        ],
      },
    ];

    it('deve somar apenas a Opção Principal (opcoes[0]) quando modo for "principal"', () => {
      const totais = calcularTotaisPlano(refeicoesMock, 'principal');
      // Ref 1 Opção 0 = 400 kcal | Ref 2 Opção 0 = 500 kcal => 900 kcal
      expect(totais).toEqual({
        cal: 900,
        prot: 65,
        carb: 95,
        gord: 27,
        fibra: 12,
      });
    });

    it('deve calcular a média das opções de cada refeição quando modo for "media"', () => {
      const totais = calcularTotaisPlano(refeicoesMock, 'media');
      // Ref 1 média = (400 + 200)/2 = 300 kcal | Ref 2 média = 500 kcal => 800 kcal
      expect(totais).toEqual({
        cal: 800,
        prot: 60,
        carb: 82.5,
        gord: 24,
        fibra: 10.5,
      });
    });

    it('calcularTotaisAlimentos deve somar corretamente os itens de uma opção', () => {
      const totais = calcularTotaisAlimentos(refeicoesMock[0].opcoes[0].alimentos);
      expect(totais).toEqual({
        cal: 400,
        prot: 25,
        carb: 45,
        gord: 12,
        fibra: 6,
      });
    });
  });

  describe('4. Cálculos de Gasto Energético — TMB e GET (Fórmulas do WebDiet)', () => {
    it('deve calcular TMB por Mifflin-St Jeor (1990) para Homem e Mulher', () => {
      // Homem: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      const tmbHomem = calcularTMB({
        peso: 80,
        alturaCm: 180,
        idade: 30,
        sexo: 'MASCULINO',
        protocolo: 'MIFFLIN_ST_JEOR',
      });
      expect(tmbHomem).toBeCloseTo(1780, 1);

      // Mulher: 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25
      const tmbMulher = calcularTMB({
        peso: 60,
        alturaCm: 165,
        idade: 28,
        sexo: 'FEMININO',
        protocolo: 'MIFFLIN_ST_JEOR',
      });
      expect(tmbMulher).toBeCloseTo(1330.25, 1);
    });

    it('deve calcular TMB por Harris-Benedict (1919) para Homem e Mulher', () => {
      // Homem: 66.473 + 13.7516*80 + 5.0033*180 - 6.755*30 = 1864.545
      const tmbHomem = calcularTMB({
        peso: 80,
        alturaCm: 180,
        idade: 30,
        sexo: 'MASCULINO',
        protocolo: 'HARRIS_BENEDICT',
      });
      expect(tmbHomem).toBeCloseTo(1864.5, 0);

      // Mulher: 655.0955 + 9.5634*60 + 1.8496*165 - 4.6756*28 = 1403.17
      const tmbMulher = calcularTMB({
        peso: 60,
        alturaCm: 165,
        idade: 28,
        sexo: 'FEMININO',
        protocolo: 'HARRIS_BENEDICT',
      });
      expect(tmbMulher).toBeCloseTo(1403.2, 0);
    });

    it('deve calcular TMB por FAO/OMS para diferentes faixas etárias', () => {
      // Homem 25 anos (18-30): 15.057 * 75 + 692.2 = 1821.475
      const tmbH25 = calcularTMB({
        peso: 75,
        alturaCm: 175,
        idade: 25,
        sexo: 'MASCULINO',
        protocolo: 'FAO_OMS',
      });
      expect(tmbH25).toBeCloseTo(1821.5, 0);

      // Mulher 40 anos (30-60): 8.126 * 65 + 845.6 = 1373.79
      const tmbM40 = calcularTMB({
        peso: 65,
        alturaCm: 162,
        idade: 40,
        sexo: 'FEMININO',
        protocolo: 'FAO_OMS',
      });
      expect(tmbM40).toBeCloseTo(1373.8, 0);
    });

    it('deve calcular TMB por Cunningham (1980) usando Massa Livre de Gordura', () => {
      // 500 + 22 * 60 = 1820
      const tmb = calcularTMB({
        peso: 75,
        alturaCm: 178,
        idade: 26,
        sexo: 'MASCULINO',
        protocolo: 'CUNNINGHAM',
        massaMagraKg: 60,
      });
      expect(tmb).toBe(1820);
    });

    it('deve calcular GET / Meta Direta pela Fórmula de Bolso (kcal/kg)', () => {
      // 70kg * 30 kcal/kg = 2100 kcal
      const valor = calcularTMB({
        peso: 70,
        alturaCm: 170,
        idade: 35,
        sexo: 'MASCULINO',
        protocolo: 'BOLSO',
        kcalPorKg: 30,
      });
      expect(valor).toBe(2100);
    });

    it('calcularGET deve multiplicar TMB pelo Fator de Atividade e somar o ajuste do objetivo', () => {
      // TMB = 1500, FA = 1.55 (Moderado) => GET = 2325. Déficit -500 => Meta = 1825
      const res = calcularGET(1500, 1.55, -500);
      expect(res.get).toBe(2325);
      expect(res.metaCalorias).toBe(1825);
    });
  });

  describe('5. Distribuição de Macronutrientes por g/kg e Hidratação', () => {
    it('deve distribuir Proteína e Gordura por g/kg e fechar o restante das calorias em Carboidratos', () => {
      // Paciente 75kg, Meta 2100 kcal
      // Proteína: 2.0 g/kg => 150g (600 kcal)
      // Gordura: 1.0 g/kg => 75g (675 kcal)
      // Restante para Carboidrato: 2100 - 1275 = 825 kcal => 206.25g (~206g, 2.75 g/kg)
      const dist = calcularDistribuicaoMacrosPorGKg({
        pesoKg: 75,
        metaCalorias: 2100,
        proteinaGKg: 2.0,
        gorduraGKg: 1.0,
      });

      expect(dist.proteinasG).toBe(150);
      expect(dist.gordurasG).toBe(75);
      expect(dist.carboidratosG).toBe(206);
      expect(dist.carboidratoGKg).toBeCloseTo(2.75, 1);
      expect(dist.proteinaPct).toBeCloseTo((600 / 2100) * 100, 0);
      expect(dist.gorduraPct).toBeCloseTo((675 / 2100) * 100, 0);
    });

    it('calcularMetricasMacro deve retornar g/kg e % calórico para exibição ao lado das metas', () => {
      const mProt = calcularMetricasMacro(150, 'proteina', 75, 2000);
      expect(mProt.gPorKg).toBeCloseTo(2.0, 1);
      expect(mProt.kcal).toBe(600);
      expect(mProt.percentual).toBeCloseTo(30, 1);
    });

    it('calcularRecomendacaoAgua deve calcular 35 ml/kg por padrão', () => {
      expect(calcularRecomendacaoAgua(70)).toBe(2450);
      expect(calcularRecomendacaoAgua(70, 40)).toBe(2800);
    });
  });

  describe('6. Antropometria, Composição Corporal (Pollock 3/7) e Exames', () => {
    it('deve classificar IMC corretamente para Adultos (OMS) vs Idosos >= 60 anos (Lipschitz)', () => {
      const imc21 = calcularIMC(54, 160)!; // 21.09 kg/m²
      expect(classificarIMC(imc21, 30)).toBe('Peso adequado');
      expect(classificarIMC(imc21, 68)).toBe('Baixo peso (Idoso)');

      const imc26 = calcularIMC(66.5, 160)!; // 25.97 kg/m²
      expect(classificarIMC(imc26, 30)).toBe('Sobrepeso');
      expect(classificarIMC(imc26, 68)).toBe('Peso adequado (Idoso)');
    });

    it('deve calcular a Faixa de Peso Ideal conforme idade (Adulto vs Idoso)', () => {
      const faixaAdulto = calcularFaixaPesoIdeal(170, 30)!;
      // 1.7^2 = 2.89 => min: 18.5*2.89 = 53.5kg, max: 24.9*2.89 = 72.0kg
      expect(faixaAdulto.min).toBeCloseTo(53.5, 1);
      expect(faixaAdulto.max).toBeCloseTo(72.0, 1);

      const faixaIdoso = calcularFaixaPesoIdeal(170, 65)!;
      // min: 22*2.89 = 63.6kg, max: 27*2.89 = 78.0kg
      expect(faixaIdoso.min).toBeCloseTo(63.6, 1);
      expect(faixaIdoso.max).toBeCloseTo(78.0, 1);
    });

    it('deve calcular RCQ (Relação Cintura-Quadril) e RCE (Relação Cintura-Estatura) com risco cardiovascular', () => {
      const rcqMulherAlto = calcularRCQ(88, 98, 'FEMININO')!;
      expect(rcqMulherAlto.valor).toBeCloseTo(0.9, 2);
      expect(rcqMulherAlto.risco).toBe('Alto');

      const rcqHomemBaixo = calcularRCQ(82, 98, 'MASCULINO')!;
      expect(rcqHomemBaixo.valor).toBeCloseTo(0.84, 2);
      expect(rcqHomemBaixo.risco).toBe('Baixo');

      const rce = calcularRCE(92, 170)!;
      expect(rce.valor).toBeCloseTo(0.54, 2);
      expect(rce.risco).toBe('Elevado');
    });

    it('deve calcular Composição Corporal por Pollock 3 Dobras (Homem e Mulher)', () => {
      // Homem 30 anos, 80kg: Peitoral 10mm, Abdominal 20mm, Coxa 15mm (Soma = 45mm)
      const resH = calcularPollock3({
        sexo: 'MASCULINO',
        idade: 30,
        peso: 80,
        peitoral: 10,
        abdominal: 20,
        coxa: 15,
      })!;
      expect(resH.somaDobras).toBe(45);
      expect(resH.percentualGordura).toBeGreaterThan(10);
      expect(resH.percentualGordura).toBeLessThan(16);
      expect(resH.massaGordaKg + resH.massaMagraKg).toBeCloseTo(80, 1);

      // Mulher 28 anos, 62kg: Tríceps 15mm, Supra-ilíaca 14mm, Coxa 21mm (Soma = 50mm)
      const resM = calcularPollock3({
        sexo: 'FEMININO',
        idade: 28,
        peso: 62,
        triceps: 15,
        suprailiaca: 14,
        coxa: 21,
      })!;
      expect(resM.somaDobras).toBe(50);
      expect(resM.percentualGordura).toBeGreaterThan(18);
      expect(resM.percentualGordura).toBeLessThan(24);
      expect(resM.massaGordaKg + resM.massaMagraKg).toBeCloseTo(62, 1);
    });

    it('deve calcular Composição Corporal por Pollock 7 Dobras', () => {
      const res7 = calcularPollock7({
        sexo: 'MASCULINO',
        idade: 32,
        peso: 82,
        peitoral: 10,
        axilarMedia: 12,
        triceps: 11,
        subescapular: 14,
        abdominal: 20,
        suprailiaca: 15,
        coxa: 16,
      })!;
      expect(res7.somaDobras).toBe(98);
      expect(res7.percentualGordura).toBeGreaterThan(12);
      expect(res7.percentualGordura).toBeLessThan(20);
      expect(res7.massaGordaKg + res7.massaMagraKg).toBeCloseTo(82, 1);
    });

    it('avaliarResultadoExame deve identificar valores Abaixo, Normal e Acima da referência', () => {
      expect(avaliarResultadoExame('65', 70, 99)).toBe('ABAIXO');
      expect(avaliarResultadoExame('88,5', 70, 99)).toBe('NORMAL');
      expect(avaliarResultadoExame('112 mg/dL', 70, 99)).toBe('ACIMA');
      expect(avaliarResultadoExame('Não reagente', null, null)).toBe('INDETERMINADO');
    });

    it('calcularComposicaoPorBioimpedancia deve calcular massa magra e gorda a partir do % de gordura', () => {
      const res = calcularComposicaoPorBioimpedancia({
        peso: 80,
        percentualGordura: 20,
      })!;
      expect(res.percentualGordura).toBe(20);
      expect(res.massaGordaKg).toBe(16);
      expect(res.massaMagraKg).toBe(64);
    });

    it('calcularComposicaoPorBioimpedancia deve calcular % de gordura quando apenas massa magra for informada', () => {
      const res = calcularComposicaoPorBioimpedancia({
        peso: 70,
        massaMagraKg: 52.5,
      })!;
      expect(res.massaMagraKg).toBe(52.5);
      expect(res.massaGordaKg).toBe(17.5);
      expect(res.percentualGordura).toBe(25);
    });

    it('calcularComposicaoPorBioimpedancia deve retornar null para entradas inválidas', () => {
      expect(calcularComposicaoPorBioimpedancia({ peso: 0, percentualGordura: 20 })).toBeNull();
      expect(calcularComposicaoPorBioimpedancia({ peso: 70 })).toBeNull();
    });

    it('classificarPercentualGordura deve classificar homem e mulher conforme referência clínica', () => {
      expect(classificarPercentualGordura(14, 'MASCULINO', 28)?.label).toBe('Bom / Adequado');
      expect(classificarPercentualGordura(28, 'MASCULINO', 28)?.badgeType).toBe('danger');
      expect(classificarPercentualGordura(22, 'FEMININO', 30)?.label).toBe('Bom / Adequado');
      expect(classificarPercentualGordura(36, 'FEMININO', 30)?.badgeType).toBe('danger');
      expect(classificarPercentualGordura(null, 'FEMININO', 30)).toBeNull();
    });

    it('formatarListaPortugues deve formatar "X", "X e Y" e "X, Y e Z" corretamente', () => {
      expect(formatarListaPortugues([])).toBe('');
      expect(formatarListaPortugues(['Peso e Circunferências'])).toBe('Peso e Circunferências');
      expect(formatarListaPortugues(['Peso e Circunferências', 'Dobras Cutâneas'])).toBe(
        'Peso e Circunferências e Dobras Cutâneas',
      );
      expect(
        formatarListaPortugues(['Peso e Circunferências', 'Dobras Cutâneas', 'Bioimpedância (BIA)']),
      ).toBe('Peso e Circunferências, Dobras Cutâneas e Bioimpedância (BIA)');
    });

    it('calcularProgressoAvaliacao deve calcular % de preenchimento por aba, total e listar o que falta', () => {
      const vazio = calcularProgressoAvaliacao({}, 'POLLOCK_3', 'MASCULINO');
      expect(vazio.nenhumCampoPreenchido).toBe(true);
      expect(vazio.percentualTotal).toBe(0);
      expect(vazio.abasIncompletas).toEqual([
        'Peso e Circunferências',
        'Dobras Cutâneas (Pollock 3)',
        'Bioimpedância (BIA)',
      ]);
      expect(vazio.textoAbasIncompletas).toBe(
        'Peso e Circunferências, Dobras Cutâneas (Pollock 3) e Bioimpedância (BIA)',
      );

      const parcial = calcularProgressoAvaliacao(
        {
          peso: '80',
          altura: '175',
          dobraPeitoral: '12',
          dobraAbdominal: '20',
          dobraCoxa: '15',
        },
        'POLLOCK_3',
        'MASCULINO',
      );
      expect(parcial.nenhumCampoPreenchido).toBe(false);
      expect(parcial.abas.dobras.preenchidos).toBe(3);
      expect(parcial.abas.dobras.total).toBe(3);
      expect(parcial.abas.dobras.percentual).toBe(100);
      expect(parcial.abasIncompletas).toEqual([
        'Peso e Circunferências',
        'Bioimpedância (BIA)',
      ]);
      expect(parcial.textoAbasIncompletas).toBe(
        'Peso e Circunferências e Bioimpedância (BIA)',
      );
    });

    it('validarValoresMedida deve apontar erros claros em português por campo quando valores excedem limites clínicos', () => {
      const erros = validarValoresMedida({
        percentualGordura: '123',
        aguaCorporalPct: '123',
        gorduraVisceral: '123',
        idadeMetabolica: '123',
        peso: '-5',
      });
      expect(erros.percentualGordura).toContain('entre 1% e 75%');
      expect(erros.aguaCorporalPct).toContain('entre 10% e 90%');
      expect(erros.gorduraVisceral).toContain('entre 1 e 60');
      expect(erros.idadeMetabolica).toContain('entre 5 e 120 anos');
      expect(erros.peso).toContain('maior que zero');
    });
  });

  describe('7. Produtividade — Duplicar Plano e Refeições Padrão', () => {
    it('duplicarPlanoParaInput deve clonar um plano existente prontamente para criação', () => {
      const planoExistente: any = {
        id: 'p-1',
        pacienteId: 'pac-1',
        titulo: 'Dieta Cutting',
        objetivo: 'EMAGRECIMENTO',
        metaCalorias: 1800,
        metaProteinas: 140,
        metaCarboidratos: 180,
        metaGorduras: 55,
        recomendacaoAguaMl: 2500,
        observacoes: 'Beber bastante água',
        refeicoes: [
          {
            id: 'r-1',
            nome: 'Café da Manhã',
            horario: '08:00',
            ordem: 0,
            opcoes: [
              {
                id: 'o-1',
                nome: 'Opção 1',
                ordem: 0,
                alimentos: [
                  {
                    id: 'a-1',
                    alimentoId: 'al-1',
                    medidaCaseiraId: 'mc-1',
                    alimento: 'Pão Integral',
                    quantidade: 2,
                    unidade: 'Fatia',
                    calorias: 120,
                    proteinas: 6,
                    carboidratos: 22,
                    gorduras: 1.5,
                    observacao: null,
                  },
                ],
              },
            ],
          },
        ],
      };

      const clonado = duplicarPlanoParaInput(planoExistente);
      expect(clonado.titulo).toBe('Dieta Cutting (Cópia)');
      expect(clonado.pacienteId).toBe('pac-1');
      expect(clonado.metaCalorias).toBe(1800);
      expect(clonado.refeicoes).toHaveLength(1);
      expect(clonado.refeicoes[0].opcoes[0].alimentos[0].alimento).toBe('Pão Integral');
      expect(clonado.refeicoes[0].opcoes[0].alimentos[0].medidaCaseiraId).toBe('mc-1');
    });

    it('gerarRefeicoesPadrao deve retornar as 5 refeições clássicas ordenadas', () => {
      const padrao = gerarRefeicoesPadrao();
      expect(padrao).toHaveLength(5);
      expect(padrao[0].nome).toBe('Café da Manhã');
      expect(padrao[2].nome).toBe('Almoço');
      expect(padrao[4].nome).toBe('Jantar');
    });
  });
});
