/**
 * Notion API にページを 1 件追加する共通ロジック。
 *
 * 期待する Notion DB のプロパティ:
 *  - Date      (Date)
 *  - Amount    (Number)
 *  - Category  (Select もしくは Title もしくは Rich text)
 *  - Memo      (Rich text)   — optional
 *  - Type      (Select)      — optional ('income' / 'expense')
 *  - Satisfaction (Select)   — optional ('good' / 'bad' / 'neutral')
 *
 * Title プロパティは DB ごとに異なるので、Category を Title 候補とする。
 */

export interface NotionTxPayload {
  date: number; // ms timestamp
  amount: number;
  category: string;
  memo: string;
  type: 'income' | 'expense';
  satisfaction: 'good' | 'bad' | 'neutral';
}

const NOTION_VERSION = '2022-06-28';

interface PropertyDef {
  id: string;
  type: string;
  name: string;
}

/** DB の property schema を取得 (Title プロパティ判定のため)。 */
async function fetchDbSchema(
  databaseId: string,
  token: string,
): Promise<Record<string, PropertyDef>> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Notion DB fetch failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    properties: Record<string, PropertyDef>;
  };
  return data.properties;
}

function isoDate(ms: number): string {
  // 日付プロパティの ISO は "YYYY-MM-DD" 形式で十分
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function postTransactionToNotion(
  databaseId: string,
  token: string,
  tx: NotionTxPayload,
): Promise<void> {
  const schema = await fetchDbSchema(databaseId, token);

  // Title プロパティを探す
  const titleProp = Object.values(schema).find((p) => p.type === 'title');

  const properties: Record<string, unknown> = {};

  if (schema.Date?.type === 'date') {
    properties.Date = { date: { start: isoDate(tx.date) } };
  }
  if (schema.Amount?.type === 'number') {
    properties.Amount = { number: tx.amount };
  }
  // Category — DB の Title プロパティ名と合致すれば title に入れる、そうでなければ select か rich_text
  if (titleProp) {
    properties[titleProp.name] = {
      title: [{ text: { content: tx.category || 'その他' } }],
    };
  }
  if (
    schema.Category &&
    schema.Category.type !== 'title' // Title 重複回避
  ) {
    if (schema.Category.type === 'select') {
      properties.Category = { select: { name: tx.category || 'その他' } };
    } else if (schema.Category.type === 'rich_text') {
      properties.Category = {
        rich_text: [{ text: { content: tx.category || 'その他' } }],
      };
    }
  }
  if (schema.Memo?.type === 'rich_text') {
    properties.Memo = { rich_text: [{ text: { content: tx.memo } }] };
  }
  if (schema.Type?.type === 'select') {
    properties.Type = { select: { name: tx.type } };
  }
  if (schema.Satisfaction?.type === 'select') {
    properties.Satisfaction = { select: { name: tx.satisfaction } };
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Notion page create failed (${res.status}): ${text}`);
  }
}
