/**
 * HabitFlow — app.js
 * Features: hábitos, streak, confetti, XP/nível, conquistas,
 *           humor do dia, desafio do dia, pomodoro, respiração,
 *           snake, afirmações, diário, modo foco, quick stats
 */

// ============================================================
// ESTADO GLOBAL
// ============================================================

let habits = [];
let completions = {};
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let selectedEmoji = '💧';
let selectedColor = '#FF6B6B';
let editingHabitId = null;
let dragSrcIndex = null;
let selectedFreq = 7;

// XP
let xp = 0;
let level = 1;
const XP_PER_LEVEL = 100;

// Mood
let moodHistory = {}; // date -> mood 1-5

// Challenge
let challengeDoneToday = false;

// Journal
let journalEntries = []; // [{date, text}]

// Pomodoro
let pomState = { running: false, mode: 'focus', seconds: 25 * 60, interval: null, sessions: 0 };
const POM_FOCUS = 25 * 60;
const POM_SHORT = 5 * 60;
const POM_LONG = 15 * 60;

// Respiração
let breathState = { running: false, phase: null, timer: null, cycles: 0, countdown: null };

// Snake
let snakeState = { running: false, interval: null, score: 0, record: 0 };

// Modo Foco
let focusState = { running: false, interval: null, elapsed: 0 };

// Afirmações
const AFFIRMATIONS = [
  "Eu sou capaz de criar hábitos que transformam minha vida.",
  "Cada pequeno passo me aproxima da minha melhor versão.",
  "Eu tenho força e disciplina para seguir em frente.",
  "Meu progresso importa, mesmo quando é lento.",
  "Eu escolho a consistência todos os dias.",
  "Meu futuro é construído pelas ações de hoje.",
  "Eu confio no processo e na minha evolução.",
  "Cada dia é uma nova oportunidade de crescer.",
  "Eu mereço uma vida equilibrada e saudável.",
  "A disciplina é minha aliada mais poderosa.",
  "Eu celebro cada conquista, por menor que seja.",
  "Estou construindo a vida que desejo, tijolo a tijolo.",
  "Eu sou mais forte do que qualquer obstáculo.",
  "O hábito de hoje é a qualidade de amanhã.",
  "Eu me comprometo com meu crescimento pessoal.",
];

const CHALLENGES = [
  "Beba 2 litros de água antes das 18h",
  "Faça 10 minutos de meditação ou respiração consciente",
  "Escreva 3 coisas pelas quais você é grato hoje",
  "Faça 20 flexões ou equivalente de exercício",
  "Leia 10 páginas de um livro",
  "Passe 30 minutos sem usar o celular",
  "Organize um cantinho da sua mesa ou quarto",
  "Mande uma mensagem positiva para alguém que você admira",
  "Acorde e faça sua cama imediatamente",
  "Coma pelo menos uma refeição sem distrações",
  "Dê uma caminhada de 15 minutos ao ar livre",
  "Escreva seus 3 objetivos principais para o mês",
  "Desative notificações por 1 hora e foque em uma tarefa",
  "Durma antes da meia-noite hoje",
  "Aprenda uma coisa nova em 15 minutos",
];

const QUOTES = [
  'A consistência é a mãe do progresso.',
  'Um dia de cada vez. Sempre.',
  'Você não precisa ser perfeito, só precisa aparecer.',
  'Pequenas ações todo dia criam grandes mudanças.',
  'O segredo é começar.',
  'Disciplina é escolher entre o que você quer agora e o que você quer mais.',
  'Cada marca no calendário é uma vitória.',
  'Hábitos são votos que você faz consigo mesmo.',
  'A motivação te começa. O hábito te mantém.',
  'Feito é melhor que perfeito.',
  'O sucesso é a soma de pequenos esforços repetidos todos os dias.',
  'Você se torna o que você pratica.',
  'A jornada de mil milhas começa com um único passo.',
  'Não conte os dias. Faça os dias contarem.',
];

