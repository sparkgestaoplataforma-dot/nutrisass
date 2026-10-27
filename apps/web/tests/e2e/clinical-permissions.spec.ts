import { test, expect, type Page } from '@playwright/test';
import { canAccessClinical } from '../../src/hooks/useClinicalAccess';
import type { TokenPayload } from '@nutricao/shared';

// ============================================================================
// 1. TESTES UNITÁRIOS DA REGRA DE AUTORIZAÇÃO (canAccessClinical)
// ============================================================================
test.describe('Autorização Clínica - Regra de Acesso (Testes Unitários)', () => {
  test('deve permitir acesso clínico total para ADMIN em clínica AUTONOMO', () => {
    const user: TokenPayload = {
      userId: 'user-1',
      clinicaId: 'clinica-1',
      email: 'admin@autonomo.com',
      perfil: 'ADMIN',
      tipoClinica: 'AUTONOMO',
    };
    expect(canAccessClinical(user)).toBe(true);
  });

  test('deve permitir acesso clínico total para NUTRICIONISTA em clínica AUTONOMO', () => {
    const user: TokenPayload = {
      userId: 'user-2',
      clinicaId: 'clinica-1',
      email: 'nutri@autonomo.com',
      perfil: 'NUTRICIONISTA',
      tipoClinica: 'AUTONOMO',
    };
    expect(canAccessClinical(user)).toBe(true);
  });

  test('deve permitir acesso clínico para SECRETARIA em clínica AUTONOMO (acesso total do tipo AUTONOMO)', () => {
    const user: TokenPayload = {
      userId: 'user-3',
      clinicaId: 'clinica-1',
      email: 'sec@autonomo.com',
      perfil: 'SECRETARIA',
      tipoClinica: 'AUTONOMO',
    };
    expect(canAccessClinical(user)).toBe(true);
  });

  test('deve permitir acesso clínico para NUTRICIONISTA em clínica do tipo CLINICA', () => {
    const user: TokenPayload = {
      userId: 'user-4',
      clinicaId: 'clinica-2',
      email: 'nutri@clinica.com',
      perfil: 'NUTRICIONISTA',
      tipoClinica: 'CLINICA',
    };
    expect(canAccessClinical(user)).toBe(true);
  });

  test('deve permitir acesso clínico para ADMIN em clínica do tipo CLINICA', () => {
    const user: TokenPayload = {
      userId: 'user-5',
      clinicaId: 'clinica-2',
      email: 'admin@clinica.com',
      perfil: 'ADMIN',
      tipoClinica: 'CLINICA',
    };
    expect(canAccessClinical(user)).toBe(true);
  });

  test('deve bloquear acesso clínico para SECRETARIA em clínica do tipo CLINICA', () => {
    const user: TokenPayload = {
      userId: 'user-6',
      clinicaId: 'clinica-2',
      email: 'sec@clinica.com',
      perfil: 'SECRETARIA',
      tipoClinica: 'CLINICA',
    };
    expect(canAccessClinical(user)).toBe(false);
  });

  test('deve bloquear acesso clínico para qualquer outro perfil em clínica do tipo CLINICA', () => {
    const user: TokenPayload = {
      userId: 'user-7',
      clinicaId: 'clinica-2',
      email: 'outro@clinica.com',
      perfil: 'RECEPCIONISTA',
      tipoClinica: 'CLINICA',
    };
    expect(canAccessClinical(user)).toBe(false);
  });

  test('deve retornar false com segurança para usuário null ou undefined (sem autenticação)', () => {
    expect(canAccessClinical(null)).toBe(false);
    expect(canAccessClinical(undefined)).toBe(false);
  });

  test('deve retornar false com segurança para objeto malformado ou campos faltantes', () => {
    expect(canAccessClinical({} as any)).toBe(false);
    expect(canAccessClinical({ perfil: 'ADMIN' } as any)).toBe(false);
    expect(canAccessClinical({ tipoClinica: 'CLINICA' } as any)).toBe(false);
  });
});

// ============================================================================
// 2. TESTES DE NAVEGAÇÃO, ROTAS E INTERFACE (E2E / Browser)
// ============================================================================

async function injectAuth(page: Page, user: TokenPayload) {
  await page.addInitScript((userData) => {
    window.localStorage.setItem(
      'nutricao-auth',
      JSON.stringify({
        state: {
          accessToken: 'mock-valid-jwt-token',
          refreshToken: 'mock-valid-refresh-token',
          user: userData,
        },
        version: 0,
      })
    );
  }, user);
}

async function mockCommonApis(page: Page) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url();

    if (url.includes('/api/pacientes/pac-123')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            id: 'pac-123',
            nome: 'Maria da Silva',
            email: 'maria@teste.com',
            telefone: '(11) 98765-4321',
            cpf: '123.456.789-00',
            dataNascimento: '1990-05-15',
            dataNascimentoFormatada: '15/05/1990',
            endereco: 'Rua das Flores, 100',
            bairro: 'Jardins',
            municipio: 'São Paulo',
            uf: 'SP',
            profissao: 'Engenheira',
            convenio: { id: 'conv-1', nome: 'Unimed' },
            agendamentos: [
              {
                id: 'ag-1',
                dataHora: new Date().toISOString(),
                tipo: 'CONSULTA',
                status: 'CONFIRMOU',
                convenio: { nome: 'Unimed' },
              },
            ],
          },
        },
      });
    }

    if (url.includes('/api/dashboard')) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const localIso = `${y}-${m}-${d}T10:00:00`;

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            totalPacientes: 1,
            pacientesMes: 1,
            agendaHoje: 1,
            realizadosMes: 0,
            canceladosMes: 0,
            proximosAgendamentos: [
              {
                id: 'ag-1',
                dataHora: localIso,
                tipo: 'CONSULTA',
                status: 'CONFIRMOU',
                paciente: {
                  id: 'pac-123',
                  nome: 'Maria da Silva',
                  telefone: '(11) 98765-4321',
                },
                nutricionista: {
                  id: 'nutri-1',
                  nome: 'Dr. Nutricionista',
                },
              },
            ],
          },
        },
      });
    }

    if (url.includes('/api/pacientes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            data: [
              {
                id: 'pac-123',
                nome: 'Maria da Silva',
                email: 'maria@teste.com',
                telefone: '(11) 98765-4321',
                convenio: { id: 'conv-1', nome: 'Unimed' },
              },
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
      });
    }

    // Default para quaisquer outros endpoints (notificações, refresh, etc.)
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { success: true, data: [] },
    });
  });
}

