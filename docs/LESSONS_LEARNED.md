# Lessons Learned — 本番開発で踏んだ落とし穴 7 個

> このプロジェクトを本番運用するまでに、コードを書くこと自体より **「なぜ動かないのか」を突き止めること** に時間を使ったケースがいくつもあった。
> ここでは、エラー画面を貼って終わりにせず、**症状 → 仮説 → 原因究明 → 修正 → 学び** の流れで残す。
> 同じ罠にハマる人 (含む将来の自分) への手紙でもある。

---

## 🧩 全体マップ

| # | 沼 | 領域 | 時間 |
|---|---|---|---|
| 1 | ESM / CommonJS の出力不一致 | Node / TypeScript / Vercel | 30分 |
| 2 | ESM では相対 import に `.js` が必須 | Node ESM | 10分 |
| 3 | Stripe SDK v22 の型構造変更 | TypeScript / npm | 20分 |
| 4 | RLS の無限再帰 | PostgreSQL / Supabase | 25分 |
| 5 | PostgREST の `INSERT ... RETURNING` の罠 | PostgREST | 20分 |
| 6 | RLS 政策の連鎖漏れ | PostgreSQL / RLS 設計 | 15分 |
| 7 | SQL マイグレーションの冪等性 | DDL 運用 | 10分 |

合計 約 2 時間 30 分を「動かす」 ために使った。全部、**実装中ではなく本番デプロイで初めて表面化** したのが共通点。

---

## 🐛 Lesson 1 — `exports is not defined in ES module scope`

### 症状
Stripe Checkout を押した瞬間、Vercel Functions のログに:

```
ReferenceError: exports is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file
extension and '/var/task/package.json' contains "type": "module".
```

ローカルの `tsc --noEmit` は通る。`npm run build` も通る。本番だけ落ちる。

### 仮説と検証

**仮説 A**: ソースが CommonJS の `require` を使ってる？
→ `grep -nE "require\(|module\.exports|exports\." api/*.ts` で確認。**全部 ES module syntax (`import`, `export default`)**。NG。

**仮説 B**: ビルド設定の問題？
→ `api/tsconfig.json` を確認:
```json
{
  "compilerOptions": {
    "module": "commonjs",   // ⚠️ ココ
    ...
  }
}
```

ソースは ES module だが、TypeScript コンパイラに `module: commonjs` と指定していた。コンパイル出力は CommonJS の `exports.handler = ...`。これが Node の ESM ランタイムで実行されて爆発。

### 根本原因
- ルート `package.json` に `"type": "module"` がある → Vercel は `.js` を ESM として実行
- `api/tsconfig.json` の `module: commonjs` → コンパイル出力は CJS
- **両者の意図が食い違う**

ローカル開発では Vite 経由のフロントが動くだけで、api/ は Vercel が動かす。だからローカル `npm run dev` では再現しない。

### 修正

```diff
// api/tsconfig.json
{
  "compilerOptions": {
-   "module": "commonjs",
+   "module": "esnext",
    "moduleResolution": "bundler",
+   "isolatedModules": true,
+   "verbatimModuleSyntax": false,
    ...
  }
}
```

### 学び
- **ローカルで通っても本番で落ちる場合、build pipeline の各層を疑う**
- TypeScript の `module` 出力 と Node の実行モード (ESM/CJS) は常にペアで考える
- `package.json` の `"type": "module"` の影響範囲は思ったより広い
- **エラーメッセージは丁寧に読む**。「This file is being treated as an ES module because…」の補足が答えそのものだった

---

## 🐛 Lesson 2 — `ERR_MODULE_NOT_FOUND` on relative imports

