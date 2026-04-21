<div align="center">

<br />

```
 ██████╗ ███╗   ██╗███████╗██╗██████╗  ██████╗ ███████╗
██╔═══██╗████╗  ██║██╔════╝██║██╔══██╗██╔═══██╗██╔════╝
██║   ██║██╔██╗ ██║█████╗  ██║██████╔╝██║   ██║███████╗
██║   ██║██║╚██╗██║██╔══╝  ██║██╔══██╗██║   ██║╚════██║
╚██████╔╝██║ ╚████║███████╗██║██║  ██║╚██████╔╝███████║
 ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

### *Speak your dream into the void. The oracle listens.*

<br />

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.3+-646CFF?style=flat-square&logo=vite&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local-black?style=flat-square)
![qwen2.5](https://img.shields.io/badge/qwen2.5-7b-8B5CF6?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-gold?style=flat-square)
![100 Days](https://img.shields.io/badge/100%20Days%20of%20Vibe%20Coding-%F0%9F%8C%99-purple?style=flat-square)

<br />

> *"Who looks outside, dreams; who looks inside, awakes."*
> — **C.G. Jung**

<br />

</div>

---

## ☽ What is ONEIROS?

**ONEIROS** is a local-first AI dream interpreter that gives your unconscious mind the psychological analysis it deserves. Describe any dream — no matter how fragmented, haunting, or surreal — and ONEIROS delivers a deep, multi-framework breakdown across **Jungian depth psychology**, **Freudian psychoanalysis**, **universal symbolism**, and **archetypal pattern recognition**.

No cloud. No API keys. No data leaving your machine. Just you, your dreams, and a 7-billion-parameter oracle running entirely on your local hardware.

This is not a chatbot. This is not a gimmick. ONEIROS is a **genuine psychological analysis engine** wrapped in a dark occult UI that makes the experience feel like what it is — consulting something ancient and all-knowing about the language of your own unconscious.

---

## ✦ Features

### The Analysis Engine
- **4-Framework Deep Dive** — Jungian (shadow, individuation, archetypes), Freudian (id/ego/superego, repression, wish fulfillment), Symbolic (universal and cultural symbol meanings), Archetypal (Campbell, von Franz, Hillman)
- **Symbol Extraction** — 4–7 key dream symbols identified and decoded with psychological depth, each assigned a rarity tier (Common → Uncommon → Rare → Legendary)
- **Emotional Signature** — a 7-tier mood scoring system from *The Abyss* (0%) to *Transcendent* (100%), rendered as an animated SVG arc gauge with a sweep needle
- **Oracle Summary** — a single piercing sentence that captures the dream's core psychological truth, designed to feel like revelation

### The Interface
- **Dark Occult Design System** — Cinzel display font + Crimson Pro body, void palette with nebula-violet accents and oracle-gold highlights, layered cosmic background with animated grain
- **Typewriter Analysis** — text reveals character by character with punctuation-aware pauses. Periods pause 18× longer than normal characters. The oracle doesn't rush
- **Dual Orbit Loader** — while qwen2.5 thinks, an outer ring of Elder Futhark runes orbits clockwise at 28s while inner arcane glyphs counter-orbit at 16s. A central pulsing orb glows with a shimmer sweep. 8 oracle phases cycle every 4 seconds
- **MoodMeter Arc Gauge** — a 210° SVG arc with 21 tick marks, spectrum gradient fill, animated needle, tip-orb pulse, and an interpolated color system across 7 RGB anchors
- **Rotating Dream Prompts** — 10 dream fragments cycle as placeholder text every 4.5 seconds, each one an invitation to remember something lost in the night
- **Share Card** — a 520px screenshot-ready artifact with mini mood arc, symbol tags, oracle summary, framework badges, and corner ornaments. `html2canvas` captures it at 2× retina quality

### The Journal
- **Persistent Dream Journal** — every dream auto-saved to `localStorage` after analysis. Up to 100 entries, schema-versioned with migration support
- **Journal Insights** — streak tracking, avg mood score, total words, dark/liminal/peaceful breakdown, recurring symbols across all dreams, top tags
- **Search + Filter + Sort** — full-text search across dream text, summaries, and symbols. Filter by mood. Sort by newest, oldest, darkest, lightest, or starred
- **Inline Tag System** — add custom tags to any dream entry directly in the journal
- **Export / Import** — one-click JSON export with dated filename. Import merges without duplicates

---

## ☿ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **LLM** | qwen2.5:7b via Ollama | Best 7B model for structured reasoning + poetic language |
| **Backend** | FastAPI + Python 3.11+ | Async, typed, Swagger docs auto-generated |
| **Validation** | Pydantic v2 + pydantic-settings | Field constraints, env config, `ONEIROS_` prefix |
| **HTTP Client** | httpx (async) | Non-blocking Ollama calls with timeout + retry |
| **Frontend** | React 18 + Vite 5 | HMR, path aliases, chunked vendor build |
| **Animation** | Framer Motion 11 | Page transitions, typewriter, gauge, orbital loader |
| **State** | Zustand 4 | Dream journal store with selectors, localStorage persistence |
| **Screenshot** | html2canvas | 2× retina share card capture |
| **Fonts** | Cinzel + Crimson Pro + JetBrains Mono | Display serif + elegant body + mono for labels |

---

## ⟁ Architecture

```
dream-interpreter/
│
├── backend/
│   ├── main.py                 ← FastAPI app, CORS, lifespan, global error handlers
│   ├── requirements.txt
│   ├── routes/
│   │   └── interpret.py        ← POST /api/interpret + GET /api/health + GET /api/ping
│   ├── services/
│   │   └── ollama_service.py   ← ONEIROS system prompt, 4-strategy JSON parser,
│   │                             retry with exponential backoff, health check
│   └── models/
│       └── schemas.py          ← DreamRequest + DreamResponse + Symbol (Pydantic v2)
│
└── frontend/
    ├── index.html              ← Pre-mount loader with MutationObserver dismiss
    ├── vite.config.js          ← Path aliases, /api proxy, manual chunk splitting
    ├── package.json
    ├── components/
    │   ├── DreamInput.jsx      ← Rotating prompts, focus aura, SVG char counter, summon button
    │   ├── AnalysisPanel.jsx   ← Typewriter with punctuation pauses, tab reveals, all-view toggle
    │   ├── MoodMeter.jsx       ← 210° SVG arc gauge, sweep needle, 7-anchor RGB interpolation
    │   ├── SymbolTags.jsx      ← 4-tier rarity system, expand-in-place meanings, legendary shimmer
    │   ├── DreamJournal.jsx    ← Stats panel, search/filter/sort, inline tags, export/import
    │   ├── ShareCard.jsx       ← html2canvas PNG download, clipboard copy, share text builder
    │   └── Loader.jsx          ← Dual orbit rune rings, 8 oracle phases, Elder Futhark progress strip
    ├── hooks/
    │   ├── useDreamAnalysis.js ← Fetch, AbortController, health polling, elapsed timer, retry
    │   └── useDreamJournal.js  ← Zustand store, schema migration, stats, export/import, selectors
    ├── utils/
    │   └── formatAnalysis.js   ← Normalizer, mood interpolation, tab config, symbol tiers,
    │                             sentence splitter, share card builder, master formatter
    └── src/
        ├── App.jsx             ← View router, AnimatePresence transitions, health banner
        ├── main.jsx            ← Constellation spawn, meta init, styled console banner
        └── index.css           ← Full design system: tokens, glass surfaces, mood fills,
                                  cosmic background, grain animation, all utility classes
