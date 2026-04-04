import time
import logging
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse
from backend.models.schemas import DreamRequest, DreamResponse
from backend.services.ollama_service import interpret_dream, check_ollama_health

# ─────────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────────
logger = logging.getLogger("oneiros.routes")
router = APIRouter(prefix="/api", tags=["Dream Interpretation"])


# ─────────────────────────────────────────────
# MIDDLEWARE HELPER — request timing
# ─────────────────────────────────────────────
def log_request(request: Request, dream_length: int):
    logger.info(
        f"Incoming interpretation request | "
        f"IP: {request.client.host} | "
        f"Dream length: {dream_length} chars"
    )


# ─────────────────────────────────────────────
# POST /api/interpret
# ─────────────────────────────────────────────
@router.post(
    "/interpret",
    response_model=DreamResponse,
    status_code=status.HTTP_200_OK,
    summary="Interpret a dream",
    description="""
    Submit a dream description and receive a deep multi-framework psychological analysis.
    
    The analysis includes:
    - **Jungian** — shadow, anima/animus, individuation, collective unconscious
    - **Freudian** — repressed desires, ego/id/superego dynamics, wish fulfillment
    - **Symbolic** — universal and cultural symbol meanings
    - **Archetypal** — mythological patterns, hero's journey, trickster, mother
    - **Symbols** — extracted key symbols with psychological meanings
    - **Mood** — emotional signature of the dream
    - **Summary** — single-sentence psychological truth
    """,
    responses={
        200: {"description": "Dream interpreted successfully"},
        400: {"description": "Dream text too short or invalid"},
        503: {"description": "Ollama is not running or model unavailable"},
        504: {"description": "Interpretation timed out"},
        500: {"description": "Internal interpretation error"},
    }
)
async def interpret(request: Request, body: DreamRequest) -> DreamResponse:
    """
    Core dream interpretation endpoint.
    Validates input → calls ONEIROS → returns structured psychological analysis.
    """
    start_time = time.time()
    log_request(request, len(body.dream))

    # ── Extra guard: strip whitespace-only dreams ──
    cleaned_dream = body.dream.strip()
    if len(cleaned_dream) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "dream_too_short",
                "message": "Your dream description must be at least 10 characters. Tell ONEIROS more.",
            }
        )

    try:
        result = await interpret_dream(cleaned_dream)

        elapsed = round(time.time() - start_time, 2)
        logger.info(f"Interpretation complete in {elapsed}s | Mood: {result.mood} ({result.mood_score})")

        return result

    except ConnectionError as e:
        logger.error(f"Ollama connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "ollama_unavailable",
                "message": str(e),
                "fix": "Run `ollama serve` in a terminal, then retry."
            }
        )

    except TimeoutError as e:
        logger.error(f"Interpretation timed out: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "error": "interpretation_timeout",
                "message": "ONEIROS took too long to respond. Try a shorter dream description.",
            }
        )

    except RuntimeError as e:
        logger.error(f"Interpretation runtime error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "interpretation_failed",
                "message": "ONEIROS could not interpret this dream after multiple attempts.",
                "detail": str(e)
            }
        )

    except Exception as e:
        logger.exception(f"Unexpected error during interpretation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "unexpected_error",
                "message": "Something went wrong in the dream realm.",
                "detail": str(e)
            }
        )


# ─────────────────────────────────────────────
# GET /api/health
# ─────────────────────────────────────────────
@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if Ollama is running and the model is available.",
    responses={
        200: {"description": "Ollama is healthy"},
        503: {"description": "Ollama is down or model missing"},
    }
)
async def health_check():
    """
    Returns Ollama status + model availability.
    Frontend pings this on load to show a warning if Ollama isn't running.
    """
    health = await check_ollama_health()

    if not health["ollama_running"]:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "ollama_running": False,
                "model_available": False,
                "message": "Ollama is not running. Start it with `ollama serve`.",
                "fix": "Run `ollama serve` in a terminal."
            }
        )

    if not health["model_available"]:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "ollama_running": True,
                "model_available": False,
                "model": health["model"],
                "available_models": health["available_models"],
                "message": f"Model `{health['model']}` not found.",
                "fix": f"Run `ollama pull {health['model']}` to download it."
            }
        )

    return {
        "status": "healthy",
        "ollama_running": True,
        "model_available": True,
        "model": health["model"],
        "available_models": health["available_models"],
        "message": "ONEIROS is awake and ready to interpret your dreams."
    }


# ─────────────────────────────────────────────
# GET /api/ping
# ─────────────────────────────────────────────
@router.get(
    "/ping",
    status_code=status.HTTP_200_OK,
    summary="Simple ping",
    description="Lightweight liveness check. Just confirms the API is running.",
    include_in_schema=False  # hide from Swagger — internal use only
)
async def ping():
    return {"ping": "pong", "service": "ONEIROS Dream Interpreter"}