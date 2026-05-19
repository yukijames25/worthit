import type { Locale } from '../types';

/**
 * フラットな key→翻訳のマップ。
 * 値は ja/en の組。値補間が必要な場合は `{key}` 形式を使い、t(key, { key: value }) で展開。
 */
export interface Strings {
  // App / Header
  appName: string;
  appTagline: string;

  // Screen titles
  screen_statement_title: string;
  screen_statement_subtitle: string;
  screen_advice_title: string;
  screen_advice_subtitle: string;
  screen_result_title: string;
  screen_result_subtitle: string;
  screen_settings_title: string;
  screen_settings_subtitle: string;

  // Bottom nav
  nav_statement: string;
  nav_advice: string;
  nav_result: string;
  nav_settings: string;

  // Statement
  balance: string;
  income: string;
  expense: string;
  net: string;
  satisfaction: string;
  searchPlaceholder: string;
  filter_all: string;
  filter_expense: string;
  filter_income: string;
  filter_unrated: string;
  empty_title: string;
  empty_body: string;
  empty_addBtn: string;
  empty_seedBtn: string;
  noMatch: string;

  // Statement budget card
  budget_setupCta: string;
  budget_setupSubtle: string;
  budget_month: string;
  budget_change: string;
  budget_over: string;
  budget_remaining: string;
  budget_elapsed: string;
  budget_projected: string;

  // Input sheet
  addTitle: string;
  type_expense: string;
  type_income: string;
  amount: string;
  date: string;
  category: string;
  newCategory: string;
  backToPresets: string;
  customCategoryPlaceholder: string;
  memo: string;
  memoOptional: string;
  memoExpensePlaceholder: string;
  memoIncomePlaceholder: string;
  save: string;
  cancel: string;
  close: string;
  delete: string;

  // Advice screen
  recommend_title: string;
  recommend_subtitle: string;
  warning_title: string;
  warning_subtitle: string;
  pie_title: string;
  monthlyTrend_title: string;
  monthlyReview_title: string;
  monthlyReview_topCat: string;
  monthlyReview_addEval: string;
  monthlyReview_high: string;
  monthlyReview_low: string;
  monthlyReview_mid: string;
  rec_emptyGood: string;
  rec_emptyBad: string;
  rec_reasonGood: string;
  rec_reasonBad: string;
  rec_amount: string;
  yourType: string;

  // Result
  conf: string;
  youAre: string;
  outline: string;
  aiCoach: string;
  strengths: string;
  blindspots: string;
  axes_title: string;
  topCategories: string;
  satisfaction_summary: string;
  fulfilled_label: string;
  regret_label: string;
  fulfilled_hint: string;
  regret_hint: string;
  reset_all: string;

  // Settings
  settings_accountTitle: string;
  settings_logout: string;
  settings_loginToSync: string;
  settings_login: string;
  account_signed_in: string;
  account_local: string;
  account_local_body: string;
  account_cloud_disabled: string;
  account_cloud_disabled_body: string;
  account_unauthed: string;
  account_unauthed_body: string;

  settings_budgetTitle: string;
  settings_budgetSubtitle: string;
  settings_budgetCurrent: string;
  settings_budgetResetPreset: string;
  settings_budgetSaved: string;

  settings_customizeTitle: string;
  settings_categoryManage: string;
  settings_categorySubtle: string;
  settings_recurring: string;
  settings_recurringSubtle: string;
  settings_recurringCount: string;

  settings_appearance: string;
  settings_appearance_sub: string;
  theme_light: string;
  theme_light_desc: string;
  theme_dark: string;
  theme_dark_desc: string;
  theme_system: string;
  theme_system_desc: string;

  settings_fontTitle: string;
  settings_fontSubtitle: string;
  font_sm: string;
  font_md: string;
  font_lg: string;
  font_note: string;

  settings_langTitle: string;
  settings_langSubtitle: string;
  lang_ja: string;
  lang_en: string;

