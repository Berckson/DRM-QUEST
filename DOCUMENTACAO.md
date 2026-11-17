# DRM Quest — Documentação Técnica Completa

Ecossistema educacional oficial da EEEP Deputado Roberto Mesquita. Aplicação web para criação rápida de TDs (listas de exercícios) e simulados com questões reais de vestibulares, gerados por IA, com histórico persistente por usuário, monetização via plano PRO (Pix) e exportação em A4.

> Nome anterior do projeto: **LucsQuestions** (renomeado para **DRM Quest**).

---

## 1. Visão Geral

- **Objetivo**: permitir que um professor crie uma atividade completa em menos de 1 minuto e que o aluno pratique com questões reais de vestibular.
- **Público**: professores (uso completo e gratuito, mediante validação) e alunos (plano básico limitado e plano PRO vitalício).
- **Idioma da interface**: Português (Brasil).
- **Design**: Glassmorphism acadêmico — azul institucional, branco e cinza claro, transições suaves (Tailwind), ícones Lucide, cards com `glass-card`.

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
| Animações | framer-motion + canvas-confetti |
| Notificações | sonner (toasts) |
| Roteamento | react-router-dom 6 |
| Dados/cache | @tanstack/react-query |
| Formulários | react-hook-form + zod + @hookform/resolvers |
| Backend (Lovable Cloud) | Postgres + Auth + Realtime + Edge Functions (Deno) |
| SDK backend | @supabase/supabase-js 2 |
| Login social | @lovable.dev/cloud-auth-js (Google) |
| IA | Lovable AI Gateway — modelo `google/gemini-3-flash-preview` |
| Leitura de PDF | pdfjs-dist 4.8.69 |
| QR Code Pix | qrcode.react 4.2.0 |
| Exportação | `window.print()` (@media print A4), jspdf + html2canvas |
| Testes | Vitest 3 + Testing Library + jsdom |
| Lint | ESLint 9 + typescript-eslint |

### Dependências de produção (principais)
`react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `@tanstack/react-query`, `react-hook-form`, `zod`, `framer-motion`, `lucide-react`, `sonner`, `date-fns`, `pdfjs-dist`, `jspdf`, `html2canvas`, `qrcode.react`, `canvas-confetti`, `clsx`, `tailwind-merge`, `class-variance-authority`, `cmdk`, `vaul`, `recharts`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-day-picker`, `react-resizable-panels`, e o conjunto `@radix-ui/react-*`.

### Dependências de desenvolvimento
`vite`, `@vitejs/plugin-react-swc`, `typescript`, `typescript-eslint`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@eslint/js`, `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/typography`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/*` (inclui `@types/canvas-confetti`), `globals`, `lovable-tagger`.

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
    AuthPage.tsx           # login/cadastro (e-mail e Google) + validador de força de senha
    ProfileSetupModal.tsx  # escolha bloqueante do perfil (Aluno/Professor) no 1º acesso
    TeacherRequestForm.tsx # formulário de identificação docente (sem upload)
    PixCheckoutModal.tsx   # checkout PRO: QR Code, Pix Copia e Cola, status da solicitação
    HistorySidebar.tsx     # histórico persistente à esquerda (realtime)
    GeneratorForm.tsx      # formulário de geração (abas Web/PDF, filtros, gabarito)
    EnemSimulados.tsx      # cards das 4 áreas do ENEM
    ExamMode.tsx           # modo prova imersivo: cronômetro, navegação, desempenho
    RedacaoPanel.tsx       # card da plataforma externa de redação (link parceiro)
    StudentQuiz.tsx        # teste de conhecimento ativo do aluno
    TDCanvas.tsx           # folha timbrada A4 do professor (edição + impressão)
    TDPreview.tsx          # pré-visualização, cópia para Word, gabarito "só na tela"
    AboutFeedback.tsx      # seção "Sobre" + formulário de feedback
    Editable.tsx           # edição inline de qualquer texto
    NavLink.tsx
    ui/                    # componentes shadcn/ui
  hooks/
    useAuth.ts             # sessão, login e-mail/Google, logout
    useProfile.ts          # perfil, papel (user_type), is_pro, realtime
    useTDs.ts              # CRUD + realtime + chamada da edge function
    useProRequest.ts       # solicitações PRO (própria do usuário e fila do admin)
    useTeacherRequest.ts   # solicitação docente do usuário
    useSettings.ts         # app_settings: chave Pix e URL de redação (com fallbacks)
    use-mobile.tsx, use-toast.ts
  integrations/
    supabase/client.ts     # cliente do backend (auto-gerado)
    supabase/types.ts      # tipos do banco (auto-gerado)
    lovable/index.ts       # OAuth Google (auto-gerado)
  lib/
    pdfExtract.ts          # extração de texto de PDF modelo (pdfjs, primeiras páginas)
    pix.ts                 # montagem da string Pix BR Code (estático, R$ 24,99)
    sanitize.ts            # sanitização de entradas (anti-XSS/injeção em prompts)
    passwordStrength.ts    # validador de força de senha
    utils.ts
  pages/
    Index.tsx              # fluxo principal (abas do aluno / gerador do professor)
    Admin.tsx              # painel master do administrador (/admin)
    NotFound.tsx
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
| id | uuid PK | referencia `auth.users` (ON DELETE CASCADE) |
| email | text | |
| full_name | text | |
| role | text | `Professor` ou `Aluno` (legado, compatibilidade) |
| user_type | text | `ALUNO` \| `PROFESSOR` \| `ADMIN` |
| is_pro | boolean | plano PRO — **só o ADMIN pode alterar** (trigger) |
| school | text | padrão "EEEP Deputado Roberto Mesquita" |
| phone | text | |
| created_at / updated_at | timestamptz | |

