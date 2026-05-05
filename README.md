# ByteBank — Gerenciamento Financeiro

Aplicação de gerenciamento financeiro pessoal desenvolvida como **Tech Challenge Fase 01** da pós-graduação POSTECH (Front-End Engineering).

## Funcionalidades

- **Home**: saldo disponível (com toggle de visibilidade), resumo de entradas/saídas e extrato das últimas 5 transações
- **Transações**: listagem completa com filtro por tipo, ordenação por data e ações de editar/excluir
- **Adicionar transação**: modal com formulário validado (tipo, valor, data, descrição)
- **Editar transação**: mesmo modal reutilizável pré-preenchido com os dados existentes
- **Excluir transação**: modal de confirmação antes de remover
- **Persistência**: dados salvos no `localStorage` — sobrevivem ao recarregamento da página

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16 (App Router) | Framework principal |
| React | 19 | UI |
| TypeScript | 5 | Tipagem |
| Tailwind CSS | 4 | Estilização e design tokens |
| Storybook | 10 | Documentação do Design System |

## Pré-requisitos

- Node.js >= 18
- npm >= 9

## Como executar

### Instalação

```bash
git clone <url-do-repositório>
cd bytebank-app
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Storybook (Design System)

```bash
npm run storybook
```

Acesse [http://localhost:6006](http://localhost:6006).

### Build de produção

```bash
npm run build
npm start
```

## Estrutura do projeto

```
src/
├── app/
│   ├── layout.tsx              # Layout global com Header e Provider
│   ├── page.tsx                # Home Page
│   └── transactions/
│       └── page.tsx            # Listagem de transações
├── components/
│   ├── ui/                     # Design System (documentado no Storybook)
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Modal/
│   │   └── Table/
│   └── features/               # Componentes de negócio
│       ├── Header/
│       ├── BalanceCard/
│       ├── TransactionList/
│       ├── TransactionForm/
│       └── TransactionModal/
├── contexts/
│   └── TransactionsContext.tsx # Estado global com useReducer + localStorage
├── data/
│   └── transactions.ts         # Dados mockados iniciais
├── lib/
│   └── formatters.ts           # Utilitários de formatação (BRL, data)
├── stories/                    # Stories do Storybook
└── types/
    └── transaction.ts          # Tipo Transaction e constantes
```

## Design System

Os componentes de UI seguem um design system com tokens definidos em `src/app/globals.css` via `@theme` do Tailwind CSS v4:

- **Cores**: `primary` (verde), `secondary` (azul escuro), `danger`, `success`, `warning`, `neutral`
- **Componentes documentados**: Button, Input, Select, Card, Badge, Modal

Consulte o Storybook para ver todas as variantes e documentação interativa.

## Mock de dados

Os dados são inicializados a partir de `src/data/transactions.ts` com 12 transações de exemplo. Após a primeira carga, os dados são persistidos no `localStorage` do navegador, permitindo que adições, edições e exclusões sobrevivam ao recarregamento.

Para resetar os dados, limpe o `localStorage` no DevTools do navegador (Application → Local Storage → `bytebank_transactions`).
