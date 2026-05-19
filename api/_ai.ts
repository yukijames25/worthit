/**
 * AI プロバイダ統合層。
 *
 * - 1次: Groq API (Llama 3.3 70B Versatile, 無料枠)
 * - 2次: Gemini API (Flash, 無料枠)
 *
 * どちらも環境変数が無ければスキップ。両方失敗したらエラーを投げる。
 */

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_MODEL = 'gemini-2.0-flash';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  text: string;
  provider: 'groq' | 'gemini';
}

export async function callAi(messages: ChatMessage[]): Promise<AiResponse> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    throw new Error('No AI provider configured (set GROQ_API_KEY or GEMINI_API_KEY)');
  }

  // Try Groq first
  if (groqKey) {
    try {
      const text = await callGroq(groqKey, messages);
      return { text, provider: 'groq' };
    } catch (e) {
      console.warn('[ai] groq failed:', e);
      if (!geminiKey) throw e;
    }
  }

  // Fallback to Gemini
  if (geminiKey) {
    const text = await callGemini(geminiKey, messages);
    return { text, provider: 'gemini' };
  }

  throw new Error('AI providers all failed');
}

async function callGroq(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Groq ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty response');
  return text.trim();
}

async function callGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  // Gemini は role を user/model にする必要があり、system を user に変換
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const others = messages.filter((m) => m.role !== 'system');
  const systemInstruction =
    systemMsgs.length > 0
      ? { parts: [{ text: systemMsgs.map((m) => m.content).join('\n\n') }] }
      : undefined;
  const contents = others.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      }),
    },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text.trim();
}

/** 月キー (YYYY-MM) を生成。 */
export function currentMonthKey(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
