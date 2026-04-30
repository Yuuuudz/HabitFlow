/**
 * HabitFlow — app.js
 * Gerenciador de Hábitos com localStorage
 * Features: edit modal, drag & drop reorder, export/import backup, confetti on 100%
 */

// ============================================================
// ESTADO GLOBAL
// ============================================================

/** @type {Array<{id: string, name: string, emoji: string, color: string, createdAt: string}>} */
let habits = [];

/** @type {Object<string, string[]>} Mapa de data ISO -> array de IDs de hábitos concluídos */
let completions = {};

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

let selectedEmoji = '💧';
let selectedColor = '#FF6B6B';

// ID do hábito sendo editado (null = criando novo)
let editingHabitId = null;

// Drag & drop state
let dragSrcIndex = null;

// ============================================================
// UTILITÁRIOS
// ============================================================

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatCreated(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
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
// STREAK
// ============================================================

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
      break;
    }
  }
  return streak;
}

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
// PROGRESSO
// ============================================================

let wasComplete = false;

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

  // Confetti quando chega a 100%
  const isNowComplete = total > 0 && completed === total;
  if (isNowComplete && !wasComplete) {
    launchConfetti();
  }
  wasComplete = isNowComplete;
}

// ============================================================
// CONFETTI
// ============================================================

function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const colors = ['#e8ff47', '#FF6B6B', '#4FC3F7', '#6BCB77', '#CE93D8', '#FFB74D', '#F48FB1', '#80CBC4'];
  const particles = [];

  for (let i = 0; i < 140; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 200,
      r: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2.5 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      drift: (Math.random() - 0.5) * 1.5,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
    });
  }

  let frame = 0;
  const maxFrames = 200;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      p.y += p.speed;
      p.x += p.drift;
      p.angle += p.spin;
    }

    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  requestAnimationFrame(draw);
  showToast('🎉 Parabéns! Todos os hábitos completos!');
}

// ============================================================
// RENDERIZAÇÃO — VIEW TODAY (com drag & drop)
// ============================================================

