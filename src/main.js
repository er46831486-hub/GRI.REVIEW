import "./styles/tokens.css";
import "./styles/app.css";
import { renderHome } from "./views/home.js";
import { renderGri } from "./views/gri.js";
import { renderCompare } from "./views/compare.js";
import { renderCards } from "./views/cards.js";
import { renderQuiz } from "./views/quiz.js";
import { renderSpot } from "./views/spot.js";
import { renderReview } from "./views/review.js";

const routes = {
  "": renderHome,
  gri: renderGri,
  building: renderGri, // 舊網址相容
  compare: renderCompare,
  cards: renderCards,
  quiz: renderQuiz,
  spot: renderSpot,
  review: renderReview,
};

const main = document.getElementById("main");
let cleanup = null;

function go() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const mod = routes[path] ? (path === "building" ? "gri" : path) : "";
  if (typeof cleanup === "function") cleanup();
  cleanup = null;
  main.innerHTML = "";
  document.querySelectorAll(".modnav a").forEach((a) => {
    if (a.dataset.mod === mod) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const cur = document.querySelector(".modnav a[aria-current]");
  if (cur) cur.scrollIntoView({ block: "nearest", inline: "nearest" });
  cleanup = routes[mod](main, new URLSearchParams(query));
  window.scrollTo(0, 0);
}

// 所有可展開 bar 的統一處理
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-acc]");
  if (!b) return;
  const panel = document.getElementById(b.getAttribute("aria-controls"));
  if (!panel) return;
  const open = b.getAttribute("aria-expanded") !== "true";
  b.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
});

window.addEventListener("hashchange", go);
go();