  settings_dataTitle: string;
  settings_dataCloud: string;
  settings_dataLocal: string;
  settings_recordCount: string;
  settings_count_unit: string;
  settings_export: string;
  settings_import: string;
  settings_deleteAll: string;
  confirm_deleteAll: string;

  settings_about: string;
  about_body: string;

  // Login
  login_tagline: string;
  feature_statement_t: string;
  feature_statement_b: string;
  feature_rate_t: string;
  feature_rate_b: string;
  feature_ai_t: string;
  feature_ai_b: string;
  feature_sync_t: string;
  feature_sync_b: string;
  login_google: string;
  login_localOnly: string;
  login_footnote_cloud: string;
  login_footnote_local: string;

  // Migration prompt
  mig_title: string;
  mig_body: string;
  mig_records: string;
  mig_expSum: string;
  mig_incSum: string;
  mig_uploadBtn: string;
  mig_dismissBtn: string;

  // Update banner
  update_title: string;
  update_body: string;
  update_button: string;

  // Boot
  booting: string;
  loading: string;

  // Recurring
  recurring_addBtn: string;
  recurring_emptyTitle: string;
  recurring_emptyBody: string;
  recurring_note: string;
  recurring_dayLabel: string;
  recurring_dayHint: string;
  recurring_nextDue: string;
  recurring_pause: string;
  recurring_resume: string;
  recurring_categoryPh: string;
  recurring_memoPh: string;
  recurring_monthly_marker: string;
  recurring_marker_suffix: string;

  // Category manager
  cat_managerTitle: string;
  cat_addNew: string;
  cat_editBtn: string;
  cat_preview: string;
  cat_labelHint: string;
  cat_kindLabel: string;
  cat_kindHint: string;
  cat_emojiLabel: string;
  cat_colorLabel: string;
  cat_preset: string;
  cat_custom: string;
  cat_managerNote: string;

  // Import
  import_title: string;
  import_body: string;
  import_addedCount: string;
  import_dupCount: string;
  import_errCount: string;
  import_previewTitle: string;
  import_btn: string;
  import_btnEmpty: string;
  import_errorsHeader: string;

  // Misc
  income_badge: string;
  thumb_good: string;
  thumb_bad: string;
}

