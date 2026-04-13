import { useState, useCallback, useRef, useEffect } from "react";
import { useDreamJournal } from "./useDreamJournal";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const API_BASE        = "/api";
const INTERPRET_URL   = `${API_BASE}/interpret`;
const HEALTH_URL      = `${API_BASE}/health`;
const PING_URL        = `${API_BASE}/ping`;

const HEALTH_POLL_MS  = 30_000;   // re-check Ollama every 30s
const MIN_DREAM_CHARS = 10;
const MAX_DREAM_CHARS = 2000;


// ─────────────────────────────────────────────
// STATUS ENUM — every possible UI state
// ─────────────────────────────────────────────
export const AnalysisStatus = Object.freeze({
  IDLE:        "idle",
  VALIDATING:  "validating",
  LOADING:     "loading",
  STREAMING:   "streaming",    // reserved for future streaming support
  SUCCESS:     "success",
  ERROR:       "error",
  ABORTED:     "aborted",
});


// ─────────────────────────────────────────────
// ERROR TYPES — maps backend error codes to
// human-readable UI messages
// ─────────────────────────────────────────────
const ERROR_MESSAGES = {
  dream_too_short:      "Your dream is too short. Tell ONEIROS more — at least 10 characters.",
  ollama_unavailable:   "Ollama isn't running. Open a terminal and run: ollama serve",
  interpretation_timeout: "The oracle took too long. Try describing a shorter dream.",
  interpretation_failed:  "ONEIROS couldn't interpret this dream after several attempts. Try again.",
  validation_error:       "Something about your input confused the oracle. Try rephrasing.",
  network_error:          "Can't reach the server. Is the backend running on port 8000?",
  unexpected_error:       "Something broke in the dream realm. Check the console.",
  aborted:                "Interpretation cancelled.",
};

function resolveErrorMessage(errorCode, fallback) {
  return ERROR_MESSAGES[errorCode] ?? fallback ?? ERROR_MESSAGES.unexpected_error;
}


// ─────────────────────────────────────────────
// VALIDATION — client-side before we even fetch
// ─────────────────────────────────────────────
function validateDream(text) {
  const trimmed = text?.trim() ?? "";

  if (!trimmed)
    return { valid: false, error: "dream_empty", message: "Please describe your dream first." };

  if (trimmed.length < MIN_DREAM_CHARS)
    return { valid: false, error: "dream_too_short", message: ERROR_MESSAGES.dream_too_short };

  if (trimmed.length > MAX_DREAM_CHARS)
    return {
      valid: false,
      error: "dream_too_long",
      message: `Your dream is too long. Maximum ${MAX_DREAM_CHARS} characters (currently ${trimmed.length}).`,
    };

  return { valid: true, error: null, message: null, cleaned: trimmed };
}


// ─────────────────────────────────────────────
// FETCH HELPER — typed, safe, with abort support
// ─────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body   = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Build a structured error from the backend's error shape
    const code    = isJson ? (body?.error ?? "unexpected_error") : "unexpected_error";
    const message = isJson ? (body?.message ?? body?.detail ?? "Unknown error") : body;
    const fix     = isJson ? (body?.fix ?? null) : null;

    const err     = new Error(message);
    err.code      = code;
    err.fix       = fix;
    err.status    = response.status;
    throw err;
  }

  return body;
}


