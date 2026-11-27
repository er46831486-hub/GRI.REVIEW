// Validates content/*.json. Run: node scripts/validate-content.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const load = (f) => JSON.parse(readFileSync(join(root, f), "utf8"));
const errors = [];

const sources = load("sources.json");
const standards = load("standards.json");
const frameworks = load("frameworks.json");
const quiz = load("quiz.json");
const cards = load("flashcards.json");
const spot = load("spot-the-error.json");

const checkSource = (where, key) => {
  if (!sources[key]) errors.push(`${where}: unknown source "${key}"`);
};

// sources
for (const [k, v] of Object.entries(sources)) {
  if (!v.title || !/^https:\/\//.test(v.url || "")) errors.push(`sources.${k}: missing title or https url`);
}
[...standards._meta.sources, ...frameworks._meta.sources].forEach((s) => checkSource("_meta", s));

// standards
const floorIds = new Set();
for (const f of standards.floors) {
  if (floorIds.has(f.id)) errors.push(`floor ${f.id}: duplicate id`);
  floorIds.add(f.id);
  (f.sources || []).forEach((s) => checkSource(`floor ${f.id}`, s));
  (f.standards || []).forEach((s) => (s.sources || []).forEach((x) => checkSource(`floor ${f.id} ${s.code}`, x)));
  if (f.details) {
    const codes = new Set((f.standards || []).filter(Array.isArray).map((s) => s[0]));
    for (const [code, d] of Object.entries(f.details)) {
      if (!codes.has(code)) errors.push(`floor ${f.id}: details for unknown standard ${code}`);
      if (!d.disclosures?.length) errors.push(`floor ${f.id}: details ${code} has no disclosures`);
      for (const x of d.disclosures || []) if (!String(x[0]).startsWith(code + "-")) errors.push(`floor ${f.id}: ${x[0]} not under ${code}`);
    }
    for (const c of codes) if (!f.details[c]) errors.push(`floor ${f.id}: no details for ${c}`);
  }
}

// quiz
const qIds = new Set();
for (const q of quiz.questions) {
  if (qIds.has(q.id)) errors.push(`quiz ${q.id}: duplicate id`);
  qIds.add(q.id);
  const optIds = q.options.map((o) => o[0]);
  if (new Set(optIds).size !== optIds.length) errors.push(`quiz ${q.id}: duplicate option ids`);
  if (!optIds.includes(q.answer)) errors.push(`quiz ${q.id}: answer "${q.answer}" not in options`);
  if (!q.explanation) errors.push(`quiz ${q.id}: missing explanation`);
  checkSource(`quiz ${q.id}`, q.source);
}

// flashcards
for (const c of cards.conceptCards) {
  if (!c.front || !c.back) errors.push(`card ${c.id}: missing front/back`);
  checkSource(`card ${c.id}`, c.source);
}

// spot the error
for (const s of spot.items) {
  for (const i of s.errors) {
    if (i < 0 || i >= s.sentences.length) errors.push(`spot ${s.id}: error index ${i} out of range`);
    if (!s.fixes[String(i)]) errors.push(`spot ${s.id}: missing fix for ${i}`);
  }
  checkSource(`spot ${s.id}`, s.source);
}

if (errors.length) {
  console.error(`content validation failed (${errors.length}):\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`content ok: ${standards.floors.length} floors, ${quiz.questions.length} questions, ${cards.conceptCards.length} concept cards, ${spot.items.length} spot-the-error items`);