const ja: Strings = {
  appName: 'worthit',
  appTagline: '満足度から未来の買い物を最適化する家計簿',

  screen_statement_title: '明細',
  screen_statement_subtitle: '記録を時系列で振り返る',
  screen_advice_title: 'アドバイス',
  screen_advice_subtitle: '満足度から次の一手を提案',
  screen_result_title: 'パーソナリティ',
  screen_result_subtitle: 'お金が語る、あなたの輪郭',
  screen_settings_title: '設定',
  screen_settings_subtitle: 'アカウントと表示',

  nav_statement: '明細',
  nav_advice: 'アドバイス',
  nav_result: '診断',
  nav_settings: '設定',

  balance: '残高',
  income: '収入',
  expense: '支出',
  net: '差引',
  satisfaction: '満足度',
  searchPlaceholder: 'カテゴリやメモで検索…',
  filter_all: 'すべて',
  filter_expense: '支出のみ',
  filter_income: '収入のみ',
  filter_unrated: '未評価',
  empty_title: 'まずは最初の記録を',
  empty_body:
    '収入や支出を記録すると、ここに利用明細のように並びます。買い物のあとは「買ってよかった👍 / 後悔👎」をワンタップで残せます。',
  empty_addBtn: '+ 記録する',
  empty_seedBtn: 'まずはサンプルデータで試してみる',
  noMatch: '該当する記録がありませんでした。',

  budget_setupCta: '月の予算を設定して進捗を見る',
  budget_setupSubtle: '{month}の支出 {amount}',
  budget_month: '{month} の予算',
  budget_change: '変更',
  budget_over: '予算超過 {amount}',
  budget_remaining: '残り {amount}',
  budget_elapsed: '{elapsed}/{total}日経過',
  budget_projected: '月末予想 {amount}',

  addTitle: '記録を追加',
  type_expense: '💸 支出',
  type_income: '💰 収入',
  amount: '金額',
  date: '日付',
  category: 'カテゴリ',
  newCategory: '+ 新しいカテゴリ',
  backToPresets: 'プリセットに戻る',
  customCategoryPlaceholder: '例：サブスク、旅行、コーヒー…',
  memo: 'メモ',
  memoOptional: '（任意）',
  memoExpensePlaceholder: '例：お気に入りのカフェでランチ',
  memoIncomePlaceholder: '例：5月分の給料',
  save: '記録する',
  cancel: 'キャンセル',
  close: '閉じる',
  delete: '削除',

  recommend_title: 'あなたを幸せにするお金の使い方',
  recommend_subtitle: '満足度の高いカテゴリ',
  warning_title: '注意すべき無駄遣い',
  warning_subtitle: '後悔の声が多いカテゴリ',
  pie_title: '支出の内訳',
  monthlyTrend_title: '過去6ヶ月の推移',
  monthlyReview_title: '{month} の振り返り',
  monthlyReview_topCat: 'この月のいちばんの支出は',
  monthlyReview_addEval: ' 👍👎をつけると、来月の提案がより的確になります。',
  monthlyReview_high: ' 満たされる使い方ができてます！',
  monthlyReview_low: ' 後悔の比重が高め。買う前にひと呼吸を。',
  monthlyReview_mid: ' 評価を増やして傾向を掴みましょう。',
  rec_emptyGood:
    '👍 評価がまだ少ないか、特に目立つカテゴリがありません。記録に「買ってよかった」をつけると、ここに推奨が表示されます。',
  rec_emptyBad: '👎 評価された支出のうち、後悔がついたカテゴリはまだありません。',
  rec_reasonGood: '満足度 {pct}% — 自分を幸せにする支出として続ける価値があります。',
  rec_reasonBad: '後悔率 {pct}% — 次に手が伸びたら、買う前にひと呼吸。',
  rec_amount: '記録合計 {amount}',
  yourType: 'あなたの性格タイプ',

  conf: 'CONF',
  youAre: 'YOU ARE',
  outline: 'あなたの輪郭',
  aiCoach: 'AI Coach',
  strengths: '得意なこと',
  blindspots: '気にすべきこと',
  axes_title: '性格軸スコア',
  topCategories: '支出のトップ3',
  satisfaction_summary: '満足度サマリー',
  fulfilled_label: '満たされ度',
  regret_label: '後悔率',
  fulfilled_hint: '評価のうち good の割合',
  regret_hint: '評価のうち bad の割合',
  reset_all: '記録をリセットして最初から',

  settings_accountTitle: 'アカウント',
  settings_logout: 'ログアウト',
  settings_loginToSync: 'Googleでログインしてクラウド同期',
  settings_login: 'ログイン',
  account_signed_in: 'ログイン中',
  account_local: 'ローカルモード',
  account_local_body: 'この端末のブラウザのみに保存されています',
  account_cloud_disabled: 'クラウド同期は未設定',
  account_cloud_disabled_body:
    'Supabaseの環境変数を設定するとログイン同期が有効になります。',
  account_unauthed: '未ログイン',
  account_unauthed_body: 'Google でログインすると複数端末で同期できます',

  settings_budgetTitle: '月の予算',
  settings_budgetSubtitle: '目安を決めると進捗バーで超過を予測します',
  settings_budgetCurrent: '現在: {amount} / 月',
  settings_budgetResetPreset: '予算なしに戻す',
  settings_budgetSaved: '保存しました',

  settings_customizeTitle: 'カスタマイズ',
  settings_categoryManage: 'カテゴリを管理',
  settings_categorySubtle: '絵文字・色・名前を自分仕様に',
  settings_recurring: '定期取引',
  settings_recurringSubtle: '家賃やサブスクを毎月自動で記録',
  settings_recurringCount: '{count}件',

  settings_appearance: '外観',
  settings_appearance_sub: 'ライト/ダーク/システムから選べます',
  theme_light: 'ライト',
  theme_light_desc: '常に明るい配色',
  theme_dark: 'ダーク',
  theme_dark_desc: '夜に優しい配色',
  theme_system: 'システム',
  theme_system_desc: 'OSの設定に合わせる',

  settings_fontTitle: '文字サイズ',
  settings_fontSubtitle: '読みやすい大きさを選べます',
  font_sm: '小',
  font_md: '中',
  font_lg: '大',
  font_note: '選んだサイズは即座に反映され、次回開いたときも保持されます。',

  settings_langTitle: '言語',
  settings_langSubtitle: 'インターフェースの言語を切り替えます',
  lang_ja: '日本語',
  lang_en: 'English',

  settings_dataTitle: 'データ',
  settings_dataCloud: 'クラウド (Supabase) に保存されています',
  settings_dataLocal: 'このブラウザ内に保存されています',
  settings_recordCount: '記録件数',
  settings_count_unit: '件',
  settings_export: 'CSVでエクスポート',
  settings_import: 'CSVをインポート',
  settings_deleteAll: 'すべての記録を削除',
  confirm_deleteAll: '記録をすべて削除します。よろしいですか？',

  settings_about: 'アプリについて',
  about_body:
    '「過去の支出に対する満足度」をもとに{strong}。👍👎をつけるほど推奨と警告の精度が上がります。',

  login_tagline: '満足度から未来の買い物を最適化する家計簿',
  feature_statement_t: '銀行明細風の記録',
  feature_statement_b: '収入も支出も時系列でひと目に。',
  feature_rate_t: '満足度ワンタップ',
  feature_rate_b: '買ったあとに「よかった/後悔」を残すだけ。',
  feature_ai_t: 'AIアドバイス',
  feature_ai_b: '続けるべき支出と、控えるべき支出を提案。',
  feature_sync_t: 'どの端末でも同期',
  feature_sync_b: 'ログインすればPCとスマホで同じデータを使えます。',
  login_google: 'Google でログイン',
  login_localOnly: 'ログインせずローカルで使う',
  login_footnote_cloud:
    'ログインするとSupabaseの安全なデータベースに記録が保存されます。',
  login_footnote_local: 'ローカルモードはこの端末のブラウザに保存します。',

  mig_title: 'ローカルの記録をクラウドにアップロードしますか？',
  mig_body:
    'この端末にある記録を、ログイン中のアカウントに紐づけて Supabase に保存します。完了後はすべての端末で同じデータを使えるようになります。',
  mig_records: '記録件数',
  mig_expSum: '支出合計',
  mig_incSum: '収入合計',
  mig_uploadBtn: 'アップロードする',
  mig_dismissBtn: '破棄してクラウドの状態で続ける',

  update_title: '新しいバージョンがあります',
  update_body: 'タップで最新を読み込みます',
  update_button: '更新する',

  booting: 'worthit を起動中…',
  loading: '読み込み中…',

  recurring_addBtn: '定期取引を追加',
  recurring_emptyTitle: '定期取引が登録されていません',
  recurring_emptyBody:
    '家賃・サブスクなど、毎月発生する取引を登録すると自動で明細に追加されるようになります。',
  recurring_note:
    '毎月の家賃やサブスクをここに登録しておくと、指定日が来た時に自動で記録されます。アプリを開いた時にチェックして反映するので、起動が無い月は自動挿入されません（最大3か月分まで遡って補完）。',
  recurring_dayLabel: '毎月の発生日',
  recurring_dayHint: '月末に存在しない日（例：2月30日）はその月の最終日に丸めて記録します。',
  recurring_nextDue: '次回: {date}',
  recurring_pause: '停止',
  recurring_resume: '再開',
  recurring_categoryPh: '例：家賃、Netflix',
  recurring_memoPh: '例：5月分の家賃',
  recurring_monthly_marker: '毎月{day}日',
  recurring_marker_suffix: '（定期）',

  cat_managerTitle: 'カテゴリの管理',
  cat_addNew: '新しいカテゴリを追加',
  cat_editBtn: '編集',
  cat_preview: 'プレビュー',
  cat_labelHint: 'ラベル',
  cat_kindLabel: '種別',
  cat_kindHint: '（性格診断ロジックに影響）',
  cat_emojiLabel: '絵文字',
  cat_colorLabel: 'カラー',
  cat_preset: 'プリセット',
  cat_custom: 'カスタム',
  cat_managerNote:
    'プリセットを編集すると、同じラベルで色や絵文字が上書きされます。削除はカスタムカテゴリのみ可能です。',

  import_title: 'CSVをインポートしますか？',
  import_body:
    '以下の件数を既存の記録に追加します。重複する記録（日付・金額・カテゴリ・メモが完全一致）は自動でスキップします。',
  import_addedCount: '追加件数',
  import_dupCount: '重複スキップ',
  import_errCount: 'エラー行',
  import_previewTitle: 'プレビュー (最初の{n}件)',
  import_btn: '{n}件を追加',
  import_btnEmpty: '追加できる行がありません',
  import_errorsHeader: '読み取れなかった行',

  income_badge: '収入',
  thumb_good: '買ってよかった',
  thumb_bad: '買わなきゃよかった',
};

