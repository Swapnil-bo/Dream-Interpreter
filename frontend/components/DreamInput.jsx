import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateDream } from "@hooks/useDreamAnalysis";

// ─────────────────────────────────────────────
// DREAM PROMPTS — rotating placeholder whispers
// Each one invites a different kind of dream
// ─────────────────────────────────────────────
const DREAM_PROMPTS = [
  "I was standing in a house I didn't recognize, but somehow knew was mine…",
  "I was falling, endlessly, through a sky the color of deep water…",
  "Someone I loved was there, but their face kept changing…",
  "I was being chased through corridors that kept shifting…",
  "I found a door I had never noticed before, and behind it…",
  "The ocean rose and I could not move, could not run…",
  "I was flying but slowly losing altitude, reaching for something…",
  "There were teeth. I cannot explain why, but there were teeth…",
  "A child was calling my name from somewhere I could not see…",
  "The world was burning but I felt inexplicably calm…",
];

// ─────────────────────────────────────────────
// CHARACTER COUNTER — changes color as limit nears
// ─────────────────────────────────────────────
function CharCounter({ current, max }) {
  const pct      = current / max;
  const isWarn   = pct > 0.80;
  const isDanger = pct > 0.95;
  const remaining = max - current;

  const color = isDanger
    ? "var(--crimson-glow)"
    : isWarn
    ? "var(--oracle-glow)"
    : "var(--star-dim)";

  return (
    <AnimatePresence>
      {current > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        "6px",
          }}
        >
          {/* Mini progress arc */}
          <svg width="16" height="16" viewBox="0 0 16 16"
            style={{ flexShrink: 0 }}
          >
            <circle
              cx="8" cy="8" r="6"
              fill="none"
              stroke="rgba(124,92,191,0.15)"
              strokeWidth="1.5"
            />
            <motion.circle
              cx="8" cy="8" r="6"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 6}`}
              strokeDashoffset={`${2 * Math.PI * 6 * (1 - pct)}`}
              transform="rotate(-90 8 8)"
              style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
            />
          </svg>

          <motion.span
            animate={{ color }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.62rem",
              letterSpacing: "0.08em",
            }}
          >
            {isDanger
              ? `${remaining} left`
              : `${current} / ${max}`}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// VALIDATION HINT — shows below textarea
// ─────────────────────────────────────────────
function ValidationHint({ text, minChars }) {
  const len         = text.trim().length;
  const hasContent  = len > 0;
  const isTooShort  = hasContent && len < minChars;
  const isReady     = len >= minChars;

  return (
    <AnimatePresence mode="wait">
      {isTooShort && (
        <motion.p
          key="too-short"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          style={{
            fontFamily: "var(--font-body)",
            fontStyle:  "italic",
            fontSize:   "0.78rem",
            color:      "var(--star-dim)",
          }}
        >
          Keep going… {minChars - len} more character{minChars - len !== 1 ? "s" : ""} before the oracle can listen
        </motion.p>
      )}
      {isReady && (
        <motion.p
          key="ready"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          style={{
            fontFamily: "var(--font-body)",
            fontStyle:  "italic",
            fontSize:   "0.78rem",
            color:      "rgba(124, 92, 191, 0.7)",
          }}
        >
          The oracle is ready to receive your dream
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// SUMMON BUTTON — the main CTA
// ─────────────────────────────────────────────
function SummonButton({ canSubmit, isReady, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      disabled={!canSubmit || !isReady}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={()   => setHovered(false)}
      whileHover={canSubmit && isReady ? { scale: 1.02, y: -2 } : {}}
      whileTap={canSubmit && isReady   ? { scale: 0.97 }        : {}}
      style={{
        position:      "relative",
        overflow:      "hidden",
        fontFamily:    "var(--font-display)",
        fontSize:      "0.78rem",
        fontWeight:    600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        padding:       "14px 36px",
        borderRadius:  "var(--radius-md)",
        border:        "none",
        cursor:        canSubmit && isReady ? "pointer" : "not-allowed",
        opacity:       canSubmit && isReady ? 1 : 0.4,
        background:    canSubmit && isReady
          ? "linear-gradient(135deg, var(--nebula-mid) 0%, var(--nebula-full) 60%, rgba(167,141,232,0.9) 100%)"
          : "var(--ink-3)",
        color:         "var(--star-pure)",
        boxShadow:     canSubmit && isReady
          ? hovered
            ? "0 8px 32px rgba(74,47,160,0.65), 0 0 64px rgba(124,92,191,0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
            : "0 4px 20px rgba(74,47,160,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "none",
        transition:    "box-shadow 0.3s ease, background 0.3s ease",
        minWidth:      "200px",
      }}
    >
      {/* Shimmer sweep on hover */}
      <AnimatePresence>
        {hovered && canSubmit && isReady && (
          <motion.div
            initial={{ x: "-100%", skewX: "-20deg" }}
            animate={{ x:  "200%" }}
            exit={{    x:  "200%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
              pointerEvents:"none",
            }}
          />
        )}
      </AnimatePresence>

      {/* Button label */}
      <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          {canSubmit && isReady ? (
            <motion.span
              key="ready"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -4 }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span style={{
                fontSize: "1rem",
                filter:   "drop-shadow(0 0 4px rgba(255,255,255,0.5))",
              }}>
                ☽
              </span>
              Summon the Oracle
            </motion.span>
          ) : (
            <motion.span
              key="waiting"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -4 }}
            >
              Speak your dream first
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────
// PLACEHOLDER ROTATOR
// Shows rotating dream prompts with fade
// ─────────────────────────────────────────────
function usePlaceholderRotation(active) {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * DREAM_PROMPTS.length)
  );

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % DREAM_PROMPTS.length);
    }, 4500);
    return () => clearInterval(t);
  }, [active]);

  return DREAM_PROMPTS[index];
}

// ─────────────────────────────────────────────
// FOCUS AURA — border glow that expands on focus
// ─────────────────────────────────────────────
function FocusAura({ focused }) {
  return (
    <AnimatePresence>
      {focused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1   }}
          exit={{    opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            position:     "absolute",
            inset:        "-3px",
            borderRadius: "calc(var(--radius-lg) + 3px)",
            background:   "transparent",
            border:       "1px solid rgba(124, 92, 191, 0.35)",
            boxShadow:    "0 0 0 4px rgba(124,92,191,0.06), 0 0 32px rgba(124,92,191,0.12)",
            pointerEvents:"none",
            zIndex:        0,
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// DREAM PROMPTS STRIP — example prompts the
// user can tap to seed their textarea
// ─────────────────────────────────────────────
function ExamplePrompts({ onSelect, visible }) {
  const examples = [
    "I was falling…",
    "Being chased…",
    "A strange house…",
    "Someone familiar…",
    "I could fly…",
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0  }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{    opacity: 0, height: 0  }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div style={{
            display:    "flex",
            gap:        "8px",
            flexWrap:   "wrap",
            paddingTop: "12px",
          }}>
            <span style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "0.6rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         "var(--star-dim)",
              display:       "flex",
              alignItems:    "center",
              marginRight:   "2px",
            }}>
              Try:
            </span>
            {examples.map((ex) => (
              <motion.button
                key={ex}
                onClick={() => onSelect(ex)}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{   scale: 0.97 }}
                style={{
                  background:    "rgba(74, 47, 160, 0.1)",
                  border:        "1px solid rgba(124, 92, 191, 0.25)",
                  borderRadius:  "var(--radius-full)",
                  color:         "var(--star-mid)",
                  fontFamily:    "var(--font-body)",
                  fontStyle:     "italic",
                  fontSize:      "0.75rem",
                  padding:       "4px 12px",
                  cursor:        "pointer",
                  transition:    "all 200ms ease",
                  whiteSpace:    "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background   = "rgba(124,92,191,0.18)";
                  e.target.style.borderColor  = "rgba(124,92,191,0.45)";
                  e.target.style.color        = "var(--nebula-pure)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background   = "rgba(74,47,160,0.1)";
                  e.target.style.borderColor  = "rgba(124,92,191,0.25)";
                  e.target.style.color        = "var(--star-mid)";
                }}
              >
                {ex}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// WORD COUNT STRIP
// ─────────────────────────────────────────────
function WordCountStrip({ text }) {
  const words = text.trim()
    ? text.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (!words) return null;

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.6rem",
        color:         "var(--star-dim)",
        letterSpacing: "0.1em",
      }}
    >
      {words} word{words !== 1 ? "s" : ""}
    </motion.span>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function DreamInput({
  onSubmit,
  isLoading   = false,
  canSubmit   = true,
  defaultValue = "",
}) {
  const MAX_CHARS = 2000;
  const MIN_CHARS = 10;

  const [text,        setText]    = useState(defaultValue);
  const [focused,     setFocused] = useState(false);
  const [submitted,   setSubmitted] = useState(false);
  const textareaRef               = useRef(null);
  const placeholder               = usePlaceholderRotation(!text && !focused);

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 600);
    return () => clearTimeout(t);
  }, []);

  // Sync defaultValue if it changes (journal re-load)
  useEffect(() => {
    if (defaultValue && !text) setText(defaultValue);
  }, [defaultValue]);

  const isReady     = text.trim().length >= MIN_CHARS;
  const isOverLimit = text.length > MAX_CHARS;
  const showExamples = !text && !focused;

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return; // hard stop
    setText(val);
    setSubmitted(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !isReady || isLoading) return;
    setSubmitted(true);
    onSubmit(text.trim());
  }, [canSubmit, isReady, isLoading, onSubmit, text]);

  // Cmd/Ctrl + Enter → submit
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleExampleSelect = useCallback((ex) => {
    setText(ex);
    textareaRef.current?.focus();
  }, []);

  const handleClear = useCallback(() => {
    setText("");
    setSubmitted(false);
    textareaRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      style={{ width: "100%" }}
    >
      {/* ── CARD ── */}
      <div style={{
        background:    "rgba(6, 6, 20, 0.75)",
        backdropFilter:"blur(24px) saturate(140%)",
        border:        "1px solid rgba(124, 92, 191, 0.2)",
        borderRadius:  "var(--radius-xl)",
        padding:       "clamp(20px, 4vw, 32px)",
        position:      "relative",
        transition:    "border-color 0.35s ease, box-shadow 0.35s ease",
        borderColor:   focused
          ? "rgba(124, 92, 191, 0.4)"
          : "rgba(124, 92, 191, 0.2)",
        boxShadow:     focused
          ? "0 8px 48px rgba(0,0,7,0.7), 0 0 0 1px rgba(124,92,191,0.08)"
          : "0 4px 24px rgba(0,0,7,0.5)",
      }}>

        <FocusAura focused={focused} />

        {/* ── HEADER ── */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginBottom:   "16px",
        }}>
          <div>
            <div className="label-oracle" style={{ marginBottom: "4px" }}>
              Describe Your Dream
            </div>
            <p style={{
              fontFamily: "var(--font-body)",
              fontStyle:  "italic",
              fontSize:   "0.8rem",
              color:      "var(--star-dim)",
              margin:     0,
            }}>
              Write freely. Every detail matters to the oracle.
            </p>
          </div>

          {/* Clear button — only when there's text */}
          <AnimatePresence>
            {text.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1   }}
                exit={{    opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                title="Clear"
                style={{
                  background:    "rgba(124, 92, 191, 0.08)",
                  border:        "1px solid rgba(124, 92, 191, 0.2)",
                  borderRadius:  "var(--radius-full)",
                  color:         "var(--star-dim)",
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.65rem",
                  letterSpacing: "0.1em",
                  padding:       "4px 10px",
                  cursor:        "pointer",
                  flexShrink:    0,
                  transition:    "all 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color       = "var(--crimson-glow)";
                  e.target.style.borderColor = "rgba(196,40,40,0.35)";
                  e.target.style.background  = "rgba(196,40,40,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color       = "var(--star-dim)";
                  e.target.style.borderColor = "rgba(124,92,191,0.2)";
                  e.target.style.background  = "rgba(124,92,191,0.08)";
                }}
              >
                clear ✕
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── TEXTAREA WRAPPER ── */}
        <div style={{ position: "relative", marginBottom: "12px" }}>

          {/* Animated placeholder — only shows when textarea is empty */}
          <AnimatePresence>
            {!text && (
              <motion.div
                key={placeholder}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  position:      "absolute",
                  top:           "clamp(16px, 3vw, 20px)",
                  left:          "clamp(16px, 3vw, 20px)",
                  right:         "clamp(16px, 3vw, 20px)",
                  fontFamily:    "var(--font-body)",
                  fontStyle:     "italic",
                  fontWeight:    300,
                  fontSize:      "clamp(1rem, 2.5vw, 1.15rem)",
                  color:         "rgba(110, 110, 154, 0.4)",
                  pointerEvents: "none",
                  lineHeight:    1.8,
                  zIndex:        1,
                  letterSpacing: "0.01em",
                }}
              >
                {placeholder}
              </motion.div>
            )}
          </AnimatePresence>

          {/* The actual textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={()  => setFocused(false)}
            onKeyDown={handleKeyDown}
            aria-label="Dream description"
            aria-describedby="dream-hint"
            spellCheck={true}
            style={{
              display:       "block",
              width:         "100%",
              minHeight:     "clamp(160px, 30vw, 220px)",
              padding:       "clamp(16px, 3vw, 20px)",
              fontFamily:    "var(--font-body)",
              fontStyle:     "italic",
              fontWeight:    300,
              fontSize:      "clamp(1rem, 2.5vw, 1.15rem)",
              lineHeight:    1.85,
              letterSpacing: "0.01em",
              color:         "var(--star-glow)",
              background:    "transparent",
              border:        "none",
              outline:       "none",
              resize:        "vertical",
              caretColor:    "var(--nebula-glow)",
              position:      "relative",
              zIndex:        2,
            }}
          />

          {/* Bottom border line — animated on focus */}
          <div style={{
            position:   "absolute",
            bottom:     0,
            left:       0,
            right:      0,
            height:     "1px",
            background: "rgba(124, 92, 191, 0.12)",
            overflow:   "hidden",
          }}>
            <motion.div
              animate={{ scaleX: focused ? 1 : 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height:          "100%",
                background:      "linear-gradient(90deg, transparent, var(--nebula-full), transparent)",
                transformOrigin: "center",
              }}
            />
          </div>
        </div>

        {/* ── META ROW ── */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginBottom:   "16px",
          minHeight:      "20px",
        }}>
          <div id="dream-hint">
            <ValidationHint text={text} minChars={MIN_CHARS} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <WordCountStrip text={text} />
            <CharCounter current={text.length} max={MAX_CHARS} />
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="divider" style={{ margin: "0 0 16px" }} />

        {/* ── SUBMIT ROW ── */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            "12px",
        }}>
          <SummonButton
            canSubmit={canSubmit && !isLoading}
            isReady={isReady}
            onClick={handleSubmit}
          />

          {/* Keyboard shortcut hint */}
          <AnimatePresence>
            {isReady && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{    opacity: 0, x: 8 }}
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.58rem",
                  color:         "var(--star-dim)",
                  letterSpacing: "0.12em",
                  display:       "flex",
                  alignItems:    "center",
                  gap:           "4px",
                }}
              >
                <kbd style={{
                  background:    "rgba(124,92,191,0.1)",
                  border:        "1px solid rgba(124,92,191,0.2)",
                  borderRadius:  "3px",
                  padding:       "1px 5px",
                  fontSize:      "0.58rem",
                  fontFamily:    "var(--font-mono)",
                  color:         "var(--nebula-glow)",
                }}>
                  ⌘ Enter
                </kbd>
                to summon
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ── EXAMPLE PROMPTS ── */}
        <ExamplePrompts
          onSelect={handleExampleSelect}
          visible={showExamples}
        />

      </div>
    </motion.div>
  );
}