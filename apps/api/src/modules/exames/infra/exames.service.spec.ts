import { describe, it, expect } from 'vitest';
import { prismaMock } from '@/shared/providers/__mocks__/prisma';
import * as examesService from './exames.service';

describe('Exames Service (TDD - Clean Architecture)', () => {
  const clinicaId = 'clinica-123';
  const pacienteId = 'paciente-123';

  describe('Exames Base', () => {
    it('listarExamesBase deve filtrar por clinicaId e busca sem acento', async () => {
      prismaMock.exameBase.findMany.mockResolvedValue([
        { id: '1', nome: 'Ácido Úrico', codigo: 'AU01', isBase: true },
        { id: '2', nome: 'Glicemia de Jejum', codigo: 'GJ01', isBase: true },
      ] as any);

      const res = await examesService.listarExamesBase(clinicaId, {
        tipo: 'base',
        search: 'acido',
        page: 1,
        limit: 20,
      });

      expect(prismaMock.exameBase.findMany).toHaveBeenCalledWith({
        where: { clinicaId, isBase: true },
        orderBy: { nome: 'asc' },
      });
      expect(res.data).toHaveLength(1);
      expect(res.data[0].nome).toBe('Ácido Úrico');
    });

    it('editarExameBase deve bloquear edição de exame base padrão (403)', async () => {
      prismaMock.exameBase.findFirst.mockResolvedValue({
        id: 'ex-1',
        clinicaId,
        isBase: true,
      } as any);

      await expect(
        examesService.editarExameBase('ex-1', clinicaId, { nome: 'Alterado' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('Solicitações e Resultados', () => {
    it('solicitarExamePaciente deve validar exames da mesma clínica antes de criar', async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: pacienteId, clinicaId } as any);
      prismaMock.exameBase.count.mockResolvedValue(2);
      prismaMock.solicitacaoExame.create.mockResolvedValue({ id: 'sol-1' } as any);

      const res = await examesService.solicitarExamePaciente(pacienteId, clinicaId, [
        'ex-1',
        'ex-2',
      ]);

      expect(prismaMock.exameBase.count).toHaveBeenCalledWith({
        where: { id: { in: ['ex-1', 'ex-2'] }, clinicaId },
      });
      expect(res.id).toBe('sol-1');
    });

    it('registrarResultadoExame deve atualizar item validando clinicaId do paciente', async () => {
      prismaMock.solicitacaoExameItem.findFirst.mockResolvedValue({ id: 'item-1' } as any);
      prismaMock.solicitacaoExameItem.update.mockResolvedValue({
        id: 'item-1',
        resultado: '92',
      } as any);

      const res = await examesService.registrarResultadoExame(clinicaId, {
        itemId: 'item-1',
        dataResultado: '2026-06-15',
        resultado: '92',
      });

      expect(prismaMock.solicitacaoExameItem.findFirst).toHaveBeenCalledWith({
        where: { id: 'item-1', solicitacao: { paciente: { clinicaId } } },
      });
      expect(res.resultado).toBe('92');
    });
  });
});

