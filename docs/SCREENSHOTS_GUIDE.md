# Screenshots guide

This is what to capture to make the portfolio land. **Quality > quantity** — 4 great shots beat 12 mediocre ones.

Save everything under `docs/screenshots/` (the README will reference them from there).

---

## The shortlist (target: 4 images)

### 1. **Hero shot** → `docs/screenshots/01-hero.png`
The "what is this app?" image. Recommended:
- **Statement screen** with sample data loaded (use 「サンプルデータで試してみる」).
- 👍👎 buttons visible on a few rows, ideally with the **green/red satisfaction bar** showing on the summary card.
- **Light mode** (looks brighter for a thumbnail).
- Pixel size around **1200×800** or wider (Retina if possible).

### 2. **Advice / monthly chart** → `docs/screenshots/02-advice.png`
The "intelligent" angle:
- **Advice screen** with at least one Recommendation card and one Warning card visible.
- The pie chart + 6-month bar chart.
- Same theme/mode as hero shot for consistency.

### 3. **Dark mode** → `docs/screenshots/03-dark.png`
Show the same screen (statement or advice) in **dark mode**. Lets reviewers see you actually did theme work, not just "added `dark:` to one button."

### 4. **PDF report** → `docs/screenshots/04-pdf-report.png`
After subscribing in Stripe test mode:
- Click 「PDFレポートをダウンロード」 in Settings
- Open the downloaded PDF and screenshot the rendered page.
- This is the "I shipped a real Pro feature with real output" proof.

### Bonus (optional)
- `05-personality.png` — the colorful personality result page
- `06-upgrade-sheet.png` — the Pro upgrade bottom-sheet (shows monetization UX)
- `07-recurring.png` — recurring transactions sheet (shows depth of feature set)

---

## How to take them

### On macOS
- `Cmd + Shift + 4` → drag to select → screenshot saved to Desktop
- For crispness on Retina, that's already 2× DPR

### On Windows (Chrome)
- Open DevTools (`F12`) → toggle device toolbar (`Ctrl+Shift+M`)
- Choose **「iPhone 14 Pro」** or similar mobile preset to get the phone view
- Click the **⋯ menu** in the device toolbar → **「スクリーンショットをキャプチャ」**

### On Vercel deploy
Just open `https://worthit-sigma.vercel.app` on your laptop and use the above. Vercel's HTTPS gives you a clean URL bar (no `localhost`).

---

## Wiring screenshots into the README

After dropping the files in `docs/screenshots/`, replace the README "🎯 What it is" or "✨ What's inside" section with:

```markdown
<div align="center">

| Statement | Advice | PDF report |
|---|---|---|
| ![](docs/screenshots/01-hero.png) | ![](docs/screenshots/02-advice.png) | ![](docs/screenshots/04-pdf-report.png) |

</div>
```

Or if you want a single bigger hero:

```markdown
<div align="center">
  <img src="docs/screenshots/01-hero.png" width="320" alt="worthit Statement screen" />
</div>
```

GitHub serves images directly from the repo, so no hosting setup needed.

---

## After the screenshots are in

Optional but high-impact:

1. **Record a 30-second screen capture** of yourself using the app (add a transaction → rate it 👍 → check Advice tab). Upload to YouTube unlisted or Twitter. Add the link to the README hero.
2. **Pin the worthit repo** on your GitHub profile.
3. **Write a LinkedIn post** about the build — title: *"AIペアプロでフルスタックの個人アプリを N 日で本番リリースした話"*. Link to the live demo + repo + this README.
4. Submit to **Hacker News** as a "Show HN" if you feel brave.

The cliché works: **`hero shot → live demo button → architecture → AI build process` is the order recruiters read.** Optimize for that path.
