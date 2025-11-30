// popup.js — improved UI for the updated popup layout.
// It keeps the same storage schema (state.tasks) used by background.js

const taskList = document.getElementById('taskList');
const addForm = document.getElementById('addForm');
const taskTitle = document.getElementById('taskTitle');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const streakEl = document.getElementById('streak');
const emptyState = document.getElementById('emptyState');

function uid(){ return Math.random().toString(36).slice(2,9); }

async function loadState(){
  const res = await chrome.storage.local.get('state');
  const state = res.state || { tasks: [], streak: { current:0 } };
  renderTasks(state.tasks || []);
  renderStreak(state.streak || { current:0 });
}

function renderStreak(streak){
  streakEl.textContent = `🔥 ${streak.current || 0}`;
}

function renderTasks(tasks){
  taskList.innerHTML = '';
  if (!tasks || tasks.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  const today = new Date().toISOString().slice(0,10);
  tasks.slice().reverse().forEach(t => {
    const card = document.createElement('div');
    card.className = 'task-card' + (t.completedForDay === today ? ' completed' : '');
    card.innerHTML = `
      <div class="task-left">
        <button class="checkbox" aria-label="Mark complete">${t.completedForDay === today ? '✓' : '+'}</button>
        <div style="min-width:0">
          <div style="font-weight:700; font-size:13px; color:var(--accent); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(t.title)}</div>
          <div class="task-meta">${formatDue(t)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn small edit">Edit</button>
        <button class="btn small remove ghost">Remove</button>
      </div>
    `;
    // handlers
    const checkbox = card.querySelector('.checkbox');
    checkbox.addEventListener('click', () => toggleComplete(t.id));
    card.querySelector('.remove').addEventListener('click', () => removeTask(t.id));
    card.querySelector('.edit').addEventListener('click', () => editTask(t.id));
    taskList.appendChild(card);
  });
}

function formatDue(t) {
  if (!t?.dueAt) return 'No due time';
  try {
    const d = new Date(Number(t.dueAt));
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  } catch(e) {
    return 'Invalid date';
  }
}

function escapeHtml(s) {
  return s ? s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) : '';
}

// complete / toggle
async function toggleComplete(id){
  const res = await chrome.storage.local.get('state');
  const state = res.state || { tasks: [], streak: { current:0 } };
  const task = (state.tasks || []).find(x => x.id === id);
  if (!task) return;
  const today = new Date().toISOString().slice(0,10);
  if (task.completedForDay === today) {
    task.completedForDay = null;
  } else {
    task.completedForDay = today;
    task.snoozedUntil = null;
  }
  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: 'scheduleAll' });
  loadState();
}

// remove
async function removeTask(id){
  const r = await chrome.storage.local.get('state');
  const state = r.state || { tasks: [] };
  state.tasks = (state.tasks || []).filter(t => t.id !== id);
  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: 'scheduleAll' });
  loadState();
}

// edit (simple inline: prefill form then remove old)
async function editTask(id){
  const r = await chrome.storage.local.get('state');
  const state = r.state || { tasks: [] };
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  // prefill title/date/time
  taskTitle.value = t.title || '';
  if (t.dueAt) {
    const dt = new Date(Number(t.dueAt));
    taskDate.value = dt.toISOString().slice(0,10);
    taskTime.value = dt.toTimeString().slice(0,5);
  } else {
    taskDate.value = '';
    taskTime.value = '';
  }
  // remove the old one (we will add new on submit)
  state.tasks = state.tasks.filter(x => x.id !== id);
  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: 'scheduleAll' });
  loadState();
}

// add form
addForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) return;
  let dt = null;
  if (taskDate.value) {
    // combine with time if available
    const datePart = taskDate.value; // yyyy-mm-dd
    const timePart = taskTime.value || '09:00';
    dt = new Date(`${datePart}T${timePart}`).getTime();
    if (isNaN(dt)) dt = null;
  } else if (taskTime.value) {
    // if no date but time provided, treat as today
    const today = new Date().toISOString().slice(0,10);
    dt = new Date(`${today}T${taskTime.value}`).getTime();
    if (isNaN(dt)) dt = null;
  }
  const newTask = {
    id: uid(),
    title,
    dueAt: dt,
    repeat: null,
    createdAt: Date.now(),
    completedForDay: null,
    snoozedUntil: null
  };
  const r = await chrome.storage.local.get('state');
  const state = r.state || { tasks: [], streak: { current:0 } };
  state.tasks.push(newTask);
  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: 'scheduleAll' });
  taskTitle.value = ''; taskDate.value = ''; taskTime.value = '';
  loadState();
});

// load initial
document.addEventListener('DOMContentLoaded', loadState);
