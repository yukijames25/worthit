# worthit

「過去の支出への満足度（👍 / 👎）」から未来の買い物を最適化する家計簿アプリ。

- 🏦 銀行明細風の時系列リスト
- 👍👎 各支出にワンタップで評価
- 🧭 満足度ベースの推奨 / 警告 + 性格診断
- 🌗 ダーク / ライト / システムテーマ
- 🔠 文字サイズ 小・中・大
- ☁️ Supabase 同期（任意）— PCとスマホで同じデータ

---

## ローカル開発

```bash
npm install
npm run dev
```

`http://localhost:5173/` で起動します。

### クラウド同期を有効にする（任意）

何もしなくてもLocalStorageモードで動作しますが、複数端末で同期したい場合は以下のセットアップを行ってください。

#### 1. Supabase プロジェクトを作成

1. <https://supabase.com> でサインアップ → 「New project」
2. プロジェクト作成後、左サイドバーの **SQL Editor** を開く
3. このリポジトリの [`supabase/schema.sql`](./supabase/schema.sql) の中身をコピペして **Run**

#### 2. Google OAuth を設定

1. <https://console.cloud.google.com> でプロジェクト作成 → 「APIとサービス」→「認証情報」
2. **「OAuth クライアント ID を作成」** → アプリケーションタイプ「ウェブアプリケーション」
3. **承認済みのリダイレクト URI** に Supabase のコールバック URL を追加:
   ```
   https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
   ```
4. 生成された **クライアントID** と **クライアントシークレット** をコピー
5. Supabase ダッシュボード → **Authentication → Providers → Google** を ON にして、クライアントID/シークレットを貼り付け → 保存
6. Supabase の **Authentication → URL Configuration** で **Site URL** にVercelのURL（例 `https://worthit-sigma.vercel.app`）を設定

#### 3. 環境変数を設定

Supabaseダッシュボードの **Project Settings → API** から:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

##### ローカル開発用
`.env.example` を `.env.local` にコピーして値を埋める:

```bash
cp .env.example .env.local
# .env.local を編集
```

##### Vercel 本番用
Vercel ダッシュボード → Project → **Settings → Environment Variables** に同じ2つを追加して **Redeploy**。

---

## デプロイ

GitHubに `git push` すれば Vercel が自動で再デプロイします。

```bash
git add . && git commit -m "..." && git push
```

---

## スタック

- Vite + React 19 + TypeScript
- Tailwind CSS 3 (ダークモード `class` 戦略)
- Recharts
- lucide-react
- Supabase（任意）