RLS: usuário só lê/insere/atualiza a própria linha (`auth.uid() = id`). DELETE negado.
Trigger `prevent_pro_self_grant`: bloqueia autoelevação de `is_pro` — apenas ADMIN libera o PRO.
Trigger `prevent_profile_escalation`: bloqueia troca de `user_type` pelo próprio usuário.

### `user_roles`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | referencia `auth.users` (ON DELETE CASCADE) |
| role | app_role | enum: `ADMIN` \| `PROFESSOR` \| `ALUNO` |

Tabela protegida de papéis — privilégios nunca derivam de metadata editável pelo usuário.
Função `has_role(user_id, role)` (`SECURITY DEFINER`) usada nas políticas RLS de admin.

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

RLS: todas as operações restritas a `auth.uid() = user_id`.

### `teacher_requests` (validação docente)
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | solicitante |
| full_name, school, institutional_email, phone | text | dados cadastrais |
| status | text | `PENDENTE` \| `APROVADO` \| `RECUSADO` |
| created_at / updated_at | timestamptz | |

RLS: usuário cria/lê a própria solicitação; ADMIN lê/atualiza todas (via `has_role`).
RPC `review_teacher_request(request_id, approve)`: só ADMIN; ao aprovar, muda a role para PROFESSOR.

### `pro_requests` (auditoria de pagamentos Pix)
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | solicitante |
| full_name, email | text | identificação |
| amount | numeric | R$ 24,99 |
| pix_key | text | chave usada no pagamento |
| status | text | `PENDENTE` \| `APROVADO` \| `RECUSADO` |
| created_at / updated_at | timestamptz | |

RLS: usuário cria/lê a própria solicitação; ADMIN lê/atualiza todas.
RPC `review_pro_request(request_id, approve)`: só ADMIN; ao aprovar, seta `is_pro = true` no perfil.
**O clique em "Já paguei" nunca libera o PRO diretamente** — registra a solicitação e aguarda aprovação manual.

### `feedbacks`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | autor |
| name, email, message | text | campos sanitizados |
| created_at | timestamptz | |

RLS: inserção/leitura restritas a `auth.uid() = user_id`.

### `app_settings`
| Coluna | Tipo | Notas |
|---|---|---|
| key | text PK | ex: `pix_key`, `redacao_url` |
| value | text | |
| updated_at | timestamptz | |

RLS: leitura para autenticados; escrita apenas ADMIN.
Valores atuais: `pix_key` = `965a1162-2e88-4085-b8e1-badc9a46907c` (chave aleatória de fallback); `redacao_url` = `https://www.estudeadistancia.com/redacao-enem`.

