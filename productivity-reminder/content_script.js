// content_script.js — show a subtle dark/beige inline overlay
window.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_INLINE_REMINDER') {
    showOverlay(event.data.task);
  }
});

function showOverlay(task) {
  // avoid duplicates
  if (document.getElementById('prod-reminder-overlay')) return;
  const div = document.createElement('div');
  div.id = 'prod-reminder-overlay';
  div.style.position = 'fixed';
  div.style.right = '16px';
  div.style.bottom = '16px';
  div.style.zIndex = 2147483647;
  div.style.padding = '12px 14px';
  div.style.borderRadius = '12px';
  div.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
  div.style.background = 'linear-gradient(180deg, rgba(20,20,20,0.98), rgba(12,12,12,0.98))';
  div.style.color = '#d6c7b6';
  div.style.maxWidth = '320px';
  div.style.fontFamily = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial';
  div.style.cursor = 'pointer';

  const inner = document.createElement('div');
  inner.style.display = 'flex'; inner.style.gap = '10px'; inner.style.alignItems = 'center';
  inner.innerHTML = `
    <div style="font-size:20px; width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(214,199,182,0.06); color:#d6c7b6; font-weight:700;">PR</div>
    <div style="flex:1; min-width:0">
      <div style="font-weight:700; font-size:13px;">${escapeHtml(task.title)}</div>
      <div style="font-size:12px; color:#a79f97; margin-top:4px;">Open the extension to manage • Snooze or complete in notification</div>
    </div>
    <div>
      <button id="pr-close" style="background:transparent;border:1px solid rgba(255,255,255,0.04); padding:6px 8px; border-radius:8px; color:#a79f97; cursor:pointer;">Dismiss</button>
    </div>
  `;
  div.appendChild(inner);
  document.body.appendChild(div);

  const style = document.createElement('style');
  style.id = 'prod-reminder-style';
  style.innerHTML = `
    @keyframes prPop { 0%{ transform: translateY(6px) scale(.98); opacity:0 } 60%{ transform: translateY(-4px) scale(1.02); opacity:1 } 100%{ transform: translateY(0) scale(1); opacity:1 } }
    #prod-reminder-overlay { animation: prPop .45s cubic-bezier(.2,.9,.3,1); }
    #prod-reminder-overlay button { background:transparent; color:#d6c7b6; }
  `;
  document.head.appendChild(style);

  document.getElementById('pr-close').addEventListener('click', () => {
    div.remove();
    style.remove();
  });

  div.addEventListener('click', (e) => {
    // open popup — best-effort (service worker will open when notification clicked)
    try { chrome.runtime.sendMessage({ type: 'openPopup' }); } catch(e) {}
    // do not close immediately; let user click notification or popup
  });

  setTimeout(()=> { if (div && div.parentNode) div.remove(); if (style && style.parentNode) style.remove(); }, 22000);
}

function escapeHtml(s) {
  return s ? s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) : '';
}
