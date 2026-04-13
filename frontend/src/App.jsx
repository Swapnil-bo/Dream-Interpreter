import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDreamAnalysis }  from "@hooks/useDreamAnalysis";
import { useDreamJournal }   from "@hooks/useDreamJournal";
import { formatAnalysis }    from "@utils/formatAnalysis";
import DreamInput    from "@components/DreamInput";
import AnalysisPanel from "@components/AnalysisPanel";
import SymbolTags    from "@components/SymbolTags";
import MoodMeter     from "@components/MoodMeter";
import DreamJournal  from "@components/DreamJournal";
import ShareCard     from "@components/ShareCard";
import Loader        from "@components/Loader";

// ─────────────────────────────────────────────
// APP VIEWS
// ─────────────────────────────────────────────
const VIEW = Object.freeze({
  HOME:    "home",
  RESULT:  "result",
  JOURNAL: "journal",
});

// ─────────────────────────────────────────────
// MOTION VARIANTS
// ─────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0, y: -16, filter: "blur(6px)",
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
};

const staggerChild = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
  },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit:    { opacity: 0, transition: { duration: 0.25 } },
};


// ─────────────────────────────────────────────
// HEALTH BANNER
// ─────────────────────────────────────────────
function HealthBanner({ health, onDismiss }) {
  if (!health || health.status === "healthy") return null;

  const isDown    = !health.ollamaRunning;
  const isMissing = health.ollamaRunning && !health.modelAvailable;

  return (
    <AnimatePresence>
      <motion.div
        key="health-banner"
        initial={{ opacity: 0, y: -40, height: 0 }}
        animate={{ opacity: 1, y: 0,  height: "auto" }}
        exit={{    opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div style={{
          background: isDown
            ? "rgba(61, 10, 10, 0.85)"
            : "rgba(30, 20, 5, 0.85)",
          borderBottom: isDown
            ? "1px solid rgba(196, 40, 40, 0.4)"
            : "1px solid rgba(196, 144, 10, 0.4)",
          backdropFilter: "blur(16px)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          fontSize: "0.78rem",
          fontFamily: "var(--font-mono)",
          color: isDown ? "var(--crimson-glow)" : "var(--oracle-glow)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>{isDown ? "●" : "◐"}</span>
            <span>{health.message}</span>
            {health.fix && (
              <span style={{ opacity: 0.7, color: "var(--star-mid)" }}>
                → {health.fix}
              </span>
            )}
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: "none", border: "none",
              color: "currentColor", cursor: "pointer",
              opacity: 0.6, fontSize: "1rem",
              padding: "2px 6px",
            }}
            aria-label="Dismiss"
          >✕</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


// ─────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────
function Nav({ view, onNavigate, journalCount }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position:       "sticky",
        top:            0,
        zIndex:         "var(--z-overlay)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "0 clamp(16px, 4vw, 48px)",
        height:         "60px",
        background:     "rgba(4, 4, 15, 0.75)",
        backdropFilter: "blur(24px) saturate(150%)",
        borderBottom:   "1px solid rgba(124, 92, 191, 0.12)",
      }}
    >
      {/* Logo */}
      <button
        onClick={() => onNavigate(VIEW.HOME)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "baseline", gap: "10px",
        }}
      >
        <span style={{
          fontFamily:  "var(--font-display)",
          fontSize:    "1.1rem",
          fontWeight:  700,
          letterSpacing: "0.2em",
          background: "linear-gradient(135deg, var(--oracle-glow), var(--star-pure), var(--nebula-pure))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor:  "transparent",
          backgroundClip: "text",
        }}>
          ONEIROS
        </span>
        <span style={{
          fontFamily:  "var(--font-body)",
          fontStyle:   "italic",
          fontSize:    "0.72rem",
          color:       "var(--star-dim)",
          letterSpacing: "0.08em",
        }}>
          dream interpreter
        </span>
      </button>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {[
          { id: VIEW.HOME,    label: "Interpret" },
          { id: VIEW.JOURNAL, label: `Journal${journalCount > 0 ? ` (${journalCount})` : ""}` },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => onNavigate(link.id)}
            style={{
              background:    view === link.id
                ? "rgba(124, 92, 191, 0.15)"
                : "transparent",
              border:        view === link.id
                ? "1px solid rgba(124, 92, 191, 0.35)"
                : "1px solid transparent",
              borderRadius:  "6px",
              color:         view === link.id
                ? "var(--nebula-pure)"
                : "var(--star-mid)",
              fontFamily:    "var(--font-display)",
              fontSize:      "0.7rem",
              fontWeight:    500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding:       "6px 14px",
              cursor:        "pointer",
              transition:    "all 200ms ease",
            }}
          >
            {link.label}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}


// ─────────────────────────────────────────────
// HERO — landing section
// ─────────────────────────────────────────────
function Hero() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{ textAlign: "center", padding: "clamp(32px, 6vw, 64px) 0 40px" }}
    >
      {/* Glyph */}
      <motion.div variants={staggerChild} style={{ marginBottom: "20px" }}>
        <span style={{
          fontSize:  "clamp(2.5rem, 6vw, 4rem)",
          filter:    "drop-shadow(0 0 24px rgba(124, 92, 191, 0.5))",
          display:   "inline-block",
          animation: "float 4s ease-in-out infinite",
        }}>
          🌙
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1 variants={staggerChild} className="title-oracle"
        style={{ marginBottom: "16px", fontSize: "clamp(2.2rem, 6vw, 4rem)" }}
      >
        ONEIROS
      </motion.h1>

      {/* Tagline */}
      <motion.p variants={staggerChild} className="title-sub"
        style={{ marginBottom: "12px", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}
      >
        Speak your dream into the void. The oracle listens.
      </motion.p>

      {/* Sub-tagline */}
      <motion.p variants={staggerChild} style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.68rem",
        color:         "var(--star-dim)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}>
        Jungian · Freudian · Symbolic · Archetypal
      </motion.p>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// RESULT HEADER
// ─────────────────────────────────────────────
function ResultHeader({ analysis, onNewDream }) {
  const formatted = formatAnalysis(analysis);
  if (!formatted) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{ marginBottom: "32px" }}
    >
      {/* Back button */}
      <motion.div variants={staggerChild} style={{ marginBottom: "24px" }}>
        <button className="btn btn-ghost" onClick={onNewDream}
          style={{ fontSize: "0.72rem", letterSpacing: "0.15em", padding: "8px 16px" }}
        >
          ← New Dream
        </button>
      </motion.div>

      {/* Summary card */}
      <motion.div variants={staggerChild}>
        <div className="glass-oracle" style={{
          padding:      "clamp(20px, 4vw, 32px)",
          marginBottom: "24px",
          position:     "relative",
          overflow:     "hidden",
        }}>
          {/* Decorative glyph */}
          <div style={{
            position:  "absolute", top: "16px", right: "20px",
            fontSize:  "2.5rem", opacity: 0.08,
            fontFamily: "var(--font-display)",
          }}>
            ✦
          </div>

          <div className="label-oracle" style={{ marginBottom: "12px" }}>
            The Oracle Speaks
          </div>

          <p style={{
            fontFamily:  "var(--font-body)",
            fontSize:    "clamp(1rem, 2.5vw, 1.25rem)",
            fontStyle:   "italic",
            fontWeight:  400,
            lineHeight:  1.7,
            color:       "var(--oracle-pure)",
            margin:      0,
          }}>
            "{formatted.summary}"
          </p>
        </div>
      </motion.div>

      {/* Mood + symbols row */}
      <motion.div variants={staggerChild} style={{
        display:   "grid",
        gridTemplateColumns: "1fr 1fr",
        gap:       "16px",
      }}>
        <MoodMeter
          score={formatted.mood.score}
          label={formatted.mood.label}
          tier={formatted.mood.tier}
          tierLabel={formatted.mood.tierLabel}
          emoji={formatted.mood.emoji}
          description={formatted.mood.description}
        />
        <div className="glass-dim" style={{ padding: "16px" }}>
          <div className="label-nebula" style={{ marginBottom: "10px" }}>
            Dream Symbols
          </div>
          <SymbolTags symbols={formatted.symbols} />
        </div>
      </motion.div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// ERROR DISPLAY
// ─────────────────────────────────────────────
function ErrorDisplay({ error, onRetry, onReset }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div style={{
        background:   "rgba(61, 10, 10, 0.4)",
        border:       "1px solid rgba(196, 40, 40, 0.35)",
        borderRadius: "var(--radius-lg)",
        padding:      "clamp(20px, 4vw, 32px)",
        textAlign:    "center",
      }}>
        <div style={{
          fontSize:   "2rem",
          marginBottom: "12px",
          filter:     "drop-shadow(0 0 12px rgba(196, 40, 40, 0.5))",
        }}>
          ⚠
        </div>

        <h3 style={{
          fontFamily:    "var(--font-display)",
          fontSize:      "1rem",
          letterSpacing: "0.1em",
          color:         "var(--crimson-glow)",
          marginBottom:  "10px",
        }}>
          The Oracle is Silent
        </h3>

        <p style={{
          fontFamily: "var(--font-body)",
          fontSize:   "0.95rem",
          color:      "var(--star-full)",
          marginBottom: error?.fix ? "8px" : "20px",
          lineHeight:  1.6,
        }}>
          {error?.message ?? "Something went wrong in the dream realm."}
        </p>

        {error?.fix && (
          <p style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.72rem",
            color:         "var(--star-dim)",
            letterSpacing: "0.05em",
            marginBottom:  "20px",
            padding:       "8px 12px",
            background:    "rgba(0,0,0,0.3)",
            borderRadius:  "4px",
            display:       "inline-block",
          }}>
            {error.fix}
          </p>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {onRetry && (
            <button className="btn btn-ghost" onClick={onRetry}
              style={{ fontSize: "0.72rem" }}
            >
              Try Again
            </button>
          )}
          <button className="btn btn-ghost" onClick={onReset}
            style={{ fontSize: "0.72rem" }}
          >
            Start Over
          </button>
        </div>
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      textAlign:    "center",
      padding:      "clamp(24px, 4vw, 48px) 0",
      borderTop:    "1px solid rgba(124, 92, 191, 0.08)",
      marginTop:    "auto",
    }}>
      <p style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.65rem",
        color:         "var(--star-dim)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}>
        ONEIROS · Local-first · qwen2.5:7b · No cloud · No keys
      </p>
      <p style={{
        fontFamily: "var(--font-body)",
        fontStyle:  "italic",
        fontSize:   "0.72rem",
        color:      "rgba(110, 110, 154, 0.5)",
        marginTop:  "6px",
      }}>
        "Who looks outside, dreams; who looks inside, awakes." — C.G. Jung
      </p>
    </footer>
  );
}


// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [view,           setView]          = useState(VIEW.HOME);
  const [dreamText,      setDreamText]     = useState("");
  const [showShareCard,  setShowShareCard] = useState(false);
  const [bannerDismissed,setBannerDismissed] = useState(false);

  const {
    interpret, abort, reset, retry,
    status, analysis, error,
    isLoading, isSuccess, isError, isAborted,
    canInterpret, elapsedLabel,
    health, startHealthPoll, stopHealthPoll,
  } = useDreamAnalysis();

  const journalCount = useDreamJournal((s) => s.totalDreams);

  // ── Start health polling on mount ──
  useEffect(() => {
    startHealthPoll();
    return () => stopHealthPoll();
  }, [startHealthPoll, stopHealthPoll]);

  // ── Auto-navigate to result on success ──
  useEffect(() => {
    if (isSuccess && view === VIEW.HOME) {
      setView(VIEW.RESULT);
    }
  }, [isSuccess, view]);

  // ── Handlers ──
  const handleSubmit = useCallback(async (text) => {
    setDreamText(text);
    await interpret(text);
  }, [interpret]);

  const handleNewDream = useCallback(() => {
    reset();
    setDreamText("");
    setShowShareCard(false);
    setView(VIEW.HOME);
  }, [reset]);

  const handleNavigate = useCallback((targetView) => {
    if (targetView === VIEW.HOME && isLoading) return; // don't nav away mid-load
    setView(targetView);
    setShowShareCard(false);
  }, [isLoading]);

  const handleJournalSelect = useCallback((entry) => {
    // Load a past dream result from the journal
    setDreamText(entry.dreamText);
    setView(VIEW.RESULT);
  }, []);

  const showBanner = !bannerDismissed && health && health.status !== "healthy";

  // ── Layout ──
  return (
    <div style={{
      minHeight:     "100vh",
      display:       "flex",
      flexDirection: "column",
    }}>

      {/* Health Banner */}
      {showBanner && (
        <HealthBanner
          health={health}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Nav */}
      <Nav
        view={view}
        onNavigate={handleNavigate}
        journalCount={journalCount}
      />

      {/* Main */}
      <main style={{
        flex:      1,
        width:     "100%",
        maxWidth:  "860px",
        margin:    "0 auto",
        padding:   "0 clamp(16px, 4vw, 48px)",
        display:   "flex",
        flexDirection: "column",
      }}>
        <AnimatePresence mode="wait">

          {/* ══ HOME VIEW ══ */}
          {view === VIEW.HOME && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Hero />

              {/* Loading state */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    key="loader"
                    variants={fadeIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ marginBottom: "32px" }}
                  >
                    <Loader elapsedLabel={elapsedLabel} onAbort={abort} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error state */}
              <AnimatePresence>
                {(isError || isAborted) && !isLoading && (
                  <motion.div
                    key="error"
                    variants={fadeIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ marginBottom: "32px" }}
                  >
                    <ErrorDisplay
                      error={error}
                      onRetry={retry}
                      onReset={handleNewDream}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dream input */}
              {!isLoading && (
                <motion.div
                  key="input"
                  variants={staggerChild}
                  initial="initial"
                  animate="animate"
                >
                  <DreamInput
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    canSubmit={canInterpret}
                    defaultValue={dreamText}
                  />
                </motion.div>
              )}
            </motion.div>
          )}


          {/* ══ RESULT VIEW ══ */}
          {view === VIEW.RESULT && (
            <motion.div
              key="result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ paddingTop: "clamp(20px, 4vw, 40px)" }}
            >
              {/* Result header — summary + mood + symbols */}
              {analysis && (
                <ResultHeader
                  analysis={analysis}
                  onNewDream={handleNewDream}
                />
              )}

              {/* Analysis tabs */}
              {analysis && (
                <motion.div
                  variants={staggerChild}
                  initial="initial"
                  animate="animate"
                  style={{ marginBottom: "24px" }}
                >
                  <AnalysisPanel analysis={analysis} dreamText={dreamText} />
                </motion.div>
              )}

              {/* Action bar */}
              {analysis && (
                <motion.div
                  variants={staggerChild}
                  initial="initial"
                  animate="animate"
                  style={{
                    display:        "flex",
                    gap:            "12px",
                    justifyContent: "center",
                    flexWrap:       "wrap",
                    padding:        "24px 0",
                  }}
                >
                  <button
                    className="btn btn-oracle"
                    onClick={() => setShowShareCard((v) => !v)}
                    style={{ fontSize: "0.72rem" }}
                  >
                    {showShareCard ? "✕ Close Card" : "✦ Share Dream"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={handleNewDream}
                    style={{ fontSize: "0.72rem" }}
                  >
                    🌙 New Dream
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setView(VIEW.JOURNAL)}
                    style={{ fontSize: "0.72rem" }}
                  >
                    📖 Journal ({journalCount})
                  </button>
                </motion.div>
              )}

              {/* Share card */}
              <AnimatePresence>
                {showShareCard && analysis && (
                  <motion.div
                    key="share"
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{    opacity: 0, y: 16,  scale: 0.97 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: "32px" }}
                  >
                    <ShareCard
                      analysis={analysis}
                      dreamText={dreamText}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}


          {/* ══ JOURNAL VIEW ══ */}
          {view === VIEW.JOURNAL && (
            <motion.div
              key="journal"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ paddingTop: "clamp(20px, 4vw, 40px)" }}
            >
              {/* Journal header */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                style={{ marginBottom: "28px" }}
              >
                <motion.div variants={staggerChild}
                  style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}
                >
                  <button
                    className="btn btn-ghost"
                    onClick={() => setView(VIEW.HOME)}
                    style={{ fontSize: "0.72rem", padding: "6px 12px" }}
                  >
                    ← Back
                  </button>
                </motion.div>

                <motion.div variants={staggerChild}>
                  <h2 style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "clamp(1.4rem, 3vw, 2rem)",
                    fontWeight:    600,
                    letterSpacing: "0.1em",
                    color:         "var(--star-pure)",
                    marginBottom:  "4px",
                  }}>
                    Dream Journal
                  </h2>
                  <p style={{
                    fontFamily: "var(--font-body)",
                    fontStyle:  "italic",
                    fontSize:   "0.9rem",
                    color:      "var(--star-mid)",
                  }}>
                    {journalCount === 0
                      ? "Your unconscious has not yet spoken."
                      : `${journalCount} dream${journalCount !== 1 ? "s" : ""} recorded`}
                  </p>
                </motion.div>
              </motion.div>

              {/* Journal component */}
              <DreamJournal onSelectEntry={handleJournalSelect} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}