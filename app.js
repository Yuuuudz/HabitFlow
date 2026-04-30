/**
 * HabitFlow — app.js
 * Gerenciador de Hábitos com localStorage
 */

// ============================================================
// ESTADO GLOBAL
// ============================================================

/** @type {Array<{id: string, name: string, emoji: string, color: string, createdAt: string}>} */
let habits = [];

/** @type {Object<string, string[]>} Mapa de data ISO -> array de IDs de hábitos concluídos */
let completions = {};

// Data sendo navegada no calendário
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

// Seleções no modal
let selectedEmoji = '💧';
let selectedColor = '#FF6B6B';

// ============================================================
// UTILITÁRIOS
// ============================================================

/**
 * Retorna a data de hoje no formato YYYY-MM-DD (local)
 * @returns {string}
 */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Formata uma data ISO para exibição legível em pt-BR
 * @param {string} iso
 * @returns {string}
 */
function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

/**
 * Gera um ID único simples
 * @returns {string}
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ============================================================
// PERSISTÊNCIA (localStorage)
// ============================================================

function saveData() {
  localStorage.setItem('habitflow_habits', JSON.stringify(habits));
  localStorage.setItem('habitflow_completions', JSON.stringify(completions));
}

function loadData() {
  try {
    habits = JSON.parse(localStorage.getItem('habitflow_habits') || '[]');
    completions = JSON.parse(localStorage.getItem('habitflow_completions') || '{}');
  } catch {
    habits = [];
    completions = {};
  }
}

// ============================================================
// STREAK — calcula dias consecutivos com todos hábitos ok
// ============================================================

/**
 * Calcula o streak atual (dias consecutivos com 100% de conclusão)
 * @returns {number}
 */
function calcStreak() {
  if (!habits.length) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const done = completions[iso] || [];
    const allDone = habits.every(h => done.includes(h.id));

    if (allDone) {
      streak++;
    } else if (i > 0) {
      // Quebrou o streak (não conta o dia de hoje se ainda não completou)
      break;
    }
  }
  return streak;
}

// ============================================================
// PROGRESSO DO DIA
// ============================================================

function updateProgress() {
  const today = todayISO();
  const done = completions[today] || [];
  const total = habits.length;
  const completed = habits.filter(h => done.includes(h.id)).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('progressLabel').textContent =
    `${completed} de ${total} hábito${total !== 1 ? 's' : ''} concluído${completed !== 1 ? 's' : ''}`;
  document.getElementById('progressPercent').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('streakCount').textContent = calcStreak();
}

// ============================================================
// RENDERIZAÇÃO — VIEW TODAY
// ============================================================

function renderHabits() {
  const container = document.getElementById('habitsList');
  const today = todayISO();
  const done = completions[today] || [];

  // Limpa apenas os cards, mantém o empty-state no DOM
  container.querySelectorAll('.habit-card').forEach(el => el.remove());

  const emptyState = document.getElementById('emptyState');
  emptyState.style.display = habits.length === 0 ? 'block' : 'none';

  habits.forEach(habit => {
    const isDone = done.includes(habit.id);
    const card = document.createElement('div');
    card.className = `habit-card${isDone ? ' done' : ''}`;
    card.style.setProperty('--habit-color', habit.color);
    card.dataset.id = habit.id;

    // Calcula streak individual do hábito
    const habitStreak = calcHabitStreak(habit.id);

    card.innerHTML = `
      <span class="habit-emoji">${habit.emoji}</span>
      <div class="habit-info">
        <div class="habit-name">${escapeHtml(habit.name)}</div>
        <div class="habit-meta">🔥 ${habitStreak} dias — criado em ${formatCreated(habit.createdAt)}</div>
      </div>
      <div class="habit-actions">
        <button class="habit-check" title="${isDone ? 'Desmarcar' : 'Marcar como concluído'}" style="--habit-color:${habit.color}">
          ${isDone ? '✓' : ''}
        </button>
        <button class="habit-delete" title="Remover hábito">✕</button>
      </div>
    `;

    // Toggle conclusão
    card.querySelector('.habit-check').addEventListener('click', () => toggleHabit(habit.id));

    // Deletar
    card.querySelector('.habit-delete').addEventListener('click', () => deleteHabit(habit.id));

    container.appendChild(card);
  });

  updateProgress();
}

/**
 * Escapa HTML para evitar XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Formata a data de criação de forma curta
 * @param {string} iso
 * @returns {string}
 */
