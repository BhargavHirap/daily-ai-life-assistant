'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type Task = { id: string; text: string; done: boolean; due?: string };
type Note = { id: string; text: string; created: string };

const greetings: Record<string, string> = {
  English: 'Hi! I’m Daylight, your everyday assistant. What can I help you with today?',
  Español: '¡Hola! Soy Daylight, tu asistente diario. ¿En qué puedo ayudarte hoy?',
  हिन्दी: 'नमस्ते! मैं Daylight हूँ, आपका रोज़मर्रा का सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?',
  Français: 'Bonjour ! Je suis Daylight, votre assistant du quotidien. Comment puis-je vous aider ?',
  Português: 'Olá! Sou o Daylight, seu assistente diário. Como posso ajudar hoje?',
  العربية: 'مرحبًا! أنا Daylight، مساعدك اليومي. كيف يمكنني مساعدتك اليوم؟',
  中文: '你好！我是 Daylight，你的日常助手。今天有什么我可以帮忙的？',
};
const suggestions = ['Help me plan my day', 'Give me a quick healthy lunch idea', 'Help me write a polite message'];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : fallback; } catch { return fallback; }
}

export default function Home() {
  const [language, setLanguage] = useState('English');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'ai' | 'demo' | ''>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [documentContext, setDocumentContext] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'assistant' | 'planner' | 'notes'>('assistant');
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTasks(readStorage<Task[]>('daylight-tasks', []));
    setNotes(readStorage<Note[]>('daylight-notes', []));
    const savedLanguage = localStorage.getItem('daylight-language');
    if (savedLanguage && greetings[savedLanguage]) setLanguage(savedLanguage);
  }, []);
  useEffect(() => { localStorage.setItem('daylight-tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('daylight-notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('daylight-language', language); }, [language]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next); setInput(''); setBusy(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next, language, documentContext }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');
      setMessages([...next, { role: 'assistant', content: data.reply }]); setMode(data.mode || 'ai');
    } catch (error) {
      setMessages([...next, { role: 'assistant', content: error instanceof Error ? error.message : 'Please try again.' }]);
    } finally { setBusy(false); }
  }

  function addTask(event: FormEvent) {
    event.preventDefault(); const text = taskInput.trim(); if (!text) return;
    setTasks([{ id: crypto.randomUUID(), text, done: false }, ...tasks]); setTaskInput('');
  }
  function addNote(event: FormEvent) {
    event.preventDefault(); const text = noteInput.trim(); if (!text) return;
    setNotes([{ id: crypto.randomUUID(), text, created: new Date().toLocaleDateString() }, ...notes]); setNoteInput('');
  }
  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }
  function startVoice() {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice input is not supported in this browser. Try a recent version of Chrome.'); return; }
    const recognition = new SpeechRecognition(); recognition.lang = language === 'Español' ? 'es-ES' : language === 'हिन्दी' ? 'hi-IN' : language === 'Français' ? 'fr-FR' : language === 'Português' ? 'pt-BR' : language === 'العربية' ? 'ar-SA' : language === '中文' ? 'zh-CN' : 'en-US';
    recognition.onresult = (event) => setInput(event.results[0][0].transcript); recognition.start();
  }
  function speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = language === 'Español' ? 'es-ES' : language === 'हिन्दी' ? 'hi-IN' : language === 'Français' ? 'fr-FR' : language === 'Português' ? 'pt-BR' : language === 'العربية' ? 'ar-SA' : language === '中文' ? 'zh-CN' : 'en-US'; window.speechSynthesis.speak(utterance);
  }
  async function attachFile(file?: File) {
    if (!file) return;
    if (!/\.(txt|md|csv)$/i.test(file.name)) { alert('For this MVP, upload a text, Markdown, or CSV file.'); return; }
    if (file.size > 200_000) { alert('Please choose a file smaller than 200 KB.'); return; }
    setDocumentContext(await file.text()); setDocumentName(file.name);
  }

  const doneCount = tasks.filter((task) => task.done).length;
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Daylight home"><span className="brand-mark">☀</span><span>daylight</span></a>
        <div className="workspace-label">YOUR SPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <button className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`} onClick={() => setActiveTab('assistant')}><span>✦</span> Assistant</button>
          <button className={`nav-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}><span>▣</span> My day <b>{tasks.filter((t) => !t.done).length}</b></button>
          <button className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}><span>▤</span> Notes <b>{notes.length}</b></button>
        </nav>
        <div className="sidebar-bottom"><div className="privacy-card"><span className="privacy-icon">◈</span><div><strong>Your space, your data</strong><p>Notes and tasks stay in this browser.</p></div></div><div className="profile"><div className="avatar">Y</div><div><strong>Your account</strong><small>Personal space</small></div><span className="more">···</span></div></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark">☀</span> daylight</div><div className="topbar-right"><span className={`status ${mode === 'demo' ? 'demo' : ''}`}><i />{mode === 'demo' ? 'Demo mode' : mode === 'ai' ? 'AI connected' : 'Ready when you are'}</span><label className="language-select" aria-label="Choose language"><span>文</span><select value={language} onChange={(e) => setLanguage(e.target.value)}><option>English</option><option>Español</option><option>हिन्दी</option><option>Français</option><option>Português</option><option>العربية</option><option>中文</option></select></label></div></header>
        <div className="content-wrap">
          {activeTab === 'assistant' && <section className="assistant-view">
            <div className="welcome"><div className="sun-illustration">☀</div><p className="eyebrow">A LITTLE HELP, EVERY DAY</p><h1>Your day, a little<br className="desktop-break" /> brighter.</h1><p className="welcome-copy">A friendly space to think things through, make a plan, or just ask.</p></div>
            <div className="chat-panel">
              {messages.length === 0 ? <div className="starter"><p>What would you like help with?</p><div className="suggestion-row">{suggestions.map((item) => <button key={item} className="suggestion" onClick={() => void sendMessage(item)}>{item}<span>↗</span></button>)}</div></div> : <div className="messages">{messages.map((message, index) => <div key={index} className={`message-row ${message.role}`}><div className={`message-avatar ${message.role}`}>{message.role === 'assistant' ? '☀' : 'Y'}</div><div className="message-content"><span className="message-name">{message.role === 'assistant' ? 'Daylight' : 'You'}</span><div className="bubble">{message.content}{message.role === 'assistant' && <button className="speak-button" aria-label="Read response aloud" onClick={() => speak(message.content)}>◖))</button>}</div></div></div>)}{busy && <div className="message-row assistant"><div className="message-avatar assistant">☀</div><div className="typing"><i /><i /><i /></div></div>}<div ref={messagesEnd} /></div>}
              {documentName && <div className="attached-file">▤ {documentName}<button aria-label="Remove attachment" onClick={() => { setDocumentName(''); setDocumentContext(''); }}>×</button></div>}
              <form className="composer" onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask anything, or tell me what’s on your mind…" rows={2} aria-label="Your message" /><div className="composer-actions"><div className="left-actions"><label className="icon-button attach-button" title="Attach a text document">＋<input type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" hidden onChange={(e) => void attachFile(e.target.files?.[0])} /></label><button type="button" className={`icon-button ${voiceEnabled ? 'voice-on' : ''}`} title="Dictate a message" onClick={startVoice}>♩</button><span className="composer-hint">Enter to send · Shift + Enter for a new line</span></div><button className="send-button" type="submit" disabled={busy || !input.trim()}>Send <span>↑</span></button></div></form>
              <p className="disclaimer">Daylight can make mistakes. For important decisions, double-check information.</p>
            </div>
          </section>}

          {activeTab === 'planner' && <section className="utility-view"><div className="section-heading"><div><p className="eyebrow">MAKE SPACE FOR WHAT MATTERS</p><h1>My day</h1><p className="welcome-copy">A small plan can make the day feel lighter.</p></div><div className="date-pill">◷ {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div></div><div className="planner-card"><div className="card-title"><div><span className="card-icon">▣</span><h2>Today’s list</h2></div><span className="progress-label">{doneCount} of {tasks.length} done</span></div><form className="inline-form" onSubmit={addTask}><input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="Add something you want to get done…" aria-label="New task" /><button type="submit" disabled={!taskInput.trim()}>Add task <span>＋</span></button></form>{tasks.length === 0 ? <div className="empty-state"><span>☼</span><strong>Nothing on your list yet</strong><p>Add one small task to get started.</p></div> : <ul className="task-list">{tasks.map((task) => <li key={task.id} className={task.done ? 'completed' : ''}><button className="check-button" aria-label={task.done ? 'Mark incomplete' : 'Mark complete'} onClick={() => setTasks(tasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))}>{task.done ? '✓' : ''}</button><span>{task.text}</span><button className="delete-button" aria-label="Delete task" onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}>×</button></li>)}</ul>}</div><div className="planner-tip"><span>✦</span><div><strong>Need a hand prioritizing?</strong><p>Ask Daylight to help organize your tasks into a realistic plan.</p></div><button onClick={() => { setActiveTab('assistant'); setInput('Help me prioritize and plan my day. My tasks are: ' + tasks.filter((t) => !t.done).map((t) => t.text).join(', ')); }}>Ask assistant →</button></div></section>}

          {activeTab === 'notes' && <section className="utility-view"><div className="section-heading"><div><p className="eyebrow">THOUGHTS, READY WHEN YOU ARE</p><h1>Notes</h1><p className="welcome-copy">Keep little ideas, reminders, and things you want to remember.</p></div><span className="notes-count">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span></div><div className="note-editor"><form onSubmit={addNote}><textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Write a note or capture an idea…" aria-label="New note" rows={3} /><div className="note-editor-footer"><span>Only you can see these notes in this browser.</span><button type="submit" disabled={!noteInput.trim()}>Save note <span>↑</span></button></div></form></div>{notes.length === 0 ? <div className="empty-state notes-empty"><span>✎</span><strong>Your notes live here</strong><p>Save a thought before it wanders off.</p></div> : <div className="notes-grid">{notes.map((note) => <article className="note-card" key={note.id}><p>{note.text}</p><footer><span>{note.created}</span><button className="delete-button" aria-label="Delete note" onClick={() => setNotes(notes.filter((n) => n.id !== note.id))}>×</button></footer></article>)}</div>}</section>}
          <footer className="page-footer"><span>Made for everyday life <span className="footer-sun">☀</span></span><span>Simple, thoughtful, yours.</span></footer>
        </div>
      </section>
    </main>
  );
}

type SpeechRecognitionLike = { lang: string; onresult: (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void; start: () => void };