### `activities` (tabela legada da primeira versão)
Mesma proteção por `user_id`; mantida por compatibilidade histórica.

### Funções de banco
- `handle_new_user()` — trigger `SECURITY DEFINER` que cria o `profiles` no cadastro.
- `update_updated_at_column()` — trigger de atualização de timestamp.
- `has_role(user_id, role)` — checagem de papel para RLS de admin.
- `review_teacher_request(...)` / `review_pro_request(...)` — RPCs exclusivas de ADMIN.
- `prevent_profile_escalation()` / `prevent_pro_self_grant()` — triggers anti-escalada.
- EXECUTE das funções sensíveis revogado de `anon`; SELECT de `anon` revogado em todas as tabelas.

---

## 5. Autenticação e Perfis

- **Métodos**: e-mail/senha e Google (OAuth via Lovable Cloud, `redirect_uri = window.location.origin`).
- **Sessão**: `onAuthStateChange` + `getSession` em `useAuth`, persistida em `localStorage`.
- **Senha forte obrigatória no cadastro**: mínimo 8 caracteres com maiúsculas, minúsculas, números e caracteres especiais, com indicador visual de progresso (`passwordStrength.ts`).
- **Primeiro acesso**: `ProfileSetupModal` bloqueante obriga a escolha do papel:
  - **Aluno** → acesso imediato.
  - **Professor** → `TeacherRequestForm` obrigatório (nome completo, escola — padrão "EEEP Deputado Roberto Mesquita" editável, e-mail institucional, telefone/WhatsApp). Fica `PENDENTE` com aviso elegante "Acesso docente em análise" até aprovação no painel Admin.

### Regras de negócio por perfil
| Regra | Aluno básico | Aluno PRO | Professor | Admin |
|---|---|---|---|---|
| Máx. de questões | 10 | 30 | 30 | 30 |
| Cabeçalho escolar | oculto ("Dashboard de Estudos") | oculto | folha timbrada A4 | — |
| Gabarito | simples (matriz de letras) | comentado detalhado | 4 modos (simples, folha, comentado, só na tela) | — |
| Modo "espelhar modelo" (PDF) | bloqueado (badge PRO) | sim | sim | — |
| Simulados ENEM | sim (até 10 questões) | sim (até 30) | — | — |
| Duas colunas para impressão | — | — | sim | — |
| Painel /admin | — | — | — | sim |

Os limites são aplicados **também no servidor** (edge function), não apenas na interface.

### Monetização — plano PRO (R$ 24,99 vitalício)
1. Aluno clica em "Seja PRO - R$ 24,99" → `PixCheckoutModal` (Glassmorphism).
2. `pix.ts` monta a string **Pix BR Code estático** (valor fixo `24.99`, descrição "DRM Quest Pro") com a chave de `app_settings.pix_key` (fallback: chave aleatória `965a1162-2e88-4085-b8e1-badc9a46907c`).
3. QR Code renderizado via `qrcode.react`; área "Pix Copia e Cola" com botão "Copiar Código Pix" e feedback "Copiado!".
4. "Já realizei o pagamento" → cria registro `PENDENTE` em `pro_requests` e exibe "Aguardando confirmação do administrador" (banner + botão "PRO em análise").
5. Admin aprova no painel → RPC `review_pro_request` seta `is_pro = true`; o perfil do aluno atualiza em tempo real (Realtime em `profiles`).

---

## 6. Painel do Administrador (`/admin`)

Rota protegida: acesso apenas com role `ADMIN` (verificada via `user_roles` + RLS).

Funcionalidades:
- **Solicitações docentes**: lista em tempo real das `teacher_requests` pendentes com dados cadastrais; botões "Aprovar" (concede role PROFESSOR via RPC) e "Recusar".
- **Pagamentos PRO**: fila de `pro_requests` pendentes para conferência do Pix; botões "Liberar PRO" (seta `is_pro`) e "Recusar", com histórico das decisões.
- **Chave Pix**: gerenciamento da chave geral da plataforma (`app_settings.pix_key`).

