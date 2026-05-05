# HabitFlow — Gerenciador de Hábitos

App web de rastreamento de hábitos com visual dark editorial, salvamento local e sem dependências externas.

---

## Funcionalidades originais

- Criar, editar e deletar hábitos com emoji e cor personalizados
- Marcar hábitos como concluídos no dia atual
- Streak global e streak individual por hábito
- Calendário de histórico mensal com níveis de completude
- Estatísticas por hábito (dias completos, % de consistência, streak)
- Drag & drop para reordenar hábitos
- Exportar e importar backup em JSON
- Confetti ao completar 100% dos hábitos no dia
- Toast de notificações inline

---

## Novidades adicionadas

### ☀ Modo Claro / Escuro
Botão na barra lateral alterna entre tema escuro (padrão) e tema claro. A preferência é salva no `localStorage` e restaurada automaticamente na próxima visita.

### 💬 Frase motivacional do dia
Uma frase de motivação é exibida na sidebar, rotacionando diariamente de forma determinística (baseada na data). Sem requisição de rede — funciona offline.

### 📅 Frequência semanal por hábito
Ao criar ou editar um hábito, é possível definir quantas vezes por semana ele deve ser realizado (1× a 7× / Diário). A frequência aparece como badge no card do hábito na view "Hoje".

### 📝 Anotação pessoal por hábito
Campo opcional de até 120 caracteres para registrar o motivo ou intenção por trás de cada hábito. A anotação aparece discretamente abaixo do nome do hábito nos cards.

---

## Como usar

Abra o `index.html` diretamente no navegador — não precisa de servidor.  
Todos os dados ficam no `localStorage` do navegador.

---

## Estrutura de arquivos

```
habitflow/
├── index.html        # Estrutura e markup
├── style.css         # Estilos + tema claro/escuro
├── app.js            # Lógica completa
└── README.md         # Este arquivo
```
