import { escapeHtml, printDocument, renderTimbrado, type ClinicaTimbrado } from '@/utils/print';

export interface MedidaRegistro {
  id: string;
  data: string;
  [key: string]: any;
}

interface PacienteResumo {
  nome: string;
  dataNascimento?: string | null;
  sexo?: string | null;
}

export const MEDIDA_CAMPOS = [
  { key: 'peso', label: 'Peso', unidade: 'kg' },
  { key: 'altura', label: 'Altura', unidade: 'cm' },
  { key: 'cintura', label: 'Cintura', unidade: 'cm' },
  { key: 'abdomen', label: 'Abdômen', unidade: 'cm' },
  { key: 'quadril', label: 'Quadril', unidade: 'cm' },
  { key: 'bracoDireito', label: 'Braço Direito', unidade: 'cm' },
  { key: 'bracoEsquerdo', label: 'Braço Esquerdo', unidade: 'cm' },
  { key: 'coxaDireita', label: 'Coxa Direita', unidade: 'cm' },
  { key: 'coxaEsquerda', label: 'Coxa Esquerda', unidade: 'cm' },
  { key: 'culote', label: 'Culote', unidade: 'cm' },
] as const;

/** Máximo de avaliações (colunas) que cabem em uma folha A4 retrato. */
const MAX_COLUNAS = 6;

function fmt(n: number | null | undefined, casas = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function calcIMC(peso?: number | null, alturaCm?: number | null) {
  if (!peso || !alturaCm) return null;
  const m = alturaCm / 100;
  return peso / (m * m);
}

function classificarIMC(imc: number) {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso adequado';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

function idade(dataNascimento?: string | null) {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

function dataBR(iso: string) {
  // Datas de medida são salvas como data (sem hora); usar UTC evita voltar um dia
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function imprimirMedidas(
  medidas: MedidaRegistro[],
  paciente: PacienteResumo,
  clinica: ClinicaTimbrado | null | undefined,
) {
  const registros = [...medidas]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(-MAX_COLUNAS);

  if (registros.length === 0) return;

  const primeira = registros[0];
  const ultima = registros[registros.length - 1];
  const mostrarVariacao = registros.length > 1;

  const linhas = MEDIDA_CAMPOS.map((campo) => {
    const valores = registros.map((r) => `<td>${fmt(r[campo.key])}</td>`).join('');
    let variacao = '';
    if (mostrarVariacao) {
      const ini = primeira[campo.key];
      const fim = ultima[campo.key];
      if (typeof ini === 'number' && typeof fim === 'number') {
        const diff = fim - ini;
        const classe = diff < 0 ? 'neg' : diff > 0 ? 'pos' : '';
        variacao = `<td class="var ${classe}">${diff > 0 ? '+' : ''}${fmt(diff)}</td>`;
      } else {
        variacao = '<td class="var">-</td>';
      }
    }
    return `<tr><th>${escapeHtml(campo.label)} <small>(${campo.unidade})</small></th>${valores}${variacao}</tr>`;
  }).join('');

  const imcs = registros.map((r) => calcIMC(r.peso, r.altura));
  const linhaImc = imcs.some((v) => v !== null)
    ? `<tr class="imc"><th>IMC <small>(kg/m²)</small></th>${imcs.map((v) => `<td>${fmt(v)}</td>`).join('')}${
        mostrarVariacao
          ? (() => {
              const ini = imcs[0];
              const fim = imcs[imcs.length - 1];
              if (ini === null || fim === null) return '<td class="var">-</td>';
              const diff = fim - ini;
              return `<td class="var ${diff < 0 ? 'neg' : diff > 0 ? 'pos' : ''}">${diff > 0 ? '+' : ''}${fmt(diff)}</td>`;
            })()
          : ''
      }</tr>`
    : '';

  const imcAtual = imcs[imcs.length - 1];
  const anos = idade(paciente.dataNascimento);
  const sexo = paciente.sexo === 'MASCULINO' ? 'Masculino' : paciente.sexo === 'FEMININO' ? 'Feminino' : null;

  const body = `
    ${renderTimbrado(clinica)}
    <h1>Avaliação Antropométrica</h1>

    <section class="paciente">
      <div><span>Paciente</span><strong>${escapeHtml(paciente.nome)}</strong></div>
      ${anos !== null ? `<div><span>Idade</span><strong>${anos} anos</strong></div>` : ''}
      ${sexo ? `<div><span>Sexo</span><strong>${sexo}</strong></div>` : ''}
      <div><span>Última avaliação</span><strong>${dataBR(ultima.data)}</strong></div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Medida</th>
          ${registros.map((r) => `<th>${dataBR(r.data)}</th>`).join('')}
          ${mostrarVariacao ? '<th class="var">Variação</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${linhas}
        ${linhaImc}
      </tbody>
    </table>

    ${
      imcAtual !== null
        ? `<div class="resumo">IMC atual: <strong>${fmt(imcAtual)}</strong> — ${classificarIMC(imcAtual)}
           <small>(classificação OMS para adultos)</small></div>`
        : ''
    }

    ${medidas.length > MAX_COLUNAS ? `<p class="nota">Exibindo as ${MAX_COLUNAS} avaliações mais recentes de ${medidas.length}.</p>` : ''}

    <footer>
      <div class="assinatura">
        <div class="linha"></div>
        <span>Nutricionista responsável</span>
      </div>
      <div class="emissao">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
    </footer>
  `;

  const css = `
    h1 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #111827; }
    .paciente { display: flex; flex-wrap: wrap; gap: 8px 28px; padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 6px; margin-bottom: 16px; }
    .paciente div { display: flex; flex-direction: column; }
    .paciente span { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: .03em; }
    .paciente strong { font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 7px 8px; text-align: center; font-size: 12px; }
    thead th { background: #10b981; color: #fff; font-weight: 600; }
    tbody th { text-align: left; background: #f9fafb; font-weight: 600; white-space: nowrap; }
    tbody th small { font-weight: 400; color: #6b7280; }
    tbody tr:nth-child(even) td { background: #fcfcfd; }
    tr.imc th, tr.imc td { background: #ecfdf5 !important; font-weight: 600; }
    .var { font-weight: 600; }
    .var.neg { color: #059669; }
    .var.pos { color: #b45309; }
    .resumo { margin-top: 14px; font-size: 13px; }
    .resumo small { color: #6b7280; margin-left: 4px; }
    .nota { margin-top: 8px; font-size: 10px; color: #6b7280; }
    footer { margin-top: 64px; display: flex; justify-content: space-between; align-items: flex-end; }
    .assinatura { text-align: center; }
    .assinatura .linha { width: 260px; border-top: 1px solid #374151; margin-bottom: 4px; }
    .assinatura span, .emissao { font-size: 11px; color: #4b5563; }
  `;

  printDocument({ title: `Medidas - ${paciente.nome}`, body, css });
}
