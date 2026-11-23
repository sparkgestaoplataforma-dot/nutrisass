import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Delete02Icon, PrinterIcon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import {
  listarMedidas,
  criarMedida,
  editarMedida,
  excluirMedida,
  type MedidaAPI,
} from '@/services/prontuario';
import { getPacientePorId } from '@/services/pacientes';
import { getClinica } from '@/services/clinica';
import { obterMeuPerfil } from '@/services/usuario';
import type { CreateMedidaInput, ProtocoloComposicao } from '@nutricao/shared';
import {
  calcularIMC,
  classificarIMC,
  calcularFaixaPesoIdeal,
  calcularRCQ,
  calcularRCE,
  calcularPollock3,
  calcularPollock7,
  calcularComposicaoPorBioimpedancia,
  classificarPercentualGordura,
  calcularProgressoAvaliacao,
  validarValoresMedida,
  traduzirErrosApiMedida,
  prepararSerieEvolucaoAntropometrica,
} from '@/utils/nutricaoCalculos';
import { imprimirMedidas } from '../print/imprimirMedidas';
import styles from '../ProntuarioPage.module.scss';

type FormTab = 'circunferencias' | 'dobras' | 'bioimpedancia';
type PollockModo = 'POLLOCK_3' | 'POLLOCK_7';
type ChartView = 'pesoImc' | 'composicao' | 'circunferencias';

