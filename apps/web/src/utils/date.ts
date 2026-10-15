/**
 * Formata uma data ISO ou objeto Date para o padrão brasileiro (Brasília).
 * 
 * @param dataISO - String de data no formato ISO ou objeto Date.
 * @returns String formatada como dd/MM/yyyy HH:mm:ss no fuso America/Sao_Paulo.
 */
export function formatarDataBrasilia(dataISO: string | Date | null | undefined): string {
  if (!dataISO) return '-';

  try {
    const date = typeof dataISO === 'string' ? new Date(dataISO) : dataISO;

    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }

    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
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
 */
export function formatarParaInputDateTime(dataISO: string | Date | null | undefined): string {
  if (!dataISO) return '';

  try {
    const date = typeof dataISO === 'string' ? new Date(dataISO) : dataISO;
    if (isNaN(date.getTime())) return '';

    // Usamos a técnica de formatar partes específicas para garantir o fuso correto
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;

    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
  } catch (error) {
    console.error('Erro ao formatar para input:', error);
    return '';
  }
}