Administradora atual: bercksonthierry@gmail.com.

---

## 7. Inteligência Artificial

**Edge Function**: `supabase/functions/generate-activity/index.ts` (Deno).

Fluxo:
1. Frontend (`useTDs.generateTD`) envia POST com o token do usuário.
2. A função valida o JWT (`auth.getClaims`), lê o perfil e aplica o limite de questões pelo papel (10/30/30).
3. Sanitiza todas as entradas no servidor (anti-injeção de prompt).
4. Monta o prompt e chama `https://ai.gateway.lovable.dev/v1/chat/completions` com `google/gemini-3-flash-preview`.
5. Normaliza a resposta (sempre 5 alternativas A–E, letra correta válida, nível válido).
6. Insere em `generated_tds` e devolve o registro criado.

### Regras invioláveis do prompt (motor anti-alucinação)
- Somente questões **reais** de exames brasileiros (ENEM, FUVEST, ITA, UNICAMP, UNESP...).
- Enunciado começa com banca e ano entre colchetes: `[ENEM 2023] ...`.
- Exatamente 5 alternativas por questão (A–E).
- Classificação automática em `facil` / `media` / `dificil` (propriedade `difficulty` no JSON).
- Justificativa passo a passo (gabarito comentado).
- Saída em JSON puro, sem markdown — garante que "Copiar para Word" funcione.

### Trava de banca
Se a fonte escolhida for ENEM **ou** o modo for PDF (espelho), o modelo é **proibido** de misturar outras bancas (FUVEST/ITA/UNICAMP/UNESP): todas as questões devem ser do ENEM, com tag no formato exato `[ENEM - Ano]`.

### Suporte visual obrigatório
Quando o tema ou o PDF espelho envolver gráficos, tabelas conceituais, circuitos, figuras geométricas, experimentos ilustrados ou mapas, a IA **não pode ignorar** o elemento visual: deve gerar um bloco `SUPORTE VISUAL:` dentro do enunciado descrevendo o elemento com precisão (eixos, valores, unidades, escalas, ligações do circuito, medidas) ou uma tabela limpa em Markdown, sem omitir informação numérica.

### Modos de geração
- **IA + Web** (Aba 1): tema + fonte (`Vestibulares Reais/ENEM`, `Toda Matéria`, `Brasil Escola`, `Todas as Fontes`) + foco de dificuldade opcional (`Misturado`, `Foco em Fáceis`, `Foco em Médias`, `Foco em Difíceis`).
- **Espelhar modelo (PDF)** (Aba 2, bloqueada para aluno básico): `pdfExtract.ts` extrai texto apenas das primeiras páginas (limite de caracteres para não estourar tokens); o documento serve **estritamente como molde estrutural** — a IA conta as questões do PDF e gera exatamente a mesma quantidade para o novo tema, com resumo teórico proporcional.

Erros tratados: 401 (não autorizado), 400 (tema obrigatório), 429 (limite de requisições), 402 (créditos de IA esgotados), 500 (falha de parse/gravação).

---

## 8. Interface e Fluxo de Uso

### Professor
1. Login → validação docente → acesso liberado.
2. Sidebar esquerda: histórico em tempo real (Realtime Postgres Changes), reabrir com 1 clique, excluir.
3. `GeneratorForm`: abas "✨ Usar IA + Fontes da Web" e "📄 Espelhar Modelo (Upload de PDF)"; cabeçalho (escola, disciplina, professor, turma); seletor de gabarito com 3 modos de saída: "Apenas Folha de Respostas", "Gabarito Comentado no PDF", "Apenas Ler na Tela" (justificativas em painel interativo, ocultas do documento via `@media print`).
4. `TDCanvas`: folha timbrada A4 com bordas finas, nome da escola em input editável sem bordas, campos Nome do Aluno/Turma/Data/Professor/Disciplina; **duas colunas** (`columns-2 gap-6 space-y-4`) com linha vertical sutil, `break-inside-avoid` em cada questão.
5. Edição inline (`Editable`) de teoria e questões; botão para excluir questões antes de exportar; "Copiar Questão" (enunciado + alternativas).
6. Exportação: "Copiar para Word" (texto limpo) e "Exportar PDF / Imprimir" via `window.print()` — `@media print` oculta sidebars, menus e botões (layout A4 limpo).
7. Seção "Sobre o DRM Quest" com proposta pedagógica + formulário de feedback (`feedbacks`).

