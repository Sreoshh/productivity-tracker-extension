window.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_INLINE_REMINDER') {
    showOverlay(event.data.task);
  }
});

function showOverlay(task) {
  if (document.getElementById('prod-reminder-overlay')) return;
  const div = document.createElement('div');
  div.id = 'prod-reminder-overlay';
  div.style.position = 'fixed';
  div.style.right = '16px';
  div.style.bottom = '16px';
  div.style.zIndex = 2147483647;
  div.style.padding = '12px 14px';
  div.style.borderRadius = '12px';
  div.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
  div.style.background = 'linear-gradient(135deg,#fff,#f7f9ff)';
  div.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;cursor:pointer;">
      <div style="font-size:22px; animation: pop 1s infinite;">🔔</div>
      <div>
        <div style="font-weight:600">${escapeHtml(task.title)}</div>
        <div style="font-size:12px;color:#555">Open the extension popup to manage</div>
      </div>
      <div style="margin-left:10px">
        <button id="pr-close" style="padding:6px 8px">Dismiss</button>
      </div>
    </div>
  `;
  const style = document.createElement('style');
  style.id = 'prod-reminder-style';
  style.innerHTML = `@keyframes pop { 0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)} } #prod-reminder-overlay button{cursor:pointer}`;
  document.head.appendChild(style);
  document.body.appendChild(div);

  document.getElementById('pr-close').addEventListener('click', () => {
    div.remove();
    style.remove();
  });

  div.addEventListener('click', () => {
    try { chrome.runtime.sendMessage({ type: 'openPopup' }); } catch(e) {}
  });

  setTimeout(()=>{ if (div && div.parentNode) div.remove(); if (style && style.parentNode) style.remove(); }, 20000);
}

function escapeHtml(s) {
  return s ? s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) : '';
}
