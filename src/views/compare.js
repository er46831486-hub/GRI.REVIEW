import { frameworks } from "../data.js";
import { esc, acc, srcLinks } from "../ui.js";
import { save } from "../store.js";

export function renderCompare(root) {
  const { comparison: cmp, tcfd, ifrs, taiwan, griIfrsLinks } = frameworks;
  save("cmp.visited", true);
  const list = (items) => `<ul class="plain">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;

  root.innerHTML = `<section class="mod">
    <header class="mod-head">
      <h1 class="h-mod">對照</h1>
      <p class="mod-sub">GRI、IFRS S1／S2、TCFD 放在一起看。點欄位名稱只看那一欄。</p>
    </header>

    <div class="block">
      <h2 class="h-sec">三欄對照</h2>
      <div class="colpick" role="group" aria-label="只看某一欄">
        <button type="button" class="pill" data-col="-1" aria-pressed="true">全部</button>
        ${cmp.columns.map((c, i) => `<button type="button" class="pill" data-col="${i}" aria-pressed="false">${esc(c)}</button>`).join("")}
      </div>
      <div class="cmp" id="cmp" data-focus="-1">
        <div class="cmp-row cmp-hdr" aria-hidden="true"><span></span>${cmp.columns.map((c, i) => `<span class="cmp-cell" data-c="${i}">${esc(c)}</span>`).join("")}</div>
        ${cmp.rows
          .map(
            (r) => `<div class="cmp-row">
          <span class="cmp-lbl">${esc(r.label)}</span>
          ${r.values.map((v, i) => `<span class="cmp-cell" data-c="${i}"><span class="cmp-colname">${esc(cmp.columns[i])}</span>${esc(v)}</span>`).join("")}
        </div>`
          )
          .join("")}
      </div>
      ${acc("雙重重大性", `<p class="body-txt">${esc(cmp.doubleMateriality)}</p>${srcLinks(["gri-universal", "ifrs-s1"])}`, { cls: "bar-soft" })}
      ${acc("GRI 與 IFRS 的連結", list(griIfrsLinks) + srcLinks("gri-102-ifrs-statement"))}
      ${srcLinks(["gri-universal", "ifrs-s1", "tcfd-site", "tcfd-ifrs"])}
    </div>

    <div class="block">
      <h2 class="h-sec">TCFD 四支柱</h2>
      <div class="mnemo"><span class="mnemo-lbl">口訣</span><p>${esc(tcfd.mnemonic)}　${esc(tcfd.count)}</p></div>
      ${tcfd.pillars.map((p) => acc(esc(p.name), list(p.disclosures), { meta: `${p.disclosures.length} 項` })).join("")}
      ${acc("TCFD 的來龍去脈", list([tcfd.founded, tcfd.disbanded]))}
      <h3 class="h-sub">轉型風險與實體風險</h3>
      <div class="risks">
        <div class="risk-grp"><p class="risk-lbl">轉型風險</p><div class="chips" role="group" aria-label="轉型風險">${tcfd.risks.transition.map((r) => `<button type="button" class="pill" data-risk="轉型風險" aria-pressed="false">${esc(r)}</button>`).join("")}</div></div>
        <div class="risk-grp"><p class="risk-lbl">實體風險</p><div class="chips" role="group" aria-label="實體風險">${tcfd.risks.physical.map((r) => `<button type="button" class="pill" data-risk="實體風險" aria-pressed="false">${esc(r)}</button>`).join("")}</div></div>
      </div>
      <p class="risk-out" id="risk-out" aria-live="polite">點一個標籤，看它屬於哪一類。</p>
      ${srcLinks(["tcfd-site", "tcfd-ifrs"])}
    </div>

    <div class="block">
      <h2 class="h-sec">IFRS S1／S2</h2>
      ${acc(esc(ifrs.s1.title), list(ifrs.s1.points) + srcLinks("ifrs-s1"), { meta: esc(ifrs.s1.issued) })}
      ${acc(esc(ifrs.s2.title), list(ifrs.s2.points) + srcLinks("ifrs-s2"), { meta: esc(ifrs.s2.issued) })}
      ${acc(
        "IFRS S2 2025 修正",
        `<dl class="tags"><div><dt>發布</dt><dd>${esc(ifrs.s2.amendment2025.issued)}</dd></div><div><dt>生效</dt><dd>${esc(ifrs.s2.amendment2025.effective)}</dd></div></dl>` +
          list(ifrs.s2.amendment2025.changes) +
          srcLinks("ifrs-s2-amend"),
        { meta: esc(ifrs.s2.amendment2025.issued) }
      )}
    </div>

    <div class="block">
      <h2 class="h-sec">台灣接軌時程</h2>
      <p class="body-txt">${esc(taiwan.approach)}；${esc(taiwan.location)}。</p>
      <div class="timeline" role="group" aria-label="接軌階段">
        ${taiwan.phases.map((p, i) => `<button type="button" class="tl-seg" data-ph="${i}" aria-pressed="${i === 0}"><span class="tl-year">${esc(p.year)}</span><span class="tl-step">第 ${i + 1} 階段</span></button>`).join("")}
      </div>
      <p class="tl-out" id="tl-out" aria-live="polite">${esc(taiwan.phases[0].who)}</p>
      ${srcLinks("fsc-roadmap")}
    </div>
  </section>`;

  const cmpEl = root.querySelector("#cmp");
  root.querySelector(".colpick").addEventListener("click", (e) => {
    const b = e.target.closest("[data-col]");
    if (!b) return;
    cmpEl.dataset.focus = b.dataset.col;
    root.querySelectorAll(".colpick .pill").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });

  const out = root.querySelector("#risk-out");
  root.querySelector(".risks").addEventListener("click", (e) => {
    const b = e.target.closest("[data-risk]");
    if (!b) return;
    root.querySelectorAll("[data-risk]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    out.innerHTML = `<b>${esc(b.textContent)}</b> 屬於<b>${esc(b.dataset.risk)}</b>。`;
  });

  const tl = root.querySelector("#tl-out");
  root.querySelector(".timeline").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ph]");
    if (!b) return;
    root.querySelectorAll(".tl-seg").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    tl.textContent = taiwan.phases[Number(b.dataset.ph)].who;
  });
}