```

---

## ◈ The Prompt Engineering

The system prompt is the soul of ONEIROS. The model is given a persona — **an ancient oracle named ONEIROS** who has read every word of Jung, Freud, Campbell, von Franz, Hillman, and Bachelard — and instructed to respond exclusively in a structured JSON object with 8 fields.

The JSON extraction system has **4 fallback strategies** to handle every way an LLM can misbehave with its output:

1. Direct `JSON.parse()` — best case
2. Extract between first `{` and last `}`
3. Strip markdown code fences, then retry
4. Fix trailing commas (the most common LLM JSON sin), then retry

If all 4 strategies fail, the service retries up to 3 times with **true exponential backoff** (2s → 4s → 8s). `ConnectError` is never retried — if Ollama is down, no amount of waiting helps.

---

## ⚙ Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) installed

### 1. Pull the model

```bash
ollama pull qwen2.5:7b
```

### 2. Clone and install

```bash
git clone https://github.com/Swapnil-bo/Dream-Interpreter.git
cd Dream-Interpreter
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Run

**Terminal 1 — Ollama:**
```bash
ollama serve
```

**Terminal 2 — Backend (from project root):**
```bash
cd Dream-Interpreter
uvicorn backend.main:app --reload
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Open

```
http://localhost:5173
```

The oracle is awake.

---

## ☽ Environment Variables

Create a `.env` file in the project root (optional — defaults work out of the box):

```env
ONEIROS_OLLAMA_BASE_URL=http://localhost:11434
ONEIROS_MODEL=qwen2.5:7b
ONEIROS_MAX_RETRIES=3
ONEIROS_TIMEOUT=120.0
```

All variables are prefixed with `ONEIROS_` and managed by `pydantic-settings`. Swap the model to `qwen2.5:14b` or `mistral:7b` with zero code changes.

---

## ◉ API Reference

Auto-generated Swagger UI available at `http://localhost:8000/docs`

