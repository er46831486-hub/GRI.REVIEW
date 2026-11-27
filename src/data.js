import sources from "../content/sources.json";
import standards from "../content/standards.json";
import frameworks from "../content/frameworks.json";
import quiz from "../content/quiz.json";
import flashcards from "../content/flashcards.json";
import spot from "../content/spot-the-error.json";

export { sources, standards, frameworks };
export const questions = quiz.questions;
export const spotItems = spot.items;

export const TOPICS = [
  ["gri-1", "GRI 1"],
  ["gri-2", "GRI 2"],
  ["gri-3", "GRI 3"],
  ["gri-100", "101–103"],
  ["gri-200", "200"],
  ["gri-300", "300"],
  ["gri-400", "400"],
  ["gri-sector", "行業"],
  ["tcfd", "TCFD"],
  ["ifrs", "IFRS"],
  ["taiwan", "台灣"],
  ["compare", "對照"],
];
export const topicName = (id) => (TOPICS.find((t) => t[0] === id) || [id, id])[1];

export const floorById = Object.fromEntries(standards.floors.map((f) => [f.id, f]));

// 由 standards.json 自動產生「編號 ⇄ 名稱」雙向卡
function codeCards() {
  const out = [];
  const add = (topic, code, name, source, unofficial = false) => {
    const key = code.replace(/\s+/g, "");
    out.push({ id: `n:${key}:f`, topic, dir: "fwd", front: code, back: name, source, unofficial, isNew: topic === "gri-100" });
    out.push({ id: `n:${key}:r`, topic, dir: "rev", front: name, back: code, source, unofficial, isNew: topic === "gri-100" });
  };
  for (const f of standards.floors) {
    const src = (f.sources || [])[0];
    (f.sections || []).forEach((s) => s.disclosures.forEach(([c, n]) => add(f.id, `GRI ${c}`, n, src)));
    (f.disclosures || []).forEach(([c, n]) => add(f.id, `GRI ${c}`, n, src));
    for (const s of f.standards || []) {
      if (Array.isArray(s)) {
        const code = /^GRI/.test(s[0]) ? s[0] : `GRI ${s[0]}`;
        add(f.id, code, s[1], src);
      } else {
        const ssrc = (s.sources || [])[0] || src;
        add(f.id, s.code, s.zh, ssrc, !!s.zhUnofficial);
        (s.disclosures || []).forEach(([c, n]) => add(f.id, `GRI ${c}`, n, ssrc, !!s.zhUnofficial));
      }
    }
  }
  return out;
}

export const allCards = [
  ...flashcards.conceptCards.map((c) => ({ ...c, dir: "concept", isNew: c.topic === "gri-100" })),
  ...codeCards(),
];
export const cardById = Object.fromEntries(allCards.map((c) => [c.id, c]));
export const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
