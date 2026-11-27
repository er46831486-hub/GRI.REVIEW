import { standards, floorById } from "../data.js";
import { esc, acc, srcLinks, unofficial } from "../ui.js";
import { load, save } from "../store.js";

const ORDER = ["gri-400", "gri-300", "gri-200", "gri-100", "gri-3", "gri-2", "gri-1", "gri-sector"];
const BIG = { "gri-400": "400", "gri-300": "300", "gri-200": "200", "gri-100": "101–103", "gri-3": "3", "gri-2": "2", "gri-1": "1", "gri-sector": "11–14" };

const row = (code, name, desc, flag = false) => {
  const id = `d-${code.replace(/[^\w-]/g, "")}-${Math.random().toString(36).slice(2, 7)}`;
  const hasDesc = !!desc;
  return `<li class="drow">
    <button type="button" class="drow-btn" data-row ${hasDesc ? `aria-expanded="false" aria-controls="${id}"` : ""}>
      <span class="drow-code">${esc(code)}</span>
      <span class="drow-name"><span class="nm">${esc(name)}</span>${unofficial(flag)}</span>
      ${hasDesc ? '<span class="chev" aria-hidden="true"></span>' : ""}
    </button>
    ${hasDesc ? `<p class="drow-desc" id="${id}" hidden>${esc(desc)}</p>` : ""}
  </li>`;
};
const rows = (list) => `<ul class="drows">${list.join("")}</ul>`;

function panelHtml(f) {
  const parts = [];
  parts.push(`<div class="panel-head">
    <p class="panel-floor">${esc(f.floor)}</p>
    <h2 class="panel-title"><span class="panel-code">${esc(f.code)}</span><span>${esc(f.zh)}</span></h2>
    ${f.en ? `<p class="panel-en">${esc(f.en)}</p>` : ""}
    <p class="lede">${esc(f.oneLiner)}</p>
  </div>`);

  if (f.id === "gri-100") {
    parts.push(`<div class="oldnew" aria-label="新舊對照">
      <p class="oldnew-lbl">新舊對照</p>
      <ul class="oldnew-list">
        <li><span>304</span><span class="oldnew-to">取代為</span><b>101</b></li>
        <li><span>305-1~5＋201-2</span><span class="oldnew-to">取代為</span><b>102</b></li>
        <li><span>302</span><span class="oldnew-to">取代為</span><b>103</b></li>
      </ul>
    </div>`);
  }

  if (f.mnemonic) parts.push(`<div class="mnemo"><span class="mnemo-lbl">口訣</span><p>${esc(f.mnemonic)}</p></div>`);

  for (const kp of f.keyPoints || []) {
    parts.push(
      acc(
        esc(kp.title),
        `<ul class="plain">${kp.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` +
          (kp.mnemonic ? `<div class="mnemo"><span class="mnemo-lbl">口訣</span><p>${esc(kp.mnemonic)}</p></div>` : "")
      )
    );
  }

  for (const s of f.sections || []) {
    parts.push(acc(esc(s.title), rows(s.disclosures.map(([c, n]) => row(c, n))), { meta: esc(s.range) }));
  }

  if (f.disclosures) {
    parts.push(`<div class="block"><h3 class="h-sub">揭露項目</h3>${rows(f.disclosures.map(([c, n]) => row(c, n)))}</div>`);
  }

  if (f.standards) {
    const objs = f.standards.filter((s) => !Array.isArray(s));
    const arrs = f.standards.filter((s) => Array.isArray(s));
    for (const s of objs) {
      const body = `
        <dl class="tags">
          <div><dt>取代</dt><dd>${esc(s.replaces)}</dd></div>
          <div><dt>生效</dt><dd>${esc(s.effective)}</dd></div>
          <div><dt>狀態</dt><dd>${esc(s.status)}</dd></div>
        </dl>
        <p class="body-txt">${esc(s.structure)}</p>
        ${rows(s.disclosures.map(([c, n, d]) => row(c, n, d, s.zhUnofficial)))}
        ${s.alignment ? `<p class="body-txt"><b>對齊：</b>${esc(s.alignment)}</p>` : ""}
        ${srcLinks(s.sources)}`;
      parts.push(
        acc(`<span class="std-code">${esc(s.code)}</span><span class="nm">${esc(s.zh)}</span>${unofficial(s.zhUnofficial)}`, body, {
          meta: esc(s.status),
        })
      );
    }
    if (arrs.length) {
      parts.push(
        `<div class="block"><h3 class="h-sub">準則清單</h3>${rows(
          arrs.map(([c, n, note]) => row(/^GRI/.test(c) ? c : `GRI ${c}`, n, note))
        )}</div>`
      );
    }
  }

  if (f.traps?.length) {
    parts.push(`<div class="traps"><h3 class="h-sub">陷阱提示</h3><ul class="plain">${f.traps.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`);
  }
  if (f.upcoming) parts.push(`<div class="block"><h3 class="h-sub">即將上路</h3><p class="body-txt">${esc(f.upcoming)}</p></div>`);
  parts.push(srcLinks(f.sources || standards._meta.sources));
  return parts.join("");
}