const ACHIEVEMENTS = [
  { id: 'first_habit', emoji: '🌱', name: 'Primeiro Passo', desc: 'Criou seu primeiro hábito', check: () => habits.length >= 1 },
  { id: 'streak_3', emoji: '🔥', name: 'Em Chamas', desc: '3 dias de streak', check: () => calcStreak() >= 3 },
  { id: 'streak_7', emoji: '⚡', name: 'Uma Semana', desc: '7 dias de streak', check: () => calcStreak() >= 7 },
  { id: 'streak_30', emoji: '🏆', name: 'Mês Completo', desc: '30 dias de streak', check: () => calcStreak() >= 30 },
  { id: 'level_5', emoji: '⭐', name: 'Nível 5', desc: 'Chegou ao nível 5', check: () => level >= 5 },
  { id: 'level_10', emoji: '💎', name: 'Nível 10', desc: 'Chegou ao nível 10', check: () => level >= 10 },
  { id: 'five_habits', emoji: '📋', name: 'Multitarefas', desc: '5 hábitos criados', check: () => habits.length >= 5 },
  { id: 'journal_5', emoji: '📝', name: 'Escritor', desc: '5 reflexões no diário', check: () => journalEntries.length >= 5 },
];

// ============================================================
// UTILITÁRIOS
// ============================================================

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ============================================================
// PERSISTÊNCIA
// ============================================================

function saveData() {
  localStorage.setItem('habitflow_habits', JSON.stringify(habits));
  localStorage.setItem('habitflow_completions', JSON.stringify(completions));
  localStorage.setItem('habitflow_xp', JSON.stringify({ xp, level }));
  localStorage.setItem('habitflow_mood', JSON.stringify(moodHistory));
  localStorage.setItem('habitflow_challenge_done', JSON.stringify({ date: todayISO(), done: challengeDoneToday }));
  localStorage.setItem('habitflow_journal', JSON.stringify(journalEntries));
  localStorage.setItem('habitflow_snake_record', JSON.stringify(snakeState.record));
  localStorage.setItem('habitflow_pom_sessions', JSON.stringify(pomState.sessions));
}

function loadData() {
  try {
    habits = JSON.parse(localStorage.getItem('habitflow_habits') || '[]');
    completions = JSON.parse(localStorage.getItem('habitflow_completions') || '{}');
    const xpData = JSON.parse(localStorage.getItem('habitflow_xp') || '{"xp":0,"level":1}');
    xp = xpData.xp; level = xpData.level;
    moodHistory = JSON.parse(localStorage.getItem('habitflow_mood') || '{}');
    const cd = JSON.parse(localStorage.getItem('habitflow_challenge_done') || '{"date":"","done":false}');
    challengeDoneToday = (cd.date === todayISO()) ? cd.done : false;
    journalEntries = JSON.parse(localStorage.getItem('habitflow_journal') || '[]');
    snakeState.record = JSON.parse(localStorage.getItem('habitflow_snake_record') || '0');
    const savedSessions = JSON.parse(localStorage.getItem('habitflow_pom_sessions') || '0');
    pomState.sessions = savedSessions;
  } catch {
    habits = []; completions = {};
  }
}

// ============================================================
// XP / NÍVEL
// ============================================================

function addXP(amount) {
  const prevLevel = level;
  xp += amount;
  while (xp >= level * XP_PER_LEVEL) {
    xp -= level * XP_PER_LEVEL;
    level++;
  }
  saveData();
  renderXP();
  if (level > prevLevel) showLevelUp(level);
}

function renderXP() {
  const needed = level * XP_PER_LEVEL;
  const pct = Math.min(100, Math.round((xp / needed) * 100));
  document.getElementById('playerLevel').textContent = level;
  document.getElementById('xpDisplay').textContent = xp + ' XP';
  document.getElementById('xpFill').style.width = pct + '%';
  document.getElementById('xpNext').textContent = `${xp} / ${needed} XP`;
}

function showLevelUp(lvl) {
  document.getElementById('levelupNumber').textContent = lvl;
  document.getElementById('levelupOverlay').classList.add('active');
  launchConfetti();
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
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const done = completions[iso] || [];
    const allDone = habits.every(h => done.includes(h.id));
    if (allDone) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function calcHabitStreak(habitId) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if ((completions[iso] || []).includes(habitId)) streak++;
    else if (i > 0) break;
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

  const isNowComplete = total > 0 && completed === total;
  if (isNowComplete && !wasComplete) {
    launchConfetti();
    addXP(50);
    showToast('🎉 Todos os hábitos completos! +50 XP');
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
  const colors = ['#e8ff47','#FF6B6B','#4FC3F7','#6BCB77','#CE93D8','#FFB74D','#F48FB1','#80CBC4'];
  const particles = [];
  for (let i = 0; i < 140; i++) {
    particles.push({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 200,
      r: 4 + Math.random() * 7, color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2.5 + Math.random() * 4, angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2, drift: (Math.random() - 0.5) * 1.5,
      shape: Math.random() > 0.5 ? 'rect' : 'circle', w: 6 + Math.random() * 8, h: 4 + Math.random() * 6,
    });
  }
  let frame = 0; const maxFrames = 200;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
      if (p.shape === 'rect') ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
      p.y += p.speed; p.x += p.drift; p.angle += p.spin;
    }
    frame++;
    if (frame < maxFrames) requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
  }
  requestAnimationFrame(draw);
}

