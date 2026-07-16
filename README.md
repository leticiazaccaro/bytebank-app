# ByteBank — Gerenciamento Financeiro

Aplicação de gerenciamento financeiro pessoal desenvolvida como **Tech Challenge Fase 02** da pós-graduação POSTECH (Front-End Engineering). Evolui a SPA da Fase 01 para uma arquitetura de microfrontends (Next.js Multi-Zones) integrada à API real `tech-challenge-2`, com gráficos financeiros, filtros avançados, upload de anexos e acessibilidade WCAG 2.1 AA.

## Funcionalidades

- **Autenticação real**: cadastro e login contra a API `tech-challenge-2`, sessão em cookie `httpOnly` (o JWT nunca chega ao JavaScript do navegador)
- **Home**: saldo disponível, gráfico de evolução de saldo e gráfico de entradas/saídas por categoria, calculados a partir do extrato real
- **Transações**: listagem com filtro por tipo/categoria/data, busca textual (debounced) e scroll infinito
- **Formulário de transação**: validação avançada, sugestão automática de categoria por palavra-chave, upload de anexo (imagem ou PDF, até 2MB)
- **Persistência real**: criação, edição e exclusão de transações via API real — sobrevivem entre sessões e dispositivos (dentro das limitações da API, ver abaixo)
- **Microfrontends**: `shell`, `mf-dashboard` e `mf-transactions` são builds e deploys independentes
- **Acessibilidade**: navegação completa por teclado, foco preso em modais, anúncios `aria-live` e contraste mínimo 4.5:1

## Arquitetura / Estrutura do monorepo

Monorepo com **npm workspaces**: 3 apps Next.js independentes (Multi-Zones) e 2 pacotes compartilhados. `shell` é a zona-raiz — dono do domínio, da autenticação e do BFF — e reescreve (`rewrites`) as demais rotas para `mf-dashboard` e `mf-transactions`, cada um um app Next.js completo com build/deploy próprios.

```
apps/
├── shell/              # Zona raiz: login/cadastro, BFF de autenticação, proteção de rota (proxy.ts),
│                        # rewrites cross-zone
├── mf-dashboard/        # Home: saldo e gráficos financeiros (Nivo)
└── mf-transactions/     # Listagem (filtro/busca/scroll infinito) e formulário de transação

packages/
├── ui/                  # Design System compartilhado (Button, Input, Select, Card, Badge, Modal,
│                        # Table, FAB, Header, BottomNav, LiveRegion) + tokens Tailwind (theme.css)
└── shared/               # Tipos, cliente HTTP da API real, categorias/sugestão, helpers de sessão

e2e/                     # Testes end-to-end (Playwright), drivam os 3 apps juntos
docker-compose.yml       # Orquestração local dos 3 serviços
DEPLOY.md                # Passo a passo de deploy multi-projeto na Vercel
```

Navegação **dentro** de uma zona é soft (client-side); navegação **entre** zonas (ex.: Home → Transações) é uma hard navigation (recarrega a página) — trade-off da arquitetura Multi-Zones.

## Stack

| Tecnologia | Versão | Uso |
| --- | --- | --- |
| Next.js | 16 (App Router, Multi-Zones) | Framework dos 3 apps |
| React | 19 | UI |
| TypeScript | 5 | Tipagem |
| Tailwind CSS | 4 | Estilização e design tokens |
| Redux Toolkit + RTK Query | — | Estado e cache de dados em `mf-transactions` |
| Zod | 4 | Validação de formulário |
| Nivo (`@nivo/line`, `@nivo/pie`) | — | Gráficos financeiros da Home |
| Storybook | 10 | Documentação e testes de interação do Design System |
| Playwright | 1 | Testes end-to-end |
| Vitest | 4 | Testes unitários e de integração |
| Docker / Docker Compose | — | Containerização local |

## Pré-requisitos

- Node.js >= 20
- npm >= 9
- Uma instância acessível da API `tech-challenge-2` (ou o `API_BASE_URL` apontado para uma já hospedada)

## Como executar localmente

### Instalação

```bash
git clone <url-do-repositório>
cd bytebank-app
npm install
```

### Variáveis de ambiente

Cada app lê a sua própria `API_BASE_URL` (URL da API real `tech-challenge-2`), e o `shell` também precisa das origens dos outros dois apps para montar suas rewrites. Copie o `.env.example` de cada app para `.env.local`:

