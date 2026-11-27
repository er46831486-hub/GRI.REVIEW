// 所有 localStorage 讀寫都包在 try/catch：讀不到就當新使用者
const NS = "esg-review:";

export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(NS + key);
    if (raw == null) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* 私密模式或空間不足：略過 */
  }
}

export function clearAll() {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(NS)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* 略過 */
  }
}