// ============================================================
// RENDERIZAÇÃO — HABITS
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
    card.dataset.id = habit.id; card.dataset.index = index;
    card.draggable = true;
    const habitStreak = calcHabitStreak(habit.id);
    const freqLabel = habit.freq && habit.freq < 7 ? `${habit.freq}x/sem` : 'diário';
    card.innerHTML = `
      <div class="drag-handle" title="Arrastar para reordenar">⠿</div>
      <span class="habit-emoji">${habit.emoji}</span>
      <div class="habit-info">
        <div class="habit-name habit-name-clickable" title="Clique para editar">${escapeHtml(habit.name)}</div>
        <div class="habit-meta">🔥 ${habitStreak} dias — <span class="freq-badge">${freqLabel}</span></div>
        ${habit.notes ? `<div class="habit-notes">${escapeHtml(habit.notes)}</div>` : ''}
      </div>
      <div class="habit-actions">
        <button class="habit-check" title="${isDone ? 'Desmarcar' : 'Marcar como concluído'}" style="--habit-color:${habit.color}">${isDone ? '✓' : ''}</button>
        <button class="habit-delete" title="Remover hábito">✕</button>
      </div>
    `;
    card.querySelector('.habit-check').addEventListener('click', () => toggleHabit(habit.id));
    card.querySelector('.habit-delete').addEventListener('click', () => deleteHabit(habit.id));
    card.querySelector('.habit-name-clickable').addEventListener('click', () => openEditModal(habit.id));
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragover', onDragOver);
    card.addEventListener('dragleave', onDragLeave);
    card.addEventListener('drop', onDrop);
    card.addEventListener('dragend', onDragEnd);
    container.appendChild(card);
  });
  updateProgress();
  renderQuickStats();
}

// ============================================================
// DRAG & DROP
// ============================================================

function onDragStart(e) {
  dragSrcIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e) {
  e.preventDefault();
  const targetIndex = parseInt(e.currentTarget.dataset.index);
  if (targetIndex !== dragSrcIndex) e.currentTarget.classList.add('drag-over');
}
function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function onDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const targetIndex = parseInt(e.currentTarget.dataset.index);
  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;
  const moved = habits.splice(dragSrcIndex, 1)[0];
  habits.splice(targetIndex, 0, moved);
  dragSrcIndex = null;
  saveData(); renderHabits();
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
    addXP(10);
    showToast('✓ Hábito marcado! +10 XP');
  } else {
    completions[today].splice(idx, 1);
    showToast('Hábito desmarcado.');
  }
  saveData(); renderHabits();
}

function deleteHabit(habitId) {
  habits = habits.filter(h => h.id !== habitId);
  for (const day in completions) completions[day] = completions[day].filter(id => id !== habitId);
  saveData(); renderHabits(); renderStats();
  showToast('Hábito removido.');
}

// ============================================================
// MODAL
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
  document.getElementById('habitNotes').value = '';
  document.getElementById('modalTitle').textContent = 'Novo Hábito';
  document.getElementById('saveHabit').textContent = 'Criar Hábito';
  resetModalSelections('💧', '#FF6B6B');
  resetFreqPicker(7);
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('habitName').focus(), 100);
}

function openEditModal(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  editingHabitId = habitId;
  document.getElementById('habitName').value = habit.name;
  document.getElementById('habitNotes').value = habit.notes || '';
  document.getElementById('modalTitle').textContent = 'Editar Hábito';
  document.getElementById('saveHabit').textContent = 'Salvar';
  resetModalSelections(habit.emoji, habit.color);
  resetFreqPicker(habit.freq || 7);
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('habitName').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingHabitId = null;
}

