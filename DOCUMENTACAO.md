# LucsQuestions — Documentação Técnica Completa

Aplicação web para criação rápida de TDs (listas de exercícios) com questões reais de vestibulares, geradas por IA, com histórico persistente por usuário e exportação em A4.

---

## 1. Visão Geral

- **Objetivo**: permitir que um usuário leigo crie uma atividade completa em menos de 1 minuto.
- **Público**: professores (uso principal) e alunos (uso limitado).
- **Idioma da interface**: Português (Brasil).
- **Design**: minimalista acadêmico — branco, cinza e azul acadêmico, cards para questões, configurações avançadas escondidas.

---

## 2. Stack de Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework UI | React 18 |
| Linguagem | TypeScript 5 |
| Build / Dev server | Vite 5 (`@vitejs/plugin-react-swc`), porta 8080 |
| Estilos | Tailwind CSS 3 + `tailwindcss-animate` + `@tailwindcss/typography` |
| Componentes | shadcn/ui sobre Radix UI |
| Ícones | lucide-react |
| Animações | framer-motion |
| Notificações | sonner (toasts) |
| Roteamento | react-router-dom 6 |
| Dados/cache | @tanstack/react-query |
| Formulários | react-hook-form + zod + @hookform/resolvers |
| Backend (Lovable Cloud) | Postgres + Auth + Edge Functions (Deno) |
| SDK backend | @supabase/supabase-js 2 |
| Login social | @lovable.dev/cloud-auth-js (Google) |
| IA | Lovable AI Gateway — modelo `google/gemini-3-flash-preview` |
| Leitura de PDF | pdfjs-dist 4.8.69 |
| Exportação | `window.print()` (@media print A4), jspdf + html2canvas |
| Testes | Vitest 3 + Testing Library + jsdom |
| Lint | ESLint 9 + typescript-eslint |

### Dependências de produção (principais)
`react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `@tanstack/react-query`, `react-hook-form`, `zod`, `framer-motion`, `lucide-react`, `sonner`, `date-fns`, `pdfjs-dist`, `jspdf`, `html2canvas`, `clsx`, `tailwind-merge`, `class-variance-authority`, `cmdk`, `vaul`, `recharts`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-day-picker`, `react-resizable-panels`, e o conjunto `@radix-ui/react-*` (accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip).

### Dependências de desenvolvimento
`vite`, `@vitejs/plugin-react-swc`, `typescript`, `typescript-eslint`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@eslint/js`, `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/typography`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/*`, `globals`, `lovable-tagger`.

### Scripts
```bash
npm run dev        # servidor de desenvolvimento (porta 8080)
npm run build      # build de produção
npm run build:dev  # build em modo development
npm run preview    # preview do build
npm run lint       # ESLint
npm run test       # Vitest (execução única)
npm run test:watch # Vitest em watch
```

---

## 3. Estrutura de Pastas

```
src/
  components/
    AuthPage.tsx           # login/cadastro (e-mail e Google)
    ProfileSetupModal.tsx  # escolha do perfil (Professor/Aluno)
    HistorySidebar.tsx     # histórico persistente à esquerda
    GeneratorForm.tsx      # formulário de geração (tema, fonte, cabeçalho, gabarito)
    TDCanvas.tsx           # área principal de edição do TD
    TDPreview.tsx          # pré-visualização A4 / impressão
    Editable.tsx           # edição inline de qualquer texto
    NavLink.tsx
    ui/                    # componentes shadcn/ui
  hooks/
    useAuth.ts             # sessão, login e-mail/Google, logout
    useProfile.ts          # perfil e papel do usuário
    useTDs.ts              # CRUD + realtime + chamada da edge function
    use-mobile.tsx, use-toast.ts
  integrations/
    supabase/client.ts     # cliente do backend (auto-gerado)
    supabase/types.ts      # tipos do banco (auto-gerado)
    lovable/index.ts       # OAuth Google (auto-gerado)
  lib/
    pdfExtract.ts          # extração de texto de PDF modelo (pdfjs)
    utils.ts
  pages/
    Index.tsx, NotFound.tsx
  types/td.ts              # tipos e constantes de domínio
  index.css                # design system (tokens HSL) + regras @media print
supabase/
  functions/generate-activity/index.ts
  migrations/*.sql
  config.toml
```

---

## 4. Modelo de Dados (Postgres)

### `profiles`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | referencia o usuário autenticado |
| email | text | |
| full_name | text | |
| role | text | `Professor` ou `Aluno` |
| created_at / updated_at | timestamptz | |

RLS: usuário só lê/insere/atualiza a própria linha (`auth.uid() = id`). DELETE negado.

### `generated_tds`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | dono do TD |
| school | text | padrão "EEEP Deputado Roberto Mesquita" |
| subject, teacher, class_name | text | cabeçalho |
| topic | text | tema pesquisado |
| source | text | fonte selecionada |
| mode | text | `web` ou `pdf` |
| theory | text | resumo teórico |
| questions | jsonb | array de questões |
| question_count | int | |
| answer_key_mode | text | `simple` \| `sheet` \| `commented` \| `screen` |
| author_role | text | `Professor` \| `Aluno` |
| created_at / updated_at | timestamptz | |