test.describe('Acesso Clínico Permitido para ADMIN em clínica CLINICA', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page, {
      userId: 'usr-admin-clinica',
      clinicaId: 'clinica-colab',
      email: 'admin@clinica.com',
      perfil: 'ADMIN',
      tipoClinica: 'CLINICA',
    });
    await mockCommonApis(page);
  });

  test('na página do paciente (/pacientes/:id), deve exibir seções clínicas e cadastrais', async ({ page }) => {
    await page.goto('/pacientes/pac-123');

    // Dados cadastrais visíveis
    await expect(page.getByRole('heading', { name: 'Maria da Silva' })).toBeVisible();
    await expect(page.getByText('Rua das Flores, 100')).toBeVisible();
    await expect(page.getByRole('button', { name: /editar/i })).toBeVisible();

    // Seções clínicas DEVEM estar visíveis para ADMIN
    await expect(page.getByRole('button', { name: /iniciar atendimento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /plano alimentar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /medidas/i })).toBeVisible();
    await expect(page.getByText('Estado Clínico')).toBeVisible();
  });

  test('no Dashboard, o botão "Atender" deve estar visível', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /atender/i })).toBeVisible();
  });
});

test.describe('Proteção de Rotas e Interface para SECRETARIA em clínica CLINICA', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page, {
      userId: 'usr-sec-clinica',
      clinicaId: 'clinica-colab',
      email: 'secretaria@clinica.com',
      perfil: 'SECRETARIA',
      tipoClinica: 'CLINICA',
    });
    await mockCommonApis(page);
  });

  test('deve redirecionar acesso direto à URL de comparativo clínico para /pacientes', async ({ page }) => {
    await page.goto('/pacientes/pac-123/comparativo');
    await expect(page).toHaveURL(/\/pacientes$/);
  });

  test('na página do paciente (/pacientes/:id), deve manter dados cadastrais e ocultar seções clínicas', async ({ page }) => {
    await page.goto('/pacientes/pac-123');

    // Dados cadastrais visíveis
    await expect(page.getByRole('heading', { name: 'Maria da Silva' })).toBeVisible();
    await expect(page.getByText('Histórico de Consultas')).toBeVisible();

    // Elementos clínicos ocultos
    await expect(page.locator('button:has-text("Iniciar Atendimento")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Plano Alimentar")')).not.toBeVisible();
    await expect(page.locator('h2:has-text("Estado Clínico")')).not.toBeVisible();
  });

  test('no Dashboard, o botão "Atender" não deve estar visível', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /atender/i })).not.toBeVisible();
  });
});

test.describe('Acesso Clínico Permitido para ADMIN em clínica AUTONOMO', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page, {
      userId: 'usr-admin-autonomo',
      clinicaId: 'clinica-auto',
      email: 'admin@autonomo.com',
      perfil: 'ADMIN',
      tipoClinica: 'AUTONOMO',
    });
    await mockCommonApis(page);
  });

  test('na página do paciente (/pacientes/:id), deve exibir seções clínicas e cadastrais', async ({ page }) => {
    await page.goto('/pacientes/pac-123');

    // Dados cadastrais visíveis
    await expect(page.getByRole('heading', { name: 'Maria da Silva' })).toBeVisible();

    // Seções clínicas DEVEM estar visíveis para AUTONOMO
    await expect(page.getByRole('button', { name: /iniciar atendimento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /plano alimentar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /medidas/i })).toBeVisible();
    await expect(page.getByText('Estado Clínico')).toBeVisible();
  });

  test('no Dashboard, o botão "Atender" deve estar visível', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /atender/i })).toBeVisible();
  });
});

test.describe('Acesso Clínico Permitido para NUTRICIONISTA em clínica CLINICA', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page, {
      userId: 'usr-nutri-clinica',
      clinicaId: 'clinica-colab',
      email: 'nutri@clinica.com',
      perfil: 'NUTRICIONISTA',
      tipoClinica: 'CLINICA',
    });
    await mockCommonApis(page);
  });

  test('na página do paciente (/pacientes/:id), deve exibir seções clínicas e cadastrais', async ({ page }) => {
    await page.goto('/pacientes/pac-123');

    // Dados cadastrais visíveis
    await expect(page.getByRole('heading', { name: 'Maria da Silva' })).toBeVisible();

    // Seções clínicas visíveis
    await expect(page.getByRole('button', { name: /iniciar atendimento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /plano alimentar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /medidas/i })).toBeVisible();
    await expect(page.getByText('Estado Clínico')).toBeVisible();
  });

  test('no Dashboard, o botão "Atender" deve estar visível', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /atender/i })).toBeVisible();
  });
});