function saveHabit() {
  const name = document.getElementById('habitName').value.trim();
  if (!name) { document.getElementById('habitName').focus(); showToast('⚠️ Digite um nome.'); return; }
  if (editingHabitId) {
    const habit = habits.find(h => h.id === editingHabitId);
    if (habit) { habit.name = name; habit.emoji = selectedEmoji; habit.color = selectedColor; }
    saveData(); closeModal(); renderHabits(); renderStats();
    showToast('✏️ Hábito atualizado!');
  } else {
    const habit = { id: uid(), name, emoji: selectedEmoji, color: selectedColor,
      freq: selectedFreq, notes: document.getElementById('habitNotes').value.trim(), createdAt: todayISO() };
    habits.push(habit);
    addXP(20);
    saveData(); closeModal(); renderHabits(); renderStats();
    showToast(`${selectedEmoji} Hábito criado! +20 XP`);
  }
}

// ============================================================
// EXPORT / IMPORT
// ============================================================

function exportData() {
  const backup = { version: 2, exportedAt: new Date().toISOString(), habits, completions, xp, level, moodHistory, journalEntries };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `habitflow-backup-${todayISO()}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('📦 Backup exportado!');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.habits || !backup.completions) throw new Error('Formato inválido');
      habits = backup.habits; completions = backup.completions;
      if (backup.xp !== undefined) { xp = backup.xp; level = backup.level; }
      if (backup.moodHistory) moodHistory = backup.moodHistory;
      if (backup.journalEntries) journalEntries = backup.journalEntries;
      saveData(); renderHabits(); renderStats(); renderCalendar(); renderXP();
      showToast('✅ Backup importado!');
    } catch { showToast('❌ Arquivo inválido.'); }
  };
  reader.readAsText(file);
}

// ============================================================
// CALENDÁRIO
// ============================================================

function renderCalendar() {
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('monthLabel').textContent = `${months[calendarMonth]} ${calendarYear}`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  const todayStr = todayISO();
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div'); empty.className = 'cal-day empty'; grid.appendChild(empty);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const done = completions[iso] || [];
    const total = habits.length;
    const completed = habits.filter(h => done.includes(h.id)).length;
    let level = 'level-0';
    if (total > 0 && completed > 0) level = completed === total ? 'level-2' : 'level-1';
    const dayEl = document.createElement('div');
    dayEl.className = `cal-day ${level}${iso === todayStr ? ' today' : ''}`;
    dayEl.textContent = d;
    dayEl.title = `${iso}: ${completed}/${total} hábitos`;
    grid.appendChild(dayEl);
  }
  renderMoodHistory();
}

// ============================================================
// MOOD
// ============================================================

function renderMoodHistory() {
  const grid = document.getElementById('moodHistoryGrid');
  grid.innerHTML = '';
  const moodEmojis = { 1: '😩', 2: '😔', 3: '😐', 4: '😊', 5: '🤩' };
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const mood = moodHistory[iso];
    const day = document.createElement('div');
    day.className = 'mood-day';
    day.innerHTML = `
      <span class="mood-day-emoji">${mood ? moodEmojis[mood] : '○'}</span>
      <span class="mood-day-date">${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</span>
    `;
    grid.appendChild(day);
  }
}

function initMoodPicker() {
  const today = todayISO();
  const savedMood = moodHistory[today];
  if (savedMood) {
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.mood) === savedMood);
    });
  }
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = parseInt(btn.dataset.mood);
      moodHistory[today] = mood;
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      saveData();
      showToast('Humor salvo!');
    });
  });
}

// ============================================================
// DESAFIO DO DIA
// ============================================================

function initDailyChallenge() {
  const today = todayISO();
  const idx = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % CHALLENGES.length;
  document.getElementById('challengeText').textContent = CHALLENGES[idx];
  const btn = document.getElementById('challengeDoneBtn');
  if (challengeDoneToday) {
    btn.disabled = true;
    btn.textContent = '✓ Concluído!';
    document.getElementById('dailyChallenge').classList.add('done');
  }
  btn.addEventListener('click', () => {
    if (challengeDoneToday) return;
    challengeDoneToday = true;
    btn.disabled = true;
    btn.textContent = '✓ Concluído!';
    document.getElementById('dailyChallenge').classList.add('done');
    addXP(50);
    saveData();
    showToast('⚡ Desafio concluído! +50 XP');
  });
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

function renderStats() {
  const container = document.getElementById('statsGrid');
  container.innerHTML = '';
  if (!habits.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Nenhum hábito para exibir ainda.</p>';
    renderAchievements(); return;
  }
  habits.forEach(habit => {
    let completedDays = 0, totalDaysTracked = 0;
    const createdDate = new Date(habit.createdAt + 'T00:00:00');
    const today = new Date();
    for (let d = new Date(createdDate); d <= today; d.setDate(d.getDate() + 1)) {
      const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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
      <div class="stat-numbers"><span>${completedDays} dias completos</span><span>${consistency}%</span></div>
      <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${consistency}%"></div></div>
      <div class="stat-big">${streak}</div>
      <div class="stat-big-label">streak atual (dias)</div>
    `;
    container.appendChild(card);
  });
  renderAchievements();
}