function calcularIdadeAnos(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

function toPosNum(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function badgeClassFor(badgeType: 'ok' | 'warn' | 'danger') {
  if (badgeType === 'ok') return styles.antropoBadgeOk;
  if (badgeType === 'warn') return styles.antropoBadgeWarn;
  return styles.antropoBadgeDanger;
}

const PROTOCOLO_LABELS: Record<string, string> = {
  POLLOCK_3: 'Pollock 3 Dobras',
  POLLOCK_7: 'Pollock 7 Dobras',
  BIOIMPEDANCIA: 'Bioimpedância (BIA)',
  MANUAL: 'Manual',
};

interface MedidasTabProps {
  pacienteId: string;
}

const circunferenciaFields = [
  { key: 'peso', label: 'Peso (kg)' },
  { key: 'altura', label: 'Altura (cm)' },
  { key: 'cintura', label: 'Cintura (cm)' },
  { key: 'abdomen', label: 'Abdômen (cm)' },
  { key: 'quadril', label: 'Quadril (cm)' },
  { key: 'bracoDireito', label: 'Braço Dir.' },
  { key: 'bracoEsquerdo', label: 'Braço Esq.' },
  { key: 'coxaDireita', label: 'Coxa Dir.' },
  { key: 'coxaEsquerda', label: 'Coxa Esq.' },
  { key: 'culote', label: 'Culote' },
] as const;

const dobraFields = [
  { key: 'dobraPeitoral', label: 'Peitoral (mm)', pollock3Masc: true, pollock3Fem: false },
  { key: 'dobraAxilarMedia', label: 'Axilar Média (mm)', pollock3Masc: false, pollock3Fem: false },
  { key: 'dobraTriceps', label: 'Tríceps (mm)', pollock3Masc: false, pollock3Fem: true },
  { key: 'dobraSubescapular', label: 'Subescapular (mm)', pollock3Masc: false, pollock3Fem: false },
  { key: 'dobraAbdominal', label: 'Abdominal (mm)', pollock3Masc: true, pollock3Fem: false },
  { key: 'dobraSuprailiaca', label: 'Suprailíaca (mm)', pollock3Masc: false, pollock3Fem: true },
  { key: 'dobraCoxa', label: 'Coxa Medial (mm)', pollock3Masc: true, pollock3Fem: true },
] as const;

const bioimpedanciaFields = [
  { key: 'percentualGordura', label: '% Gordura Corporal (1 a 75%)', step: '0.1', placeholder: 'Ex: 22.5' },
  { key: 'massaMagraKg', label: 'Massa Magra (kg)', step: '0.1', placeholder: 'Auto pelo %G ou manual' },
  { key: 'massaGordaKg', label: 'Massa Gorda (kg)', step: '0.1', placeholder: 'Auto pelo %G ou manual' },
  { key: 'massaMuscularKg', label: 'Massa Muscular Esq. (kg)', step: '0.1', placeholder: 'Ex: 31.4' },
  { key: 'aguaCorporalPct', label: 'Água Corporal (10 a 90%)', step: '0.1', placeholder: 'Ex: 56.0' },
  { key: 'gorduraVisceral', label: 'Gordura Visceral (nível 1 a 60)', step: '1', placeholder: 'Ex: 6' },
  { key: 'taxaMetabolicaBia', label: 'TMB Aparelho BIA (kcal)', step: '1', placeholder: 'Ex: 1580' },
  { key: 'idadeMetabolica', label: 'Idade Metabólica (5 a 120 anos)', step: '1', placeholder: 'Ex: 28' },
] as const;

const allNumericKeys = [
  ...circunferenciaFields.map((f) => f.key),
  ...dobraFields.map((f) => f.key),
  ...bioimpedanciaFields.map((f) => f.key),
];

export function MedidasTab({ pacienteId }: MedidasTabProps) {
  const [formAberto, setFormAberto] = useState(false);
  const [abaForm, setAbaForm] = useState<FormTab>('circunferencias');
  const [pollockModo, setPollockModo] = useState<PollockModo>('POLLOCK_3');
  const [composicaoOrigem, setComposicaoOrigem] = useState<ProtocoloComposicao | null>(null);
  const [sexoFallback, setSexoFallback] = useState<'MASCULINO' | 'FEMININO'>('FEMININO');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [confirmandoIncompleto, setConfirmandoIncompleto] = useState(false);
  const [abaGrafico, setAbaGrafico] = useState<ChartView>('pesoImc');
  const queryClient = useQueryClient();

  const { data: medidas = [] } = useQuery<MedidaAPI[]>({
    queryKey: ['medidas', pacienteId],
    queryFn: () => listarMedidas(pacienteId),
  });

  const { data: paciente } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => getPacientePorId(pacienteId),
  });

  const { data: clinica } = useQuery({
    queryKey: ['clinica'],
    queryFn: getClinica,
    staleTime: 5 * 60 * 1000,
  });

  const { data: meuPerfil } = useQuery({
    queryKey: ['meu-perfil'],
    queryFn: obterMeuPerfil,
    staleTime: 5 * 60 * 1000,
  });

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<any>();
  const valoresForm = watch();

  const sexoPaciente: 'MASCULINO' | 'FEMININO' | null =
    paciente?.sexo === 'MASCULINO' || paciente?.sexo === 'FEMININO' ? paciente.sexo : null;
  const sexoCalc = sexoPaciente || sexoFallback;
  const idadePaciente = calcularIdadeAnos(paciente?.dataNascimento);
  const idadeCalc = idadePaciente ?? 30;
  const pesoWatch = toPosNum(valoresForm?.peso) ?? 0;

  const progresso = useMemo(
    () => calcularProgressoAvaliacao(valoresForm, pollockModo, sexoCalc),
    [valoresForm, pollockModo, sexoCalc],
  );

  const errosPorAba = useMemo(() => {
    const circKeys = new Set<string>(circunferenciaFields.map((f) => f.key));
    const dobraKeys = new Set<string>(dobraFields.map((f) => f.key));
    const biaKeys = new Set<string>(bioimpedanciaFields.map((f) => f.key));
    let circ = 0;
    let dobras = 0;
    let bia = 0;
    for (const k of Object.keys(errosCampos)) {
      if (circKeys.has(k)) circ++;
      else if (dobraKeys.has(k)) dobras++;
      else if (biaKeys.has(k)) bia++;
    }
    return { circ, dobras, bia };
  }, [errosCampos]);

  const pollockPreview = useMemo(() => {
    if (pesoWatch <= 0) return null;
    if (pollockModo === 'POLLOCK_3') {
      return calcularPollock3({
        sexo: sexoCalc,
        idade: idadeCalc,
        peso: pesoWatch,
        peitoral: toPosNum(valoresForm?.dobraPeitoral),
        abdominal: toPosNum(valoresForm?.dobraAbdominal),
        coxa: toPosNum(valoresForm?.dobraCoxa),
        triceps: toPosNum(valoresForm?.dobraTriceps),
        suprailiaca: toPosNum(valoresForm?.dobraSuprailiaca),
      });
    }

    const peitoral = toPosNum(valoresForm?.dobraPeitoral);
    const axilarMedia = toPosNum(valoresForm?.dobraAxilarMedia);
    const triceps = toPosNum(valoresForm?.dobraTriceps);
    const subescapular = toPosNum(valoresForm?.dobraSubescapular);
    const abdominal = toPosNum(valoresForm?.dobraAbdominal);
    const suprailiaca = toPosNum(valoresForm?.dobraSuprailiaca);
    const coxa = toPosNum(valoresForm?.dobraCoxa);

    if (
      !peitoral ||
      !axilarMedia ||
      !triceps ||
      !subescapular ||
      !abdominal ||
      !suprailiaca ||
      !coxa
    ) {
      return null;
    }

    return calcularPollock7({
      sexo: sexoCalc,
      idade: idadeCalc,
      peso: pesoWatch,
      peitoral,
      axilarMedia,
      triceps,
      subescapular,
      abdominal,
      suprailiaca,
      coxa,
    });
  }, [
    pesoWatch,
    pollockModo,
    sexoCalc,
    idadeCalc,
    valoresForm?.dobraPeitoral,
    valoresForm?.dobraAxilarMedia,
    valoresForm?.dobraTriceps,
    valoresForm?.dobraSubescapular,
    valoresForm?.dobraAbdominal,
    valoresForm?.dobraSuprailiaca,
    valoresForm?.dobraCoxa,
  ]);

  const bioPreview = useMemo(() => {
    if (pesoWatch <= 0) return null;
    return calcularComposicaoPorBioimpedancia({
      peso: pesoWatch,
      percentualGordura: toPosNum(valoresForm?.percentualGordura),
      massaGordaKg: toPosNum(valoresForm?.massaGordaKg),
      massaMagraKg: toPosNum(valoresForm?.massaMagraKg),
    });
  }, [
    pesoWatch,
    valoresForm?.percentualGordura,
    valoresForm?.massaGordaKg,
    valoresForm?.massaMagraKg,
  ]);

  const pollockClassificacao = useMemo(
    () => (pollockPreview ? classificarPercentualGordura(pollockPreview.percentualGordura, sexoCalc, idadeCalc) : null),
    [pollockPreview, sexoCalc, idadeCalc],
  );

  const bioClassificacao = useMemo(
    () => (bioPreview ? classificarPercentualGordura(bioPreview.percentualGordura, sexoCalc, idadeCalc) : null),
    [bioPreview, sexoCalc, idadeCalc],
  );

  function aplicarPollockNosCampos(modo: PollockModo = pollockModo) {
    if (!pollockPreview) return;
    setValue('percentualGordura', pollockPreview.percentualGordura);
    setValue('massaGordaKg', pollockPreview.massaGordaKg);
    setValue('massaMagraKg', pollockPreview.massaMagraKg);
    setComposicaoOrigem(modo);
  }

  const dobrasVisiveis = useMemo(() => {
    if (pollockModo === 'POLLOCK_7') return dobraFields;
    return dobraFields.filter((d) => (sexoCalc === 'MASCULINO' ? d.pollock3Masc : d.pollock3Fem));
  }, [pollockModo, sexoCalc]);

  function focarPrimeiraAbaComErro(erros: Record<string, string>) {
    const keys = Object.keys(erros);
    if (keys.some((k) => circunferenciaFields.some((f) => f.key === k))) {
      setAbaForm('circunferencias');
    } else if (keys.some((k) => dobraFields.some((f) => f.key === k))) {
      setAbaForm('dobras');
    } else if (keys.some((k) => bioimpedanciaFields.some((f) => f.key === k))) {
      setAbaForm('bioimpedancia');
    }
  }

  const salvarMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const payload: Record<string, any> = {
        data: data.data,
        observacoes: data.observacoes?.trim() || (editandoId ? null : undefined),
      };

      for (const key of allNumericKeys) {
        const raw = data[key];
        if (raw !== undefined && raw !== '' && raw !== null) {
          const num = Number(raw);
          if (Number.isFinite(num)) {
            payload[key] = key === 'idadeMetabolica' ? Math.round(num) : num;
          }
        } else if (editandoId) {
          payload[key] = null;
        }
      }

      if (pollockPreview && composicaoOrigem !== 'BIOIMPEDANCIA') {
        payload.protocoloComposicao = pollockModo;
        payload.percentualGordura = pollockPreview.percentualGordura;
        payload.massaGordaKg = pollockPreview.massaGordaKg;
        payload.massaMagraKg = pollockPreview.massaMagraKg;
      } else if (
        composicaoOrigem === 'BIOIMPEDANCIA' ||
        payload.percentualGordura != null ||
        payload.massaMagraKg != null ||
        payload.massaMuscularKg != null ||
        payload.aguaCorporalPct != null ||
        payload.gorduraVisceral != null
      ) {
        payload.protocoloComposicao = 'BIOIMPEDANCIA';
        if (bioPreview) {
          if (payload.percentualGordura == null) payload.percentualGordura = bioPreview.percentualGordura;
          if (payload.massaGordaKg == null) payload.massaGordaKg = bioPreview.massaGordaKg;
          if (payload.massaMagraKg == null) payload.massaMagraKg = bioPreview.massaMagraKg;
        }
      } else if (editandoId) {
        payload.protocoloComposicao = composicaoOrigem;
      }

      if (editandoId) {
        return editarMedida(editandoId, payload);
      }
      return criarMedida(pacienteId, { ...(payload as CreateMedidaInput), pacienteId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medidas', pacienteId] });
      setFormAberto(false);
      setEditandoId(null);
      setComposicaoOrigem(null);
      setErrosCampos({});
      setErroGeral(null);
      setConfirmandoIncompleto(false);
      reset();
    },
    onError: (err: any) => {
      setConfirmandoIncompleto(false);
      const apiErrors = err?.response?.data?.errors as Record<string, string[]> | undefined;
      if (apiErrors && Object.keys(apiErrors).length > 0) {
        const traduzidos = traduzirErrosApiMedida(apiErrors);
        setErrosCampos(traduzidos);
        setErroGeral('Corrija os campos destacados em vermelho antes de salvar:');
        focarPrimeiraAbaComErro(traduzidos);
      } else {
        setErroGeral(
          err?.response?.data?.message ||
            'Não foi possível salvar a avaliação. Verifique os valores informados.',
        );
      }
    },
  });

  function tentarSubmeterAvaliacao(data: Record<string, any>, forcarEnvioIncompleto = false) {
    setErroGeral(null);

    if (!data.data) {
      setErroGeral('Informe a Data da Avaliação.');
      return;
    }

    const errosValidacao = validarValoresMedida(data);
    if (Object.keys(errosValidacao).length > 0) {
      setErrosCampos(errosValidacao);
      setConfirmandoIncompleto(false);
      setErroGeral('Corrija os campos com valores fora do limite clínico permitido:');
      focarPrimeiraAbaComErro(errosValidacao);
      return;
    }

    setErrosCampos({});

    if (progresso.nenhumCampoPreenchido) {
      setConfirmandoIncompleto(false);
      setErroGeral('Preencha ao menos uma medida (Peso, Dobras ou Bioimpedância) antes de salvar.');
      return;
    }

    if (!forcarEnvioIncompleto && progresso.abasIncompletas.length > 0) {
      setConfirmandoIncompleto(true);
      return;
    }

    setConfirmandoIncompleto(false);
    salvarMutation.mutate(data);
  }

  function limparErroCampo(key: string) {
    setConfirmandoIncompleto(false);
    if (errosCampos[key]) {
      setErrosCampos((prev) => {
        const next = { ...prev };
        delete next[key];
        if (Object.keys(next).length === 0) setErroGeral(null);
        return next;
      });
    }
  }

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirMedida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medidas', pacienteId] });
    },
  });

  function iniciarNovaMedida() {
    setEditandoId(null);
    setAbaForm('circunferencias');
    setPollockModo('POLLOCK_3');
    setComposicaoOrigem(null);
    setErrosCampos({});
    setErroGeral(null);
    setConfirmandoIncompleto(false);
    const ultimaAltura = medidasOrdenadas[medidasOrdenadas.length - 1]?.altura;
    reset({
      data: new Date().toISOString().split('T')[0],
      altura: ultimaAltura ?? '',
      observacoes: '',
    });
    setFormAberto(true);
  }

  function iniciarEdicao(medida: MedidaAPI) {
    setEditandoId(medida.id);
    setAbaForm('circunferencias');
    setPollockModo(medida.protocoloComposicao === 'POLLOCK_7' ? 'POLLOCK_7' : 'POLLOCK_3');
    setComposicaoOrigem(medida.protocoloComposicao ?? null);
    setErrosCampos({});
    setErroGeral(null);
    setConfirmandoIncompleto(false);

    const valores: Record<string, any> = {
      data: medida.data ? new Date(medida.data).toISOString().split('T')[0] : '',
      observacoes: medida.observacoes ?? '',
    };
    for (const key of allNumericKeys) {
      valores[key] = (medida as any)[key] ?? '';
    }
    reset(valores);
    setFormAberto(true);
  }

  const medidasOrdenadas = useMemo(
    () => [...medidas].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
    [medidas],
  );

  const serieEvolucao = useMemo(
    () => prepararSerieEvolucaoAntropometrica(medidas),
    [medidas],
  );

  const resumoAntropometrico = useMemo(() => {
    if (medidasOrdenadas.length === 0) return null;
    const ultima = medidasOrdenadas[medidasOrdenadas.length - 1];
    const anterior = medidasOrdenadas.length > 1 ? medidasOrdenadas[medidasOrdenadas.length - 2] : null;
    const idade = calcularIdadeAnos(paciente?.dataNascimento);

    const imcRaw = calcularIMC(ultima.peso, ultima.altura);
    const imc = imcRaw !== null ? Math.round(imcRaw * 10) / 10 : null;
    const imcClassificacao = imc !== null ? classificarIMC(imc, idade) : null;
    const imcReferencia = idade !== null && idade >= 60 ? 'Lipschitz (Idoso ≥ 60a)' : 'OMS (Adulto)';
    const faixaPeso = calcularFaixaPesoIdeal(ultima.altura, idade);
    const pesoAlvoMedio = faixaPeso ? Math.round(((faixaPeso.min + faixaPeso.max) / 2) * 10) / 10 : null;
    const rcq = calcularRCQ(ultima.cintura, ultima.quadril, paciente?.sexo as any);
    const rce = calcularRCE(ultima.cintura, ultima.altura);
    const classificacaoGordura = classificarPercentualGordura(
      ultima.percentualGordura,
      paciente?.sexo === 'MASCULINO' || paciente?.sexo === 'FEMININO' ? paciente.sexo : null,
      idade,
    );

    const diffPeso =
      anterior && typeof ultima.peso === 'number' && typeof anterior.peso === 'number'
        ? +(ultima.peso - anterior.peso).toFixed(1)
        : null;

    return {
      ultima,
      idade,
      imc,
      imcClassificacao,
      imcReferencia,
      faixaPeso,
      pesoAlvoMedio,
      rcq,
      rce,
      classificacaoGordura,
      diffPeso,
    };
  }, [medidasOrdenadas, paciente]);

  return (
    <div>
      <div className={styles.toolbar}>
        <button
          className={styles.novaMedidaBtn}
          onClick={() => {
            if (formAberto && !editandoId) {
              setFormAberto(false);
            } else {
              iniciarNovaMedida();
            }
          }}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Adicionar Medida
        </button>
        <button
          className={styles.outlineBtn}
          disabled={medidas.length === 0 || !paciente}
          title={medidas.length === 0 ? 'Nenhuma medida para imprimir' : 'Imprimir medidas em papel timbrado'}
          onClick={() => paciente && imprimirMedidas(medidas, paciente, clinica, meuPerfil)}
        >
          <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2} /> Imprimir
        </button>
      </div>

      {/* Cards de Diagnóstico Antropométrico Automático */}
      {resumoAntropometrico && (
        <div className={styles.antropoSummaryGrid}>
          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>Peso Atual</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.ultima.peso ?? '-'}
              <small>kg</small>
            </div>
            {resumoAntropometrico.diffPeso !== null ? (
              <span
                className={
                  resumoAntropometrico.diffPeso <= 0 ? styles.antropoBadgeOk : styles.antropoBadgeWarn
                }
              >
                {resumoAntropometrico.diffPeso > 0 ? '+' : ''}
                {resumoAntropometrico.diffPeso} kg vs. anterior
              </span>
            ) : (
              <span className={styles.antropoCardSub}>
                Altura: {resumoAntropometrico.ultima.altura ? `${resumoAntropometrico.ultima.altura} cm` : '-'}
              </span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>IMC Atual</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.imc ?? '-'}
              {resumoAntropometrico.imc !== null && <small>kg/m²</small>}
            </div>
            {resumoAntropometrico.imcClassificacao ? (
              <>
                <span
                  className={
                    resumoAntropometrico.imcClassificacao.startsWith('Peso adequado')
                      ? styles.antropoBadgeOk
                      : styles.antropoBadgeWarn
                  }
                >
                  {resumoAntropometrico.imcClassificacao}
                </span>
                <span className={styles.antropoCardSub}>
                  Critério: {resumoAntropometrico.imcReferencia}
                </span>
              </>
            ) : (
              <span className={styles.antropoCardSub}>Informe peso e altura</span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>Faixa de Peso Ideal</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.faixaPeso
                ? `${resumoAntropometrico.faixaPeso.min} – ${resumoAntropometrico.faixaPeso.max}`
                : '-'}
              {resumoAntropometrico.faixaPeso && <small>kg</small>}
            </div>
            {resumoAntropometrico.pesoAlvoMedio !== null && (
              <span className={styles.antropoCardSub}>
                Alvo médio: <strong>{resumoAntropometrico.pesoAlvoMedio} kg</strong>
              </span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>RCQ (Cintura/Quadril)</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.rcq ? resumoAntropometrico.rcq.valor : '-'}
            </div>
            {resumoAntropometrico.rcq ? (
              <span
                className={
                  resumoAntropometrico.rcq.risco === 'Baixo'
                    ? styles.antropoBadgeOk
                    : resumoAntropometrico.rcq.risco === 'Moderado'
                      ? styles.antropoBadgeWarn
                      : styles.antropoBadgeDanger
                }
              >
                Risco {resumoAntropometrico.rcq.risco}
              </span>
            ) : (
              <span className={styles.antropoCardSub}>Informe cintura e quadril</span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>RCE (Cintura/Estatura)</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.rce ? resumoAntropometrico.rce.valor : '-'}
            </div>
            {resumoAntropometrico.rce ? (
              <span
                className={
                  resumoAntropometrico.rce.risco === 'Adequado'
                    ? styles.antropoBadgeOk
                    : styles.antropoBadgeDanger
                }
              >
                {resumoAntropometrico.rce.risco}
              </span>
            ) : (
              <span className={styles.antropoCardSub}>Meta saudável: &lt; 0,50</span>
            )}
          </div>

          {resumoAntropometrico.ultima.percentualGordura != null && (
            <div className={styles.antropoCard}>
              <span className={styles.antropoCardLabel}>% Gordura Corporal</span>
              <div className={styles.antropoCardValue}>
                {resumoAntropometrico.ultima.percentualGordura}
                <small>%</small>
              </div>
              {resumoAntropometrico.classificacaoGordura && (
                <span className={badgeClassFor(resumoAntropometrico.classificacaoGordura.badgeType)}>
                  {resumoAntropometrico.classificacaoGordura.label}
                </span>
              )}
              {resumoAntropometrico.ultima.protocoloComposicao && (
                <span className={styles.antropoCardSub}>
                  Método:{' '}
                  {PROTOCOLO_LABELS[resumoAntropometrico.ultima.protocoloComposicao] ||
                    resumoAntropometrico.ultima.protocoloComposicao}
                </span>
              )}
            </div>
          )}

          {(resumoAntropometrico.ultima.massaMagraKg != null ||
            resumoAntropometrico.ultima.massaGordaKg != null ||
            resumoAntropometrico.ultima.massaMuscularKg != null) && (
            <div className={styles.antropoCard}>
              <span className={styles.antropoCardLabel}>Composição Corporal</span>
              <div className={styles.antropoCardValue}>
                {resumoAntropometrico.ultima.massaMagraKg ?? '-'}
                <small>kg MM</small>
              </div>
              <span className={styles.antropoCardSub}>
                Massa Gorda: <strong>{resumoAntropometrico.ultima.massaGordaKg ?? '-'} kg</strong>
              </span>
              {(resumoAntropometrico.ultima.massaMuscularKg != null ||
                resumoAntropometrico.ultima.aguaCorporalPct != null ||
                resumoAntropometrico.ultima.gorduraVisceral != null) && (
                <span className={styles.antropoCardSub}>
                  {[
                    resumoAntropometrico.ultima.massaMuscularKg != null
                      ? `M.Musc: ${resumoAntropometrico.ultima.massaMuscularKg}kg`
                      : null,
                    resumoAntropometrico.ultima.aguaCorporalPct != null
                      ? `Água: ${resumoAntropometrico.ultima.aguaCorporalPct}%`
                      : null,
                    resumoAntropometrico.ultima.gorduraVisceral != null
                      ? `Visceral: ${resumoAntropometrico.ultima.gorduraVisceral}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gráfico Comparativo de Evolução Antropométrica */}
      {serieEvolucao.pontos.length >= 2 && (
        <div className={styles.evolucaoChartCard}>
          <div className={styles.evolucaoChartHeader}>
            <div className={styles.evolucaoChartTitleBox}>
              <h4>Evolução Antropométrica ({serieEvolucao.pontos.length} avaliações)</h4>
              <div className={styles.evolucaoChartDeltas}>
                {serieEvolucao.variacoes.peso !== null && (
                  <span
                    className={
                      serieEvolucao.variacoes.peso <= 0
                        ? styles.antropoBadgeOk
                        : styles.antropoBadgeWarn
                    }
                  >
                    Peso: {serieEvolucao.variacoes.peso > 0 ? '+' : ''}
                    {serieEvolucao.variacoes.peso} kg
                  </span>
                )}
                {serieEvolucao.variacoes.percentualGordura !== null && (
                  <span
                    className={
                      serieEvolucao.variacoes.percentualGordura <= 0
                        ? styles.antropoBadgeOk
                        : styles.antropoBadgeWarn
                    }
                  >
                    % Gordura: {serieEvolucao.variacoes.percentualGordura > 0 ? '+' : ''}
                    {serieEvolucao.variacoes.percentualGordura}%
                  </span>
                )}
                {serieEvolucao.variacoes.massaMagraKg !== null && (
                  <span
                    className={
                      serieEvolucao.variacoes.massaMagraKg >= 0
                        ? styles.antropoBadgeOk
                        : styles.antropoBadgeWarn
                    }
                  >
                    Massa Magra: {serieEvolucao.variacoes.massaMagraKg > 0 ? '+' : ''}
                    {serieEvolucao.variacoes.massaMagraKg} kg
                  </span>
                )}
                {serieEvolucao.variacoes.cintura !== null && (
                  <span
                    className={
                      serieEvolucao.variacoes.cintura <= 0
                        ? styles.antropoBadgeOk
                        : styles.antropoBadgeWarn
                    }
                  >
                    Cintura: {serieEvolucao.variacoes.cintura > 0 ? '+' : ''}
                    {serieEvolucao.variacoes.cintura} cm
                  </span>
                )}
              </div>
            </div>

            <div className={styles.protocolPills} style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`${styles.protocolPill} ${
                  abaGrafico === 'pesoImc' ? styles.protocolPillActive : ''
                }`}
                onClick={() => setAbaGrafico('pesoImc')}
              >
                Peso e IMC
              </button>
              <button
                type="button"
                className={`${styles.protocolPill} ${
                  abaGrafico === 'composicao' ? styles.protocolPillActive : ''
                }`}
                onClick={() => setAbaGrafico('composicao')}
              >
                % Gordura e Massa Magra
              </button>
              <button
                type="button"
                className={`${styles.protocolPill} ${
                  abaGrafico === 'circunferencias' ? styles.protocolPillActive : ''
                }`}
                onClick={() => setAbaGrafico('circunferencias')}
              >
                Cintura / Abdômen / Quadril
              </button>
            </div>
          </div>

          <div className={styles.evolucaoChartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={serieEvolucao.pontos}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                <XAxis dataKey="dataLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    color: '#fff',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {abaGrafico === 'pesoImc' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="peso"
                      name="Peso (kg)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="imc"
                      name="IMC (kg/m²)"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  </>
                )}
                {abaGrafico === 'composicao' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="percentualGordura"
                      name="% Gordura"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="massaMagraKg"
                      name="Massa Magra (kg)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="massaGordaKg"
                      name="Massa Gorda (kg)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3.5 }}
                      connectNulls
                    />
                  </>
                )}
                {abaGrafico === 'circunferencias' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="cintura"
                      name="Cintura (cm)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="abdomen"
                      name="Abdômen (cm)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="quadril"
                      name="Quadril (cm)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {formAberto && (
        <form
          className={styles.evolucaoForm}
          onSubmit={handleSubmit((data) => tentarSubmeterAvaliacao(data, false))}
        >
          <div className={styles.medidaFormHeader}>
            <h4>
              {editandoId ? 'Editar Avaliação Antropométrica' : 'Nova Avaliação Antropométrica'}
            </h4>
            <div className={styles.field} style={{ minWidth: '180px' }}>
              <label>Data da Avaliação *</label>
              <input type="date" {...register('data', { required: true })} />
            </div>
          </div>

          {/* Barra de Progresso Unificada das 3 Abas */}
          <div className={styles.medidaProgressBox}>
            <div className={styles.medidaProgressTop}>
              <span>
                As 3 abas abaixo fazem parte da mesma avaliação (preenchimento opcional por seção)
              </span>
              <strong>
                Progresso total: {progresso.percentualTotal}% ({progresso.totalPreenchidos}/
                {progresso.totalCampos} campos)
              </strong>
            </div>
            <div className={styles.medidaProgressBarTrack}>
              <div
                className={styles.medidaProgressBarFill}
                style={{ width: `${progresso.percentualTotal}%` }}
              />
            </div>
          </div>

          <div className={styles.medidaFormTabs} role="tablist" aria-label="Seções da avaliação">
            <button
              type="button"
              role="tab"
              aria-selected={abaForm === 'circunferencias'}
              className={`${styles.medidaFormTabBtn} ${
                abaForm === 'circunferencias' ? styles.medidaFormTabActive : ''
              }`}
              onClick={() => setAbaForm('circunferencias')}
            >
              1. Peso e Circunferências
              <span className={styles.tabCountBadge}>
                {progresso.abas.circunferencias.preenchidos}/{progresso.abas.circunferencias.total}
              </span>
              {errosPorAba.circ > 0 && (
                <span className={styles.tabErrorBadge}>{errosPorAba.circ} erro(s)</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaForm === 'dobras'}
              className={`${styles.medidaFormTabBtn} ${
                abaForm === 'dobras' ? styles.medidaFormTabActive : ''
              }`}
              onClick={() => setAbaForm('dobras')}
            >
              2. Dobras Cutâneas (Pollock 3/7)
              <span className={styles.tabCountBadge}>
                {progresso.abas.dobras.preenchidos}/{progresso.abas.dobras.total}
              </span>
              {errosPorAba.dobras > 0 && (
                <span className={styles.tabErrorBadge}>{errosPorAba.dobras} erro(s)</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaForm === 'bioimpedancia'}
              className={`${styles.medidaFormTabBtn} ${
                abaForm === 'bioimpedancia' ? styles.medidaFormTabActive : ''
              }`}
              onClick={() => setAbaForm('bioimpedancia')}
            >
              3. Bioimpedância (BIA)
              <span className={styles.tabCountBadge}>
                {progresso.abas.bioimpedancia.preenchidos}/{progresso.abas.bioimpedancia.total}
              </span>
              {errosPorAba.bia > 0 && (
                <span className={styles.tabErrorBadge}>{errosPorAba.bia} erro(s)</span>
              )}
            </button>
          </div>

          {abaForm === 'circunferencias' && (
            <div className={styles.formGrid}>
              {circunferenciaFields.map((f) => {
                const reg = register(f.key);
                const erro = errosCampos[f.key];
                return (
                  <div key={f.key} className={styles.field}>
                    <label>{f.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      className={erro ? styles.inputError : undefined}
                      {...reg}
                      onChange={(e) => {
                        reg.onChange(e);
                        limparErroCampo(f.key);
                      }}
                      placeholder="0.0"
                    />
                    {erro && <span className={styles.fieldErrorText}>{erro}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {abaForm === 'dobras' && (
            <div>
              <div className={styles.protocolPills}>
                <button
                  type="button"
                  className={`${styles.protocolPill} ${
                    pollockModo === 'POLLOCK_3' ? styles.protocolPillActive : ''
                  }`}
                  onClick={() => {
                    setPollockModo('POLLOCK_3');
                    if (composicaoOrigem === 'POLLOCK_7') setComposicaoOrigem('POLLOCK_3');
                  }}
                >
                  Pollock 3 Dobras (Rápido)
                </button>
                <button
                  type="button"
                  className={`${styles.protocolPill} ${
                    pollockModo === 'POLLOCK_7' ? styles.protocolPillActive : ''
                  }`}
                  onClick={() => {
                    setPollockModo('POLLOCK_7');
                    if (composicaoOrigem === 'POLLOCK_3') setComposicaoOrigem('POLLOCK_7');
                  }}
                >
                  Pollock 7 Dobras (Completo)
                </button>
              </div>

              {(!sexoPaciente || pesoWatch <= 0) && (
                <div className={styles.composicaoAlert}>
                  <span>
                    {pesoWatch <= 0
                      ? 'Informe o Peso (kg) na aba "Peso e Circunferências" para calcular %G, Massa Magra e Massa Gorda.'
                      : 'Sexo biológico não informado no cadastro do paciente. Escolha temporariamente para o cálculo de Pollock:'}
                  </span>
                  {!sexoPaciente && (
                    <select
                      value={sexoFallback}
                      onChange={(e) => setSexoFallback(e.target.value as 'MASCULINO' | 'FEMININO')}
                    >
                      <option value="FEMININO">Feminino</option>
                      <option value="MASCULINO">Masculino</option>
                    </select>
                  )}
                </div>
              )}

              <div className={styles.formGrid}>
                {dobrasVisiveis.map((f) => {
                  const reg = register(f.key);
                  const erro = errosCampos[f.key];
                  return (
                    <div key={f.key} className={styles.field}>
                      <label>{f.label}</label>
                      <input
                        type="number"
                        step="0.1"
                        className={erro ? styles.inputError : undefined}
                        {...reg}
                        onChange={(e) => {
                          reg.onChange(e);
                          limparErroCampo(f.key);
                          if (composicaoOrigem === 'BIOIMPEDANCIA' || !composicaoOrigem) {
                            setComposicaoOrigem(pollockModo);
                          }
                        }}
                        placeholder="mm"
                      />
                      {erro && <span className={styles.fieldErrorText}>{erro}</span>}
                    </div>
                  );
                })}
              </div>

              {pollockPreview && (
                <div className={styles.composicaoPreview}>
                  <div className={styles.composicaoMetrics}>
                    <div className={styles.composicaoMetricItem}>
                      <span>Soma Dobras</span>
                      <strong>{pollockPreview.somaDobras} mm</strong>
                    </div>
                    <div className={styles.composicaoMetricItem}>
                      <span>Densidade</span>
                      <strong>{pollockPreview.densidadeCorporal} g/mL</strong>
                    </div>
                    <div className={styles.composicaoMetricItem}>
                      <span>% Gordura</span>
                      <strong>{pollockPreview.percentualGordura}%</strong>
                    </div>
                    <div className={styles.composicaoMetricItem}>
                      <span>Massa Magra</span>
                      <strong>{pollockPreview.massaMagraKg} kg</strong>
                    </div>
                    <div className={styles.composicaoMetricItem}>
                      <span>Massa Gorda</span>
                      <strong>{pollockPreview.massaGordaKg} kg</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {pollockClassificacao && (
                      <span className={badgeClassFor(pollockClassificacao.badgeType)}>
                        {pollockClassificacao.label}
                      </span>
                    )}
                    <button
                      type="button"
                      className={styles.outlineBtn}
                      onClick={() => aplicarPollockNosCampos()}
                    >
                      Usar no Resumo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {abaForm === 'bioimpedancia' && (
            <div>
              {pollockPreview && composicaoOrigem === 'BIOIMPEDANCIA' && (
                <div className={styles.composicaoAlert}>
                  <span>
                    Você possui dobras Pollock preenchidas, mas está editando valores manuais da Bioimpedância.
                  </span>
                  <button
                    type="button"
                    className={styles.protocolPill}
                    onClick={() => aplicarPollockNosCampos()}
                  >
                    Restaurar cálculo de Pollock
                  </button>
                </div>
              )}

              {pollockPreview && composicaoOrigem !== 'BIOIMPEDANCIA' && (
                <div className={styles.composicaoPreview}>
                  <div className={styles.composicaoMetrics}>
                    <div className={styles.composicaoMetricItem}>
                      <span>Ativo via {pollockModo === 'POLLOCK_3' ? 'Pollock 3' : 'Pollock 7'}</span>
                      <strong>
                        {pollockPreview.percentualGordura}% • MM {pollockPreview.massaMagraKg} kg
                      </strong>
                    </div>
                  </div>
                  <span className={styles.antropoCardSub}>
                    Você pode complementar com métricas da BIA abaixo ou digitar % Gordura / Massa Magra manualmente para substituir.
                  </span>
                </div>
              )}

              <div className={styles.formGrid}>
                {bioimpedanciaFields.map((f) => {
                  const reg = register(f.key);
                  const erro = errosCampos[f.key];
                  const isTrioComposicao =
                    f.key === 'percentualGordura' ||
                    f.key === 'massaMagraKg' ||
                    f.key === 'massaGordaKg';
                  return (
                    <div key={f.key} className={styles.field}>
                      <label>{f.label}</label>
                      <input
                        type="number"
                        step={f.step}
                        className={erro ? styles.inputError : undefined}
                        {...reg}
                        onChange={(e) => {
                          reg.onChange(e);
                          limparErroCampo(f.key);
                          if (isTrioComposicao || !pollockPreview) {
                            setComposicaoOrigem('BIOIMPEDANCIA');
                          }
                        }}
                        placeholder={f.placeholder}
                      />
                      {erro && <span className={styles.fieldErrorText}>{erro}</span>}
                    </div>
                  );
                })}
              </div>

              {bioPreview && (
                <div className={styles.composicaoPreview}>
                  <div className={styles.composicaoMetrics}>
                    <div className={styles.composicaoMetricItem}>
                      <span>% Gordura Est.</span>
                      <strong>{bioPreview.percentualGordura}%</strong>
                    </div>
                    <div className={styles.composicaoMetricItem}>
                      <span>Massa Magra Est.</span>
                      <strong>{bioPreview.massaMagraKg} kg</strong>
                    </div>
                    <div className={styles.composicaoMetricItem}>
                      <span>Massa Gorda Est.</span>
                      <strong>{bioPreview.massaGordaKg} kg</strong>
                    </div>
                  </div>
                  {bioClassificacao && (
                    <span className={badgeClassFor(bioClassificacao.badgeType)}>
                      {bioClassificacao.label}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={styles.field} style={{ marginBottom: '1rem' }}>
            <label>Observações da Avaliação (opcional)</label>
            <textarea
              {...register('observacoes')}
              placeholder="Ex: Fita Cescorf, InBody 120 em jejum de 4h..."
              style={{ minHeight: '64px' }}
            />
          </div>

          {/* Banner detalhado de erros de validação (client-side ou API) */}
          {(erroGeral || Object.keys(errosCampos).length > 0) && (
            <div className={styles.formErrorBanner} role="alert">
              <strong>{erroGeral || 'Verifique os campos inválidos:'}</strong>
              {Object.keys(errosCampos).length > 0 && (
                <ul>
                  {Object.entries(errosCampos).map(([k, msg]) => (
                    <li key={k}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Aviso de confirmação quando há abas/campos faltando */}
          {confirmandoIncompleto && progresso.abasIncompletas.length > 0 && (
            <div className={styles.incompleteConfirmBox} role="region" aria-label="Confirmação de envio incompleto">
              <div>
                <strong>
                  Avaliação com preenchimento incompleto ({progresso.percentualTotal}% preenchido)
                </strong>
                <p style={{ margin: '0.25rem 0 0' }}>
                  Você está enviando a avaliação faltando dados em:{' '}
                  <strong>{progresso.textoAbasIncompletas}</strong>.
                </p>
              </div>
              <ul>
                {[
                  progresso.abas.circunferencias,
                  progresso.abas.dobras,
                  progresso.abas.bioimpedancia,
                ]
                  .filter((a) => a.faltantes.length > 0)
                  .map((a) => (
                    <li key={a.nome}>
                      <strong>{a.nome}:</strong>{' '}
                      {a.preenchidos === 0
                        ? 'nenhum campo preenchido'
                        : `faltando ${a.textoFaltantes}`}
                    </li>
                  ))}
              </ul>
              <p style={{ margin: 0, fontWeight: 600 }}>
                Tem certeza que deseja salvar a avaliação mesmo faltando{' '}
                {progresso.textoAbasIncompletas}?
              </p>
              <div className={styles.incompleteConfirmActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setConfirmandoIncompleto(false)}
                >
                  Voltar e continuar preenchendo
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={salvarMutation.isPending}
                  onClick={() => tentarSubmeterAvaliacao(getValues(), true)}
                >
                  {salvarMutation.isPending ? 'Salvando...' : 'Sim, salvar mesmo assim'}
                </button>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setFormAberto(false);
                setEditandoId(null);
                setComposicaoOrigem(null);
                setErrosCampos({});
                setErroGeral(null);
                setConfirmandoIncompleto(false);
                reset();
              }}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={salvarMutation.isPending}>
              {salvarMutation.isPending ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {medidas.length === 0 ? (
        <div className={styles.empty}>Nenhuma medida registrada.</div>
      ) : (
        <>
          {/* Tabela para Desktop */}
          <div className={styles.medidasTable}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  {circunferenciaFields.map((f) => (
                    <th key={f.key}>{f.label.replace(' (cm)', '').replace(' (kg)', '')}</th>
                  ))}
                  <th>% Gord.</th>
                  <th>M. Magra</th>
                  <th>M. Gorda</th>
                  <th>IMC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {medidas.map((m) => {
                  const imcLinha = calcularIMC(m.peso, m.altura);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div>{new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                        {m.protocoloComposicao && (
                          <span className={styles.protocolBadge}>
                            {PROTOCOLO_LABELS[m.protocoloComposicao] || m.protocoloComposicao}
                          </span>
                        )}
                      </td>
                      {circunferenciaFields.map((f) => (
                        <td key={f.key}>{(m as any)[f.key] ?? '-'}</td>
                      ))}
                      <td>{m.percentualGordura != null ? `${m.percentualGordura}%` : '-'}</td>
                      <td>{m.massaMagraKg != null ? `${m.massaMagraKg} kg` : '-'}</td>
                      <td>{m.massaGordaKg != null ? `${m.massaGordaKg} kg` : '-'}</td>
                      <td>
                        <strong>{imcLinha ?? '-'}</strong>
                      </td>
                      <td>
                        <div className={styles.medidaActionsCell}>
                          <button
                            type="button"
                            className={styles.medidaEditBtn}
                            title="Editar medida"
                            onClick={() => iniciarEdicao(m)}
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className={styles.medidaActionBtn}
                            title="Excluir medida"
                            onClick={() => {
                              if (confirm('Excluir esta medida?')) {
                                excluirMutation.mutate(m.id);
                              }
                            }}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards para Mobile */}
          <div className={styles.mobileCards}>
            {medidas.map((m) => {
              const imcCard = calcularIMC(m.peso, m.altura);
              return (
                <div key={m.id} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <strong>{new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</strong>
                      {m.protocoloComposicao && (
                        <div>
                          <span className={styles.protocolBadge}>
                            {PROTOCOLO_LABELS[m.protocoloComposicao] || m.protocoloComposicao}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.medidaActionsCell}>
                      <button
                        type="button"
                        className={styles.medidaEditBtn}
                        title="Editar medida"
                        onClick={() => iniciarEdicao(m)}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className={styles.medidaActionBtn}
                        title="Excluir medida"
                        onClick={() => {
                          if (confirm('Excluir esta medida?')) {
                            excluirMutation.mutate(m.id);
                          }
                        }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.cardBodyGrid}>
                    {circunferenciaFields.map((f) => (
                      <div key={f.key} className={styles.cardInfoGridItem}>
                        <span className={styles.cardInfoLabel}>{f.label}</span>
                        <span className={styles.cardInfoValue}>{(m as any)[f.key] ?? '-'}</span>
                      </div>
                    ))}
                    <div className={styles.cardInfoGridItem}>
                      <span className={styles.cardInfoLabel}>% Gordura</span>
                      <span className={styles.cardInfoValue}>
                        {m.percentualGordura != null ? `${m.percentualGordura}%` : '-'}
                      </span>
                    </div>
                    <div className={styles.cardInfoGridItem}>
                      <span className={styles.cardInfoLabel}>Massa Magra</span>
                      <span className={styles.cardInfoValue}>
                        {m.massaMagraKg != null ? `${m.massaMagraKg} kg` : '-'}
                      </span>
                    </div>
                    <div className={styles.cardInfoGridItem}>
                      <span className={styles.cardInfoLabel}>Massa Gorda</span>
                      <span className={styles.cardInfoValue}>
                        {m.massaGordaKg != null ? `${m.massaGordaKg} kg` : '-'}
                      </span>
                    </div>
                    <div className={styles.cardInfoGridItem}>
                      <span className={styles.cardInfoLabel}>IMC (kg/m²)</span>
                      <span className={styles.cardInfoValue}>{imcCard ?? '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
