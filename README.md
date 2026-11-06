# Daylight — your everyday AI companion

Daylight is a mobile-friendly, multilingual assistant MVP for everyday questions, planning, and keeping useful thoughts in one place. It includes a chat interface, local tasks and notes, optional AI-provider integration, text-file Q&A context, browser speech input/output, and seven language choices.

## Run locally

Requirements: Node.js 18.17+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without an API key the app runs in demo mode with a small built-in response fallback. For full model responses, set `OPENAI_API_KEY` in `.env.local` and restart the server. You can optionally set `OPENAI_MODEL` and `OPENAI_BASE_URL` for an OpenAI-compatible provider. The key stays server-side and must never use a `NEXT_PUBLIC_` prefix.

## MVP features

- Responsive web app for desktop and mobile browsers.
- AI chat through an OpenAI-compatible Chat Completions endpoint; safe demo responses when no key is configured.
- English, Spanish, Hindi, French, Portuguese, Arabic, and Chinese language selection; the selected language is sent as the assistant response preference.
- Browser speech-to-text (supported browsers) and text-to-speech.
- Daily task list with completion and deletion.
- Notes with create and delete actions.
- Attach text, Markdown, or CSV files up to 200 KB as reference context for chat.
- Tasks, notes, and language preference are stored in the browser's local storage.

## Deployment

Deploy as a Node.js Next.js app on a platform such as Vercel, Render, or your own Node host. Configure `OPENAI_API_KEY` and optional model/base URL as server-side environment variables in the hosting dashboard. The app does not currently have user accounts or cloud sync: notes and tasks are private to the browser/device where they were created. Do not describe this MVP as providing encrypted or cross-device storage.

## Important limitations

- “Demo mode” is a limited local fallback, not a full language model.
- Browser speech recognition availability and language support vary by browser/device; microphone permission is required.
- File upload currently supports text formats only; PDFs and images are not parsed.
- Do not upload sensitive personal information. The selected file's text is sent to the configured AI provider when you send a chat message.
- AI can make mistakes. It is not a substitute for emergency services or professional medical, legal, or financial advice.

## Project structure

```text
app/
  api/chat/route.ts   # server-side AI provider integration
  globals.css         # responsive styling
  layout.tsx          # app metadata and document shell
  page.tsx            # chat, planner, notes, voice, and document UI
```