### 症状
Lesson 1 を直して再デプロイしたら、今度は:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib'
imported from /var/task/api/checkout.js
```

`api/_lib.ts` は確かに存在する。Vercel がビルドしている。

### 仮説と検証
TypeScript の **`bundler` モジュール解決** は拡張子を省略できる。だから `from './_lib'` で OK だった (コンパイラ的には)。

でも実行時の Node.js は **ESM では拡張子明示が必須**。`'./_lib'` を見て `_lib` ディレクトリも `_lib.js` も `_lib.ts` も全部探さず、そのまま「無い」と判定する。

### 根本原因
TypeScript の moduleResolution と Node ESM のモジュール解決の **思想の違い**:

| 仕組み | 相対 import に拡張子 |
|---|---|
| TS `moduleResolution: node` (CommonJS) | 省略 OK |
| TS `moduleResolution: bundler` | 省略 OK |
| TS `moduleResolution: nodenext` (ESM) | **必須** |
| Node ESM (実行時) | **必須** |

`bundler` を使うとコンパイラは怒らないが、Node は実行時に怒る。

### 修正
TS ソースの拡張子は `.ts` のままで OK。**import パスだけ `.js` にする** (TypeScript はこれを許容する):

```diff
// api/checkout.ts
- import { getStripe, json } from './_lib';
+ import { getStripe, json } from './_lib.js';
```

3 ファイル全部に同じ変更。

### 学び
- Node ESM の **「相対 import は拡張子明示」** は仕様。慣れるしかない
- TS の `moduleResolution: bundler` は柔軟だが、**Node ランタイムの厳格さは別問題**
- 一括変換は `grep -nE "from '\./" api/*.ts` でリスト化してから

---

## 🐛 Lesson 3 — Stripe SDK v22 の型階層が変わっていた

### 症状
ローカルで `npx tsc --noEmit -p api/tsconfig.json` を ESM 設定に切り替えたら:

```
api/_lib.ts: Namespace '"...stripe.esm.node".Stripe' has no exported member 'Stripe'.
```

`Stripe.Stripe.Event` のような書き方が CJS 版では通ったが、ESM 版では通らなくなった。

### 仮説と検証
Stripe SDK v18 以降、default export が **callable namespace** (関数として new でき、かつ namespace としてサブ型を持つ) に統一されている。CJS と ESM では namespace の内部構造が微妙に違う:

```typescript
// CJS (TypeScript 補助)
import Stripe from 'stripe';
// Stripe は StripeConstructor 名前空間。class type は Stripe.Stripe にネスト

// ESM
import Stripe from 'stripe';
// Stripe はクラス型そのもの
```

### 修正
**型の名前空間を直接使うのを避け、必要な型だけ自前で書く**。webhook handler では `Stripe.Subscription` などを使う代わりに:

```typescript
// 必要なフィールドだけを抜き出した軽量型
interface SubscriptionLike {
  id: string;
  customer: string | { id: string };
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | ...;
  current_period_end: number;
  metadata?: Record<string, string>;
}

// 受け取った event.data.object を as でキャスト
const sub = event.data.object as SubscriptionLike;
```

これで CJS / ESM どちらでも動き、SDK のメジャーアップでも壊れにくい。

### 学び
- **外部 SDK のメジャーバージョン更新は型階層が変わる前提で見る**
- 100% の型安全より、**ランタイム互換性 + 必要十分の型** の方が長続きする
- Webhook handler は「Stripe が送ってくる JSON」を信じるのが基本。SDK 型と完全一致させなくていい

---

## 🐛 Lesson 4 — RLS の無限再帰検出

### 症状
家族グループ機能を追加した直後、明細画面で:

```
⚠️ データ取得エラー
infinite recursion detected in policy for relation "household_members"
```

トランザクション読み取りすら 500 系で落ちる。家族機能の入口にすら立てない。

### 仮説と検証
最初に書いた RLS:

```sql
create policy "members: select if same household"
  on public.household_members for select
  using (
    household_id IN (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );
```

これは:
1. クライアントが `select * from household_members` する
2. RLS 政策が起動: `household_id IN (subquery from household_members)`
3. **subquery 自体も `household_members` を読むので、再び同じ RLS 政策が起動**
4. → 無限ループ → PostgreSQL が検出して abort

### 根本原因
**自テーブルを参照する RLS 政策** は再帰の温床。クライアント視点の WHERE 句なら問題ないが、RLS のような暗黙適用される条件では危険。

### 修正
`SECURITY DEFINER` 関数で RLS をバイパスして判定する **Supabase 公式パターン**:

```sql
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.household_members
    where household_id = p_household_id
    and user_id = auth.uid()
  );
$$;

grant execute on function public.is_household_member(uuid) to authenticated;
```

`security definer` は **関数の所有者の権限で実行** されるため、関数内の SELECT は RLS をスキップする。再帰しなくなる。

そして政策を書き換え:

```diff
create policy "members: select if same household"
  on public.household_members for select
  using (
-   household_id IN (
-     select household_id from public.household_members where user_id = auth.uid()
-   )
+   user_id = auth.uid()
+   OR public.is_household_member(household_id)
  );
```

同じ関数で `households`、`transactions`、`receipts` の政策も書き換え。全部、自テーブル subquery が消える。

### 学び
- **「政策の中で同じテーブルを参照しない」** は RLS の鉄則
- Supabase docs に明記されている **典型的な罠**。実装前に読むべき
- `security definer` は強力だが、**`set search_path` を必ず付ける** (悪意ある object 改変を防ぐ)
- グループメンバーシップ、フォロー関係、コラボレーション系はほぼ全て同じ問題に当たる

---

## 🐛 Lesson 5 — `INSERT ... RETURNING` で 403 Forbidden

### 症状
RLS 再帰を直した後、家族グループの「作成」ボタンを押すと:

```
POST https://.../rest/v1/households?select=id,name,owner_id 403 (Forbidden)
```

INSERT 政策は通るはずなのに 403。

### 仮説と検証
コードを見る:
```typescript
const { data, error } = await supabase
  .from('households')
  .insert({ name, owner_id: userId })
  .select('id, name, owner_id')   // ⬅️ ココ
  .single();
```

`.select(...).single()` を後ろに付けると、PostgREST は **INSERT ... RETURNING ...** に展開する。

これは2段階の権限チェックが必要:
1. INSERT 政策の WITH CHECK が通る
2. SELECT 政策が **新規挿入された行を読める**

SELECT 政策:
```sql
create policy "households: select if member"
  on public.households for select
  using (public.is_household_member(id));
```

「メンバーなら見える」。でも **作ったばかりの行にはまだメンバーが居ない** (member の INSERT はこの後)。だから RETURNING が空 → 403。

### 根本原因
**「自分が今作った行を、自分で読めない」** という権限設計のバグ。RLS は同期的に評価されるので、トランザクション内でも矛盾は許されない。

### 修正
SELECT 政策に **オーナーは無条件で見える** を追加:

```diff
create policy "households: select if member or owner"
  on public.households for select
  using (
+   owner_id = auth.uid()
+   OR
    public.is_household_member(id)
  );
```

これで:
1. INSERT (owner_id = me) ✓
2. SELECT (owner = me) → 政策の前半が true で読める ✓
3. RETURNING が値を返す ✓

### 学び
- **`.insert().select()` は 2 つの権限ゲートを通る**
- 「メンバーシップ」のような **時間軸を持つ条件** で SELECT 政策を組むと、**INSERT 直後の行が読めない盲点** が生まれる
- 「作成者は常に自分のリソースを読める」を SELECT 政策に **必ず** 入れる
- PostgREST のシグナルは 403 だが、エラーメッセージ自体は何も示唆しない。**疑ったのは「SELECT 政策のせいかも」という仮説検証あり**

---

## 🐛 Lesson 6 — INSERT 政策の連鎖漏れ

### 症状
Lesson 5 を直した直後、`createHousehold` の 1 段目 (households INSERT) は通るようになった。が、2 段目:

```typescript
// 自分自身を最初のメンバーとして追加
await supabase
  .from('household_members')
  .insert({ household_id: data.id, user_id: userId, role: 'owner' });
```

これが **silent fail** していた。エラーも出ず、`household_members` 行が増えてない。

### 仮説と検証
RLS の **INSERT 政策が無い** = 全 INSERT が拒否される (RLS は default deny)。

スキーマを確認:
```sql
-- メンバー追加は service_role 経由のみ (invite フロー)。
create policy "members: delete self only"
  on public.household_members for delete
  using (user_id = auth.uid());
```

コメントに「service_role 経由のみ」と書いていたが、`createHousehold` はクライアントから直接 INSERT していた。**ドキュメントと実装の意図が食い違っていた**。

### 修正
オーナーは自分自身を最初のメンバーとして追加できる、という INSERT 政策を追加:

```sql
create policy "members: insert self if owner"
  on public.household_members for insert
  with check (
    user_id = auth.uid()
    AND household_id IN (
      select id from public.households where owner_id = auth.uid()
    )
  );
```

`user_id = auth.uid()` で自己挿入のみ、`household_id IN ...` で自分が owner のグループのみ、と二重に絞る。第三者の household に勝手に入る攻撃を防ぐ。

### 学び
- **RLS は default deny**。INSERT 政策を書き忘れると黙って失敗する
- silent fail は最悪。ログを必ず見る、UI に **エラー表示の経路を作る**
- 「ドキュメント上の意図」と「実装の振る舞い」のズレは、コードレビューで一度で気付くべき
- 政策セットを設計する時は **CRUD 4 つ全部、誰が何できるか** を表にする

---

## 🐛 Lesson 7 — マイグレーションの非冪等性

### 症状
スキーマを 2 回目に走らせると:

```
ERROR: 42710: policy "receipts: read own or household" for table "objects" already exists
```

最初の実行は成功した。ファイルを変えてもいない 2 回目で失敗する。

### 仮説と検証
SQL を読み返す:

```sql
drop policy if exists "receipts: read own" on storage.objects;
create policy "receipts: read own or household" on storage.objects ...
```

- 旧政策の名前: `receipts: read own`
- 新政策の名前: `receipts: read own or household`

DROP するのは **旧名のみ**。1 回目の実行で新政策が作られた後、2 回目以降は **新名がそのまま残っている** ので CREATE で衝突する。

### 根本原因
**「政策を rename した」** つもりが、実は古い名前を drop して新しい名前を create している。古い名前は無いので drop は no-op。新しい名前を 2 回目以降 drop していないので CREATE が衝突する。

PostgreSQL の `CREATE POLICY` には `OR REPLACE` 構文が無い (関数とは違う)。`DROP POLICY IF EXISTS` をペアで書くしかない。

### 修正
**新旧両方** drop してから create する:

```diff
drop policy if exists "receipts: read own" on storage.objects;
+ drop policy if exists "receipts: read own or household" on storage.objects;
create policy "receipts: read own or household" on storage.objects ...
```

これで「政策名を変えても、何回流しても通る」マイグレーションになる。

### 学び
- **マイグレーションは何回流しても結果が変わらない (idempotent) 設計が大前提**
- 政策を rename した時は **旧名と新名の両方 drop** がパターン
- 1 回目だけ通って 2 回目で失敗する SQL は、**チームメンバーが pull した時に壊れる**ので絶対に許してはいけない
- `IF NOT EXISTS` / `IF EXISTS` を全 DDL に付ける癖をつける

---

## 🎓 メタな学び

7 個の沼を抜けて分かったこと:

### 1. 「本番でしか起きないバグ」は構造的に潜む

ローカル開発の Vite は親切で、TypeScript は型を緩く解釈し、PostgreSQL は手元の Docker で動く。**全部、本番より易しい**。

本番の Vercel Functions は ESM、Vercel の Supabase は本物の RLS、ユーザーは想定外の操作をする。**ローカルが緑でも本番で赤になる前提で構える** ことが大事。

### 2. エラーメッセージは「ヒント」、原因は別の場所にある

- `exports is not defined` → 問題は「export してない」じゃなくて「TS が CJS 出力にしてた」
- `403 Forbidden on POST` → 問題は INSERT じゃなくて SELECT 政策
- `infinite recursion detected` → 問題は再帰そのものより、**そういう書き方をしてしまった RLS 設計**

エラーは入口、根本原因は数層下。

### 3. AI ペアプロでも「最後の 5%」は人間が踏ん張る

このプロジェクトは AI と組んで超速で進んだ。でも:
- 「Vercel ログを見る」「Supabase の Policies タブで確認する」「Stripe Test Mode に切り替える」
- これらは **AI が代わりにやれない**。人間の判断と操作。

「AI が書いた」ではなく、**「AI と一緒に書いて、本番で動かして、壊れた所を直した」** が本物の経験になる。

### 4. RLS は強力だが、設計の難易度が高い

サーバーレスにすると、フロントに権限ロジックを書かずに済むのが利点。だがその代わり **データベース層の設計が全部** になる。

家族グループ機能を作ってみて初めて分かった:
- 政策の数: 5 テーブル × 4 CRUD = **20 個ぐらい必要**
- 再帰や connectivity の問題が出る
- INSERT.RETURNING のような **PostgREST 固有の罠** がある

これは Express + Prisma で書くより難しい部分もある。代わりに、**正しく書けば本当に堅牢**。

---

## 🔧 デバッグツールキット (実際使ったやつ)

| ツール | 用途 |
|---|---|
| Vercel Dashboard → Functions → Logs | サーバー側の例外 stack trace |
| Supabase → Database → Policies | RLS の現状 (現在の名前と内容) |
| Supabase → Database → Logs | 実際走った SQL とエラー詳細 |
| Stripe Dashboard → Webhooks → Recent Deliveries | Webhook payload と response |
| Chrome DevTools → Network | フロント発の HTTP リクエスト |
| `npx tsc --noEmit -p <config>` | コンパイル時の型不整合検出 |
| `grep -nE "pattern" src/**/*.ts` | パターン検索 (CommonJS 残骸など) |
| `console.error` + Vercel Logs | ピンポイントなトレース |

**特に効いた組み合わせ**: Network で 403 を見る → リクエスト URL から該当エンドポイント特定 → Vercel Functions Log で完全な stack trace 確認 → Supabase Policies で対応する政策を読む。

---

## 🧭 まとめ

> 「動かない」 → 「直る」 までの間に何が起きているかを、エンジニアは語れる必要がある。

このドキュメントは、worthit が **本番で実際に動くまでに踏んだ罠を、後から再現できるレベル** で残したものです。

書類選考や面接で「家計簿アプリを個人で作りました」だけでは差がつかない時代、**「これを動かすために RLS の再帰検出に当たって SECURITY DEFINER で直しました」** と語れることの方が、本当の戦力を示す。

その意味で、ハマった時間は無駄ではなく、**ポートフォリオの一番濃い部分** だった。

---

📖 関連ドキュメント:
- [`AI_BUILD_PROCESS.md`](./AI_BUILD_PROCESS.md) — 全体のプロジェクト進行と AI ペアプロのフロー
- [`DECISIONS.md`](./DECISIONS.md) — 設計上の意思決定とトレードオフ
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — 完成系のアーキテクチャ
