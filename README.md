# ESG 期末考互動複習網站（規格包）

這個資料夾是交給 Claude Code 實作用的起始專案。

## 怎麼開始

1. 解壓縮，在終端機進入資料夾。
2. （建議）`git init` 並推上你自己的 GitHub 私人 repo。
3. 在資料夾裡啟動 Claude Code，輸入：

   ```
   讀 CLAUDE.md 和 docs/SPEC.md，照順序實作並部署到 Vercel。
   ```

## 內容

| 路徑 | 說明 |
|---|---|
| `CLAUDE.md` | Claude Code 的工作說明與鐵則 |
| `docs/SPEC.md` | 完整規格：設計、功能、部署、驗收 |
| `content/` | 題庫與知識內容（48 題、20 張概念卡＋約 190 張自動編號卡、8 段找碴） |
| `scripts/validate-content.mjs` | 內容驗證：`node scripts/validate-content.mjs` |

## 之後要改內容

只改 `content/*.json`，改完跑一次驗證腳本。上傳教材後，用語以教材為準。
