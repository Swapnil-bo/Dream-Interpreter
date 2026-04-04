import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from backend.routes.interpret import router
from backend.services.ollama_service import check_ollama_health

# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
logger = logging.getLogger("oneiros.main")


# ─────────────────────────────────────────────
# LIFESPAN — startup + shutdown events
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ──
    logger.info("━" * 50)
    logger.info("🌙 ONEIROS Dream Interpreter is waking up...")
    logger.info("━" * 50)

    health = await check_ollama_health()

    if health["ollama_running"]:
        if health["model_available"]:
            logger.info(f"✅ Ollama running | Model `{health['model']}` ready")
        else:
            logger.warning(
                f"⚠️  Ollama running but model `{health['model']}` NOT found. "
                f"Run: ollama pull {health['model']}"
            )
            logger.info(f"   Available models: {health.get('available_models', [])}")
    else:
        logger.error(
            "❌ Ollama is NOT running. "
            "Start it with: ollama serve"
        )

    logger.info("━" * 50)
    logger.info("📖 Swagger UI → http://localhost:8000/docs")
    logger.info("📡 API Base   → http://localhost:8000/api")
    logger.info("💚 Health     → http://localhost:8000/api/health")
    logger.info("━" * 50)

    yield  # ← app runs here

    # ── SHUTDOWN ──
    logger.info("🌙 ONEIROS is going back to sleep. Goodbye.")


# ─────────────────────────────────────────────
# APP INSTANCE
# ─────────────────────────────────────────────
app = FastAPI(
    title="ONEIROS — Dream Interpreter",
    description="""
## 🌙 ONEIROS Dream Interpreter API

Submit a dream. Receive a deep multi-framework psychological analysis powered by **qwen2.5:7b** running locally via Ollama.

### Frameworks
- **Jungian** — shadow self, archetypes, individuation, collective unconscious
- **Freudian** — repressed desires, ego/id/superego, wish fulfillment  
- **Symbolic** — universal and cultural symbol meanings
- **Archetypal** — mythological patterns from Campbell, von Franz, Hillman

### Stack
- FastAPI + Pydantic v2
- Ollama (local LLM, no cloud, no API keys)
- qwen2.5:7b
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # fallback
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# GLOBAL MIDDLEWARE — request timing + logging
# ─────────────────────────────────────────────
@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000, 2)  # ms

    # Attach timing header to every response
    response.headers["X-Response-Time"] = f"{elapsed}ms"

    logger.info(
        f"{request.method} {request.url.path} "
        f"→ {response.status_code} "
        f"[{elapsed}ms]"
    )
    return response


# ─────────────────────────────────────────────
# GLOBAL EXCEPTION HANDLERS
# ─────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Pydantic validation errors → clean 422 with human-readable messages.
    Default FastAPI validation errors are ugly. This makes them readable.
    """
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })

    logger.warning(f"Validation error on {request.url.path}: {errors}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "message": "Request validation failed. Check your input.",
            "errors": errors
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for any unhandled exception — never expose raw tracebacks."""
    logger.exception(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "message": "Something broke in the dream realm. Check server logs.",
        }
    )


# ─────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────
app.include_router(router)


# ─────────────────────────────────────────────
# ROOT
# ─────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "ONEIROS Dream Interpreter",
        "version": "1.0.0",
        "status": "awake",
        "docs": "/docs",
        "health": "/api/health",
        "interpret": "POST /api/interpret"
    }


# ─────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )