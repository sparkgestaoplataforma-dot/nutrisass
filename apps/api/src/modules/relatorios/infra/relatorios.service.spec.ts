import { describe, it, expect } from 'vitest';
import { prismaMock } from '@/shared/providers/__mocks__/prisma';
import * as relatoriosService from './relatorios.service';

describe('Relatorios Service (TDD - Clean Architecture)', () => {
  const clinicaId = 'clinica-123';

  it('gerarRelatorioAgendamentos deve consolidar total, realizados e cancelados apenas da clínica', async () => {
    prismaMock.agendamento.findMany.mockResolvedValue([
      { id: '1', status: 'REALIZADO' },
      { id: '2', status: 'CANCELADO' },
      { id: '3', status: 'DESISTIU' },
      { id: '4', status: 'AGENDADO' },
    ] as any);

    const res = await relatoriosService.gerarRelatorioAgendamentos(clinicaId, {
      dataInicio: '2026-06-01',
      dataFim: '2026-06-30',
    });

    expect(prismaMock.agendamento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clinicaId }),
      }),
    );
    expect(res.resumo).toEqual({
      total: 4,
      realizados: 1,
      cancelados: 2,
    });
  });
});