function renderHabits() {
  const container = document.getElementById('habitsList');
  const today = todayISO();
  const done = completions[today] || [];

  container.querySelectorAll('.habit-card').forEach(el => el.remove());

  const emptyState = document.getElementById('emptyState');
  emptyState.style.display = habits.length === 0 ? 'block' : 'none';

  habits.forEach((habit, index) => {
    const isDone = done.includes(habit.id);
    const card = document.createElement('div');
    card.className = `habit-card${isDone ? ' done' : ''}`;
    card.style.setProperty('--habit-color', habit.color);
    card.dataset.id = habit.id;
    card.dataset.index = index;
    card.draggable = true;

    const habitStreak = calcHabitStreak(habit.id);

    card.innerHTML = `
      <div class="drag-handle" title="Arrastar para reordenar">⠿</div>
      <span class="habit-emoji">${habit.emoji}</span>
      <div class="habit-info">
        <div class="habit-name habit-name-clickable" title="Clique para editar">${escapeHtml(habit.name)}</div>
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

    // Editar ao clicar no nome
    card.querySelector('.habit-name-clickable').addEventListener('click', () => openEditModal(habit.id));

    // Drag & Drop events
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragover', onDragOver);
    card.addEventListener('dragleave', onDragLeave);
    card.addEventListener('drop', onDrop);
    card.addEventListener('dragend', onDragEnd);

    container.appendChild(card);
  });

  updateProgress();
}

// ============================================================
// DRAG & DROP
// ============================================================

function onDragStart(e) {
  dragSrcIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcIndex);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const card = e.currentTarget;
  const targetIndex = parseInt(card.dataset.index);
  if (targetIndex !== dragSrcIndex) {
    card.classList.add('drag-over');
  }
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const card = e.currentTarget;
  card.classList.remove('drag-over');

  const targetIndex = parseInt(card.dataset.index);
  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;

  // Reorder habits array
  const moved = habits.splice(dragSrcIndex, 1)[0];
  habits.splice(targetIndex, 0, moved);

  dragSrcIndex = null;
  saveData();
  renderHabits();
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.habit-card').forEach(c => c.classList.remove('drag-over'));
  dragSrcIndex = null;
}

// ============================================================
// TOGGLE / DELETE
// ============================================================

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

function deleteHabit(habitId) {
  habits = habits.filter(h => h.id !== habitId);
  for (const day in completions) {
    completions[day] = completions[day].filter(id => id !== habitId);
  }
  saveData();
  renderHabits();
  renderStats();
  showToast('Hábito removido.');
}

// ============================================================
// MODAL — CRIAR / EDITAR
// ============================================================

function resetModalSelections(emoji = '💧', color = '#FF6B6B') {
  document.querySelectorAll('.emoji-picker span').forEach(el => el.classList.remove('selected'));
  const emojiEl = document.querySelector(`.emoji-picker [data-emoji="${emoji}"]`);
  if (emojiEl) emojiEl.classList.add('selected');
  selectedEmoji = emoji;

  document.querySelectorAll('.color-picker span').forEach(el => el.classList.remove('selected'));
  const colorEl = document.querySelector(`.color-picker [data-color="${color}"]`);
  if (colorEl) colorEl.classList.add('selected');
  selectedColor = color;
}

function openModal() {
  editingHabitId = null;
  document.getElementById('habitName').value = '';
  document.getElementById('modalTitle').textContent = 'Novo Hábito';
  document.getElementById('saveHabit').textContent = 'Criar Hábito';
  resetModalSelections('💧', '#FF6B6B');
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('habitName').focus(), 100);
}

function openEditModal(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  editingHabitId = habitId;
  document.getElementById('habitName').value = habit.name;
  document.getElementById('modalTitle').textContent = 'Editar Hábito';
  document.getElementById('saveHabit').textContent = 'Salvar';
  resetModalSelections(habit.emoji, habit.color);
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('habitName').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingHabitId = null;
}

function saveHabit() {
  const name = document.getElementById('habitName').value.trim();
  if (!name) {
    document.getElementById('habitName').focus();
    showToast('⚠️ Digite um nome para o hábito.');
    return;
  }

  if (editingHabitId) {
    // Modo edição
    const habit = habits.find(h => h.id === editingHabitId);
    if (habit) {
      habit.name = name;
      habit.emoji = selectedEmoji;
      habit.color = selectedColor;
    }
    saveData();
    closeModal();
    renderHabits();
    renderStats();
    showToast(`✏️ Hábito atualizado!`);
  } else {
    // Modo criação
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
}

// ============================================================
// EXPORTAR / IMPORTAR BACKUP
// ============================================================

function exportData() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    completions
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habitflow-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📦 Backup exportado!');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.habits || !backup.completions) throw new Error('Formato inválido');

      habits = backup.habits;
      completions = backup.completions;
      saveData();
      renderHabits();
      renderStats();
      renderCalendar();
      showToast('✅ Backup importado com sucesso!');
    } catch {
      showToast('❌ Arquivo inválido ou corrompido.');
    }
  };
  reader.readAsText(file);
}

// ============================================================
// CALENDÁRIO
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
// ESTATÍSTICAS
// ============================================================

function renderStats() {
  const container = document.getElementById('statsGrid');
  container.innerHTML = '';

  if (!habits.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Nenhum hábito para exibir ainda.</p>';
    return;
  }

  habits.forEach(habit => {
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
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============================================================
// NAVEGAÇÃO
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

  // Modal criar
  document.getElementById('openModal').addEventListener('click', openModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('saveHabit').addEventListener('click', saveHabit);

  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

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

  // Calendário
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

  // Export / Import
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('importData').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', (e) => {
    importData(e.target.files[0]);
    e.target.value = ''; // reset so same file can be re-imported
  });
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function init() {
  loadData();

  document.getElementById('sidebarDate').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  renderHabits();
  initListeners();
}

document.addEventListener('DOMContentLoaded', init);