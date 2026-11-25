import { test, expect, type Page } from "@playwright/test";

// Utilizando execução em série garantimos ordem lógica do fluxo sem interrupções
// de concorrência que quebram acessos a dados no banco.
test.describe.serial("Jornada Completa do Usuário (Macro E2E)", () => {
  const timestamp = Date.now();
  const clincaNome = `Clinica E2E ${timestamp}`;
  const adminEmail = `admin-${timestamp}@e2etest.com`;
  const nutriEmail = `nutri-${timestamp}@e2etest.com`;
  const pacienteNome = `Paciente Teste ${timestamp}`;
  const pacienteEmail = `paciente-${timestamp}@teste.com`;
  const pacienteCpf = "52998224725";
  const pacienteWhatsapp = "11987654321";

  let pacienteId: string;
  let questionarioId: string;
  let authToken: string;
  let expectedScore = 0;

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("Etapa 1: Cadastro da Clínica e Nutricionista", async () => {
    await page.goto("/cadastro");

    // Selecionar o tipo de conta (Clínica)
    await page.getByText("Tenho uma Clínica").click();

    // Formulário Clinica
    await page.getByPlaceholder("Ex: Clínica Nutri Vida").fill(clincaNome);

    // Formulário Administrador
    await page.getByPlaceholder("Seu nome").fill("Nutricionista E2E Admin");
    await page.getByPlaceholder("seu@email.com").fill(adminEmail);
    await page.getByPlaceholder("Mínimo 6 caracteres").fill("123456");

    // Submeter
    await page.getByRole("button", { name: "Cadastrar Clínica" }).click();

    // Deve ser redirecionado para o Dashboard após token armazenado
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Certificar que logou (botão sair, ou layout presente)
    await expect(
      page
        .getByRole("heading", {
          level: 2,
          name: /Resumo|Dashboard|Pacientes|Agenda/i,
        })
        .first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Sair" }).first()).toBeVisible();

    // Fazer logout no fim desta etapa para provar que a rota de Login pura funciona depois
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Etapa 2: Login com credenciais criadas", async () => {
    test.setTimeout(30000);
    await page.goto("/login");
    await page.getByPlaceholder("seu@email.com").fill(adminEmail);
    await page.getByPlaceholder("Sua senha").fill("123456");
    await page.getByRole("button", { name: "Acessar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("button", { name: "Sair" }).first()).toBeVisible();

    // Capturar token direto do localStorage para uso futuro dinâmico
    const authStoreStr = await page.evaluate(() =>
      window.localStorage.getItem("nutricao-auth"),
    );
    if (authStoreStr) {
      const authStore = JSON.parse(authStoreStr);
      authToken = authStore.state.accessToken;
    }
    expect(authToken).toBeTruthy();
  });

  test("Etapa 2.5: Cadastro de Nutricionista via Configurações", async () => {
    await page.goto("/configuracoes");
    await page.getByRole("button", { name: "Usuários" }).click();
    await page.getByRole("button", { name: "Novo Usuário" }).click();

    await page.locator('input[name="nome"]').fill("Nutricionista de Teste");
    await page.locator('input[name="email"]').fill(nutriEmail);
    await page.locator('input[name="senha"]').fill("123456");
    await page.locator('select[name="perfil"]').selectOption("NUTRICIONISTA");

    await page.getByRole("button", { name: "Cadastrar" }).click();

    // Validar se apareceu na tabela
    await expect(
      page.getByRole("cell", { name: "Nutricionista de Teste" }),
    ).toBeVisible();
  });

  test("Etapa 3: Cadastro de Paciente via Dashboard", async () => {
    // A partir do Dashboard, clica no menu Pacientes
    await page
      .getByRole("link", { name: /Pacientes/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/pacientes/);

    // Clica no botão Novo Paciente
    await page.getByRole("button", { name: /Novo Paciente/i }).click();

    await expect(
      page.getByRole("heading", { level: 2, name: "Novo Paciente" }),
    ).toBeVisible();

    // Preencher campos obrigatórios e essenciais do paciente
    await page.getByPlaceholder("Nome completo").fill(pacienteNome);
    await page.getByPlaceholder("email@exemplo.com").fill(pacienteEmail);
    await page.getByPlaceholder("(00) 00000-0000").fill(pacienteWhatsapp);
    await page.locator('select[name="sexo"]').selectOption("MASCULINO");
    await page.getByPlaceholder("000.000.000-00").fill(pacienteCpf);

    await page.getByRole("button", { name: "Cadastrar" }).click();

    // Aguarda retorno à listagem de pacientes e exibição do novo paciente
    await expect(page).toHaveURL(/\/pacientes$/, { timeout: 15000 });
    await expect(page.getByText(pacienteNome).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("Etapa Intermediária: Extrair IDs via API local do E2E", async ({
    request,
  }) => {
    expect(authToken).toBeTruthy();

    // Buscar Paciente criado por nome
    const pResponse = await request.get("/api/pacientes", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(pResponse.ok()).toBeTruthy();
    const pData = await pResponse.json();
    expect(pData.data.data.length).toBeGreaterThan(0);
    const pacienteEncontrado = pData.data.data.find(
      (p: { id: string; nome: string }) => p.nome === pacienteNome,
    );
    expect(pacienteEncontrado).toBeTruthy();
    pacienteId = pacienteEncontrado.id;

    // Buscar Questionário da clínica
    const qResponse = await request.get("/api/questionarios", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(qResponse.ok()).toBeTruthy();
    const qData = await qResponse.json();
    expect(qData.data.data.length).toBeGreaterThan(0);
    questionarioId = qData.data.data[0].id;
  });

  test("Etapa 4: Agendamento de uma consulta", async () => {
    // Clica link da Agenda
    await page
      .getByRole("link", { name: /Agenda/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/agenda/);

    // Confirma que a página de agenda abriu
    await expect(page.getByRole("button", { name: /Agendar/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /Agendar/i }).click();
    await expect(
      page.getByRole("heading", { level: 3, name: "Novo Agendamento" }),
    ).toBeVisible();

    // Selecionar Paciente via combobox visível
    const pacienteCombobox = page.getByPlaceholder(
      "Buscar ou selecionar paciente...",
    );
    await pacienteCombobox.click();
    await pacienteCombobox.fill(pacienteNome);
    await page.getByText(pacienteNome, { exact: true }).first().click();

    // Selecionar "Nutricionista de Teste" explicitamente
    const nutricionistaSelect = page.locator('select[name="nutricionistaId"]');
    await expect(
      nutricionistaSelect.locator("option", {
        hasText: "Nutricionista de Teste",
      }),
    ).toHaveCount(1, { timeout: 10000 });
    await nutricionistaSelect.selectOption({ label: "Nutricionista de Teste" });
    await expect(nutricionistaSelect).not.toHaveValue("");

    await page.locator('select[name="tipo"]').selectOption("CONSULTA");

    // Data/hora para datetime-local (YYYY-MM-DDTHH:mm)
    const currentViewDate = await page
      .locator('input[type="date"]')
      .inputValue();
    await page
      .locator('input[type="datetime-local"]')
      .fill(`${currentViewDate}T14:30`);

    await page
      .locator("form")
      .getByRole("button", { name: "Agendar", exact: true })
      .click();

    await expect(
      page.getByRole("heading", { level: 3, name: "Novo Agendamento" }),
    ).not.toBeVisible({ timeout: 10000 });

    // Filtrar a página pelo "Nutricionista de Teste" para exibir o agendamento criado para ele
    const pageFilter = page.locator("#nutricionista-filter");
    await expect(
      pageFilter.locator("option", { hasText: "Nutricionista de Teste" }),
    ).toHaveCount(1, { timeout: 10000 });
    await pageFilter.selectOption({ label: "Nutricionista de Teste" });

    // Consulta deve renderizar na tabela com o nome do paciente
    await expect(
      page.getByRole("cell", { name: pacienteNome }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Etapa 4.5: Validar e Limpar Notificações de Agendamento", async () => {
    // Notificações de agendamento são persistidas na caixa do nutricionista alvo
    await page.goto("/login");
    await page.getByPlaceholder("seu@email.com").fill(nutriEmail);
    await page.getByPlaceholder("Sua senha").fill("123456");
    await page.getByRole("button", { name: "Acessar" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Abrir o centro de notificações
    const bellButton = page.getByRole("button", { name: "Notificações" });
    await expect(bellButton).toBeVisible({ timeout: 10000 });
    await bellButton.click();

    await expect(
      page.getByRole("heading", { level: 3, name: "Notificações" }),
    ).toBeVisible({ timeout: 10000 });

    // Validar que a notificação do novo agendamento está listada
    await expect(page.getByText("Novo agendamento").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(pacienteNome).first()).toBeVisible({
      timeout: 10000,
    });

    // Clicar para limpar as notificações e confirmar esvaziamento
    await page.getByRole("button", { name: /Limpar/i }).click();
    await expect(
      page.getByText("Nenhuma notificação por enquanto."),
    ).toBeVisible({ timeout: 10000 });

    // Fechar painel
    await page.getByRole("button", { name: "Fechar" }).click();
    await expect(
      page.getByRole("heading", { level: 3, name: "Notificações" }),
    ).not.toBeVisible();
  });

  test("Etapa 5: Preenchimento de Questionário Público", async () => {
    test.setTimeout(45000);

    // Abre URL pública (deslogada virtualmente)
    await page.goto(
      `/questionarios/${questionarioId}/pacientes/${pacienteId}/responder`,
    );

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    // [Testes Negativos Iniciais] Tentar enviar vazio para confirmar bloqueio
    await page.getByRole("button", { name: "Finalizar Questionário" }).click();

    await expect(
      page.getByText("Questionário preenchido com sucesso"),
    ).not.toBeVisible();

    // Interceptar e simular erro 400 do backend
    await page.route(
      "**/api/pacientes/*/questionarios/*/avaliacoes",
      async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Questionário inativo ou não existe.",
          }),
        });
      },
    );

    const gruposParaRejeitar = await page
      .locator('article[id^="pergunta-"]')
      .all();
    for (const grupo of gruposParaRejeitar) {
      const options = await grupo.locator("label").all();
      if (options.length > 0) {
        await options[0].click();
      }
    }

    await page.getByRole("button", { name: "Finalizar Questionário" }).click();

    await expect(
      page.getByText("Questionário inativo ou não existe."),
    ).toBeVisible();

    // Remover a interceptação de falha para testar o sucesso total
    await page.unroute("**/api/pacientes/*/questionarios/*/avaliacoes");

    // Marcar a última alternativa disponível de cada pergunta e calcular score esperado
    let scoreEsperado = 0;
    const gruposParaAcertar = await page
      .locator('article[id^="pergunta-"]')
      .all();
    for (const grupo of gruposParaAcertar) {
      const options = await grupo.locator("label").all();
      if (options.length > 0) {
        const lastOption = options[options.length - 1];
        await lastOption.click();

        const inputVal = await lastOption.locator("input").inputValue();
        scoreEsperado += parseInt(inputVal || "0", 10);
      }
    }

    // Submeter com sucesso total
    await page.getByRole("button", { name: "Finalizar Questionário" }).click();
    await expect(
      page.getByText("Questionário preenchido com sucesso"),
    ).toBeVisible({ timeout: 10000 });

    expectedScore = scoreEsperado;
  });

  test("Etapa 6: Validar o Score no Prontuário do Login da Clínica", async () => {
    // Fazer Login novamente como ADMIN da clínica
    await page.goto("/login");
    await page.getByPlaceholder("seu@email.com").fill(adminEmail);
    await page.getByPlaceholder("Sua senha").fill("123456");
    await page.getByRole("button", { name: "Acessar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Ir para o Prontuário do paciente
    await page.goto(`/pacientes/${pacienteId}`);

    // Validar visualmente o aside de resultados de questionários
    await expect(
      page
        .locator("aside")
        .getByRole("heading", { name: "Resultados de Questionários" }),
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(`Score: ${expectedScore}`, { exact: true }).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
