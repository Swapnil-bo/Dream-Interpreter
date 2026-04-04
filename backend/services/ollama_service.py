import httpx
import json
import re
import asyncio
from typing import Optional
from backend.models.schemas import DreamResponse, Symbol

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL = "qwen2.5:7b"
MAX_RETRIES = 3
TIMEOUT = 120.0

# ─────────────────────────────────────────────
# SYSTEM PROMPT — the soul of the interpreter
# ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are ONEIROS — an ancient, all-knowing dream oracle who speaks at the intersection of Jungian depth psychology, Freudian psychoanalysis, mythological symbolism, and archetypal pattern recognition.

You have read every word written by Carl Jung, Sigmund Freud, Joseph Campbell, Marie-Louise von Franz, James Hillman, and Gaston Bachelard. You think in symbols, archetypes, and the language of the unconscious.

When given a dream, you perform a DEEP, LAYERED, MULTI-FRAMEWORK psychological analysis. You do not give shallow or generic interpretations. You go DEEP. You find connections the dreamer never consciously noticed. You speak with authority, poetic precision, and psychological weight.

CRITICAL RULES:
1. You MUST respond ONLY with a single valid JSON object. No preamble. No explanation. No markdown. No backticks. Just raw JSON.
2. Every analysis field must be 3-5 rich, dense sentences minimum. Not vague. Specific to THIS dream.
3. Extract 4-7 symbols. Each symbol meaning must be psychologically rich, not surface-level.
4. mood must be a single evocative word or short phrase (e.g. "Anxious Yearning", "Numinous Terror", "Melancholic Liberation").
5. mood_score: 0.0 = deeply disturbing/dark, 0.5 = ambivalent/neutral, 1.0 = transcendent/peaceful.
6. summary must be a single piercing sentence under 280 chars that captures the dream's core psychological truth — make it feel like a revelation.

RESPOND IN THIS EXACT JSON STRUCTURE:
{
  "jungian": "...",
  "freudian": "...",
  "symbolic": "...",
  "archetypal": "...",
  "symbols": [
    {"name": "...", "meaning": "..."},
    {"name": "...", "meaning": "..."}
  ],
  "mood": "...",
  "mood_score": 0.0,
  "summary": "..."
}"""


USER_PROMPT_TEMPLATE = """Analyze this dream deeply across all four frameworks. Go beyond the obvious. Find what the dreamer's unconscious is truly communicating:

DREAM:
\"\"\"{dream}\"\"\"