// ============================================================
// CONQUISTAS
// ============================================================

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const unlocked = a.check();
    const el = document.createElement('div');
    el.className = `achievement-badge ${unlocked ? 'unlocked' : 'locked'}`;
    el.innerHTML = `
      <span class="achievement-emoji">${a.emoji}</span>
      <div class="achievement-info">
        <span class="achievement-name">${a.name}</span>
        <span class="achievement-desc">${a.desc}</span>
      </div>
    `;
    grid.appendChild(el);
  });
}

// ============================================================
// QUICK STATS
// ============================================================

function renderQuickStats() {
  const grid = document.getElementById('quickStatsGrid');
  if (!grid) return;
  const today = todayISO();
  const done = completions[today] || [];
  const completedToday = habits.filter(h => done.includes(h.id)).length;
  const totalDays = Object.keys(completions).length;
  const streak = calcStreak();
  const totalCompletions = Object.values(completions).reduce((a, b) => a + b.length, 0);
  grid.innerHTML = `
    <div class="qs-item"><div class="qs-number">${completedToday}</div><div class="qs-label">hoje</div></div>
    <div class="qs-item"><div class="qs-number">${streak}</div><div class="qs-label">streak</div></div>
    <div class="qs-item"><div class="qs-number">${habits.length}</div><div class="qs-label">hábitos</div></div>
    <div class="qs-item"><div class="qs-number">${totalCompletions}</div><div class="qs-label">concluídos</div></div>
  `;
}

// ============================================================
// AFIRMAÇÕES
// ============================================================

function initAffirmations() {
  const today = todayISO();
  const idx = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AFFIRMATIONS.length;
  document.getElementById('affirmationText').textContent = `"${AFFIRMATIONS[idx]}"`;

  document.getElementById('newAffirmation').addEventListener('click', () => {
    const el = document.getElementById('affirmationText');
    el.style.opacity = '0';
    setTimeout(() => {
      const rand = Math.floor(Math.random() * AFFIRMATIONS.length);
      el.textContent = `"${AFFIRMATIONS[rand]}"`;
      el.style.opacity = '1';
    }, 300);
  });

  renderJournalEntries();

  document.getElementById('journalSave').addEventListener('click', () => {
    const text = document.getElementById('journalInput').value.trim();
    if (!text) return;
    journalEntries.unshift({ date: todayISO(), text });
    if (journalEntries.length > 30) journalEntries.pop();
    document.getElementById('journalInput').value = '';
    saveData();
    renderJournalEntries();
    addXP(15);
    showToast('📝 Reflexão salva! +15 XP');
  });
}

function renderJournalEntries() {
  const container = document.getElementById('journalEntries');
  container.innerHTML = '';
  journalEntries.slice(0, 5).forEach(e => {
    const el = document.createElement('div');
    el.className = 'journal-entry';
    el.innerHTML = `<div class="journal-entry-date">${e.date}</div><div class="journal-entry-text">${escapeHtml(e.text)}</div>`;
    container.appendChild(el);
  });
}

// ============================================================
// POMODORO
// ============================================================