### Aluno (abas)
1. **Gerador**: mesmo formulário, sem cabeçalho escolar, limitado a 10 questões (30 no PRO), gabarito simples.
2. **Simulados ENEM** (`EnemSimulados`): 4 cards de alta conversão — 🧪 Ciências da Natureza, 🏛️ Ciências Humanas, 📚 Linguagens e Códigos, 📐 Matemática — com contador de questões (5–10 free / 5–30 PRO) e botão "Iniciar Simulado".
3. **Modo Prova** (`ExamMode`): tela imersiva com **cronômetro** no topo (3 min por questão), barra de progresso, grade de navegação com **marcação para revisão**, seleção de alternativas A–E na tela.
4. **Painel de Desempenho** (pós-envio): tempo total registrado, acertos/erros, aproveitamento; **gabarito comentado interativo** alternativa por alternativa — PRO vê a explicação completa da IA; básico vê apenas a letra correta com botão de upgrade.
5. **Redação** (`RedacaoPanel`): card institucional com as 5 competências do ENEM e botão "Acessar Plataforma Externa de Redação" abrindo o portal parceiro em nova aba (`target="_blank"`, URL de `app_settings.redacao_url`).

---

## 9. Segurança

- RLS habilitado em **todas** as tabelas públicas, com políticas por `auth.uid() = user_id`; ações administrativas protegidas por `has_role` (tabela `user_roles`, nunca metadata editável).
- GRANTs explícitos por papel; SELECT de `anon` revogado em todas as tabelas; EXECUTE de funções sensíveis revogado de `anon`.
- Triggers anti-escalada: `prevent_profile_escalation` (user_type) e `prevent_pro_self_grant` (is_pro) — nenhum usuário eleva o próprio privilégio.
- Papel do usuário lido do banco, nunca de `localStorage`; limites de questões revalidados na edge function.
- Sanitização estrita de entradas (`sanitize.ts`) no cliente **e** no servidor — anti-XSS e anti-injeção de prompt.
- Validador de força de senha no cadastro (8+ caracteres, maiúsculas, minúsculas, números, especiais).
- Tratamento seguro de erros nativos do backend (rate limiting, credenciais inválidas) sem vazar detalhes internos.
- Chave de IA (`LOVABLE_API_KEY`) vive apenas no servidor; o cliente usa somente a chave publicável (anon key).
- Avisos restantes do linter de segurança (GraphQL exposto a `authenticated`, funções `SECURITY DEFINER` executáveis por `authenticated`) são intencionais: usuários logados só enxergam os próprios dados.

---

## 10. Configuração de Ambiente

Variáveis (arquivo `.env`, geradas automaticamente):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Segredos do servidor: `LOVABLE_API_KEY` (IA), além das variáveis internas do backend.

`supabase/config.toml`: `[functions.generate-activity] verify_jwt = false` — a validação do token é feita manualmente dentro da função.

---

## 11. Constantes de Domínio (`src/types/td.ts`)

- `SOURCE_OPTIONS`: fontes disponíveis para busca.
- `DIFFICULTY_FOCUS_OPTIONS`: `misturado` / `facil` / `media` / `dificil`.
- `LEVEL_LABELS` / `LEVEL_COLORS`: rótulos e cores por dificuldade (verde/amarelo/vermelho).
- `LETTERS`: `['A','B','C','D','E']`.
- `ENEM_AREAS`: as 4 áreas do ENEM (id, emoji, título, matérias, tópico enviado à IA, cor de destaque).
- `STUDENT_MAX_QUESTIONS = 10`, `STUDENT_PRO_MAX_QUESTIONS = 30`, `TEACHER_MAX_QUESTIONS = 30`.
- Convenções de banco: status `PENDENTE`/`APROVADO`/`RECUSADO`; `difficultyFocus` em minúsculas (`misturado`).
