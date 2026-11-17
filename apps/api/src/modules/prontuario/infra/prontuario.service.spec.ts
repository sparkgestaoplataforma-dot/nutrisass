import { describe, it, expect } from 'vitest';
import { prismaMock } from '@/shared/providers/__mocks__/prisma';
import * as prontuarioService from './prontuario.service';

describe('Prontuario Service (TDD - Clean Architecture)', () => {
  const clinicaId = 'clinica-123';
  const pacienteId = 'paciente-123';

  describe('Evoluções Clínicas', () => {
    it('listarEvolucoesPaciente deve validar clínica do paciente e retornar evoluções ordenadas', async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: pacienteId, clinicaId } as any);
      prismaMock.evolucaoClinica.findMany.mockResolvedValue([{ id: 'ev-1', estadoClinico: 'Bem' }] as any);

      const res = await prontuarioService.listarEvolucoesPaciente(pacienteId, clinicaId);

      expect(prismaMock.paciente.findFirst).toHaveBeenCalledWith({
        where: { id: pacienteId, clinicaId },
      });
      expect(res).toHaveLength(1);
    });

    it('listarEvolucoesPaciente deve lançar 404 se paciente for de outra clínica', async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);

      await expect(
        prontuarioService.listarEvolucoesPaciente(pacienteId, clinicaId),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('editarEvolucaoPaciente deve atualizar evolução validando a clínica', async () => {
      prismaMock.evolucaoClinica.findFirst.mockResolvedValue({ id: 'ev-1' } as any);
      prismaMock.evolucaoClinica.update.mockResolvedValue({ id: 'ev-1', estadoClinico: 'Melhor' } as any);

      const res = await prontuarioService.editarEvolucaoPaciente('ev-1', clinicaId, {
        estadoClinico: 'Melhor',
      });

      expect(prismaMock.evolucaoClinica.findFirst).toHaveBeenCalledWith({
        where: { id: 'ev-1', paciente: { clinicaId } },
      });
      expect(res.estadoClinico).toBe('Melhor');
    });

    it('excluirEvolucaoPaciente deve remover evolução validando a clínica', async () => {
      prismaMock.evolucaoClinica.findFirst.mockResolvedValue({ id: 'ev-1' } as any);
      prismaMock.evolucaoClinica.delete.mockResolvedValue({ id: 'ev-1' } as any);

      await prontuarioService.excluirEvolucaoPaciente('ev-1', clinicaId);

      expect(prismaMock.evolucaoClinica.delete).toHaveBeenCalledWith({
        where: { id: 'ev-1' },
      });
    });
  });

  describe('Medidas Antropométricas', () => {
    it('criarMedidaPaciente deve converter string de data em Date e salvar no banco', async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: pacienteId, clinicaId } as any);
      prismaMock.medida.create.mockResolvedValue({ id: 'med-1', peso: 72.5 } as any);

      const res = await prontuarioService.criarMedidaPaciente(pacienteId, clinicaId, {
        data: '2026-06-10',
        peso: 72.5,
      });

      expect(prismaMock.medida.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pacienteId,
          peso: 72.5,
          data: new Date('2026-06-10'),
        }),
      });
      expect(res.id).toBe('med-1');
    });

    it('editarMedidaPaciente deve ignorar troca de pacienteId e atualizar campos', async () => {
      prismaMock.medida.findFirst.mockResolvedValue({ id: 'med-1' } as any);
      prismaMock.medida.update.mockResolvedValue({ id: 'med-1', peso: 71.0 } as any);

      const res = await prontuarioService.editarMedidaPaciente('med-1', clinicaId, {
        pacienteId: 'hacker-id',
        peso: 71.0,
      });

      expect(prismaMock.medida.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { peso: 71.0 },
      });
      expect(res.peso).toBe(71.0);
    });
  });
});

