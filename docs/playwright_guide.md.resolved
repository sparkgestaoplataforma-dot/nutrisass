# 🎭 Guia Rápido: Playwright E2E

O **Playwright** é uma ferramenta de automação para testes de ponta a ponta (End-to-End) que permite testar sua aplicação exatamente como um usuário real faria no navegador (Chromium, Firefox, WebKit).

---

## 🚀 Como Executar os Testes

Os comandos devem ser executados dentro da pasta do projeto web (`apps/web`).

### 1. Modo Interface (UI Mode)
Recomendado para desenvolvimento. Abre uma janela onde você pode ver o teste rodando, depurar passo a passo e ver o histórico de ações.
```bash
npm run test:e2e:ui
```

### 2. Modo Terminal (Headless)
Ideal para rodar rápido ou em esteiras de CI/CD.
```bash
npm run test:e2e
```

### 3. Rodar um Arquivo Específico
Se você quiser rodar apenas o fluxo completo:
```bash
npx playwright test flux-completo.spec.ts
```

---

## 🛠️ Comandos Principais no Código

### Localizadores (Locators)
Sempre prefira localizadores que simulem a acessibilidade:

| Comando | Descrição |
| :--- | :--- |
| `page.getByRole('button', { name: 'Sair' })` | Busca um botão pelo texto. |
| `page.getByPlaceholder('seu@email.com')` | Busca um campo pelo placeholder. |
| `page.getByLabel('Nome')` | Busca pelo label associado ao input. |
| `page.locator('text=Texto')` | Busca por texto genérico (use como última opção). |

### Ações
| Comando | Ação |
| :--- | :--- |
| `.click()` | Clica no elemento. |
| `.fill('texto')` | Digita no campo. |
| `.selectOption('valor')` | Seleciona item em um `<select>`. |
| `.check()` | Marca um checkbox ou radio. |

### Asserções (Expects)
| Comando | Validação |
| :--- | :--- |
| `await expect(locator).toBeVisible()` | Verifica se o item está visível. |
| `await expect(locator).toHaveText('...')` | Verifica se o texto é exato. |
| `await expect(page).toHaveURL(/dashboard/)` | Verifica a URL atual. |

---

## 🔍 Dicas de Ouro

1. **Aguarde a Transição**: O Playwright já espera os elementos aparecerem automaticamente, mas às vezes você precisa de um `await page.waitForURL()` após um login ou redirecionamento.
2. **Debugar**: Se um teste falhar, o Playwright gera um **Trace** (rastreio). No modo UI, você pode clicar nas ações e ver o "antes" e "depois" do DOM.
3. **Fuso Horário**: Em campos de `datetime-local`, tente sempre ler a data que a UI está exibindo para evitar erros de fuso horário entre o computador de teste e o navegador.

---

## 📂 Onde ficam os testes?
No nosso projeto, os testes estão localizados em:
`apps/web/tests/e2e/`
> O arquivo principal que corrigimos é o `fluxo-completo.spec.ts`.