Remember: Raw JSON only. No markdown. No backticks. Start your response with {{ and end with }}."""


# ─────────────────────────────────────────────
# JSON EXTRACTION — battle-tested parser
# ─────────────────────────────────────────────
def extract_json(raw: str) -> Optional[dict]:
    """
    Tries multiple strategies to extract valid JSON from LLM output.
    LLMs are unreliable — we fight back.
    """
    # Strategy 1: direct parse (best case)
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    # Strategy 2: find JSON block between first { and last }
    try:
        start = raw.index("{")
        end = raw.rindex("}") + 1
        return json.loads(raw[start:end])
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 3: strip markdown code fences then retry
    try:
        cleaned = re.sub(r"```(?:json)?", "", raw).strip()
        start = cleaned.index("{")
        end = cleaned.rindex("}") + 1
        return json.loads(cleaned[start:end])
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 4: fix common LLM JSON sins (trailing commas)
    try:
        cleaned = re.sub(r",\s*([}\]])", r"\1", raw)
        start = cleaned.index("{")
        end = cleaned.rindex("}") + 1
        return json.loads(cleaned[start:end])
    except (ValueError, json.JSONDecodeError):
        pass

    return None


# ─────────────────────────────────────────────
# VALIDATE + BUILD RESPONSE
# ─────────────────────────────────────────────
def build_dream_response(data: dict) -> DreamResponse:
    """Validates and builds DreamResponse from parsed JSON dict."""

    # Normalize symbols — handle if LLM returns strings instead of objects
    raw_symbols = data.get("symbols", [])
    symbols = []
    for s in raw_symbols:
        if isinstance(s, dict):
            symbols.append(Symbol(
                name=str(s.get("name", "Unknown"))[:100],
                meaning=str(s.get("meaning", "No meaning provided"))[:500]
            ))
        elif isinstance(s, str):
            symbols.append(Symbol(name=s[:100], meaning="Symbol extracted from dream"))

    if not symbols:
        symbols = [Symbol(name="The Dream Itself", meaning="The unconscious speaks in ways that resist easy symbolization.")]

    # Clamp mood_score to valid range
    raw_score = data.get("mood_score", 0.5)
    try:
        mood_score = max(0.0, min(1.0, float(raw_score)))
    except (TypeError, ValueError):
        mood_score = 0.5

    return DreamResponse(
        jungian=str(data.get("jungian", "The Jungian layer remains veiled in this dream.")).strip(),
        freudian=str(data.get("freudian", "The Freudian undercurrents are subtle but present.")).strip(),
        symbolic=str(data.get("symbolic", "Symbols weave through this dream like threads in an ancient tapestry.")).strip(),
        archetypal=str(data.get("archetypal", "Archetypal forces move beneath the surface of this dream.")).strip(),
        symbols=symbols,
        mood=str(data.get("mood", "Uncertain")).strip()[:50],
        mood_score=mood_score,
        summary=str(data.get("summary", "A dream that resists simple interpretation, inviting deeper reflection.")).strip()[:280]
    )


# ─────────────────────────────────────────────
# CORE OLLAMA CALL
# ─────────────────────────────────────────────
async def call_ollama(dream: str) -> dict:
    """Single attempt to call Ollama and get raw response."""

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(dream=dream)}
        ],
        "stream": False,
        "options": {
            "temperature": 0.75,      # creative but not hallucinating wildly
            "top_p": 0.9,
            "repeat_penalty": 1.1,    # discourage repetitive filler text
            "num_predict": 1500,      # enough tokens for deep analysis
        }
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload
        )
        response.raise_for_status()
        return response.json()


# ─────────────────────────────────────────────
# MAIN ENTRY POINT — with retry logic
# ─────────────────────────────────────────────
async def interpret_dream(dream: str) -> DreamResponse:
    """
    Interprets a dream using Ollama + qwen2.5:7b.
    Retries up to MAX_RETRIES times on parse failure.
    """
    last_error: Optional[Exception] = None
    raw_content: str = ""

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"[ONEIROS] Attempt {attempt}/{MAX_RETRIES} — interpreting dream...")

            result = await call_ollama(dream)
            raw_content = result["message"]["content"]

            print(f"[ONEIROS] Raw response received ({len(raw_content)} chars)")

            # Extract JSON
            parsed = extract_json(raw_content)

            if parsed is None:
                raise ValueError(f"JSON extraction failed on attempt {attempt}. Raw: {raw_content[:300]}...")

            # Build and validate response
            dream_response = build_dream_response(parsed)

            print(f"[ONEIROS] Dream interpreted successfully. Mood: {dream_response.mood} ({dream_response.mood_score})")
            return dream_response

        except httpx.ConnectError:
            raise ConnectionError(
                "Cannot connect to Ollama. Make sure Ollama is running: `ollama serve`"
            )
        except httpx.HTTPStatusError as e:
            raise ConnectionError(f"Ollama returned HTTP {e.response.status_code}")

        except (ValueError, KeyError) as e:
            last_error = e
            print(f"[ONEIROS] Parse error on attempt {attempt}: {e}")
            if attempt < MAX_RETRIES:
                wait = attempt * 2  # exponential backoff: 2s, 4s
                print(f"[ONEIROS] Retrying in {wait}s...")
                await asyncio.sleep(wait)
            continue

    # All retries exhausted
    raise RuntimeError(
        f"ONEIROS failed to interpret the dream after {MAX_RETRIES} attempts. "
        f"Last error: {last_error}. "
        f"Raw content preview: {raw_content[:500]}"
    )


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
async def check_ollama_health() -> dict:
    """Check if Ollama is running and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])
            model_names = [m["name"] for m in models]
            model_available = any(MODEL in name for name in model_names)
            return {
                "ollama_running": True,
                "model_available": model_available,
                "model": MODEL,
                "available_models": model_names
            }
    except Exception as e:
        return {
            "ollama_running": False,
            "model_available": False,
            "model": MODEL,
            "error": str(e)
        }