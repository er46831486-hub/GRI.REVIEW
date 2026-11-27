import { standards, floorById } from "../data.js";
import { esc, acc } from "../ui.js";
import { load, save } from "../store.js";

// 由上往下：GRI 1 → 418
export const GROUPS = [
  { id: "gri-1", code: "GRI 1", short: "GRI 1", kind: "通用準則" },
  { id: "gri-2", code: "GRI 2", short: "GRI 2", kind: "通用準則" },
  { id: "gri-3", code: "GRI 3", short: "GRI 3", kind: "通用準則" },
  { id: "gri-100", code: "GRI 101–103", short: "101–103 新準則", kind: "主題準則（新）" },
  { id: "gri-200", code: "GRI 201–207", short: "201–207 經濟", kind: "主題準則" },
  { id: "gri-300", code: "GRI 301–308", short: "301–308 環境", kind: "主題準則" },
  { id: "gri-400", code: "GRI 401–418", short: "401–418 社會", kind: "主題準則" },
];

let rowSeq = 0;
// 一條揭露：編號＋中文名稱（遮罩模式可蓋住）＋英文或說明（可展開）
function row(code, name, { desc = "", en = "" } = {}) {
  const id = `r${++rowSeq}`;
  const hasDesc = !!desc;
  return `<li class="drow">
    <button type="button" class="drow-btn" data-row ${hasDesc ? `aria-expanded="false" aria-controls="${id}"` : ""}>
      <span class="drow-code">${esc(code)}</span>
      <span class="drow-name"><span class="nm">${esc(name)}</span>${en ? `<span class="drow-en">${esc(en)}</span>` : ""}</span>
      ${hasDesc ? '<span class="chev" aria-hidden="true"></span>' : ""}
    </button>
    ${hasDesc ? `<p class="drow-desc" id="${id}" hidden>${esc(desc)}</p>` : ""}
  </li>`;
}
const rows = (list) => `<ul class="drows">${list.join("")}</ul>`;

function groupHtml(g) {
  const f = floorById[g.id];
  const parts = [];
  parts.push(`<header class="grp-head">
    <p class="grp-kind">${esc(g.kind)}</p>
    <h2 class="grp-title"><span class="grp-code">${esc(g.code)}</span><span>${esc(f.zh)}</span></h2>
    ${f.en ? `<p class="panel-en">${esc(f.en)}</p>` : ""}
    <p class="lede">${esc(f.oneLiner)}</p>
  </header>`);

  for (const kp of f.keyPoints || []) {
    parts.push(
      acc(esc(kp.title), `<ul class="plain">${kp.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`)
    );
  }
  for (const s of f.sections || []) {
    parts.push(acc(esc(s.title), rows(s.disclosures.map(([c, n]) => row(c, n))), { meta: esc(s.range) }));
  }
  if (f.disclosures) {
    parts.push(acc("揭露項目", rows(f.disclosures.map(([c, n]) => row(c, n))), { meta: `${f.disclosures.length} 項` }));
  }

  for (const s of f.standards || []) {
    if (!Array.isArray(s)) {
      // GRI 101–103：新準則，含取代對象、生效日與狀態
      const body = `
        <dl class="tags">
          <div><dt>取代</dt><dd>${esc(s.replaces)}</dd></div>
          <div><dt>生效</dt><dd>${esc(s.effective)}</dd></div>
          <div><dt>狀態</dt><dd>${esc(s.status)}</dd></div>
        </dl>
        <p class="body-txt">${esc(s.structure)}</p>
        ${rows(s.disclosures.map(([c, n, d]) => row(c, n, { desc: d })))}
        ${s.alignment ? `<p class="body-txt"><b>對齊：</b>${esc(s.alignment)}</p>` : ""}`;
      parts.push(
        acc(`<span class="std-code">${esc(s.code)}</span><span class="nm">${esc(s.zh)}</span>`, body, {
          meta: `${s.disclosures.length} 項`,
        })
      );
      continue;
    }
    const [num, name, note] = s;
    const code = /^GRI/.test(num) ? num : `GRI ${num}`;
    const det = f.details?.[num];
    if (!det) {
      // 沒有細項的準則：只顯示名稱
      parts.push(`<div class="bar bar-flat"><p class="bar-head bar-static"><span class="bar-title"><span class="std-code">${esc(code)}</span><span class="nm">${esc(name)}</span></span></p></div>`);
      continue;
    }
    const body = `
      ${note ? `<p class="std-note">${esc(note)}</p>` : ""}
      <p class="panel-en">${esc(det.en)}</p>
      ${rows(det.disclosures.map(([c, n, en]) => row(c, n, { en })))}`;
    parts.push(
      acc(`<span class="std-code">${esc(code)}</span><span class="nm">${esc(name)}</span>`, body, {
        meta: `${det.disclosures.length} 項`,
        cls: note ? "has-note" : "",
      })
    );
  }

  return `<section class="grp" id="g-${g.id}" data-grp="${g.id}" tabindex="-1">${parts.join("")}</section>`;
}

