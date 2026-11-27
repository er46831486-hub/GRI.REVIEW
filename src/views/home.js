import { questions, allCards, spotItems, standards } from "../data.js";
import { esc } from "../ui.js";
import { load } from "../store.js";
import { getStats } from "./quiz.js";
import { getBoxes } from "./cards.js";
import { getSpot } from "./spot.js";

// 考試日：11 月 29 日（台北時間 00:00）
const EXAM = Date.parse("2026-11-29T00:00:00+08:00");

function countdown(target) {
  const ms = target - Date.now();
  if (ms <= 0) return { d: 0, h: 0, done: true };
  return { d: Math.floor(ms / 86400000), h: Math.floor((ms % 86400000) / 3600000), done: false };
}

export function renderHome(root) {
  const stats = getStats();
  const boxes = getBoxes();
  const spot = getSpot();
  const mods = [
    ["GRI 條文", "#/gri", load("bld.visited", []).length, standards.floors.length, "組已看過"],
    ["測驗", "#/quiz", Object.keys(stats).length, questions.length, "題做過"],
    ["翻卡", "#/cards", allCards.filter((c) => (boxes[c.id] || 1) >= 3).length, allCards.length, "張到盒 3 以上"],
    ["找碴", "#/spot", Object.keys(spot).length, spotItems.length, "段做過"],
  ];
  const draw = () => {
    const out = root.querySelector("#cd");
    const c = countdown(EXAM);
    out.innerHTML = c.done
      ? '<span class="cd-done">考試日到了，加油</span>'
      : `<span class="cd-num">${c.d}</span><span class="cd-unit">天</span><span class="cd-num">${c.h}</span><span class="cd-unit">小時</span>`;
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
        <p class="cd-lbl">距 11 月 29 日考試</p>
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