// ─────────────────────────────────────────────
// MAIN HOOK — useDreamAnalysis
// ─────────────────────────────────────────────
export function useDreamAnalysis() {
  // ── Analysis state ──
  const [status,   setStatus]   = useState(AnalysisStatus.IDLE);
  const [analysis, setAnalysis] = useState(null);
  const [error,    setError]    = useState(null);   // { code, message, fix }
  const [elapsed,  setElapsed]  = useState(null);   // ms — how long it took

  // ── Ollama health state ──
  const [health,        setHealth]        = useState(null);
  const [healthChecking, setHealthChecking] = useState(false);

  // ── Refs ──
  const abortRef    = useRef(null);   // AbortController
  const timerRef    = useRef(null);   // elapsed timer interval
  const pollRef     = useRef(null);   // health poll interval
  const startRef    = useRef(null);   // start timestamp

  // ── Journal ──
  const addEntry = useDreamJournal((s) => s.addEntry);


  // ────────────────────────────────────────────
  // CLEANUP on unmount
  // ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
    };
  }, []);


  // ────────────────────────────────────────────
  // ELAPSED TIMER — ticks every second during load
  // Gives the user feedback that something is happening
  // ────────────────────────────────────────────
  function startTimer() {
    startRef.current = performance.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.round(performance.now() - startRef.current));
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
    if (startRef.current) {
      setElapsed(Math.round(performance.now() - startRef.current));
    }
  }


  // ────────────────────────────────────────────
  // HEALTH CHECK — single shot
  // ────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    setHealthChecking(true);
    try {
      const data = await apiFetch(HEALTH_URL);
      setHealth({
        status:         data.status,
        ollamaRunning:  data.ollama_running,
        modelAvailable: data.model_available,
        model:          data.model,
        message:        data.message,
        fix:            data.fix ?? null,
        checkedAt:      Date.now(),
      });
    } catch (e) {
      // If /health itself fails, backend is probably down
      setHealth({
        status:         "unreachable",
        ollamaRunning:  false,
        modelAvailable: false,
        model:          null,
        message:        "Backend server is not reachable.",
        fix:            "Run `uvicorn backend.main:app --reload` in your project root.",
        checkedAt:      Date.now(),
      });
    } finally {
      setHealthChecking(false);
    }
  }, []);


  // ────────────────────────────────────────────
  // HEALTH POLL — auto re-checks every 30s
  // So if user starts Ollama mid-session, the
  // warning banner disappears automatically
  // ────────────────────────────────────────────
  const startHealthPoll = useCallback(() => {
    checkHealth(); // immediate first check
    pollRef.current = setInterval(checkHealth, HEALTH_POLL_MS);
  }, [checkHealth]);

  const stopHealthPoll = useCallback(() => {
    clearInterval(pollRef.current);
  }, []);


  // ────────────────────────────────────────────
  // INTERPRET — the main action
  // ────────────────────────────────────────────
  const interpret = useCallback(async (dreamText) => {

    // ── 1. Validate ──
    setStatus(AnalysisStatus.VALIDATING);
    const validation = validateDream(dreamText);

    if (!validation.valid) {
      setStatus(AnalysisStatus.ERROR);
      setError({
        code:    validation.error,
        message: validation.message,
        fix:     null,
      });
      return null;
    }

    // ── 2. Abort any in-flight request ──
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // ── 3. Reset + start loading ──
    setError(null);
    setAnalysis(null);
    setStatus(AnalysisStatus.LOADING);
    startTimer();

    try {
      // ── 4. Call the API ──
      const data = await apiFetch(INTERPRET_URL, {
        method: "POST",
        body:   JSON.stringify({ dream: validation.cleaned }),
        signal: abortRef.current.signal,
      });

      // ── 5. Stop timer ──
      stopTimer();

      // ── 6. Validate response shape ──
      if (!data?.jungian || !data?.freudian) {
        throw Object.assign(
          new Error("Malformed response from ONEIROS."),
          { code: "malformed_response" }
        );
      }

      // ── 7. Store in state ──
      setAnalysis(data);
      setStatus(AnalysisStatus.SUCCESS);

      // ── 8. Persist to journal ──
      const entryId = addEntry(validation.cleaned, data);
      console.log(`[ONEIROS] Dream saved to journal: ${entryId}`);

      return data;

    } catch (e) {

      stopTimer();

      // AbortError — user cancelled
      if (e.name === "AbortError") {
        setStatus(AnalysisStatus.ABORTED);
        setError({
          code:    "aborted",
          message: ERROR_MESSAGES.aborted,
          fix:     null,
        });
        return null;
      }

      // Network failure — fetch itself threw (backend down)
      if (e instanceof TypeError && e.message.includes("fetch")) {
        setStatus(AnalysisStatus.ERROR);
        setError({
          code:    "network_error",
          message: ERROR_MESSAGES.network_error,
          fix:     "Make sure FastAPI is running: uvicorn backend.main:app --reload",
        });
        return null;
      }

      // Structured API error (4xx / 5xx)
      setStatus(AnalysisStatus.ERROR);
      setError({
        code:    e.code    ?? "unexpected_error",
        message: resolveErrorMessage(e.code, e.message),
        fix:     e.fix     ?? null,
        status:  e.status  ?? null,
      });
      return null;
    }

  }, [addEntry]);


  // ────────────────────────────────────────────
  // ABORT — cancel in-flight request
  // ────────────────────────────────────────────
  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);


  // ────────────────────────────────────────────
  // RESET — back to idle, clear everything
  // ────────────────────────────────────────────
  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopTimer();
    setStatus(AnalysisStatus.IDLE);
    setAnalysis(null);
    setError(null);
    setElapsed(null);
  }, []);


  // ────────────────────────────────────────────
  // RETRY — re-interpret last dream
  // ────────────────────────────────────────────
  const retryRef = useRef(null);

  const interpret_with_retry = useCallback(async (dreamText) => {
    retryRef.current = dreamText;
    return interpret(dreamText);
  }, [interpret]);

  const retry = useCallback(() => {
    if (retryRef.current) {
      return interpret(retryRef.current);
    }
  }, [interpret]);


  // ────────────────────────────────────────────
  // DERIVED STATE — convenient booleans for UI
  // ────────────────────────────────────────────
  const isIdle      = status === AnalysisStatus.IDLE;
  const isLoading   = status === AnalysisStatus.LOADING   ||
                      status === AnalysisStatus.VALIDATING;
  const isSuccess   = status === AnalysisStatus.SUCCESS;
  const isError     = status === AnalysisStatus.ERROR;
  const isAborted   = status === AnalysisStatus.ABORTED;
  const canInterpret = !isLoading;

  // Formatted elapsed time string — "3s", "1m 12s"
  const elapsedLabel = elapsed === null ? null
    : elapsed < 60_000
    ? `${Math.round(elapsed / 1000)}s`
    : `${Math.floor(elapsed / 60_000)}m ${Math.round((elapsed % 60_000) / 1000)}s`;

  // Health convenience booleans
  const isOllamaDown    = health && !health.ollamaRunning;
  const isModelMissing  = health && health.ollamaRunning && !health.modelAvailable;
  const isHealthy       = health?.status === "healthy";


  // ────────────────────────────────────────────
  // RETURN
  // ────────────────────────────────────────────
  return {
    // ── Core ──
    interpret:    interpret_with_retry,
    abort,
    reset,
    retry,

    // ── State ──
    status,
    analysis,
    error,
    elapsed,
    elapsedLabel,

    // ── Booleans ──
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isAborted,
    canInterpret,

    // ── Health ──
    health,
    healthChecking,
    isOllamaDown,
    isModelMissing,
    isHealthy,
    checkHealth,
    startHealthPoll,
    stopHealthPoll,

    // ── Validation util ──
    validateDream,
    MIN_DREAM_CHARS,
    MAX_DREAM_CHARS,
  };
}


// ─────────────────────────────────────────────
// LIGHTWEIGHT COMPANION HOOK
// For components that only need health status
// and don't want to pull in the full hook
// ─────────────────────────────────────────────
export function useOllamaHealth() {
  const [health, setHealth]   = useState(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const data  = await apiFetch(HEALTH_URL);
      setHealth({ ...data, checkedAt: Date.now() });
    } catch {
      setHealth({
        status:         "unreachable",
        ollama_running: false,
        model_available: false,
        checkedAt:      Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-check on mount
  useEffect(() => { check(); }, [check]);

  return { health, loading, refetch: check };
}


// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export { validateDream, resolveErrorMessage, ERROR_MESSAGES };