```bash
cp apps/shell/.env.example apps/shell/.env.local
cp apps/mf-dashboard/.env.example apps/mf-dashboard/.env.local
cp apps/mf-transactions/.env.example apps/mf-transactions/.env.local
```

e ajuste `API_BASE_URL` em cada um para a URL da API real. Em desenvolvimento local, `MF_DASHBOARD_ORIGIN`/`MF_TRANSACTIONS_ORIGIN` já vêm preenchidos com `http://localhost:3001`/`http://localhost:3002` no `.env.example` do `shell`.

### Rodando os 3 apps

Cada app roda em sua própria porta. Em 3 terminais separados:

```bash
npm run dev -w apps/shell           # http://localhost:3000 — acesse a aplicação por aqui
npm run dev -w apps/mf-dashboard    # http://localhost:3001
npm run dev -w apps/mf-transactions # http://localhost:3002
```

Acesse sempre pelo `shell` ([http://localhost:3000](http://localhost:3000)) — é ele quem reescreve as rotas para os outros dois apps; acessar `mf-dashboard`/`mf-transactions` diretamente pula a autenticação e o layout compartilhado.

### Storybook (Design System)

```bash
npm run storybook
```

Acesse [http://localhost:6006](http://localhost:6006).

### Build de produção

```bash
npm run build --workspaces --if-present
```

Cada app também pode ser buildado individualmente com `npm run build -w apps/<nome>`.

## Testes

```bash
npm run typecheck                       # checagem de tipos em todo o monorepo
npm run test:unit --workspaces --if-present   # testes unitários/integração (Vitest)
npm run test:storybook -w packages/ui   # testes de interação e acessibilidade do Design System
npm run test:e2e                        # fluxos ponta a ponta (Playwright)
```

`npm run test:e2e` sobe os 3 apps automaticamente (via `webServer` do Playwright) contra um servidor de testes que replica o contrato da API real (`e2e/fixtures/stub-api-server.mjs`) — não é necessário ter a API real disponível para rodar os testes de ponta a ponta.

## Docker Compose

Sobe os 3 serviços de uma vez, a partir de um clone limpo do repositório:

```bash
cp .env.example .env   # preencha API_BASE_URL (e, se necessário, as origens dos zones)
docker compose up --build
```

A aplicação fica acessível em [http://localhost:3000](http://localhost:3000). Veja `docker-compose.yml` e `.env.example` para os detalhes de cada serviço/porta.

## Deploy (Vercel)

Cada app é deployado como um **projeto Vercel separado**, apontando para este mesmo repositório com uma *Root Directory* diferente (`apps/shell`, `apps/mf-dashboard`, `apps/mf-transactions`). O passo a passo completo — ordem de deploy, variáveis de ambiente por projeto e a ressalva sobre *Deployment Protection* da Vercel bloquear as rewrites entre projetos — está em [`DEPLOY.md`](./DEPLOY.md).

## Limitações conhecidas da API

Este frontend consome a API `tech-challenge-2` fornecida pelo curso como está — sem alterações no backend. As limitações abaixo são características conhecidas dessa API, documentadas aqui para transparência:

- **Senha em texto puro**: a API armazena senhas sem hashing. O frontend nunca loga nem exibe a senha do usuário, mas a limitação em si é do backend fornecido.
- **`JWT_SECRET` fixo no backend**: o segredo usado para assinar os tokens é hardcoded na API (`'tech-challenge'`), então qualquer pessoa que o conheça pode forjar um token válido. Por isso, o frontend nunca confia no payload de um JWT decodificado localmente para autorizar uma ação — toda operação sensível é validada contra a própria API real.
- **`GET /user` é público**: a API expõe esse endpoint (com todos os usuários e senhas em texto puro) sem autenticação — é um bug conhecido do backend. Nenhuma tela ou rota deste frontend chama esse endpoint.
- **Sem paginação, filtro ou busca no servidor**: `GET /account/:id/statement` sempre retorna o extrato completo. Filtro por tipo/categoria/data, busca textual e scroll infinito acontecem inteiramente no client sobre essa lista já carregada.
- **Banco de dados em memória em modo dev**: dependendo de como a API é executada, os dados podem ser resetados a cada reinicialização do servidor da API — isso é comportamento do backend, não deste frontend.
- **Uma conta por usuário**: a API não suporta múltiplas contas por usuário (`account[0]` é sempre usado).
- **Sem recuperação de senha nem refresh token**: a API não expõe esses endpoints; a sessão expira junto com o JWT (12h) e o usuário precisa logar novamente.
