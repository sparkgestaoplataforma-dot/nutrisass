import { api } from './api';

export async function gerarRelatorio(params: {
  dataInicio: string;
  dataFim: string;
  status?: string;
  convenioId?: string;
}) {
  const query: Record<string, string> = {
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
  };
  if (params.status) query.status = params.status;
  if (params.convenioId) query.convenioId = params.convenioId;

  const { data } = await api.get('/relatorios', { params: query });
  return data.data;
}

