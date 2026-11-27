import { questionById, spotItems, cardById, topicName, TOPICS } from "../data.js";
import { esc, acc, setTopics } from "../ui.js";
import { load, clearAll } from "../store.js";
import { getWrong } from "./quiz.js";
import { getSpot } from "./spot.js";
import { getBoxes } from "./cards.js";

export function renderReview(root) {
  const groups = {};
  const g = (t) => (groups[t] ||= { q: [], s: [], c: [] });
  getWrong().map((id) => questionById[id]).filter(Boolean).forEach((q) => g(q.topic).q.push(q));
  const spot = getSpot();
  for (const item of spotItems) {
    const r = spot[item.id];
    if (r?.missed?.length) g(item.topic).s.push({ item, missed: r.missed });
  }
  const boxes = getBoxes();
  Object.entries(boxes)
    .filter(([id, b]) => b === 1 && cardById[id])
    .forEach(([id]) => g(cardById[id].topic).c.push(cardById[id]));

  const order = TOPICS.map((t) => t[0]).filter((t) => groups[t]);
  const total = (x) => x.q.length + x.s.length + x.c.length;

  const body = (t) => {
    const x = groups[t];
    const parts = [];
    if (x.q.length)
      parts.push(`<h3 class="h-sub">答錯的題目（${x.q.length}）</h3><ul class="plain rv-list">${x.q
        .map((q) => `<li><p>${esc(q.prompt)}</p><p class="rv-ans">正解：${esc(q.options.find((o) => o[0] === q.answer)[1])}</p></li>`)
        .join("")}</ul>`);
    if (x.s.length)
      parts.push(`<h3 class="h-sub">找碴漏抓的句子</h3><ul class="plain rv-list">${x.s
        .flatMap(({ item, missed }) =>
          missed.map((i) => `<li><p>「${esc(item.sentences[i])}」</p><p class="rv-ans">修正：${esc(item.fixes[String(i)])}</p></li>`)
        )
        .join("")}</ul>`);
    if (x.c.length)
      parts.push(`<h3 class="h-sub">盒 1 的卡片（${x.c.length}）</h3><ul class="plain rv-list">${x.c
        .map((c) => `<li><p><b>${esc(c.front)}</b>：${esc(c.back)}</p></li>`)
        .join("")}</ul>`);
    parts.push(`<div class="qnav">
      ${x.q.length ? `<button type="button" class="btn btn-primary" data-go="quiz" data-t="${t}">重練這個主題的錯題</button>` : ""}
      ${x.s.length ? `<button type="button" class="btn btn-ghost" data-go="spot" data-t="${t}">重做找碴</button>` : ""}
      <button type="button" class="btn btn-ghost" data-go="cards" data-t="${t}">翻這個主題的卡</button>
    </div>`);
    return parts.join("");
  };

  root.innerHTML = `<section class="mod">
    <header class="mod-head">
      <h1 class="h-mod">錯題本</h1>
      <p class="mod-sub">測驗答錯的題、找碴漏抓的句子、翻卡在盒 1 的卡，依主題分組。</p>
    </header>
    ${
      order.length
        ? order.map((t) => acc(esc(topicName(t)), body(t), { meta: `${total(groups[t])} 項` })).join("")
        : '<p class="empty">目前沒有錯題。先去做一次測驗或找碴吧。</p>'
    }
    <div class="danger">
      <button type="button" class="btn btn-ghost" id="clear">清除全部學習紀錄</button>
      <p class="hint" id="clear-msg" aria-live="polite"></p>
    </div>
  </section>`;

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    setTopics([b.dataset.t]);
    location.hash = b.dataset.go === "quiz" ? "#/quiz?mode=retry&start=1" : `#/${b.dataset.go}`;
  });

  let armed = false;
  const btn = root.querySelector("#clear");
  btn.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      btn.textContent = "確定清除？再按一次";
      btn.classList.add("btn-danger");
      root.querySelector("#clear-msg").textContent = "這會刪除所有測驗、翻卡、找碴紀錄，無法復原。";
      return;
    }
    clearAll();
    renderReview(root);
    root.querySelector("#clear-msg").textContent = "已清除。";
  });
  void load;
}