export function renderGri(root) {
  let mask = false;
  rowSeq = 0;
  root.innerHTML = `<section class="mod">
    <header class="mod-head">
      <h1 class="h-mod">GRI 條文</h1>
      <p class="mod-sub">從 GRI 1 開始，依編號由上往下排到 418。點任一條展開細項。</p>
    </header>
    <div class="gri-tools">
      <button type="button" class="pill" id="mask" aria-pressed="false">遮罩記憶模式</button>
      <button type="button" class="pill" id="expand" aria-pressed="false">全部展開</button>
    </div>
    <nav class="filterbar gri-index" aria-label="跳到">${GROUPS.map((g) => `<a class="pill" href="#/gri" data-jump="${g.id}">${esc(g.short)}</a>`).join("")}</nav>
    <p class="hint">${esc(standards._meta.basis)}。</p>
    <div class="gri-list" id="list">${GROUPS.map(groupHtml).join("")}</div>
  </section>`;

  const list = root.querySelector("#list");
  const markVisited = (id) => {
    const v = new Set(load("bld.visited", []));
    if (v.has(id)) return;
    v.add(id);
    save("bld.visited", [...v]);
  };

  root.querySelector(".gri-index").addEventListener("click", (e) => {
    const a = e.target.closest("[data-jump]");
    if (!a) return;
    e.preventDefault();
    const sec = root.querySelector(`#g-${a.dataset.jump}`);
    sec.scrollIntoView({ block: "start" });
    sec.focus({ preventScroll: true });
    markVisited(a.dataset.jump);
  });

  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && markVisited(en.target.dataset.grp)),
      { rootMargin: "-45% 0px -45% 0px" } // 經過畫面中央就算看過
    );
    list.querySelectorAll(".grp").forEach((s) => io.observe(s));
  }

  root.querySelector("#mask").addEventListener("click", (e) => {
    mask = !mask;
    e.currentTarget.setAttribute("aria-pressed", String(mask));
    list.classList.toggle("masked", mask);
    list.querySelectorAll(".nm.shown").forEach((n) => n.classList.remove("shown"));
  });

  root.querySelector("#expand").addEventListener("click", (e) => {
    const open = e.currentTarget.getAttribute("aria-pressed") !== "true";
    e.currentTarget.setAttribute("aria-pressed", String(open));
    e.currentTarget.textContent = open ? "全部收合" : "全部展開";
    list.querySelectorAll("[data-acc]").forEach((b) => {
      b.setAttribute("aria-expanded", String(open));
      document.getElementById(b.getAttribute("aria-controls")).hidden = !open;
    });
  });

  // 遮罩模式：第一次點先翻開名稱，再點才展開
  list.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest("[data-row], [data-acc]");
      if (!b) return;
      const grp = b.closest("[data-grp]");
      if (grp) markVisited(grp.dataset.grp);
      if (mask) {
        const nm = b.querySelector(".nm");
        if (nm && !nm.classList.contains("shown")) {
          nm.classList.add("shown");
          e.stopPropagation();
          return;
        }
      }
      if (b.hasAttribute("data-row")) toggleRow(b);
    },
    true
  );

  return () => io && io.disconnect();
}

function toggleRow(b) {
  const id = b.getAttribute("aria-controls");
  if (!id) return;
  const p = document.getElementById(id);
  const open = b.getAttribute("aria-expanded") !== "true";
  b.setAttribute("aria-expanded", String(open));
  p.hidden = !open;
}
