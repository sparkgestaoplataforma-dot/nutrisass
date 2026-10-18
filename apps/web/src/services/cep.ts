export interface DadosEndereco {
  cep: string;
  logradouro: string;
  bairro: string;
  municipio: string;
  uf: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean | string;
}

interface BrasilApiResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  errors?: any;
}

export async function buscarEnderecoPorCep(cep: string): Promise<DadosEndereco | null> {
  const cleanCep = (cep || '').replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return null;
  }

  // 1. Tentar via ViaCEP (mais popular e rápido no Brasil)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: ViaCepResponse = await response.json();
      if (!data.erro) {
        return {
          cep: data.cep || cleanCep,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          municipio: data.localidade || '',
          uf: data.uf || '',
        };
      }
    }
  } catch (err) {
    console.warn('ViaCEP indisponível ou com erro, tentando fallback BrasilAPI...', err);
  }

  // 2. Fallback: BrasilAPI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: BrasilApiResponse = await response.json();
      if (data && data.state) {
        return {
          cep: data.cep || cleanCep,
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          municipio: data.city || '',
          uf: data.state || '',
        };
      }
    }
  } catch (err) {
    console.warn('BrasilAPI também indisponível:', err);
  }

  return null;
}
