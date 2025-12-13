const titleInput = document.getElementById("taskTitle");
const dateInput = document.getElementById("taskDate");
const timeInput = document.getElementById("taskTime");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const empty = document.getElementById("empty");
const streakEl = document.getElementById("streak");

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

async function load() {
  const { state } = await chrome.storage.local.get("state");
  const s = state || { tasks: [], streak: { current: 0 } };
  streakEl.textContent = `🔥 ${s.streak?.current || 0}`;
  render(s.tasks || []);
}

function render(tasks) {
  list.innerHTML = "";
  empty.style.display = tasks.length ? "none" : "block";
  const today = new Date().toISOString().slice(0, 10);

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task" + (t.completedForDay === today ? " done" : "");
    div.innerHTML = `
      <span>${t.title}</span>
      <button>✓</button>
    `;
    div.querySelector("button").onclick = () => toggle(t.id);
    list.appendChild(div);
  });
}

async function toggle(id) {
  const { state } = await chrome.storage.local.get("state");
  const today = new Date().toISOString().slice(0, 10);
  const task = state.tasks.find(t => t.id === id);
  task.completedForDay = task.completedForDay === today ? null : today;
  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: "scheduleAll" });
  load();
}

addBtn.onclick = async () => {
  if (!titleInput.value.trim()) return;

  let due = null;
  if (dateInput.value) {
    due = new Date(`${dateInput.value}T${timeInput.value || "09:00"}`).getTime();
  }

  const { state } = await chrome.storage.local.get("state");
  state.tasks.push({
    id: uid(),
    title: titleInput.value,
    dueAt: due,
    completedForDay: null
  });

  await chrome.storage.local.set({ state });
  chrome.runtime.sendMessage({ type: "scheduleAll" });

  titleInput.value = "";
  dateInput.value = "";
  timeInput.value = "";
  load();
};

load();
