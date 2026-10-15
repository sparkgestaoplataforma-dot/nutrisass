/**
 * Constante do fuso horário padrão do sistema (Brasília).
 */
export const TIMEZONE_BRASILIA = 'America/Sao_Paulo';

/**
 * Converte com segurança uma entrada (string ISO ou Date) para um objeto Date válido.
 * Retorna null para valores nulos, vazios ou com parsing inválido.
 */
function parseDateValid(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formata uma data ISO ou objeto Date para o padrão brasileiro (Brasília).
 * 
 * @param dataISO - String de data no formato ISO ou objeto Date.
 * @returns String formatada como dd/MM/yyyy HH:mm:ss no fuso America/Sao_Paulo.
 */
export function formatarDataBrasilia(dataISO: string | Date | null | undefined): string {
  if (!dataISO) return '-';

  try {
    const date = parseDateValid(dataISO);
    if (!date) {
      return 'Data inválida';
    }

    return date.toLocaleString('pt-BR', {
      timeZone: TIMEZONE_BRASILIA,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro na data';
  }
}

/**
 * Retorna uma string formatada para inputs do tipo datetime-local (YYYY-MM-DDTHH:mm)
 * garantindo o fuso horário de Brasília.
 * 
 * @param dataISO - String de data no formato ISO ou objeto Date.
 * @returns String no formato YYYY-MM-DDTHH:mm ou string vazia se inválido.
 */
export function formatarParaInputDateTime(dataISO: string | Date | null | undefined): string {
  if (!dataISO) return '';

  try {
    const date = parseDateValid(dataISO);
    if (!date) return '';

    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE_BRASILIA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
  } catch (error) {
    console.error('Erro ao formatar para input:', error);
    return '';
  }
}

/**
 * Formata uma data de nascimento (YYYY-MM-DD ou ISO) para o padrão brasileiro dd/MM/yyyy,
 * preservando o dia civil original e evitando conversões de fuso que alterem o dia.
 * 
 * @param data - String civil (YYYY-MM-DD, ISO, DD/MM/YYYY) ou objeto Date.
 * @returns String formatada como dd/MM/yyyy ou "Não informada" se ausente/inválido.
 */
export function formatarDataNascimento(data: string | Date | null | undefined): string {
  if (!data) return "Não informada";

  if (typeof data === "string") {
    const raw = data.trim();
    if (!raw || raw === "-" || raw === "Não informada") return "Não informada";

    // Se já estiver no formato brasileiro DD/MM/YYYY (com ou sem horário posterior)
    if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
      return raw.slice(0, 10);
    }

    // Se for string no padrão YYYY-MM-DD ou ISO (ex: YYYY-MM-DDTHH:mm:ss.sssZ)
    const datePart = raw.split("T")[0];
    const parts = datePart.split("-");
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const [ano, mes, dia] = parts;
      if (!isNaN(Number(ano)) && !isNaN(Number(mes)) && !isNaN(Number(dia))) {
        return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
      }
    }
  }

  const d = parseDateValid(data);
  if (!d) return "Não informada";

  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const ano = d.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}
