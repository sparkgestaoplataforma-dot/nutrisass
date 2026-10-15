/**
 * Utilitários para impressão de documentos (medidas timbradas, guia TISS, etc).
 *
 * O documento é renderizado em um iframe isolado, com CSS próprio, para que o
 * layout do sistema (sidebar, header) não interfira na impressão.
 */

export interface ClinicaTimbrado {
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  logomarca?: string | null;
}

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Cabeçalho timbrado padrão da clínica (logo + dados de contato). */
export function renderTimbrado(clinica: ClinicaTimbrado | null | undefined): string {
  if (!clinica) return '';
  const contato = [clinica.endereco, clinica.telefone, clinica.email]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' &bull; ');

  return `
    <header class="timbrado">
      ${clinica.logomarca ? `<img class="timbrado-logo" src="${escapeHtml(clinica.logomarca)}" alt="" />` : ''}
      <div class="timbrado-info">
        <div class="timbrado-nome">${escapeHtml(clinica.nome)}</div>
        ${clinica.cnpj ? `<div class="timbrado-linha">CNPJ: ${escapeHtml(clinica.cnpj)}</div>` : ''}
        ${contato ? `<div class="timbrado-linha">${contato}</div>` : ''}
      </div>
    </header>
  `;
}

export const TIMBRADO_CSS = `
  .timbrado { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; margin-bottom: 18px; border-bottom: 2px solid #10b981; }
  .timbrado-logo { max-height: 64px; max-width: 160px; object-fit: contain; }
  .timbrado-nome { font-size: 18px; font-weight: 700; color: #065f46; }
  .timbrado-linha { font-size: 11px; color: #4b5563; margin-top: 2px; }
`;

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif; color: #111827; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { padding: 0; }
`;

interface PrintOptions {
  title: string;
  body: string;
  css?: string;
  /** Ex.: 'A4 portrait' | 'A4 landscape' */
  page?: string;
}

export function printDocument({ title, body, css = '', page = 'A4 portrait' }: PrintOptions) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: ${page}; margin: 12mm; }
      ${BASE_CSS}
      ${TIMBRADO_CSS}
      ${css}
    </style>
  </head>
  <body>${body}</body>
</html>`);
  doc.close();

  const win = iframe.contentWindow!;
  const cleanup = () => setTimeout(() => iframe.remove(), 500);

  // Aguarda imagens (logomarcas) carregarem antes de imprimir
  const images = Array.from(doc.images);
  Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  ).then(() => {
    win.focus();
    win.addEventListener('afterprint', cleanup, { once: true });
    win.print();
    // Fallback para navegadores que não disparam afterprint
    setTimeout(cleanup, 60_000);
  });
}
