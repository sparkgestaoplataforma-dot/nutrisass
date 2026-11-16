import { describe, it, expect } from 'vitest';
import { prismaMock } from '@/shared/providers/__mocks__/prisma';
import * as conveniosService from './convenios.service';

describe('Convenios Service (TDD - Clean Architecture)', () => {
  const clinicaId = 'clinica-123';

  it('listarConvenios deve filtrar por clinicaId e termo de busca sem acento', async () => {
    prismaMock.convenio.findMany.mockResolvedValue([
      { id: '1', nome: 'São Camilo', registroANS: '12345', clinicaId },
      { id: '2', nome: 'Unimed', registroANS: '67890', clinicaId },
    ] as any);

    const res = await conveniosService.listarConvenios(clinicaId, {
      search: 'sao camilo',
      page: 1,
      limit: 20,
    });

    expect(prismaMock.convenio.findMany).toHaveBeenCalledWith({
      where: { clinicaId },
      orderBy: { nome: 'asc' },
    });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].nome).toBe('São Camilo');
  });

  it('editarConvenio deve lançar 404 quando convênio não pertencer à clínica', async () => {
    prismaMock.convenio.findFirst.mockResolvedValue(null);

    await expect(
      conveniosService.editarConvenio('conv-1', clinicaId, { nome: 'Novo' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

