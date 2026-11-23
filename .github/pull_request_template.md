## O que mudou
<!-- 1–3 frases objetivas, do ponto de vista de quem usa (nutricionista, secretária ou admin). -->

## Como testei
- [ ] `npm run lint`, `npm test` e `npm run build` verdes
- [ ] Auditoria Clean Architecture (zero `prisma` em `*.controller.ts`, zero `@/services/api` em `.tsx`)
- [ ] Conferi no navegador (comportamento clínico, validações e responsividade)

## Critérios de aceite e validações
<!-- Liste cada entrega/comportamento deste PR e como foi validado (ex.: PASS — arquivo:linha ou suíte de teste). -->
- [ ] 

## Banco de dados / Variáveis de ambiente
<!-- Houve migration Prisma, seed ou nova variável de ambiente? -->
- [ ] Nenhuma alteração de schema/env
- [ ] Nova migration Prisma (requer `npx prisma migrate deploy` após o merge)

## Fora do escopo / dúvidas
<!-- O que você observou e optou por não alterar agora, ou pontos que merecem atenção no code review. -->
