import { questions, questionById, topicName } from "../data.js";
import { esc, shuffle, topicBar, getTopics, setTopics, inTopics } from "../ui.js";
import { load, save } from "../store.js";

const EXAM_N = 30;
const EXAM_MIN = 25;
const EXAM_MS = EXAM_MIN * 60 * 1000;
const MODES = [["practice", "練習"], ["exam", "模擬考"], ["retry", "錯題重練"]];

export const getWrong = () => load("quiz.wrong", []);
export const getStats = () => load("quiz.stats", {});

function record(q, ok) {
  const stats = getStats();
  const s = stats[q.id] || { r: 0, w: 0 };
  ok ? s.r++ : s.w++;
  stats[q.id] = s;
  save("quiz.stats", stats);
  const wrong = new Set(getWrong());
  ok ? wrong.delete(q.id) : wrong.add(q.id);
  save("quiz.wrong", [...wrong]);
}

export function renderQuiz(root, params) {
  let mode = MODES.some((m) => m[0] === params.get("mode")) ? params.get("mode") : "practice";
  let list = [];
  let i = 0;
  let answers = {};
  let orders = {};
  let deadline = 0;
  let timer = null;
  let screen = "setup";

  const stopTimer = () => timer && clearInterval(timer);

  const setup = () => {
    screen = "setup";
    stopTimer();
    const wrongN = getWrong().filter((id) => questionById[id]).length;
    root.innerHTML = `<section class="mod">
      <header class="mod-head">
        <h1 class="h-mod">測驗</h1>
        <p class="mod-sub">共 ${questions.length} 題。數字鍵 1–4 作答，Enter 下一題。</p>
      </header>
      <div class="seg seg-big" role="group" aria-label="模式">${MODES.map(([v, l]) => `<button type="button" class="pill" data-mode="${v}" aria-pressed="${v === mode}">${l}</button>`).join("")}</div>
      <div class="bar bar-soft mode-desc">${
        mode === "practice"
          ? "<p>依主題篩選，逐題作答，答完馬上看解析。</p>"
          : mode === "exam"
            ? `<p>從全部題庫隨機抽 ${EXAM_N} 題，限時 ${EXAM_MIN} 分鐘。作答期間不顯示答案，交卷後一次看成績。主題篩選不適用。</p>`
            : `<p>只出答錯過的題，答對就從錯題本移除。目前有 ${wrongN} 題。</p>`
      }</div>
      <div id="fb"${mode === "exam" ? " hidden" : ""}></div>
      <p class="count" id="count"></p>
      <button type="button" class="btn btn-primary btn-lg" id="start">開始</button>
    </section>`;
    const countEl = root.querySelector("#count");
    const pool = () => build(false);
    const updateCount = () => {
      const n = pool().length;
      countEl.textContent = mode === "exam" ? `將出 ${Math.min(EXAM_N, questions.length)} 題` : `符合條件：${n} 題`;
      root.querySelector("#start").disabled = n === 0;
    };
    root.querySelector("#fb").append(topicBar(updateCount, new Set(questions.map((q) => q.topic))));
    root.querySelector(".seg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mode]");
      if (!b) return;
      mode = b.dataset.mode;
      setup();
    });
    root.querySelector("#start").addEventListener("click", start);
    updateCount();
  };

  const build = (shuffleIt = true) => {
    const t = getTopics();
    let base;
    if (mode === "exam") base = questions;
    else if (mode === "retry") base = getWrong().map((id) => questionById[id]).filter(Boolean).filter((q) => inTopics(q.topic, t));
    else base = questions.filter((q) => inTopics(q.topic, t));
    if (!shuffleIt) return base;
    const s = shuffle(base);
    return mode === "exam" ? s.slice(0, EXAM_N) : s;
  };

  const start = () => {
    list = build();
    if (!list.length) return;
    i = 0;
    answers = {};
    orders = Object.fromEntries(list.map((q) => [q.id, shuffle(q.options)]));
    if (mode === "exam") {
      deadline = Date.now() + EXAM_MS;
      timer = setInterval(tick, 1000);
    }
    question();
  };

  const tick = () => {
    const left = Math.max(0, deadline - Date.now());
    const el = root.querySelector("#timer");
    if (el) {
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      el.textContent = `剩 ${m}:${String(s).padStart(2, "0")}`;
      el.classList.toggle("urgent", left < 60000);
    }
    if (left <= 0) submit();
  };

  const question = () => {
    screen = "question";
    const q = list[i];
    const done = Object.keys(answers).length;
    const correct = list.filter((x) => answers[x.id] === x.answer).length;
    const chosen = answers[q.id];
    const reveal = mode !== "exam" && chosen != null;
    const progLabel = mode === "exam" ? `第 ${i + 1}／${list.length} 題　已作答 ${done}` : `第 ${i + 1}／${list.length} 題　答對 ${correct}／${done}`;
    root.innerHTML = `<section class="mod">
      <div class="qtop">
        <div class="prog" role="progressbar" aria-label="測驗進度" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${i + 1}">
          <span class="prog-fill" style="transform: scaleX(${(i + 1) / list.length})"></span>
        </div>
        <p class="prog-txt"><span>${progLabel}</span>${mode === "exam" ? '<span class="timer" id="timer" aria-live="off"></span>' : ""}</p>
      </div>
      <p class="q-meta">${esc(topicName(q.topic))}　難度 ${q.level}</p>
      <h2 class="q-prompt" tabindex="-1">${esc(q.prompt)}</h2>
      <ol class="opts">${orders[q.id]
        .map(([id, text], k) => {
          let state = "";
          let tag = "";
          if (reveal) {
            if (id === q.answer) (state = "correct"), (tag = '<span class="opt-tag">正解</span>');
            else if (id === chosen) (state = "wrong"), (tag = '<span class="opt-tag">你的答案</span>');
          }
          return `<li><button type="button" class="opt ${state}" data-opt="${id}" aria-pressed="${chosen === id}" ${reveal ? "disabled" : ""}>
            <span class="key">${k + 1}</span><span class="opt-txt">${esc(text)}</span>${tag}</button></li>`;
        })
        .join("")}</ol>
      ${
        reveal
          ? `<div class="explain ${chosen === q.answer ? "is-correct" : "is-wrong"}" role="status">
              <p class="verdict">${chosen === q.answer ? "答對了" : "答錯了"}</p>
              <p class="body-txt">${esc(q.explanation)}</p></div>`
          : ""
      }
      <div class="qnav">
        ${mode === "exam" ? `<button type="button" class="btn btn-ghost" id="prev" ${i === 0 ? "disabled" : ""}>上一題</button>` : '<button type="button" class="btn btn-ghost" id="quit">結束</button>'}
        ${
          i < list.length - 1
            ? `<button type="button" class="btn btn-primary" id="next" ${mode !== "exam" && !reveal ? "disabled" : ""}>下一題</button>`
            : `<button type="button" class="btn btn-primary" id="finish" ${mode !== "exam" && !reveal ? "disabled" : ""}>${mode === "exam" ? "交卷" : "看成績"}</button>`
        }
        ${mode === "exam" && i < list.length - 1 ? '<button type="button" class="btn btn-ghost" id="submit">提早交卷</button>' : ""}
      </div>
    </section>`;
    if (mode === "exam") tick();
    root.querySelector(".opts").addEventListener("click", (e) => {
      const b = e.target.closest("[data-opt]");
      if (b) choose(b.dataset.opt);
    });
    root.querySelector("#next")?.addEventListener("click", next);
    root.querySelector("#prev")?.addEventListener("click", () => (i--, question()));
    root.querySelector("#finish")?.addEventListener("click", submit);
    root.querySelector("#submit")?.addEventListener("click", submit);
    root.querySelector("#quit")?.addEventListener("click", submit);
    const focusEl = reveal ? root.querySelector("#next, #finish") : root.querySelector(".q-prompt");
    focusEl?.focus({ preventScroll: true });
  };

  const choose = (id) => {
    const q = list[i];
    if (mode !== "exam" && answers[q.id] != null) return;
    answers[q.id] = id;
    if (mode !== "exam") record(q, id === q.answer);
    question();
  };

  const next = () => {
    const q = list[i];
    if (mode !== "exam" && answers[q.id] == null) return;
    if (i < list.length - 1) {
      i++;
      question();
    } else submit();
  };

  const submit = () => {
    if (screen === "result") return;
    stopTimer();
    if (mode === "exam") list.forEach((q) => answers[q.id] != null && record(q, answers[q.id] === q.answer));
    // 練習／重練中途結束：只計已作答的題
    const graded = mode === "exam" ? list : list.filter((q) => answers[q.id] != null);
    result(graded);
  };

  const result = (graded) => {
    screen = "result";
    const correct = graded.filter((q) => answers[q.id] === q.answer).length;
    const byTopic = {};
    graded.forEach((q) => {
      const t = (byTopic[q.topic] ||= { n: 0, r: 0 });
      t.n++;
      if (answers[q.id] === q.answer) t.r++;
    });
    const topics = Object.entries(byTopic).map(([t, v]) => ({ t, ...v, rate: v.r / v.n }));
    const weak = topics.filter((x) => x.rate < 1).sort((a, b) => a.rate - b.rate || b.n - a.n).slice(0, 3);
    if (mode === "exam") save("quiz.lastExam", { score: correct, n: graded.length, at: Date.now() });

    root.innerHTML = `<section class="mod">
      <header class="mod-head">
        <h1 class="h-mod">成績</h1>
      </header>
      <div class="score">
        <p class="score-num">${correct}<span class="score-of">／${graded.length}</span></p>
        <p class="score-sub">${graded.length ? `正確率 ${Math.round((correct / graded.length) * 100)}%` : "還沒有作答的題目"}</p>
      </div>
      ${
        topics.length
          ? `<h2 class="h-sec">各主題正確率</h2>
        <ul class="tbars">${topics
          .sort((a, b) => a.rate - b.rate)
          .map(
            (x) => `<li class="tbar">
            <span class="tbar-lbl">${esc(topicName(x.t))}</span>
            <span class="tbar-track"><span class="tbar-fill" style="transform: scaleX(${x.rate})"></span></span>
            <span class="tbar-val">${x.r}／${x.n}</span></li>`
          )
          .join("")}</ul>`
          : ""
      }
      ${
        weak.length
          ? `<h2 class="h-sec">最弱的主題</h2>
        <ul class="weak">${weak
          .map((x) => `<li class="bar bar-soft weak-row"><span><b>${esc(topicName(x.t))}</b>　${Math.round(x.rate * 100)}%</span><button type="button" class="btn btn-ghost" data-cards="${x.t}">去翻這個主題的卡</button></li>`)
          .join("")}</ul>`
          : ""
      }
      <div class="qnav">
        <button type="button" class="btn btn-primary" id="again">再來一次</button>
        <a class="btn btn-ghost" href="#/review">看錯題本</a>
      </div>
      ${graded.length ? `<h2 class="h-sec">逐題解析</h2><ol class="review-list">${graded.map(reviewItem).join("")}</ol>` : ""}
    </section>`;
    root.querySelector("#again").addEventListener("click", setup);
    root.querySelector(".weak")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cards]");
      if (!b) return;
      setTopics([b.dataset.cards]);
      location.hash = "#/cards";
    });
  };

  const reviewItem = (q) => {
    const ok = answers[q.id] === q.answer;
    const txt = (id) => (q.options.find((o) => o[0] === id) || [, "未作答"])[1];
    return `<li class="rv ${ok ? "is-correct" : "is-wrong"}">
      <p class="rv-head"><span class="verdict-tag">${ok ? "答對" : "答錯"}</span>${esc(q.prompt)}</p>
      ${ok ? "" : `<p class="rv-ans">你的答案：${esc(txt(answers[q.id]))}</p>`}
      <p class="rv-ans">正解：${esc(txt(q.answer))}</p>
      <p class="body-txt">${esc(q.explanation)}</p></li>`;
  };

  const onKey = (e) => {
    if (screen !== "question" || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      const opt = orders[list[i].id][n - 1];
      if (opt) (e.preventDefault(), choose(opt[0]));
    } else if (e.key === "Enter") {
      if (e.target.closest("button, a")) return; // 按鈕自己處理 Enter
      e.preventDefault();
      if (mode === "exam") i < list.length - 1 ? (i++, question()) : submit();
      else next();
    }
  };
  document.addEventListener("keydown", onKey);

  if (params.get("start") === "1") start();
  else setup();
  if (params.get("start") === "1" && !list.length) setup();

  return () => {
    stopTimer();
    document.removeEventListener("keydown", onKey);
  };
}
