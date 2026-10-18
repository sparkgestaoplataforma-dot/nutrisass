| Módulo / Funcionalidade | Presente no PDF | Presente no NutriSaaS | Status |
| :--- | :--- | :--- | :--- |
| **Login e Autenticação** | Login e restrição de acesso | JWT, refresh token, perfis | ✅ 100% |
| **Cadastro de Pacientes** | Formulário com dados pessoais, documentos, convênio e endereço | Formulário completo idêntico (`PacienteFormPage.tsx`) | ✅ 100% |
| **Prontuário - Estado Clínico** | Sintomas, Digestivo, Antecedentes, Medicamentos, Outros | Timeline com os 5 mesmos blocos (`EstadoClinicoTimeline.tsx`) | ✅ 100% |
| **Questionário de Rastreamento (QRM)** | Módulos anatômicos, notas 0 a 4, cálculo de score e classificação | QRM completo + link público + gráfico de evolução | ✅ Supera o PDF |
| **Agenda e Calendário** | Lista do dia, status, opções | Agenda em tempo real (Socket.io) + filtros | ✅ 100% |
| **Cadastro Rápido na Agenda** | Bloco "Adicionar Paciente" embutido no agendamento | Cadastro rápido integrado no modal de agendamento com busca | ✅ 100% |
| **Antropometria (Medidas)** | Tabela com 10 circunferências/medidas corporais | Tabela e registro dos 10 mesmos campos | ✅ 100% |
| **Impressão de Medidas Timbrada** | Modelo de impressão para entrega ao paciente | Impressão timbrada com evolução comparativa, variação e IMC | ✅ 100% |
| **Tabela e Solicitação de Exames** | Exames base, solicitação e lançamento de resultados | 85 exames TUSS base + exames customizados | ✅ 100% |
| **Guia TISS (ANS)** | Botão e emissão de "GERAR GUIATISS" para convênios | Emissão e impressão da Guia de Consulta oficial padrão TISS/ANS | ✅ 100% |
| **Outros Exames (não solicitados)** | Lançamento direto de exame externo trazido pelo paciente | Lançamento direto com resultado e identificação de exame externo | ✅ 100% |
| **Histórico de Consultas no Paciente** | Card com últimos agendamentos na ficha do paciente | Card com histórico completo de agendamentos e status no prontuário | ✅ 100% |
| **Gestão de Convênios** | Nome, Registro ANS e Logomarca | Cadastro com nome, registro ANS e upload de logomarca da operadora | ✅ 100% |
| **Gestão de Usuários** | Administrador, Secretária com perfis | Admin, Nutricionista, Secretária com perfis e guards | ✅ 100% |
| **Relatórios de Atendimento** | Filtro por status (Realizados, Desistentes) + impressão | Filtro de período, status, contadores e print | ✅ 100% |