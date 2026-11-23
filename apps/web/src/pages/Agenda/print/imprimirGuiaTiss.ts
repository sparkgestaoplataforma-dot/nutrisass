import { escapeHtml, printDocument } from '@/utils/print';

export interface GuiaTissData {
  id: string;
  dataHora: string;
  tipo: string;
  status: string;
  observacao?: string | null;
  paciente: {
    id: string;
    nome: string;
    cpf?: string | null;
    numeroCarteira?: string | null;
    validadeCarteira?: string | null;
    telefone?: string | null;
    convenio?: {
      id: string;
      nome: string;
      registroANS?: string | null;
      logomarca?: string | null;
    } | null;
  };
  convenio?: {
    id: string;
    nome: string;
    registroANS?: string | null;
    logomarca?: string | null;
  } | null;
  usuario?: {
    id: string;
    nome: string;
    perfil: string;
    crn?: string | null;
  } | null;
  nutricionista?: {
    id: string;
    nome: string;
    perfil: string;
    crn?: string | null;
  } | null;
  clinica: {
    id: string;
    nome: string;
    cnpj?: string | null;
    telefone?: string | null;
    email?: string | null;
    endereco?: string | null;
    logomarca?: string | null;
  };
}

export function imprimirGuiaTiss(data: GuiaTissData) {
  const conv = data.convenio || data.paciente.convenio;
  const profissionalNome = data.nutricionista?.nome || data.usuario?.nome || '';
  const profissionalCrn = data.nutricionista?.crn || data.usuario?.crn || '';
  const dataAtendimento = new Date(data.dataHora).toLocaleDateString('pt-BR');
  const horaAtendimento = new Date(data.dataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const numeroGuia = data.id.replace(/-/g, '').slice(0, 12).toUpperCase();
  const validadeCarteira = data.paciente.validadeCarteira
    ? new Date(data.paciente.validadeCarteira).toLocaleDateString('pt-BR')
    : '';

  const isRetorno = data.tipo === 'RETORNO';

  const body = `
    <div class="guia-container">
      <!-- Cabeçalho TISS -->
      <div class="guia-header">
        <div class="header-logo operadora">
          ${conv?.logomarca ? `<img src="${escapeHtml(conv.logomarca)}" alt="" />` : ''}
          <div class="operadora-info">
            <span class="label">Operadora</span>
            <strong>${escapeHtml(conv?.nome || 'Operadora de Saúde')}</strong>
          </div>
        </div>
        <div class="header-titulo">
          <h2>PADRÃO TISS</h2>
          <h3>GUIA DE CONSULTA</h3>
        </div>
        <div class="header-logo clinica">
          ${data.clinica.logomarca ? `<img src="${escapeHtml(data.clinica.logomarca)}" alt="" />` : ''}
          <div class="clinica-info">
            <span class="label">Prestador</span>
            <strong>${escapeHtml(data.clinica.nome)}</strong>
          </div>
        </div>
      </div>

      <!-- Linha 1: Registro ANS e Números da Guia -->
      <div class="grid-row cols-3">
        <div class="box">
          <span class="box-num">1</span>
          <span class="box-label">Registro ANS</span>
          <span class="box-val">${escapeHtml(conv?.registroANS || '---')}</span>
        </div>
        <div class="box">
          <span class="box-num">2</span>
          <span class="box-label">Número da Guia no Prestador</span>
          <span class="box-val bold">${escapeHtml(numeroGuia)}</span>
        </div>
        <div class="box">
          <span class="box-num">3</span>
          <span class="box-label">Número da Guia Atribuído pela Operadora</span>
          <span class="box-val">&nbsp;</span>
        </div>
      </div>

      <!-- Seção: Dados do Beneficiário -->
      <div class="secao-title">Dados do Beneficiário</div>
      <div class="grid-row cols-3">
        <div class="box">
          <span class="box-num">4</span>
          <span class="box-label">Número da Carteira</span>
          <span class="box-val bold">${escapeHtml(data.paciente.numeroCarteira || '---')}</span>
        </div>
        <div class="box">
          <span class="box-num">5</span>
          <span class="box-label">Validade da Carteira</span>
          <span class="box-val">${escapeHtml(validadeCarteira || '---')}</span>
        </div>
        <div class="box">
          <span class="box-num">6</span>
          <span class="box-label">Atendimento a RN</span>
          <span class="box-val checkbox-row">
            <span class="check-opt">[ ] Sim</span>
            <span class="check-opt bold">[X] Não</span>
          </span>
        </div>
      </div>

      <div class="grid-row cols-2">
        <div class="box flex-2">
          <span class="box-num">7</span>
          <span class="box-label">Nome do Beneficiário</span>
          <span class="box-val bold">${escapeHtml(data.paciente.nome)}</span>
        </div>
        <div class="box flex-1">
          <span class="box-num">8</span>
          <span class="box-label">CPF / Cartão Nacional de Saúde</span>
          <span class="box-val">${escapeHtml(data.paciente.cpf || '---')}</span>
        </div>
      </div>

      <!-- Seção: Dados do Contratado -->
      <div class="secao-title">Dados do Contratado Executante</div>
      <div class="grid-row cols-3">
        <div class="box flex-2">
          <span class="box-num">9</span>
          <span class="box-label">Nome do Contratado</span>
          <span class="box-val">${escapeHtml(data.clinica.nome)}</span>
        </div>
        <div class="box">
          <span class="box-num">10</span>
          <span class="box-label">CNPJ do Contratado</span>
          <span class="box-val">${escapeHtml(data.clinica.cnpj || '---')}</span>
        </div>
        <div class="box">
          <span class="box-num">11</span>
          <span class="box-label">Código CNES</span>
          <span class="box-val">&nbsp;</span>
        </div>
      </div>

      <!-- Seção: Dados do Profissional Executante -->
      <div class="secao-title">Dados do Profissional Executante</div>
      <div class="grid-row cols-4">
        <div class="box flex-2">
          <span class="box-num">12</span>
          <span class="box-label">Nome do Profissional</span>
          <span class="box-val bold">${escapeHtml(profissionalNome)}</span>
        </div>
        <div class="box">
          <span class="box-num">13</span>
          <span class="box-label">Conselho Profissional</span>
          <span class="box-val">CRN</span>
        </div>
        <div class="box">
          <span class="box-num">14</span>
          <span class="box-label">Número no Conselho / UF</span>
          <span class="box-val">${profissionalCrn ? escapeHtml(profissionalCrn) : '&nbsp;'}</span>
        </div>
        <div class="box">
          <span class="box-num">15</span>
          <span class="box-label">Código CBO</span>
          <span class="box-val">2237-10</span>
        </div>
      </div>

      <!-- Seção: Dados do Atendimento -->
      <div class="secao-title">Dados do Atendimento / Consulta</div>
      <div class="grid-row cols-4">
        <div class="box">
          <span class="box-num">16</span>
          <span class="box-label">Data do Atendimento</span>
          <span class="box-val bold">${escapeHtml(dataAtendimento)}</span>
        </div>
        <div class="box">
          <span class="box-num">17</span>
          <span class="box-label">Hora do Atendimento</span>
          <span class="box-val">${escapeHtml(horaAtendimento)}</span>
        </div>
        <div class="box">
          <span class="box-num">18</span>
          <span class="box-label">Tipo de Consulta</span>
          <span class="box-val checkbox-row">
            <span class="check-opt ${!isRetorno ? 'bold' : ''}">${!isRetorno ? '[X]' : '[ ]'} Primeira</span>
            <span class="check-opt ${isRetorno ? 'bold' : ''}">${isRetorno ? '[X]' : '[ ]'} Retorno</span>
          </span>
        </div>
        <div class="box">
          <span class="box-num">19</span>
          <span class="box-label">Indicação de Acidente</span>
          <span class="box-val">Não acidente</span>
        </div>
      </div>

      <!-- Tabela de Procedimentos Realizados (Padrão TUSS) -->
      <div class="procedimentos-wrapper">
        <table class="tuss-table">
          <thead>
            <tr>
              <th style="width: 14%;">20 - Tabela</th>
              <th style="width: 20%;">21 - Código do Procedimento</th>
              <th>22 - Descrição do Procedimento</th>
              <th style="width: 10%;">23 - Qtd.</th>
              <th style="width: 14%;">24 - Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>22 (TUSS)</td>
              <td class="bold">50000586</td>
              <td>Consulta ambulatorial em nutrição / avaliação nutricional</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Observações -->
      <div class="box obs-box">
        <span class="box-num">25</span>
        <span class="box-label">Observação / Justificativa</span>
        <span class="box-val">${escapeHtml(data.observacao || '')}</span>
      </div>

      <!-- Assinaturas -->
      <div class="grid-row cols-2 assinaturas-row">
        <div class="box assinatura-box">
          <span class="box-num">26</span>
          <span class="box-label">Assinatura do Profissional Executante</span>
          <div class="campo-assinatura">
            <div class="linha-ass"></div>
            <span>${escapeHtml(profissionalNome)}${profissionalCrn ? ` (${escapeHtml(profissionalCrn)})` : ' (CRN)'}</span>
          </div>
        </div>
        <div class="box assinatura-box">
          <span class="box-num">27</span>
          <span class="box-label">Assinatura do Beneficiário ou Responsável</span>
          <div class="campo-assinatura">
            <div class="linha-ass"></div>
            <span>${escapeHtml(data.paciente.nome)}</span>
          </div>
        </div>
      </div>

      <!-- Rodapé Guia -->
      <div class="guia-footer">
        <span>Guia gerada eletronicamente pelo NutriSaaS em conformidade com o Padrão TISS - ANS.</span>
        <span>${escapeHtml(data.clinica.nome)} &bull; ${escapeHtml(data.clinica.telefone || '')}</span>
      </div>
    </div>
  `;

  const css = `
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, Arial, sans-serif; font-size: 10px; color: #111827; }

    .guia-container {
      border: 2px solid #111827;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .guia-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #111827;
      padding-bottom: 6px;
      margin-bottom: 2px;
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 32%;
    }

    .header-logo img {
      max-height: 44px;
      max-width: 100px;
      object-fit: contain;
    }

    .header-logo.clinica {
      justify-content: flex-end;
      text-align: right;
    }

    .operadora-info, .clinica-info {
      display: flex;
      flex-direction: column;
    }

    .header-titulo {
      text-align: center;
      width: 36%;
    }

    .header-titulo h2 {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .08em;
      margin: 0;
      color: #065f46;
    }

    .header-titulo h3 {
      font-size: 12px;
      font-weight: 700;
      margin: 2px 0 0;
    }

    .secao-title {
      background: #111827;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      padding: 2px 6px;
      margin-top: 2px;
    }

    .grid-row {
      display: flex;
      gap: 3px;
    }

    .cols-2 > .box { flex: 1; }
    .cols-3 > .box { flex: 1; }
    .cols-4 > .box { flex: 1; }
    .flex-1 { flex: 1 !important; }
    .flex-2 { flex: 2 !important; }

    .box {
      border: 1px solid #374151;
      padding: 3px 5px;
      min-height: 34px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #fff;
    }

    .box-num {
      position: absolute;
      top: 2px;
      right: 3px;
      font-size: 8px;
      color: #6b7280;
      font-weight: 600;
    }

    .box-label {
      font-size: 8px;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: .02em;
    }

    .box-val {
      font-size: 10px;
      color: #111827;
      margin-top: 1px;
    }

    .box-val.bold {
      font-weight: 700;
    }

    .checkbox-row {
      display: flex;
      gap: 10px;
    }

    .check-opt {
      font-size: 9px;
    }

    .procedimentos-wrapper {
      margin-top: 2px;
    }

    .tuss-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #374151;
    }

    .tuss-table th {
      background: #e5e7eb;
      font-size: 8px;
      font-weight: 700;
      text-align: left;
      padding: 3px 5px;
      border: 1px solid #374151;
      text-transform: uppercase;
    }

    .tuss-table td {
      font-size: 9px;
      padding: 4px 5px;
      border: 1px solid #374151;
    }

    .obs-box {
      min-height: 44px;
    }

    .assinaturas-row {
      margin-top: 4px;
    }

    .assinatura-box {
      min-height: 72px;
    }

    .campo-assinatura {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: auto;
      padding-top: 26px;
    }

    .linha-ass {
      width: 85%;
      border-top: 1px solid #111827;
      margin-bottom: 2px;
    }

    .campo-assinatura span {
      font-size: 8px;
      color: #374151;
    }

    .guia-footer {
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      color: #6b7280;
      padding-top: 3px;
      border-top: 1px dashed #9ca3af;
      margin-top: 2px;
    }
  `;

  printDocument({
    title: `Guia_TISS_${numeroGuia}_${data.paciente.nome}`,
    body,
    css,
  });
}
