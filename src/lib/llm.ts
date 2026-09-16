export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type CloudLlmResult = {
  text: string;
  model: string;
};

const DEFAULT_CLOUD_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const DEFAULT_CLOUD_MODEL = 'openai';

export function llmConfig(): { url: string; model: string; apiKey?: string } {
  const extra = typeof process !== 'undefined' ? process.env : undefined;
  return {
    url: extra?.EXPO_PUBLIC_LLM_BASE_URL?.trim() || DEFAULT_CLOUD_URL,
    model: extra?.EXPO_PUBLIC_LLM_MODEL?.trim() || DEFAULT_CLOUD_MODEL,
    apiKey: extra?.EXPO_PUBLIC_LLM_API_KEY?.trim() || extra?.EXPO_PUBLIC_OPENAI_API_KEY?.trim(),
  };
}

export async function completeChat(messages: ChatMessage[]): Promise<CloudLlmResult> {
  const config = llmConfig();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const res = await fetch(config.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    throw new Error(`Cloud LLM ${res.status}`);
  }

  const json = (await res.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Cloud LLM returned an empty reply');
  return { text, model: json.model || config.model };
}

export function parseJsonPayload<T>(raw: string): T | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.search(/[\[{]/);
  if (start < 0) return null;
  const sliced = candidate.slice(start);
  try {
    return JSON.parse(sliced) as T;
  } catch {
    const lastBrace = Math.max(sliced.lastIndexOf('}'), sliced.lastIndexOf(']'));
    if (lastBrace <= 0) return null;
    try {
      return JSON.parse(sliced.slice(0, lastBrace + 1)) as T;
    } catch {
      return null;
    }
  }
}
