import httpx
import json
import re
import asyncio
import logging
from typing import Optional
from pydantic_settings import BaseSettings
from backend.models.schemas import DreamResponse, Symbol

# ─────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────
logger = logging.getLogger("oneiros")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s"
)


# ─────────────────────────────────────────────
# CONFIG — driven by .env via pydantic-settings
# ─────────────────────────────────────────────
class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    model: str = "qwen2.5:7b"
    max_retries: int = 3
    timeout: float = 120.0

    class Config:
        env_file = ".env"
        env_prefix = "ONEIROS_"  # e.g. ONEIROS_MODEL=qwen2.5:14b in .env

settings = Settings()


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
        symbols = [Symbol(
            name="The Dream Itself",
            meaning="The unconscious speaks in ways that resist easy symbolization."
        )]

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
        "model": settings.model,
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

    async with httpx.AsyncClient(timeout=settings.timeout) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/chat",
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
    Retries up to max_retries times on parse failure with true exponential backoff.
    ConnectError is not retried — if Ollama is down, no amount of retrying helps.
    """
    last_error: Optional[Exception] = None
    raw_content: str = ""

    for attempt in range(1, settings.max_retries + 1):
        try:
            logger.info(f"Attempt {attempt}/{settings.max_retries} — interpreting dream...")

            result = await call_ollama(dream)
            raw_content = result["message"]["content"]

            logger.info(f"Raw response received ({len(raw_content)} chars)")

            parsed = extract_json(raw_content)

            if parsed is None:
                raise ValueError(f"JSON extraction failed on attempt {attempt}. Raw: {raw_content[:300]}...")

            dream_response = build_dream_response(parsed)

            logger.info(f"Dream interpreted successfully. Mood: {dream_response.mood} ({dream_response.mood_score})")
            return dream_response

        except httpx.ConnectError:
            # No point retrying — Ollama process is not running at all
            raise ConnectionError(
                "Cannot connect to Ollama. Make sure Ollama is running: `ollama serve`"
            )

        except httpx.HTTPStatusError as e:
            # HTTP errors (4xx/5xx) from Ollama are not retryable
            raise ConnectionError(f"Ollama returned HTTP {e.response.status_code}")

        except (ValueError, KeyError) as e:
            last_error = e
            logger.warning(f"Parse error on attempt {attempt}: {e}")
            if attempt < settings.max_retries:
                wait = 2 ** attempt  # true exponential backoff: 2s, 4s, 8s...
                logger.info(f"Retrying in {wait}s...")
                await asyncio.sleep(wait)
            continue

    # All retries exhausted
    raise RuntimeError(
        f"ONEIROS failed to interpret the dream after {settings.max_retries} attempts. "
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
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])
            model_names = [m["name"] for m in models]
            model_available = any(settings.model in name for name in model_names)
            return {
                "ollama_running": True,
                "model_available": model_available,
                "model": settings.model,
                "available_models": model_names
            }
    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        return {
            "ollama_running": False,
            "model_available": False,
            "model": settings.model,
            "error": str(e)
        }