### `POST /api/interpret`

**Request:**
```json
{
  "dream": "I was standing in a house I didn't recognize, but somehow knew was mine..."
}
```

**Response:**
```json
{
  "jungian": "The unrecognized house represents...",
  "freudian": "The displacement of familiar...",
  "symbolic": "Houses in dream symbolism...",
  "archetypal": "The threshold motif appears...",
  "symbols": [
    { "name": "Unknown House", "meaning": "The psyche itself — all its rooms..." },
    { "name": "Recognition Without Memory", "meaning": "The paradox of..." }
  ],
  "mood": "Liminal Unease",
  "mood_score": 0.42,
  "summary": "The dreamer stands at the threshold of self-knowledge, recognizing their own depths without yet daring to enter."
}
```

### `GET /api/health`

Returns Ollama status, model availability, and available models. Used by the frontend health banner.

---

## ⭐ What Makes This Different

Most "AI dream interpreters" are thin wrappers around GPT-4 with a purple gradient. ONEIROS is different in three ways.

**It runs entirely locally.** Your dreams are private by design. Not stored on a server. Not used for training. Not passing through any API. The analysis happens on your own hardware, using your own GPU.

**The UI matches the content.** A dream interpreter shouldn't feel like a SaaS dashboard. ONEIROS feels like consulting an ancient oracle — because it does. Every design decision from the Elder Futhark rune loader to the Cinzel typography to the cosmic grain background was made to create an experience that feels *appropriate* to the subject matter.

**The analysis is genuinely deep.** The system prompt forces qwen2.5 to commit to the ONEIROS persona across four distinct psychological frameworks, extract specific symbols, and produce a summary that feels like revelation rather than generic fortune-cookie wisdom. This is prompt engineering, not just API calling.

---

## ◈ Built as Part of 100 Days of Vibe Coding

This project is **Day N** of my public #100DaysOfVibeCoding challenge — shipping one AI project every day, building in public, learning by doing.

Follow the journey:
- **GitHub:** [github.com/Swapnil-bo](https://github.com/Swapnil-bo)
- **X / Twitter:** [@SwapnilHazra4](https://x.com/SwapnilHazra4)

If ONEIROS gave you a reading that hit different — screenshot the share card and tag me. I want to see what the oracle says to other dreamers.

---

## ◐ Roadmap

- [ ] Streaming response support (watch the analysis appear word by word in real time)
- [ ] Dream pattern analysis across journal entries (what recurring symbols say about you over time)
- [ ] Multiple model support UI (swap between qwen2.5:7b / 14b / mistral in settings)
- [ ] Dream audio input (speak your dream, Whisper transcribes, ONEIROS analyzes)
- [ ] Constellation visualization (map recurring symbols across dreams as a network graph)
- [ ] PWA support (install as a desktop app, works offline for journal access)

---

<div align="center">

<br />

```
ONEIROS · Local-first · qwen2.5:7b · No cloud · No keys
```

*"The dream is the small hidden door in the deepest and most intimate sanctum of the soul."*
— **C.G. Jung**

<br />

**Built with obsession by [Swapnil Hazra](https://github.com/Swapnil-bo)**

</div>