export function renderBuilding(root) {
  let current = load("bld.floor", "gri-1");
  if (!floorById[current]) current = "gri-1";
  let mask = false;

  root.innerHTML = `<section class="mod">
    <header class="mod-head">
      <h1 class="h-mod">大樓</h1>
      <p class="mod-sub">${esc(standards._meta.basis)}。點一層看它的揭露項目。</p>
      <button type="button" class="toggle" id="mask" aria-pressed="false">遮罩記憶模式</button>
    </header>
    <p class="hint">標「暫譯」的是 GRI 101／102／103 的中文名稱，目前尚無官方正體中文版；考試以教材用語為準。</p>
    <div class="bld">
      <nav class="tower" aria-label="樓層">${ORDER.map((id) => {
        const f = floorById[id];
        return `<button type="button" class="floor" data-floor="${id}" aria-pressed="${id === current}">
          <span class="floor-no">${BIG[id]}</span>
          <span class="floor-txt"><span class="floor-lv">${esc(f.floor)}</span><span class="floor-name">${esc(f.zh)}</span><span class="floor-one">${esc(f.oneLiner)}</span></span>
        </button>`;
      }).join("")}</nav>
      <div class="panel" id="panel" tabindex="-1" aria-live="polite"></div>
    </div>
  </section>`;

  const panel = root.querySelector("#panel");
  const draw = () => {
    panel.innerHTML = panelHtml(floorById[current]);
    panel.classList.toggle("masked", mask);
    const visited = new Set(load("bld.visited", []));
    visited.add(current);
    save("bld.visited", [...visited]);
  };
  draw();

  root.querySelector(".tower").addEventListener("click", (e) => {
    const b = e.target.closest("[data-floor]");
    if (!b) return;
    current = b.dataset.floor;
    save("bld.floor", current);
    root.querySelectorAll(".floor").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    draw();
    if (window.matchMedia("(max-width: 899px)").matches) panel.focus({ preventScroll: true }), panel.scrollIntoView({ block: "start" });
  });

  root.querySelector("#mask").addEventListener("click", (e) => {
    mask = !mask;
    e.currentTarget.setAttribute("aria-pressed", String(mask));
    panel.classList.toggle("masked", mask);
    panel.querySelectorAll(".nm.shown").forEach((n) => n.classList.remove("shown"));
  });

  // 遮罩模式下：第一次點擊先翻開名稱；之後再點展開說明
  panel.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest("[data-row], [data-acc]");
      if (!b || !mask) {
        if (b && b.hasAttribute("data-row")) toggleRow(b);
        return;
      }
      const nm = b.querySelector(".nm");
      if (nm && !nm.classList.contains("shown")) {
        nm.classList.add("shown");
        e.stopPropagation();
        return;
      }
      if (b.hasAttribute("data-row")) toggleRow(b);
    },
    true
  );
}

function toggleRow(b) {
  const id = b.getAttribute("aria-controls");
  if (!id) return;
  const p = document.getElementById(id);
  const open = b.getAttribute("aria-expanded") !== "true";
  b.setAttribute("aria-expanded", String(open));
  p.hidden = !open;
}
