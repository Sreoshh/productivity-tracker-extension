const taskList = document.getElementById('taskList');
const addForm = document.getElementById('addForm');
const taskTitle = document.getElementById('taskTitle');
const taskTime = document.getElementById('taskTime');
const streakEl = document.getElementById('streak');

function uid() { return Math.random().toString(36).slice(2,9); }

async function loadState() {
  const res = await chrome.storage.local.get('state');
  const state = res.state || { tasks: [], streak: { current:0 } };
  renderTasks(state.tasks || []);
  renderStreak(state.streak || { current:0 });
}

function renderStreak(streak) {
  streakEl.textContent = `🔥 ${streak.current || 0}`;
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  const today = new Date().toISOString().slice(0,10);
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task-item' + (t.completedForDay === today ? ' completed' : '');
    li.innerHTML = `
      <div>
        <div>${escapeHtml(t.title)}</div>
        <div class="task-meta">${t.dueAt? new Date(Number(t.dueAt)).toLocaleString() : 'No due time'}</div>
      </div>
      <div>
        <button class="complete">${t.completedForDay===today ? '✓' : 'Done'}</button>
      </div>
    `;
    li.querySelector('.complete').addEventListener('click', () => completeTask(t.id));
    taskList.appendChild(li);
  });
}

async function completeTask(id) {
  const data = await chrome.storage.local.get('state');
  const state = data.state || { tasks: [], streak: { current:0 } };
  const task = state.tasks.find(x => x.id === id);
  if (!task) return;
  task.completedForDay = new Date().toISOString().slice(0,10);
  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: 'scheduleAll' });
  loadState();
}

addForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) return;
  const dt = taskTime.value ? new Date(taskTime.value).getTime() : null;
  const newTask = {
    id: uid(),
    title,
    dueAt: dt,
    repeat: null,
    createdAt: Date.now(),
    completedForDay: null,
    snoozedUntil: null
  };
  const data = await chrome.storage.local.get('state');
  const state = data.state || { tasks: [], streak: { current:0 } };
  state.tasks.push(newTask);
  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: 'scheduleAll' });
  taskTitle.value = '';
  taskTime.value = '';
  loadState();
});

function escapeHtml(s) {
  return s ? s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) : '';
}

document.addEventListener('DOMContentLoaded', loadState);