function formatCreated(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Calcula streak individual de um hábito
 * @param {string} habitId
 * @returns {number}
 */
function calcHabitStreak(habitId) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if ((completions[iso] || []).includes(habitId)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

// ============================================================
// TOGGLE / DELETE HÁBITO
// ============================================================

/**
 * Marca ou desmarca um hábito para hoje
 * @param {string} habitId
 */
function toggleHabit(habitId) {
  const today = todayISO();
  if (!completions[today]) completions[today] = [];

  const idx = completions[today].indexOf(habitId);
  if (idx === -1) {
    completions[today].push(habitId);
    showToast('✓ Hábito marcado!');
  } else {
    completions[today].splice(idx, 1);
    showToast('Hábito desmarcado.');
  }

  saveData();
  renderHabits();
}

/**
 * Remove um hábito permanentemente
 * @param {string} habitId
 */
function deleteHabit(habitId) {
  habits = habits.filter(h => h.id !== habitId);

  // Remove completions deste hábito em todos os dias
  for (const day in completions) {
    completions[day] = completions[day].filter(id => id !== habitId);
  }

  saveData();
  renderHabits();
  renderStats();
  showToast('Hábito removido.');
}

// ============================================================
// MODAL — CRIAR HÁBITO
// ============================================================

function openModal() {
  document.getElementById('habitName').value = '';
  // Reseta seleções
  document.querySelectorAll('.emoji-picker span').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.emoji-picker [data-emoji="💧"]`).classList.add('selected');
  selectedEmoji = '💧';

  document.querySelectorAll('.color-picker span').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.color-picker [data-color="#FF6B6B"]`).classList.add('selected');
  selectedColor = '#FF6B6B';

  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('habitName').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function saveHabit() {
  const name = document.getElementById('habitName').value.trim();
  if (!name) {
    document.getElementById('habitName').focus();
    showToast('⚠️ Digite um nome para o hábito.');
    return;
  }

  const habit = {
    id: uid(),
    name,
    emoji: selectedEmoji,
    color: selectedColor,
    createdAt: todayISO()
  };

  habits.push(habit);
  saveData();
  closeModal();
  renderHabits();
  renderStats();
  showToast(`${selectedEmoji} Hábito criado!`);
}

// ============================================================
// CALENDÁRIO (VIEW HISTORY)
// ============================================================

function renderCalendar() {
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('monthLabel').textContent = `${months[calendarMonth]} ${calendarYear}`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const todayStr = todayISO();
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  // Espaços vazios antes do primeiro dia
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const done = completions[iso] || [];
    const total = habits.length;
    const completed = habits.filter(h => done.includes(h.id)).length;

    let level = 'level-0';
    if (total > 0 && completed > 0) {
      level = completed === total ? 'level-2' : 'level-1';
    }

    const dayEl = document.createElement('div');
    dayEl.className = `cal-day ${level}${iso === todayStr ? ' today' : ''}`;
    dayEl.textContent = d;
    dayEl.title = `${iso}: ${completed}/${total} hábitos`;
    grid.appendChild(dayEl);
  }
}

// ============================================================
// ESTATÍSTICAS (VIEW STATS)
// ============================================================

function renderStats() {
  const container = document.getElementById('statsGrid');
  container.innerHTML = '';

  if (!habits.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Nenhum hábito para exibir ainda.</p>';
    return;
  }

  habits.forEach(habit => {
    // Conta dias com esse hábito completo
    let completedDays = 0;
    let totalDaysTracked = 0;

    const createdDate = new Date(habit.createdAt + 'T00:00:00');
    const today = new Date();

    for (let d = new Date(createdDate); d <= today; d.setDate(d.getDate() + 1)) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      totalDaysTracked++;
      if ((completions[iso] || []).includes(habit.id)) completedDays++;
    }

    const consistency = totalDaysTracked === 0 ? 0 : Math.round((completedDays / totalDaysTracked) * 100);
    const streak = calcHabitStreak(habit.id);

    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.setProperty('--habit-color', habit.color);
    card.innerHTML = `
      <div class="stat-emoji">${habit.emoji}</div>
      <div class="stat-name">${escapeHtml(habit.name)}</div>
      <div class="stat-numbers">
        <span>${completedDays} dias completos</span>
        <span>${consistency}%</span>
      </div>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" style="width:${consistency}%"></div>
      </div>
      <div class="stat-big">${streak}</div>
      <div class="stat-big-label">streak atual (dias)</div>
    `;
    container.appendChild(card);
  });
}

// ============================================================
// TOAST
// ============================================================

let toastTimeout;
/**
 * Exibe uma mensagem de feedback temporária
 * @param {string} msg
 */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============================================================
// NAVEGAÇÃO ENTRE VIEWS
// ============================================================

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`view-${viewName}`).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

  if (viewName === 'history') renderCalendar();
  if (viewName === 'stats') renderStats();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function initListeners() {
  // Navegação
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Modal
  document.getElementById('openModal').addEventListener('click', openModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('saveHabit').addEventListener('click', saveHabit);

  // Fechar modal clicando fora
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Enter no input
  document.getElementById('habitName').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveHabit();
    if (e.key === 'Escape') closeModal();
  });

  // Emoji picker
  document.querySelectorAll('.emoji-picker span').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.emoji-picker span').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedEmoji = el.dataset.emoji;
    });
  });

  // Color picker
  document.querySelectorAll('.color-picker span').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.color-picker span').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedColor = el.dataset.color;
    });
  });

  // Calendário — navegação de mês
  document.getElementById('prevMonth').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function init() {
  loadData();

  // Data na sidebar
  document.getElementById('sidebarDate').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  renderHabits();
  initListeners();
}

document.addEventListener('DOMContentLoaded', init);