function initPomodoro() {
  updatePomDisplay();
  document.getElementById('pomSessions').textContent = `${pomState.sessions} pomodoros hoje`;

  document.getElementById('pomStart').addEventListener('click', () => {
    if (pomState.running) {
      clearInterval(pomState.interval);
      pomState.running = false;
      document.getElementById('pomStart').textContent = '▶ Continuar';
    } else {
      pomState.running = true;
      document.getElementById('pomStart').textContent = '⏸ Pausar';
      pomState.interval = setInterval(() => {
        pomState.seconds--;
        updatePomDisplay();
        if (pomState.seconds <= 0) {
          clearInterval(pomState.interval);
          pomState.running = false;
          document.getElementById('pomStart').textContent = '▶ Iniciar';
          if (pomState.mode === 'focus') {
            pomState.sessions++;
            addXP(30);
            saveData();
            document.getElementById('pomSessions').textContent = `${pomState.sessions} pomodoros hoje`;
            showToast('🍅 Pomodoro completo! +30 XP');
            pomSwitch('short');
          } else {
            showToast('☕ Pausa terminada! Hora de focar.');
            pomSwitch('focus');
          }
        }
      }, 1000);
    }
  });

  document.getElementById('pomReset').addEventListener('click', () => {
    clearInterval(pomState.interval);
    pomState.running = false;
    pomState.seconds = pomState.mode === 'focus' ? POM_FOCUS : POM_SHORT;
    document.getElementById('pomStart').textContent = '▶ Iniciar';
    updatePomDisplay();
  });

  document.getElementById('pomSkip').addEventListener('click', () => {
    clearInterval(pomState.interval);
    pomState.running = false;
    document.getElementById('pomStart').textContent = '▶ Iniciar';
    pomSwitch(pomState.mode === 'focus' ? 'short' : 'focus');
  });
}

function pomSwitch(mode) {
  pomState.mode = mode;
  pomState.running = false;
  pomState.seconds = mode === 'focus' ? POM_FOCUS : (pomState.sessions % 4 === 0 ? POM_LONG : POM_SHORT);
  document.getElementById('pomodoroMode').textContent = mode === 'focus' ? 'Foco' : 'Pausa';
  const ring = document.getElementById('pomodoroRing');
  ring.classList.toggle('pom-break', mode !== 'focus');
  updatePomDisplay();
}

function updatePomDisplay() {
  const m = Math.floor(pomState.seconds / 60);
  const s = pomState.seconds % 60;
  document.getElementById('pomodoroTime').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const total = pomState.mode === 'focus' ? POM_FOCUS : POM_SHORT;
  const pct = 1 - (pomState.seconds / total);
  const circumference = 339.29;
  document.getElementById('ringFg').style.strokeDashoffset = circumference * (1 - pct);
}

// ============================================================
// RESPIRAÇÃO
// ============================================================

function initBreath() {
  document.getElementById('breathBtn').addEventListener('click', () => {
    if (breathState.running) {
      stopBreath();
    } else {
      startBreath();
    }
  });
}

function startBreath() {
  breathState.running = true;
  breathState.cycles = 0;
  document.getElementById('breathBtn').textContent = 'Parar';
  document.getElementById('breathCycles').textContent = '0 ciclos completos';
  runBreathPhase('inhale', 4);
}

function stopBreath() {
  breathState.running = false;
  clearTimeout(breathState.timer);
  clearInterval(breathState.countdown);
  const circle = document.getElementById('breathCircle');
  circle.style.transform = 'scale(1)';
  document.getElementById('breathLabel').textContent = 'Iniciar';
  document.getElementById('breathCount').textContent = '';
  document.getElementById('breathBtn').textContent = 'Iniciar Sessão';
}

function runBreathPhase(phase, duration) {
  if (!breathState.running) return;
  const labels = { inhale: 'Inspira', hold: 'Segura', exhale: 'Expira' };
  const scales = { inhale: 1.4, hold: 1.4, exhale: 1.0 };
  const circle = document.getElementById('breathCircle');
  document.getElementById('breathLabel').textContent = labels[phase];

  const transitionMs = phase === 'exhale' ? (duration * 1000) : (phase === 'inhale' ? duration * 1000 : 200);
  circle.style.transition = `transform ${transitionMs}ms ease`;
  circle.style.transform = `scale(${scales[phase]})`;

  let count = duration;
  document.getElementById('breathCount').textContent = count;
  clearInterval(breathState.countdown);
  breathState.countdown = setInterval(() => {
    count--;
    if (count >= 0) document.getElementById('breathCount').textContent = count;
  }, 1000);

  breathState.timer = setTimeout(() => {
    clearInterval(breathState.countdown);
    if (!breathState.running) return;
    if (phase === 'inhale') runBreathPhase('hold', 7);
    else if (phase === 'hold') runBreathPhase('exhale', 8);
    else {
      breathState.cycles++;
      document.getElementById('breathCycles').textContent = `${breathState.cycles} ciclos completos`;
      if (breathState.cycles > 0 && breathState.cycles % 3 === 0) {
        addXP(20);
        showToast('🌬 3 ciclos! +20 XP');
      }
      runBreathPhase('inhale', 4);
    }
  }, duration * 1000);
}

