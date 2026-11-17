import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '@/shared/providers/__mocks__/prisma';
import * as clinicaService from './clinica.service';

vi.mock('@/shared/providers/redis', () => ({
  redisSet: vi.fn().mockResolvedValue(undefined),
}));

describe('Clinica Service (TDD - Clean Architecture)', () => {
  const clinicaId = 'clinica-123';
  const userId = 'user-123';

  it('obterClinicaPorId deve consultar a clínica pelo clinicaId', async () => {
    prismaMock.clinica.findUnique.mockResolvedValue({ id: clinicaId, nome: 'Clínica Vida' } as any);

    const res = await clinicaService.obterClinicaPorId(clinicaId);

    expect(prismaMock.clinica.findUnique).toHaveBeenCalledWith({
      where: { id: clinicaId },
    });
    expect(res?.nome).toBe('Clínica Vida');
  });

  it('alterarModoClinica deve bloquear migração para AUTONOMO se houver mais de 1 usuário', async () => {
    prismaMock.clinica.findUnique.mockResolvedValue({ id: clinicaId, tipo: 'CLINICA' } as any);
    prismaMock.usuario.count.mockResolvedValue(3);

    await expect(
      clinicaService.alterarModoClinica({
        clinicaId,
        userId,
        email: 'admin@vida.com',
        tipo: 'AUTONOMO',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

