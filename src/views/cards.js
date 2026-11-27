import { allCards, topicName } from "../data.js";
import { esc, srcLinks, unofficial, topicBar, getTopics, inTopics } from "../ui.js";
import { load, save } from "../store.js";

// Leitner 五盒：盒 1 出現機率最高
const WEIGHT = { 1: 16, 2: 8, 3: 4, 4: 2, 5: 1 };
const DIRS = [["mix", "混合"], ["fwd", "正向（編號 → 名稱）"], ["rev", "反向（名稱 → 編號）"]];

export const getBoxes = () => load("cards.box", {});

export function renderCards(root) {
  let boxes = getBoxes();
  let dir = load("cards.dir", "mix");
  let onlyNew = load("cards.new", false);
  let card = null;
  let lastId = null;
  let flipped = false;

  root.innerHTML = `<section class="mod">
    <header class="mod-head">
      <h1 class="h-mod">翻卡</h1>
      <p class="mod-sub">空白鍵翻面，1／2／3 評分。「不會」的卡會更常出現。</p>
    </header>
    <div id="fb"></div>
    <div class="optbar">
      <div class="seg" role="group" aria-label="方向">${DIRS.map(([v, l]) => `<button type="button" class="pill" data-dir="${v}" aria-pressed="${v === dir}">${l}</button>`).join("")}</div>
      <button type="button" class="pill" id="onlynew" aria-pressed="${onlyNew}">只看新準則</button>
    </div>
    <div class="progwrap" id="prog"></div>
    <div id="stage"></div>
  </section>`;

  const deck = () =>
    allCards.filter(
      (c) =>
        inTopics(c.topic, getTopics()) &&
        (!onlyNew || c.isNew) &&
        (dir === "mix" || c.dir === "concept" || c.dir === dir)
    );

  const pick = () => {
    const d = deck();
    if (!d.length) return null;
    const pool = d.length > 1 ? d.filter((c) => c.id !== lastId) : d;
    const total = pool.reduce((s, c) => s + WEIGHT[boxes[c.id] || 1], 0);
    let r = Math.random() * total;
    for (const c of pool) {
      r -= WEIGHT[boxes[c.id] || 1];
      if (r <= 0) return c;
    }
    return pool[pool.length - 1];
  };

  const drawProg = () => {
    const d = deck();
    const counts = [0, 0, 0, 0, 0];
    d.forEach((c) => counts[(boxes[c.id] || 1) - 1]++);
    const known = counts[2] + counts[3] + counts[4];
    root.querySelector("#prog").innerHTML = `
      <div class="prog" role="progressbar" aria-label="盒 3 以上的卡片比例" aria-valuemin="0" aria-valuemax="${d.length}" aria-valuenow="${known}">
        <span class="prog-fill" style="transform: scaleX(${d.length ? known / d.length : 0})"></span>
      </div>
      <p class="prog-txt">牌組 ${d.length} 張　盒 3 以上 ${known} 張</p>
      <ol class="boxes">${counts.map((n, i) => `<li><span class="box-lbl">盒 ${i + 1}</span><span class="box-n">${n}</span></li>`).join("")}</ol>`;
  };

  const stage = root.querySelector("#stage");
  const drawCard = () => {
    flipped = false;
    if (!card) {
      stage.innerHTML = `<p class="empty">這個篩選條件下沒有卡片，換個主題試試。</p>`;
      return;
    }
    const kind = card.dir === "concept" ? "概念卡" : card.dir === "fwd" ? "編號 → 名稱" : "名稱 → 編號";
    const frontFlag = card.dir === "rev" && card.unofficial;
    const backFlag = card.dir === "fwd" && card.unofficial;
    stage.innerHTML = `
      <div class="flip" data-flipped="false">
        <button type="button" class="flip-btn" id="flip" aria-label="翻面">
          <span class="flip-inner">
            <span class="face face-front">
              <span class="face-meta">${esc(topicName(card.topic))}　${kind}　盒 ${boxes[card.id] || 1}</span>
              <span class="face-txt">${esc(card.front)}${unofficial(frontFlag)}</span>
              <span class="face-hint">點一下或按空白鍵翻面</span>
            </span>
            <span class="face face-back" aria-hidden="true">
              <span class="face-meta">${esc(card.front)}</span>
              <span class="face-txt face-txt-back">${esc(card.back)}${unofficial(backFlag)}</span>
            </span>
          </span>
        </button>
      </div>
      <div class="rate" id="rate" hidden>
        <button type="button" class="btn btn-ghost" data-r="1"><span class="key">1</span>不會</button>
        <button type="button" class="btn btn-ghost" data-r="2"><span class="key">2</span>有點模糊</button>
        <button type="button" class="btn btn-primary" data-r="3"><span class="key">3</span>會了</button>
      </div>
      ${srcLinks(card.source)}`;
    stage.querySelector("#flip").addEventListener("click", flip);
  };

  const flip = () => {
    if (!card) return;
    flipped = !flipped;
    const f = stage.querySelector(".flip");
    f.dataset.flipped = String(flipped);
    f.querySelector(".face-front").setAttribute("aria-hidden", String(flipped));
    f.querySelector(".face-back").setAttribute("aria-hidden", String(!flipped));
    stage.querySelector("#rate").hidden = !flipped;
  };

  const rate = (r) => {
    if (!card || !flipped) return;
    const b = boxes[card.id] || 1;
    boxes[card.id] = r === 1 ? 1 : r === 2 ? b : Math.min(5, b + 1);
    save("cards.box", boxes);
    lastId = card.id;
    card = pick();
    drawProg();
    drawCard();
    stage.querySelector("#flip")?.focus();
  };

  stage.addEventListener("click", (e) => {
    const b = e.target.closest("[data-r]");
    if (b) rate(Number(b.dataset.r));
  });

  const refresh = () => {
    lastId = null;
    card = pick();
    drawProg();
    drawCard();
  };

  root.querySelector("#fb").append(topicBar(refresh));
  root.querySelector(".seg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dir]");
    if (!b) return;
    dir = b.dataset.dir;
    save("cards.dir", dir);
    root.querySelectorAll("[data-dir]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    refresh();
  });
  root.querySelector("#onlynew").addEventListener("click", (e) => {
    onlyNew = !onlyNew;
    save("cards.new", onlyNew);
    e.currentTarget.setAttribute("aria-pressed", String(onlyNew));
    refresh();
  });

  const onKey = (e) => {
    if (e.target.closest("input, textarea") || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === " ") {
      if (e.target.closest("button")) return; // 按鈕本身會處理空白鍵
      e.preventDefault();
      flip();
    } else if (["1", "2", "3"].includes(e.key)) rate(Number(e.key));
  };
  document.addEventListener("keydown", onKey);
  refresh();
  return () => document.removeEventListener("keydown", onKey);
}
