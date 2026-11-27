# ESG 期末考互動複習網站

給 Claude Code 的工作說明。完整規格在 `docs/SPEC.md`，開工前先讀完。

## 這是什麼

使用者的 ESG 課程期末考即將到來，範圍以 GRI 新準則為主，IFRS S1／S2 與 TCFD 為輔。這個網站讓使用者用大樓導覽、翻卡、測驗、找碴快速複習。**時間非常緊**：先做 P0、部署，再做 P1。

## 工作方式

1. 讀 `docs/SPEC.md`。
2. 執行 `/hallmark` 技能處理設計，但**使用者已指定的條件不可更改**：白色底、橘色主色、淡橘輔色、思源黑體（Noto Sans TC）依層級調整字重、資訊分成 bar 與可點擊的互動元件。Hallmark 的主題配色若與此衝突，以使用者指定為準。
3. 實作順序：專案骨架 → 內容驗證腳本 → 大樓 → 測驗 → 翻卡 → **部署第一版** → 對照 → 找碴 → 錯題本 → 首頁倒數。
4. 每完成一個模組就在瀏覽器實際操作一次（桌機＋手機寬度）。
5. 依 `docs/SPEC.md` 第 6 節部署到 Vercel 並限制存取，用無痕視窗實測後再回報連結。

## 鐵則

- **內容只能來自 `content/*.json`**。不可自行加入準則細節、數字、題目或來源；發現內容錯誤時，先修 JSON 並在回報中說明。
- 每題、每張卡、每個面板都要顯示來源連結。
- 標記 `zhUnofficial: true` 的中文名稱要加註「暫譯」。
- 開啟 Vercel Password Protection 可能產生費用，不可自行開啟。
- 所有 `localStorage` 讀寫包在 `try/catch`。
- 介面文字一律使用繁體中文（台灣用語）。

## 指令（建立專案後補上）

```
npm install
npm run dev        # 本機開發
npm run validate   # 驗證 content/
npm run build      # 先跑 validate，再 build
```