RLS: todas as operações restritas a `auth.uid() = user_id` (role `authenticated`).

### `activities` (tabela legada da primeira versão)
Mesma proteção por `user_id`; mantida por compatibilidade histórica.

### Funções de banco
- `handle_new_user()` — trigger `SECURITY DEFINER` que cria o `profiles` no cadastro.
- `update_updated_at_column()` — trigger de atualização de timestamp.

---

## 5. Autenticação e Perfis

- **Métodos**: e-mail/senha e Google (OAuth via Lovable Cloud, `redirect_uri = window.location.origin`).
- **Sessão**: `onAuthStateChange` + `getSession` em `useAuth`, persistida em `localStorage`.
- **Primeiro acesso**: `ProfileSetupModal` obriga a escolha do papel, gravado em `profiles.role`.

### Regras de negócio por perfil
| Regra | Professor | Aluno |
|---|---|---|
| Máx. de questões por TD | 30 | 10 |
| Modos de gabarito | todos (simples, folha separada, comentado, só na tela) | conforme UI liberada |
| Modo "espelhar modelo" (PDF) | sim | — |

Os limites são aplicados **também no servidor** (edge function), não apenas na interface.

---

## 6. Inteligência Artificial

**Edge Function**: `supabase/functions/generate-activity/index.ts` (Deno).

Fluxo:
1. Frontend (`useTDs.generateTD`) envia POST com o token do usuário.
2. A função valida o JWT (`auth.getClaims`) e aplica o limite de questões pelo papel.
3. Monta o prompt e chama `https://ai.gateway.lovable.dev/v1/chat/completions` com `google/gemini-3-flash-preview`.
4. Normaliza a resposta (sempre 5 alternativas A–E, letra correta válida, nível válido).
5. Insere em `generated_tds` e devolve o registro criado.

Regras invioláveis do prompt:
- Somente questões **reais** de exames brasileiros (ENEM, FUVEST, ITA, UNICAMP, UNESP...).
- Enunciado começa com banca e ano entre colchetes: `[ENEM 2023] ...`.
- Exatamente 5 alternativas por questão.
- Classificação automática em `facil` / `media` / `dificil`.
- Justificativa passo a passo (gabarito comentado).
- Saída em JSON puro, sem markdown — garante que "Copiar para Word" funcione.

Modos de geração:
- **IA + Web**: usa o tema e a fonte escolhida, gera resumo teórico + N questões.
- **Espelhar modelo (PDF)**: extrai o texto de um TD enviado (`pdfExtract.ts`) e usa como molde estrutural para um novo tema.

Erros tratados: 401 (não autorizado), 400 (tema obrigatório), 429 (limite de requisições), 402 (créditos de IA esgotados), 500 (falha de parse/gravação).

---

## 7. Interface e Fluxo de Uso

1. Login → escolha do perfil.
2. Sidebar esquerda: lista o histórico em tempo real (Realtime Postgres Changes) e permite reabrir um TD com 1 clique, além de excluir.
3. Formulário: Tema, Fonte (`Vestibulares Reais/ENEM`, `Toda Matéria`, `Brasil Escola`, `Todas as Fontes`), quantidade de questões, cabeçalho (escola, disciplina, professor, turma) e modo de gabarito. Configurações avançadas ficam ocultas por padrão.
4. Geração → cards de questões com selo de dificuldade (verde/amarelo/vermelho) e origem da banca.
5. Edição inline (`Editable`) de qualquer texto antes de salvar/exportar; alterações persistidas via `updateTD`.
6. Exportação: "Copiar para Word" (texto limpo) e "Gerar PDF / Imprimir" via `window.print()` com regras `@media print` em A4 que ocultam a interface e respeitam o modo de gabarito.

---

## 8. Segurança

- RLS habilitado em todas as tabelas públicas, com políticas por `auth.uid()`.
- GRANTs explícitos por papel (`authenticated`, `service_role`).
- Papel do usuário lido do banco, nunca de `localStorage`; limites revalidados na edge function.
- Chave de IA (`LOVABLE_API_KEY`) vive apenas no servidor; o cliente usa somente a chave publicável.

---

## 9. Configuração de Ambiente

Variáveis (arquivo `.env`, geradas automaticamente):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Segredos do servidor: `LOVABLE_API_KEY` (IA), além das variáveis internas do backend.

`supabase/config.toml`: `[functions.generate-activity] verify_jwt = false` — a validação do token é feita manualmente dentro da função.

---

## 10. Constantes de Domínio (`src/types/td.ts`)

- `SOURCE_OPTIONS`: fontes disponíveis para busca.
- `LEVEL_LABELS` / `LEVEL_COLORS`: rótulos e cores por dificuldade.
- `LETTERS`: `['A','B','C','D','E']`.
- `STUDENT_MAX_QUESTIONS = 10`, `TEACHER_MAX_QUESTIONS = 30`.
