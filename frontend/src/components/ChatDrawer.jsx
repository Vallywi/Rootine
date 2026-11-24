import { useEffect, useRef, useState } from 'react';
import * as api from '../lib/api.js';

const MAX_LENGTH = 500;
const SUGGESTIONS = [
  'How is my progress this week?',
  'Which plants have I grown?',
  'What tasks should I do next?',
  'How is my streak?',
];
const GREETING = 'Hi! I am Rootie. Ask me about your focus time, plants, streaks, tasks or badges.';

// Chat panel for the AI assistant. The server builds the facts from your own data; this only sends the conversation.
export default function ChatDrawer({ open, onClose }) {
  const ref = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', content }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); inputRef.current?.focus(); }
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages, busy, error]);

  const send = async (content) => {
    const clean = content.trim();
    if (!clean || busy) return;
    const next = [...messages, { role: 'user', content: clean }];
    setMessages(next);
    setText('');
    setError('');
    setBusy(true);
    try {
      // The server accepts the last 10 messages.
      const { reply } = await api.post('/chat', { messages: next.slice(-10), tzOffset: new Date().getTimezoneOffset() });
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e) => { e.preventDefault(); send(text); };
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text); }
  };

  return (
    <dialog
      ref={ref}
      className="drawer chat"
      aria-labelledby="chat-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="drawer__panel">
        <header className="drawer__head">
          <span className="chat__avatar" aria-hidden="true">{'\uD83C\uDF31'}</span>
          <div className="drawer__who">
            <h2 id="chat-title">Rootie</h2>
            <p className="muted small">Your progress assistant</p>
          </div>
          {messages.length > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => { setMessages([]); setError(''); }}>New chat</button>
          )}
          <button type="button" className="icon-btn" aria-label="Close" title="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" /></svg>
          </button>
        </header>

        <div className="drawer__body chat__log" role="log" aria-live="polite" aria-label="Conversation">
          <p className="chat__msg chat__msg--bot">{GREETING}</p>
          {messages.length === 0 && (
            <div className="chat__chips">
              {SUGGESTIONS.map((q) => (
                <button key={q} type="button" className="chat__chip" onClick={() => send(q)} disabled={busy}>{q}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <p key={i} className={`chat__msg ${m.role === 'user' ? 'chat__msg--me' : 'chat__msg--bot'}`}>{m.content}</p>
          ))}
          {busy && <p className="chat__msg chat__msg--bot muted" aria-label="Rootie is typing">Thinking...</p>}
          {error && <p className="chat__error" role="alert">{error}</p>}
          <div ref={endRef} />
        </div>

        <form className="drawer__foot chat__form" onSubmit={onSubmit}>
          <label htmlFor="chat-input" className="visually-hidden">Ask Rootie a question</label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="chat__input"
            rows={2}
            maxLength={MAX_LENGTH}
            placeholder="Ask about your progress..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
          />
          <button type="submit" className="btn" disabled={busy || !text.trim()}>Send</button>
        </form>
      </div>
    </dialog>
  );
}
