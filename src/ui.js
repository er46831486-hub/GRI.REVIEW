import { sources, TOPICS } from "./data.js";
import { load, save } from "./store.js";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function srcLinks(keys) {
  const list = [...new Set((Array.isArray(keys) ? keys : [keys]).filter(Boolean))];
  if (!list.length) return "";
  const links = list
    .map((k) => {
      const s = sources[k];
      if (!s) return "";
      return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><span class="src-pub">（${esc(s.publisher)}）</span>`;
    })
    .filter(Boolean)
    .join("<span class=\"src-sep\">、</span>");
  return `<p class="src"><span class="src-lbl">來源</span>${links}</p>`;
}

let uid = 0;
export const nextId = (p = "x") => `${p}${++uid}`;

// 可展開的 bar（accordion），由 main.js 統一處理點擊
export function acc(title, body, { open = false, cls = "", meta = "" } = {}) {
  const id = nextId("acc");
  return `<div class="bar ${cls}">
    <button type="button" class="bar-head" data-acc aria-expanded="${open}" aria-controls="${id}">
      <span class="bar-title">${title}</span>${meta ? `<span class="bar-meta">${meta}</span>` : ""}<span class="chev" aria-hidden="true"></span>
    </button>
    <div class="bar-body" id="${id}"${open ? "" : " hidden"}>${body}</div>
  </div>`;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 主題篩選 bar：翻卡、測驗、找碴共用，選擇會記住
export const getTopics = () => load("topics", []);
export const setTopics = (t) => save("topics", t);

export function topicBar(onChange, available) {
  const el = document.createElement("div");
  el.className = "filterbar";
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", "主題篩選");
  const draw = () => {
    const sel = new Set(getTopics());
    el.innerHTML =
      `<button type="button" class="pill" data-t="" aria-pressed="${sel.size === 0}">全部</button>` +
      TOPICS.filter(([id]) => !available || available.has(id))
        .map(([id, name]) => `<button type="button" class="pill" data-t="${id}" aria-pressed="${sel.has(id)}">${esc(name)}</button>`)
        .join("");
  };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]");
    if (!b) return;
    const t = b.dataset.t;
    let sel = new Set(getTopics());
    if (!t) sel = new Set();
    else sel.has(t) ? sel.delete(t) : sel.add(t);
    setTopics([...sel]);
    draw();
    onChange([...sel]);
  });
  draw();
  return el;
}

export const inTopics = (topic, sel) => !sel.length || sel.includes(topic);

export function progress(value, max, label) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return `<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}" aria-label="${esc(label)}">
    <span class="prog-fill" style="transform: scaleX(${max ? value / max : 0})"></span>
  </div><span class="prog-txt">${esc(label)}</span><span class="sr-only">${pct}%</span>`;
}
