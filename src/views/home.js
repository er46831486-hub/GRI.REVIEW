import { questions, allCards, spotItems } from "../data.js";
import { GROUPS } from "./gri.js";
import { esc } from "../ui.js";
import { load } from "../store.js";
import { getStats } from "./quiz.js";
import { getBoxes } from "./cards.js";
import { getSpot } from "./spot.js";

// 期末考：11/29（日）09:10–10:40（台北時間）
const EXAM_START = Date.parse("2026-11-29T09:10:00+08:00");
const EXAM_END = Date.parse("2026-11-29T10:40:00+08:00");

function countdown() {
  const now = Date.now();
  if (now >= EXAM_END) return { state: "over" };
  if (now >= EXAM_START) return { state: "during" };
  const ms = EXAM_START - now;
  return {
    state: "before",
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
  };
}
const num = (n, unit) => `<span class="cd-num">${n}</span><span class="cd-unit">${unit}</span>`;

export function renderHome(root) {
  const stats = getStats();
  const boxes = getBoxes();
  const spot = getSpot();
  const mods = [
    ["GRI 條文", "#/gri", load("bld.visited", []).filter((id) => GROUPS.some((g) => g.id === id)).length, GROUPS.length, "組已看過"],
    ["測驗", "#/quiz", Object.keys(stats).length, questions.length, "題做過"],
    ["翻卡", "#/cards", allCards.filter((c) => (boxes[c.id] || 1) >= 3).length, allCards.length, "張到盒 3 以上"],
    ["找碴", "#/spot", Object.keys(spot).length, spotItems.length, "段做過"],
  ];
  const draw = () => {
    const out = root.querySelector("#cd");
    const c = countdown();
    if (c.state === "during") out.innerHTML = '<span class="cd-done">考試進行中，加油</span>';
    else if (c.state === "over") out.innerHTML = '<span class="cd-done">考試結束了，辛苦了</span>';
    // 最後一天改顯示小時與分鐘
    else out.innerHTML = c.d > 0 ? num(c.d, "天") + num(c.h, "小時") : num(c.h, "小時") + num(c.m, "分");
  };

  root.innerHTML = `<section class="hero">
      <div class="hero-txt">
        <h1 class="h-hero">GRI 新準則，考前一次記熟</h1>
        <p class="hero-sub">用條文、翻卡、測驗、找碴複習 GRI、IFRS 與 TCFD。</p>
        <div class="hero-act">
          <a class="btn btn-primary btn-lg" href="#/quiz?mode=exam&start=1">開始模擬考</a>
          <a class="btn btn-ghost btn-lg" href="#/gri">從 GRI 條文開始</a>
        </div>
      </div>
      <div class="cd">
        <p class="cd-lbl">距期末考　11/29（日）09:10–10:40</p>
        <p class="cd-val" id="cd"></p>
      </div>
    </section>
    <section class="block">
      <h2 class="h-sec">進度</h2>
      <ul class="tbars">${mods
        .map(
          ([n, href, v, max, unit]) => `<li><a class="tbar tbar-link" href="${href}">
          <span class="tbar-lbl">${n}</span>
          <span class="tbar-track"><span class="tbar-fill" style="transform: scaleX(${max ? v / max : 0})"></span></span>
          <span class="tbar-val">${v}／${max} ${esc(unit)}</span></a></li>`
        )
        .join("")}</ul>
    </section>`;
  draw();
  const t = setInterval(draw, 60000);
  return () => clearInterval(t);
}
