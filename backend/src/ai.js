import { HttpError } from './http.js';

// Gemini client. Returns null when no API key is set, so the app still works without the chatbot.
// reply({ system, messages }) resolves to the answer text. messages are { role: 'user' | 'assistant', content }.
// Swap this file to change provider; the chat route only depends on reply().
export function createAi(config) {
  if (!config.aiApiKey) return null;
  return {
    async reply({ system, messages }) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.aiModel)}:generateContent`;
      const send = () => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.aiApiKey },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
        }),
      });
      let res;
      try {
        res = await send();
        // Gemini sometimes answers 503 "high demand". One quick retry usually works.
        if (res.status === 503) { await new Promise((r) => setTimeout(r, 800)); res = await send(); }
      } catch {
        throw new HttpError(502, 'The assistant did not answer in time. Please try again.');
      }
      if (res.status === 429 || res.status === 503) throw new HttpError(503, 'The assistant is busy right now. Please try again in a minute.');
      if (!res.ok) throw new HttpError(502, 'The assistant is not available right now. Please try again later.');
      const data = await res.json().catch(() => null);
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
      if (!text) throw new HttpError(502, 'The assistant had no answer for that. Try asking in a different way.');
      return text;
    },
  };
}
