import { spotItems, topicName } from "../data.js";
import { esc, srcLinks, topicBar, getTopics, inTopics } from "../ui.js";
import { load, save } from "../store.js";

export const getSpot = () => load("spot.result", {}); // { id: { missed: [], false: [] } }

export function renderSpot(root, params) {
  let currentId = params.get("id");
  let picked = new Set();
  let revealed = false;

  root.innerHTML = `<section class="mod">
    <header class="mod-head">
      <h1 class="h-mod">找碴</h1>
      <p class="mod-sub">每段報告書片段都藏了錯。點選你認為有錯的句子，可以複選，再按送出。</p>
    </header>
    <div id="fb"></div>
    <div class="itempick" id="items" role="group" aria-label="題目"></div>
    <div id="stage"></div>
  </section>`;

  const avail = new Set(spotItems.map((s) => s.topic));
  const visible = () => spotItems.filter((s) => inTopics(s.topic, getTopics()));

  const drawItems = () => {
    const res = getSpot();
    const v = visible();
    if (!v.some((s) => s.id === currentId)) currentId = v[0]?.id;
    root.querySelector("#items").innerHTML = v
      .map((s) => {
        const r = res[s.id];
        const status = !r ? "未作答" : r.missed.length || r.false.length ? "有錯" : "全對";
        return `<button type="button" class="pill item-pill" data-id="${s.id}" aria-pressed="${s.id === currentId}">${esc(s.title)}<span class="pill-status">${status}</span></button>`;
      })
      .join("");
  };

  const stage = root.querySelector("#stage");
  const drawStage = () => {
    const s = spotItems.find((x) => x.id === currentId);
    if (!s) {
      stage.innerHTML = '<p class="empty">這個篩選條件下沒有題目。</p>';
      return;
    }
    const errs = new Set(s.errors);
    stage.innerHTML = `
      <p class="q-meta">${esc(topicName(s.topic))}</p>
      <h2 class="q-prompt">${esc(s.title)}</h2>
      <ol class="sents">${s.sentences
        .map((t, i) => {
          let cls = "";
          let tag = "";
          if (revealed) {
            const p = picked.has(i);
            if (errs.has(i) && p) (cls = "correct"), (tag = "抓到了");
            else if (errs.has(i)) (cls = "missed"), (tag = "漏抓");
            else if (p) (cls = "wrong"), (tag = "誤判");
            else tag = "正確句";
          }
          const fix = revealed && errs.has(i) ? `<p class="fix"><b>修正：</b>${esc(s.fixes[String(i)])}</p>` : "";
          return `<li class="sent-li"><button type="button" class="sent ${cls}" data-i="${i}" aria-pressed="${picked.has(i)}" ${revealed ? "disabled" : ""}>
            <span class="sent-no">${i + 1}</span><span class="sent-txt">${esc(t)}</span>${tag ? `<span class="opt-tag">${tag}</span>` : ""}</button>${fix}</li>`;
        })
        .join("")}</ol>
      ${
        revealed
          ? `<p class="verdict" role="status">共 ${s.errors.length} 句錯，抓到 ${s.errors.filter((i) => picked.has(i)).length} 句，誤判 ${[...picked].filter((i) => !errs.has(i)).length} 句。</p>`
          : ""
      }
      <div class="qnav">
        ${revealed ? '<button type="button" class="btn btn-ghost" id="redo">重做</button><button type="button" class="btn btn-primary" id="nextitem">下一段</button>' : `<button type="button" class="btn btn-primary" id="send" ${picked.size ? "" : "disabled"}>送出</button>`}
      </div>
      ${srcLinks(s.source)}`;
  };

  stage.addEventListener("click", (e) => {
    const s = spotItems.find((x) => x.id === currentId);
    const b = e.target.closest("[data-i]");
    if (b && !revealed) {
      const i = Number(b.dataset.i);
      picked.has(i) ? picked.delete(i) : picked.add(i);
      b.setAttribute("aria-pressed", String(picked.has(i)));
      stage.querySelector("#send").disabled = picked.size === 0;
      return;
    }
    if (e.target.closest("#send")) {
      revealed = true;
      const res = getSpot();
      res[s.id] = { missed: s.errors.filter((i) => !picked.has(i)), false: [...picked].filter((i) => !s.errors.includes(i)) };
      save("spot.result", res);
      drawItems();
      drawStage();
      stage.querySelector(".verdict")?.scrollIntoView({ block: "nearest" });
    } else if (e.target.closest("#redo")) {
      reset();
    } else if (e.target.closest("#nextitem")) {
      const v = visible();
      const k = v.findIndex((x) => x.id === currentId);
      currentId = v[(k + 1) % v.length].id;
      reset();
    }
  });

  const reset = () => {
    picked = new Set();
    revealed = false;
    drawItems();
    drawStage();
  };

  root.querySelector("#items").addEventListener("click", (e) => {
    const b = e.target.closest("[data-id]");
    if (!b) return;
    currentId = b.dataset.id;
    reset();
  });
  root.querySelector("#fb").append(topicBar(reset, avail));
  reset();
}