// ============================================================
// SNAKE
// ============================================================

function initSnake() {
  document.getElementById('snakeRecord').textContent = snakeState.record;
  document.getElementById('snakeStartBtn').addEventListener('click', startSnake);
  document.addEventListener('keydown', handleSnakeKey);
  // Touch controls
  let touchStartX = 0, touchStartY = 0;
  document.getElementById('snakeCanvas').addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
  });
  document.getElementById('snakeCanvas').addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && snakeData.dir !== 'left') snakeData.nextDir = 'right';
      else if (dx < 0 && snakeData.dir !== 'right') snakeData.nextDir = 'left';
    } else {
      if (dy > 0 && snakeData.dir !== 'up') snakeData.nextDir = 'down';
      else if (dy < 0 && snakeData.dir !== 'down') snakeData.nextDir = 'up';
    }
  });
}

const CELL = 20;
const GRID = 14;
let snakeData = { snake: [], dir: 'right', nextDir: 'right', food: null, running: false };

function handleSnakeKey(e) {
  if (!snakeData.running) return;
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  const newDir = map[e.key];
  if (!newDir) return;
  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
  if (newDir !== opposite[snakeData.dir]) { snakeData.nextDir = newDir; e.preventDefault(); }
}

function startSnake() {
  document.getElementById('snakeOverlay').style.display = 'none';
  snakeState.score = 0;
  document.getElementById('snakeScore').textContent = '0';
  snakeData.snake = [{x:7,y:7},{x:6,y:7},{x:5,y:7}];
  snakeData.dir = 'right'; snakeData.nextDir = 'right';
  snakeData.running = true;
  placeSnakeFood();
  clearInterval(snakeState.interval);
  snakeState.interval = setInterval(snakeTick, 120);
}

function placeSnakeFood() {
  let food;
  do { food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
  while (snakeData.snake.some(s => s.x === food.x && s.y === food.y));
  snakeData.food = food;
}

function snakeTick() {
  snakeData.dir = snakeData.nextDir;
  const head = { ...snakeData.snake[0] };
  if (snakeData.dir === 'up') head.y--;
  else if (snakeData.dir === 'down') head.y++;
  else if (snakeData.dir === 'left') head.x--;
  else head.x++;

  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || snakeData.snake.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(snakeState.interval);
    snakeData.running = false;
    if (snakeState.score > snakeState.record) {
      snakeState.record = snakeState.score;
      document.getElementById('snakeRecord').textContent = snakeState.record;
      saveData();
      addXP(snakeState.score * 2);
      showToast(`🐍 Novo recorde! +${snakeState.score * 2} XP`);
    }
    document.getElementById('snakeOverlaySub').textContent = `Pontuação: ${snakeState.score} — Tente novamente!`;
    document.getElementById('snakeStartBtn').textContent = 'Jogar Novamente';
    document.getElementById('snakeOverlay').style.display = 'flex';
    return;
  }

  snakeData.snake.unshift(head);
  if (head.x === snakeData.food.x && head.y === snakeData.food.y) {
    snakeState.score++;
    document.getElementById('snakeScore').textContent = snakeState.score;
    placeSnakeFood();
  } else {
    snakeData.snake.pop();
  }
  drawSnake();
}