const en: Strings = {
  appName: 'worthit',
  appTagline: 'A budget that learns from your satisfaction',

  screen_statement_title: 'Statement',
  screen_statement_subtitle: 'Your records, in order',
  screen_advice_title: 'Advice',
  screen_advice_subtitle: 'Your next move, by satisfaction',
  screen_result_title: 'Personality',
  screen_result_subtitle: 'What your money says about you',
  screen_settings_title: 'Settings',
  screen_settings_subtitle: 'Account & display',

  nav_statement: 'Records',
  nav_advice: 'Advice',
  nav_result: 'Type',
  nav_settings: 'Settings',

  balance: 'Balance',
  income: 'Income',
  expense: 'Expense',
  net: 'Net',
  satisfaction: 'Satisfaction',
  searchPlaceholder: 'Search categories or memos…',
  filter_all: 'All',
  filter_expense: 'Expenses',
  filter_income: 'Income',
  filter_unrated: 'Unrated',
  empty_title: 'Start with one entry',
  empty_body:
    'Once you log income or expenses, they appear here like a bank statement. After a purchase, leave a 👍 or 👎 in a single tap.',
  empty_addBtn: '+ Add entry',
  empty_seedBtn: 'Try with sample data first',
  noMatch: 'No records matched.',

  budget_setupCta: 'Set a monthly budget to track progress',
  budget_setupSubtle: '{month} spend {amount}',
  budget_month: 'Budget for {month}',
  budget_change: 'Edit',
  budget_over: 'Over by {amount}',
  budget_remaining: '{amount} left',
  budget_elapsed: 'Day {elapsed} / {total}',
  budget_projected: 'Projected {amount}',

  addTitle: 'Add entry',
  type_expense: '💸 Expense',
  type_income: '💰 Income',
  amount: 'Amount',
  date: 'Date',
  category: 'Category',
  newCategory: '+ New category',
  backToPresets: 'Back to presets',
  customCategoryPlaceholder: 'e.g. Subscription, Trip, Coffee…',
  memo: 'Memo',
  memoOptional: '(optional)',
  memoExpensePlaceholder: 'e.g. Lunch at my usual cafe',
  memoIncomePlaceholder: 'e.g. May payroll',
  save: 'Save',
  cancel: 'Cancel',
  close: 'Close',
  delete: 'Delete',

  recommend_title: 'Spending that makes you happy',
  recommend_subtitle: 'Categories with high satisfaction',
  warning_title: 'Watch out for waste',
  warning_subtitle: 'Categories with frequent regret',
  pie_title: 'Expense breakdown',
  monthlyTrend_title: 'Last 6 months',
  monthlyReview_title: '{month} in review',
  monthlyReview_topCat: 'Your biggest spend this month was',
  monthlyReview_addEval:
    ' Add 👍👎 ratings to make next month\'s advice sharper.',
  monthlyReview_high: ' Spending that lands well — keep it up!',
  monthlyReview_low: ' Lots of regret. Try pausing before the next buy.',
  monthlyReview_mid: ' Add more ratings to surface the pattern.',
  rec_emptyGood:
    "👍 Not enough ratings yet, or no standout categories. Tap 'good' on purchases you valued, and they'll appear here.",
  rec_emptyBad: '👎 No categories with regret yet.',
  rec_reasonGood: 'Satisfaction {pct}% — worth keeping in your routine.',
  rec_reasonBad: 'Regret {pct}% — pause for a breath before the next one.',
  rec_amount: 'Total recorded {amount}',
  yourType: 'Your type',

  conf: 'CONF',
  youAre: 'YOU ARE',
  outline: 'Your outline',
  aiCoach: 'AI Coach',
  strengths: 'Strengths',
  blindspots: 'Blind spots',
  axes_title: 'Personality axes',
  topCategories: 'Top 3 categories',
  satisfaction_summary: 'Satisfaction summary',
  fulfilled_label: 'Fulfilled',
  regret_label: 'Regret',
  fulfilled_hint: 'good / (good + bad)',
  regret_hint: 'bad / (good + bad)',
  reset_all: 'Reset all records',

  settings_accountTitle: 'Account',
  settings_logout: 'Sign out',
  settings_loginToSync: 'Sign in with Google to sync',
  settings_login: 'Sign in',
  account_signed_in: 'Signed in',
  account_local: 'Local mode',
  account_local_body: 'Records are kept only on this device.',
  account_cloud_disabled: 'Cloud sync not configured',
  account_cloud_disabled_body:
    'Set the Supabase env vars to enable sign-in & sync.',
  account_unauthed: 'Signed out',
  account_unauthed_body: 'Sign in with Google to sync across devices.',

  settings_budgetTitle: 'Monthly budget',
  settings_budgetSubtitle:
    'Set a target and the progress bar will project overrun.',
  settings_budgetCurrent: 'Current: {amount} / month',
  settings_budgetResetPreset: 'Clear budget',
  settings_budgetSaved: 'Saved',

  settings_customizeTitle: 'Customize',
  settings_categoryManage: 'Manage categories',
  settings_categorySubtle: 'Emojis, colors, and names — your way',
  settings_recurring: 'Recurring',
  settings_recurringSubtle: 'Auto-log rent and subscriptions',
  settings_recurringCount: '{count} items',

  settings_appearance: 'Appearance',
  settings_appearance_sub: 'Light, dark, or system',
  theme_light: 'Light',
  theme_light_desc: 'Always bright',
  theme_dark: 'Dark',
  theme_dark_desc: 'Easy on the eyes at night',
  theme_system: 'System',
  theme_system_desc: 'Follow OS setting',

  settings_fontTitle: 'Font size',
  settings_fontSubtitle: 'Pick a comfortable size',
  font_sm: 'Small',
  font_md: 'Medium',
  font_lg: 'Large',
  font_note: 'Size applies instantly and is remembered next time.',

  settings_langTitle: 'Language',
  settings_langSubtitle: 'Switch the interface language',
  lang_ja: '日本語',
  lang_en: 'English',

  settings_dataTitle: 'Data',
  settings_dataCloud: 'Synced to Supabase cloud',
  settings_dataLocal: 'Stored in this browser only',
  settings_recordCount: 'Records',
  settings_count_unit: 'entries',
  settings_export: 'Export as CSV',
  settings_import: 'Import CSV',
  settings_deleteAll: 'Delete all records',
  confirm_deleteAll: 'Delete all records? This cannot be undone.',

  settings_about: 'About',
  about_body:
    'Built around "how satisfied you were with each purchase" — {strong}. The more 👍👎 you leave, the sharper the recommendations.',

  login_tagline: 'Optimise tomorrow\'s spending from yesterday\'s satisfaction',
  feature_statement_t: 'Bank-statement view',
  feature_statement_b: 'Income and expenses, in order at a glance.',
  feature_rate_t: 'One-tap satisfaction',
  feature_rate_b: 'After buying, just leave a 👍 or 👎.',
  feature_ai_t: 'AI-style advice',
  feature_ai_b: 'See what to keep doing — and what to ease off.',
  feature_sync_t: 'Sync across devices',
  feature_sync_b: 'Sign in and use the same data on phone and laptop.',
  login_google: 'Continue with Google',
  login_localOnly: 'Use without an account',
  login_footnote_cloud:
    'Signed-in data is stored securely in Supabase.',
  login_footnote_local: 'Local mode keeps data in this browser only.',

  mig_title: 'Upload local records to the cloud?',
  mig_body:
    'Records on this device will be linked to your signed-in account in Supabase. Once uploaded, you can use the same data on every device.',
  mig_records: 'Records',
  mig_expSum: 'Total expense',
  mig_incSum: 'Total income',
  mig_uploadBtn: 'Upload',
  mig_dismissBtn: 'Discard and use cloud as is',

  update_title: 'New version available',
  update_body: 'Tap to reload',
  update_button: 'Update',

  booting: 'Starting worthit…',
  loading: 'Loading…',

  recurring_addBtn: 'Add recurring',
  recurring_emptyTitle: 'No recurring entries yet',
  recurring_emptyBody:
    'Add monthly entries like rent or subscriptions and they will be logged automatically.',
  recurring_note:
    'Register monthly rent or subscriptions here and they\'ll be logged on the chosen day. Auto-logging checks when you open the app (it can catch up the last 3 months if you were away).',
  recurring_dayLabel: 'Day of month',
  recurring_dayHint:
    'Days that don\'t exist in a month (e.g. Feb 30) are rounded down to that month\'s last day.',
  recurring_nextDue: 'Next: {date}',
  recurring_pause: 'Pause',
  recurring_resume: 'Resume',
  recurring_categoryPh: 'e.g. Rent, Netflix',
  recurring_memoPh: 'e.g. May rent',
  recurring_monthly_marker: 'Every {day}th',
  recurring_marker_suffix: ' (recurring)',

  cat_managerTitle: 'Manage categories',
  cat_addNew: 'Add a category',
  cat_editBtn: 'Edit',
  cat_preview: 'Preview',
  cat_labelHint: 'Label',
  cat_kindLabel: 'Kind',
  cat_kindHint: '(affects personality scoring)',
  cat_emojiLabel: 'Emoji',
  cat_colorLabel: 'Color',
  cat_preset: 'Preset',
  cat_custom: 'Custom',
  cat_managerNote:
    'Editing a preset overrides its color or emoji for the same label. Only custom categories can be deleted.',

  import_title: 'Import CSV?',
  import_body:
    'Rows below will be added to your existing records. Exact duplicates (date + amount + category + memo) are skipped automatically.',
  import_addedCount: 'New rows',
  import_dupCount: 'Duplicates skipped',
  import_errCount: 'Errors',
  import_previewTitle: 'Preview (first {n})',
  import_btn: 'Add {n} rows',
  import_btnEmpty: 'No rows to add',
  import_errorsHeader: 'Skipped rows',

  income_badge: 'income',
  thumb_good: 'I am glad I bought this',
  thumb_bad: 'I wish I had not',
};

export const TRANSLATIONS: Record<Locale, Strings> = { ja, en };

/** `{key}` を置換した上で文字列を返す。 */
export function format(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}
