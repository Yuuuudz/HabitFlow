# 📋 HabitFlow — Documentação do Projeto

> Gerenciador de Hábitos com HTML, CSS e JavaScript puro  
> Sem frameworks, sem dependências — só a web padrão.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Estrutura de Arquivos](#2-estrutura-de-arquivos)
3. [Como Executar](#3-como-executar)
4. [Funcionalidades](#4-funcionalidades)
5. [Arquitetura do Código](#5-arquitetura-do-código)
6. [Persistência de Dados](#6-persistência-de-dados)
7. [Detalhamento dos Módulos (app.js)](#7-detalhamento-dos-módulos-appjs)
8. [Estilização (style.css)](#8-estilização-stylecss)
9. [Estrutura HTML](#9-estrutura-html)
10. [Fluxo de Dados](#10-fluxo-de-dados)
11. [Como Expandir o Projeto](#11-como-expandir-o-projeto)

---

## 1. Visão Geral

**HabitFlow** é um aplicativo web de página única (*SPA-like*) que permite ao usuário criar hábitos diários, marcar quais foram cumpridos, acompanhar o histórico num calendário e visualizar estatísticas de consistência.

### Tecnologias usadas

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura e semântica da página |
| CSS3 | Estilização, animações, layout (Flexbox e Grid) |
| JavaScript (ES6+) | Lógica, manipulação do DOM, eventos |
| localStorage | Persistência dos dados no navegador |
| Google Fonts | Tipografia (Syne + DM Mono) |

### Diferenciais do projeto

- **Zero dependências** — nenhuma biblioteca externa de JS
- **Design dark editorial** — identidade visual coesa e profissional
- **Dados 100% locais** — nada é enviado a nenhum servidor
- **Streak automático** — calculado em tempo real com base no histórico

---

## 2. Estrutura de Arquivos

```
habit-tracker/
│
├── index.html       # Estrutura da interface (única página)
├── style.css        # Todo o visual: layout, cores, animações
├── app.js           # Toda a lógica: estado, eventos, localStorage
└── DOCUMENTACAO.md  # Este arquivo
```

O projeto segue a separação clássica de responsabilidades:
- **HTML** → O quê existe na tela
- **CSS** → Como parece
- **JS** → Como se comporta

---

## 3. Como Executar

Não é necessário instalar nada.

1. Faça o download dos três arquivos (`index.html`, `style.css`, `app.js`) na mesma pasta
2. Abra o arquivo `index.html` no seu navegador (Chrome, Firefox, Edge, Safari)
3. Pronto — o app funciona localmente

> ⚠️ **Importante:** Os três arquivos precisam estar na **mesma pasta**. O `index.html` referencia os outros dois pelo caminho relativo.

---

## 4. Funcionalidades

### 4.1 Criar hábito

O usuário clica em **+ Novo Hábito**, preenche:
- **Nome** (até 40 caracteres)
- **Ícone** (escolhe entre 12 emojis)
- **Cor** (escolhe entre 8 cores predefinidas)

Ao salvar, o hábito aparece imediatamente na lista do dia.

### 4.2 Marcar hábito como concluído

Cada card tem um botão circular. Ao clicar:
- O card muda visualmente (fundo alterado, borda destacada, emoji animado)
- A barra de progresso se atualiza
- O dado é salvo no `localStorage`

Clicar novamente **desmarca** o hábito (toggle).

### 4.3 Barra de progresso

Exibe quantos hábitos foram concluídos no dia atual e a porcentagem. Atualiza em tempo real a cada toggle.

### 4.4 Streak

Dois tipos de streak são calculados:
- **Streak global** (sidebar): dias consecutivos em que *todos* os hábitos foram concluídos
- **Streak individual** (cada card e estatísticas): dias consecutivos em que *aquele hábito específico* foi marcado

### 4.5 Histórico (calendário)

A aba **Histórico** exibe um calendário mensal navegável. Cada dia é colorido com base na conclusão:
- ⬛ Cinza escuro: nenhum hábito completado
- 🟨 Amarelo claro: conclusão parcial
- 🟡 Amarelo forte: todos os hábitos completados

### 4.6 Estatísticas

A aba **Estatísticas** exibe um card por hábito com:
- Quantidade de dias completados desde a criação
- Percentual de consistência
- Barra de progresso proporcional
- Streak atual

### 4.7 Remover hábito

O botão ✕ aparece ao passar o mouse sobre um card. Ao remover, o hábito e **todo o seu histórico de completions** são apagados.

---

## 5. Arquitetura do Código

### Estado global (app.js)

O estado da aplicação vive em duas variáveis principais:

```js
let habits = [];
// Array de objetos com os hábitos cadastrados.
// Cada elemento: { id, name, emoji, color, createdAt }

let completions = {};
// Dicionário: chave = data ISO (YYYY-MM-DD), valor = array de IDs de hábitos concluídos naquele dia
// Exemplo: { "2025-04-22": ["abc123", "xyz789"] }
```

Essas variáveis são o "banco de dados" em memória. Toda alteração é imediatamente salva no `localStorage` via `saveData()`.

### Fluxo de operação padrão

```
Ação do usuário
    ↓
Event listener captura o evento
    ↓
Função de lógica altera o estado (habits / completions)
    ↓
saveData() persiste no localStorage
    ↓
Função de renderização atualiza o DOM
```

---

## 6. Persistência de Dados

### Chaves no localStorage

| Chave | Conteúdo |
|---|---|
| `habitflow_habits` | JSON com o array de hábitos |
| `habitflow_completions` | JSON com o objeto de conclusões por dia |

### Leitura

```js
function loadData() {
  habits = JSON.parse(localStorage.getItem('habitflow_habits') || '[]');
  completions = JSON.parse(localStorage.getItem('habitflow_completions') || '{}');
}
```

O `|| '[]'` e `|| '{}'` garantem um valor padrão seguro caso o item não exista ainda (primeiro acesso).

### Escrita

```js
function saveData() {
  localStorage.setItem('habitflow_habits', JSON.stringify(habits));
  localStorage.setItem('habitflow_completions', JSON.stringify(completions));
}
```

`JSON.stringify` converte os objetos JS para texto antes de salvar, e `JSON.parse` faz o caminho inverso ao carregar.

### Estrutura de dados

```json
// habitflow_habits
[
  {
    "id": "lp3k2abc",
    "name": "Beber 2L de água",
    "emoji": "💧",
    "color": "#4FC3F7",
    "createdAt": "2025-04-20"
  }
]

// habitflow_completions
{
  "2025-04-20": ["lp3k2abc"],
  "2025-04-21": ["lp3k2abc"],
  "2025-04-22": []
}
```

---

## 7. Detalhamento dos Módulos (app.js)

### 7.1 Utilitários

#### `todayISO() → string`
Retorna a data de hoje no formato `YYYY-MM-DD` usando o horário local do navegador (não UTC, para evitar problemas de fuso).

```js
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

> Por que não usar `new Date().toISOString()`? Porque esse método retorna a data em UTC, e dependendo do fuso horário do usuário, pode retornar o dia errado (ex: às 22h no Brasil, UTC já está no dia seguinte).

#### `uid() → string`
Gera um ID simples e único combinando timestamp base-36 com um trecho aleatório.

```js
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
```

#### `escapeHtml(str) → string`
Substitui caracteres especiais HTML (`<`, `>`, `&`) pelas entidades correspondentes, evitando injeção de HTML no DOM ao usar `innerHTML`.

---

### 7.2 Cálculo de Streak

#### `calcStreak() → number`
Itera para trás a partir de hoje, verificando se **todos** os hábitos foram concluídos em cada dia. Para no primeiro dia incompleto.

```js
function calcStreak() {
  if (!habits.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = /* formata data */;
    const done = completions[iso] || [];
    const allDone = habits.every(h => done.includes(h.id));
    if (allDone) {
      streak++;
    } else if (i > 0) {
      break; // Quebrou — para de contar
    }
  }
  return streak;
}
```

> O `else if (i > 0)` garante que, se hoje ainda não foi completado (mas ontem foi), o streak ainda conta o período anterior sem zerar imediatamente.

#### `calcHabitStreak(habitId) → number`
Mesma lógica, mas verifica apenas um hábito específico.

---

### 7.3 Renderização

#### `renderHabits()`
Limpa os cards existentes no `#habitsList` e reconstrói cada um com base no array `habits`. Para cada hábito:
- Verifica se foi concluído hoje
- Aplica a classe `done` condicionalmente
- Insere o HTML via `innerHTML` (com escape de dados do usuário)
- Adiciona os event listeners de toggle e delete

#### `renderCalendar()`
Monta o grid do mês atual:
1. Calcula o dia da semana do primeiro dia do mês (para os espaços vazios iniciais)
2. Para cada dia, verifica o nível de conclusão (0, 1 ou 2)
3. Cria um `div` com a classe CSS correspondente

#### `renderStats()`
Para cada hábito, calcula a consistência iterando todos os dias desde `createdAt` até hoje. Cria um card com a barra proporcional.

---

### 7.4 Eventos principais

| Evento | Elemento | Função chamada |
|---|---|---|
| `click` | `#openModal` | `openModal()` |
| `click` | `#saveHabit` | `saveHabit()` |
| `click` | `#closeModal` / `#cancelModal` | `closeModal()` |
| `click` | `.habit-check` | `toggleHabit(id)` |
| `click` | `.habit-delete` | `deleteHabit(id)` |
| `click` | `.nav-btn` | `switchView(view)` |
| `click` | `#prevMonth` / `#nextMonth` | Atualiza `calendarMonth` e chama `renderCalendar()` |
| `keydown` Enter | `#habitName` | `saveHabit()` |
| `keydown` Escape | `#habitName` | `closeModal()` |

---

### 7.5 Sistema de Toast

```js
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}
```

O `clearTimeout` antes de recriar o timer evita que toasts consecutivos se sobreponham ou desapareçam prematuramente. A animação de entrada/saída é toda feita via CSS (transform + opacity).

---

## 8. Estilização (style.css)

### Sistema de cores (variáveis CSS)

```css
:root {
  --bg: #0d0d0d;          /* Fundo geral */
  --surface: #161616;     /* Superfícies de cards/sidebar */
  --surface2: #1e1e1e;    /* Superfícies secundárias */
  --border: #2a2a2a;      /* Bordas suaves */
  --text: #f0ece4;        /* Texto principal */
  --text-muted: #6b6b6b;  /* Texto secundário */
  --accent: #e8ff47;      /* Amarelo limão — cor de destaque */
}
```

O uso de variáveis CSS permite trocar todo o tema facilmente alterando apenas o `:root`.

### Cor dinâmica dos hábitos

Cada card define sua própria cor via propriedade CSS customizada:

```js
card.style.setProperty('--habit-color', habit.color);
```

O CSS então usa essa variável em múltiplos lugares do card:

```css
.habit-card::before  { background: var(--habit-color, var(--accent)); }
.habit-check         { /* usa --habit-color no hover e estado done */ }
.stat-bar-fill       { background: var(--habit-color, var(--accent)); }
```

O `var(--habit-color, var(--accent))` é um fallback: se a variável não existir, usa o amarelo padrão.

### Animações principais

| Animação | Elemento | Efeito |
|---|---|---|
| `fadeIn` | `.view.active` | Entrada suave das views |
| `bounceEmoji` | `.habit-card.done .habit-emoji` | Quique do emoji ao marcar |
| `spin` | `.logo-icon` | Rotação infinita do ícone do logo |
| Transition `width` | `.progress-fill` | Barra de progresso fluida |
| Transform + opacity | `.modal` | Entrada/saída do modal |

### Layout

- **Sidebar** → `position: fixed` + `width: var(--sidebar-w)` (240px)
- **Main** → `margin-left: var(--sidebar-w)` para compensar a sidebar
- **Habits list** → `display: flex; flex-direction: column`
- **Stats grid** → `display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`
- **Calendar** → `display: grid; grid-template-columns: repeat(7, 1fr)`

---

## 9. Estrutura HTML

O `index.html` é dividido em:

```
<body>
│
├── .noise               → Overlay de textura de ruído (efeito visual)
│
├── <aside.sidebar>      → Navegação lateral fixa
│   ├── .logo
│   ├── <nav.nav>        → Botões de navegação entre views
│   ├── .sidebar-date    → Data de hoje
│   └── .streak-card     → Streak global
│
├── <main.main>          → Área de conteúdo principal
│   ├── #view-today      → Lista de hábitos do dia
│   ├── #view-history    → Calendário mensal
│   └── #view-stats      → Cards de estatísticas
│
├── .modal-overlay       → Modal de criação de hábito
│   └── .modal
│       ├── input de nome
│       ├── emoji picker
│       └── color picker
│
└── .toast               → Notificação temporária
```

As views são mostradas/escondidas via `display: none` / `display: block` + classe `active`, sem nenhuma troca de página real.

---

## 10. Fluxo de Dados

### Criando um hábito

```
Usuário clica "+ Novo Hábito"
    → openModal() exibe o modal
    → Usuário preenche nome, emoji, cor
    → Clica "Criar Hábito"
    → saveHabit() cria objeto { id, name, emoji, color, createdAt }
    → habits.push(novoHabito)
    → saveData() grava no localStorage
    → closeModal() fecha o modal
    → renderHabits() reconstrói a lista no DOM
    → renderStats() atualiza os cards de stats
```

### Marcando um hábito

```
Usuário clica no botão ✓ de um card
    → toggleHabit(habitId) é chamado
    → Obtém a data de hoje: todayISO()
    → Se ID não está em completions[hoje]: adiciona
    → Se ID já está: remove (toggle)
    → saveData() persiste
    → renderHabits() reconstrói os cards com novo estado
    → updateProgress() recalcula barra + streak
```

---

## 11. Como Expandir o Projeto

Aqui estão sugestões documentadas de como adicionar novas funcionalidades:

### Notificações diárias

Use a **Notifications API** do navegador para lembrar o usuário de marcar os hábitos:

```js
// Solicitar permissão
Notification.requestPermission();

// Disparar notificação
new Notification('HabitFlow', { body: 'Não esqueça de marcar seus hábitos hoje! 🔥' });
```

Para agendar, combine com `setTimeout` calculando o tempo até o horário desejado.

### Exportar dados

Permita ao usuário baixar seus dados como JSON:

```js
function exportData() {
  const data = { habits, completions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'habitflow-backup.json';
  a.click();
}
```

### Meta semanal por hábito

Adicione uma propriedade `weeklyGoal` (de 1 a 7 dias por semana) ao objeto de hábito. No cálculo de consistência, compare o total de conclusões da semana com a meta.

### Modo claro (Light Theme)

Crie uma segunda definição de variáveis CSS:

```css
body.light {
  --bg: #f5f4f0;
  --surface: #ffffff;
  --text: #1a1a1a;
  /* ... */
}
```

Adicione um botão que alterne a classe `light` no `<body>` e salve a preferência no `localStorage`.

### Hábitos com frequência

Permita que um hábito seja configurado para X dias por semana (não necessariamente todos os dias), ajustando o cálculo de streak para ignorar dias em que o hábito não era esperado.

---

*Documentação escrita para o projeto HabitFlow — HTML/CSS/JS puro.*
