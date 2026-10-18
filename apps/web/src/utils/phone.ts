/**
 * Utilitários para formatação e manipulação de números de telefone e WhatsApp no padrão brasileiro.
 */

/**
 * Remove caracteres não numéricos e trata prefixo internacional brasileiro (+55).
 * Limita a 11 dígitos (DDD + 9 dígitos).
 */
export function limparTelefone(valor: string): string {
  let digitos = (valor || '').replace(/\D/g, '');
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }
  return digitos.slice(0, 11);
}

/**
 * Retorna o padrão de máscara de acordo com a quantidade de dígitos numéricos:
 * - Mais de 10 dígitos: (##) #####-#### (celular com 9 dígitos)
 * - 10 dígitos ou menos: (##) ####-#### (fixo ou em digitação)
 */
export function obterMascaraTelefone(valor: string): string {
  const digitos = (valor || '').replace(/\D/g, '');
  return digitos.length > 10 ? '(##) #####-####' : '(##) ####-####';
}

/**
 * Formata os dígitos do telefone para exibição: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 */
export function formatarTelefone(valor: string): string {
  const d = limparTelefone(valor);
  if (!d) return '';
  if (d.length > 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  return valor;
}