function drawSnake() {
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  ctx.fillStyle = isDark ? '#080808' : '#f0f0f0';
  ctx.fillRect(0, 0, 280, 280);

  // Grid lines
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 280); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(280, i * CELL); ctx.stroke();
  }

  // Food
  ctx.fillStyle = '#FF6B6B';
  ctx.shadowColor = '#FF6B6B'; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(snakeData.food.x * CELL + CELL/2, snakeData.food.y * CELL + CELL/2, CELL/2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snake
  snakeData.snake.forEach((seg, i) => {
    const t = 1 - (i / snakeData.snake.length) * 0.5;
    ctx.fillStyle = `rgba(232, 255, 71, ${t})`;
    ctx.shadowColor = i === 0 ? '#e8ff47' : 'transparent';
    ctx.shadowBlur = i === 0 ? 10 : 0;
    const pad = i === 0 ? 1 : 2;
    const r = i === 0 ? 6 : 4;
    const x = seg.x * CELL + pad, y = seg.y * CELL + pad, w = CELL - pad*2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, w, r) : ctx.rect(x, y, w, w);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

// ============================================================
// MODO FOCO
// ============================================================

function initFocusMode() {
  document.getElementById('focusStart').addEventListener('click', () => {
    const intention = document.getElementById('focusIntention').value.trim() || 'Sessão de foco';
    startFocusMode(intention);
  });
  document.getElementById('focusEnd').addEventListener('click', endFocusMode);
}

function startFocusMode(intention) {
  focusState.running = true;
  focusState.elapsed = 0;
  document.getElementById('focusIntentionDisplay').textContent = intention;
  const quotes = QUOTES;
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById('focusQuote').textContent = `"${q}"`;
  document.getElementById('focusOverlay').classList.add('active');
  document.getElementById('focusTimerDisplay').textContent = '00:00';
  focusState.interval = setInterval(() => {
    focusState.elapsed++;
    const m = Math.floor(focusState.elapsed / 60);
    const s = focusState.elapsed % 60;
    document.getElementById('focusTimerDisplay').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);
}

function endFocusMode() {
  clearInterval(focusState.interval);
  focusState.running = false;
  document.getElementById('focusOverlay').classList.remove('active');
  const mins = Math.floor(focusState.elapsed / 60);
  if (mins > 0) {
    addXP(mins * 2);
    showToast(`🎯 Sessão de ${mins} min concluída! +${mins * 2} XP`);
  } else {
    showToast('🎯 Sessão encerrada.');
  }
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
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
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
  if (viewName === 'stats') { renderStats(); }
  if (viewName === 'extras') renderQuickStats();
}

// ============================================================
// QUOTE DO DIA
// ============================================================

function showDailyQuote() {
  const today = todayISO();
  const idx = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % QUOTES.length;
  const el = document.getElementById('quoteText');
  if (el) el.textContent = '"' + QUOTES[idx] + '"';
}

// ============================================================
// TEMA
// ============================================================

function loadTheme() {
  const saved = localStorage.getItem('habitflow_theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (theme === 'light') { if (icon) icon.textContent = '☽'; if (label) label.textContent = 'Modo Escuro'; }
  else { if (icon) icon.textContent = '☀'; if (label) label.textContent = 'Modo Claro'; }
  localStorage.setItem('habitflow_theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ============================================================
// FREQ PICKER
// ============================================================

function initFreqPicker() {
  document.querySelectorAll('.freq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedFreq = parseInt(btn.dataset.freq);
    });
  });
}

function resetFreqPicker(freq = 7) {
  selectedFreq = freq;
  document.querySelectorAll('.freq-btn').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.freq) === freq);
  });
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function initListeners() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
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
  document.querySelectorAll('.emoji-picker span').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.emoji-picker span').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected'); selectedEmoji = el.dataset.emoji;
    });
  });
  document.querySelectorAll('.color-picker span').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.color-picker span').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected'); selectedColor = el.dataset.color;
    });
  });
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
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('importData').addEventListener('click', () => document.getElementById('importFileInput').click());
  document.getElementById('importFileInput').addEventListener('change', e => {
    importData(e.target.files[0]); e.target.value = '';
  });
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('levelupClose').addEventListener('click', () => {
    document.getElementById('levelupOverlay').classList.remove('active');
  });
}

// ============================================================
// INIT
// ============================================================

function init() {
  loadData();
  loadTheme();
  showDailyQuote();
  document.getElementById('sidebarDate').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  renderHabits();
  renderXP();
  initListeners();
  initFreqPicker();
  initMoodPicker();
  initDailyChallenge();
  initPomodoro();
  initBreath();
  initSnake();
  initAffirmations();
  initFocusMode();
}

document.addEventListener('DOMContentLoaded', init);
