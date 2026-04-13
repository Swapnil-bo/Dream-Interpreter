import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────
// ORACLE PHASES — what the loader says while
// qwen2.5 traverses the unconscious.
// Cycles every 4s. Each phase has a message
// and a secondary whisper beneath it.
// ─────────────────────────────────────────────
const ORACLE_PHASES = [
  {
    message:  "Descending into the unconscious…",
    whisper:  "The oracle parts the veil between waking and dream",
    glyph:    "◈",
  },
  {
    message:  "Consulting the shadow self…",
    whisper:  "Jung's archetypes stir in the collective dark",
    glyph:    "⟁",
  },
  {
    message:  "Reading the dream symbols…",
    whisper:  "Each image carries the weight of centuries of meaning",
    glyph:    "✦",
  },
  {
    message:  "Tracing Freudian undercurrents…",
    whisper:  "The id speaks in riddles the ego dare not face",
    glyph:    "⊕",
  },
  {
    message:  "Mapping the archetypal patterns…",
    whisper:  "Campbell's monomyth echoes through your dreamscape",
    glyph:    "◉",
  },
  {
    message:  "Weighing the emotional signature…",
    whisper:  "Light and shadow find their equilibrium",
    glyph:    "☽",
  },
  {
    message:  "Crystallizing the analysis…",
    whisper:  "The oracle assembles truth from the fragments of night",
    glyph:    "⋆",
  },
  {
    message:  "The vision takes form…",
    whisper:  "Almost. The unconscious does not hurry.",
    glyph:    "◈",
  },
];

// ─────────────────────────────────────────────
// ARCANE RUNES — orbit the central orb
// ─────────────────────────────────────────────
const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];

// Pick 8 random runes on mount — stable per session
function pickRunes(n = 8) {
  const shuffled = [...RUNES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─────────────────────────────────────────────
// ORBITING RUNE — single rune on a circular path
// ─────────────────────────────────────────────
function OrbitingRune({ rune, index, total, radius, duration, reverse = false }) {
  const angle    = (index / total) * 360;
  const delay    = (index / total) * -duration; // stagger start positions

  return (
    <motion.div
      style={{
        position:  "absolute",
        top:       "50%",
        left:      "50%",
        width:     "24px",
        height:    "24px",
        marginTop: "-12px",
        marginLeft:"-12px",
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{
        duration,
        repeat:    Infinity,
        ease:      "linear",
        delay,
      }}
    >
      {/* Arm extends outward, rune counter-rotates to stay upright */}
      <motion.div
        style={{
          position:  "absolute",
          top:       "50%",
          left:      "50%",
          width:     `${radius * 2}px`,
          height:    "1px",
          marginLeft:"0",
          marginTop: "-0.5px",
          transformOrigin: "0 50%",
          transform: `rotate(${angle}deg)`,
        }}
      >
        <motion.span
          animate={{ rotate: reverse ? 360 : -360 }}
          transition={{
            duration,
            repeat:   Infinity,
            ease:     "linear",
            delay,
          }}
          style={{
            position:   "absolute",
            right:      0,
            top:        "50%",
            transform:  "translateY(-50%)",
            fontFamily: "var(--font-mono)",
            fontSize:   "0.75rem",
            color:      "var(--nebula-full)",
            opacity:    0.5,
            userSelect: "none",
            display:    "block",
            width:      "16px",
            textAlign:  "center",
          }}
        >
          {rune}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// CENTRAL ORB — the pulsing heart
// ─────────────────────────────────────────────
function CentralOrb() {
  return (
    <div style={{ position: "relative", width: "80px", height: "80px" }}>

      {/* Outermost glow ring */}
      <motion.div
        animate={{
          scale:   [1, 1.3, 1],
          opacity: [0.15, 0.05, 0.15],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position:     "absolute",
          inset:        "-20px",
          borderRadius: "50%",
          background:   "radial-gradient(circle, rgba(124,92,191,0.3) 0%, transparent 70%)",
          pointerEvents:"none",
        }}
      />

      {/* Middle ring — counter-pulse */}
      <motion.div
        animate={{
          scale:   [1.1, 1, 1.1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        style={{
          position:     "absolute",
          inset:        "-8px",
          borderRadius: "50%",
          border:       "1px solid rgba(124, 92, 191, 0.3)",
          pointerEvents:"none",
        }}
      />

      {/* Inner ring — spinning dashes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          position:     "absolute",
          inset:        "2px",
          borderRadius: "50%",
          border:       "1px dashed rgba(167, 141, 232, 0.25)",
          pointerEvents:"none",
        }}
      />

      {/* Core orb */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px rgba(124,92,191,0.5), 0 0 40px rgba(124,92,191,0.2), inset 0 0 20px rgba(167,141,232,0.1)",
            "0 0 32px rgba(124,92,191,0.8), 0 0 64px rgba(124,92,191,0.35), inset 0 0 28px rgba(167,141,232,0.2)",
            "0 0 20px rgba(124,92,191,0.5), 0 0 40px rgba(124,92,191,0.2), inset 0 0 20px rgba(167,141,232,0.1)",
          ],
          scale: [1, 1.04, 1],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width:        "100%",
          height:       "100%",
          borderRadius: "50%",
          background:   `
            radial-gradient(
              circle at 35% 30%,
              rgba(196, 176, 245, 0.9) 0%,
              rgba(124, 92, 191, 0.85) 35%,
              rgba(74, 47, 160, 0.9) 65%,
              rgba(13, 13, 36, 0.95) 100%
            )
          `,
          border:       "1px solid rgba(196, 176, 245, 0.3)",
          display:      "flex",
          alignItems:   "center",
          justifyContent:"center",
          position:     "relative",
          overflow:     "hidden",
        }}
      >
        {/* Shimmer sweep */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
          style={{
            position:   "absolute",
            top:        0,
            left:       0,
            width:      "40%",
            height:     "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            transform:  "skewX(-20deg)",
            pointerEvents:"none",
          }}
        />

        {/* Moon glyph */}
        <span style={{
          fontSize:   "1.6rem",
          filter:     "drop-shadow(0 0 4px rgba(255,255,255,0.6))",
          userSelect: "none",
          position:   "relative",
          zIndex:     1,
        }}>
          ☽
        </span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PHASE TEXT — cycles through oracle messages
// ─────────────────────────────────────────────
function PhaseText({ phase }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase.message}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
        exit={{    opacity: 0, y: -8, filter: "blur(3px)" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: "center" }}
      >
        <p style={{
          fontFamily:    "var(--font-display)",
          fontSize:      "clamp(0.85rem, 2vw, 1rem)",
          fontWeight:    500,
          letterSpacing: "0.08em",
          color:         "var(--nebula-pure)",
          marginBottom:  "8px",
          lineHeight:    1.4,
        }}>
          {phase.message}
        </p>
        <p style={{
          fontFamily: "var(--font-body)",
          fontStyle:  "italic",
          fontSize:   "clamp(0.75rem, 1.5vw, 0.85rem)",
          color:      "var(--star-mid)",
          lineHeight: 1.5,
          maxWidth:   "360px",
          margin:     "0 auto",
        }}>
          {phase.whisper}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// PROGRESS RUNE STRIP — 8 runes light up
// sequentially like a progress bar
// ─────────────────────────────────────────────
function RuneStrip({ phaseIndex, total }) {
  const runes = useRef(pickRunes(total)).current;

  return (
    <div style={{
      display:        "flex",
      gap:            "10px",
      alignItems:     "center",
      justifyContent: "center",
    }}>
      {runes.map((rune, i) => (
        <motion.span
          key={i}
          animate={{
            opacity:  i <= phaseIndex ? 1 : 0.2,
            color:    i <= phaseIndex
              ? "var(--oracle-glow)"
              : "var(--star-dim)",
            textShadow: i <= phaseIndex
              ? "0 0 8px rgba(232,184,75,0.6)"
              : "none",
            scale: i === phaseIndex ? [1, 1.3, 1] : 1,
          }}
          transition={{
            duration:  i === phaseIndex ? 0.6 : 0.3,
            ease:      "easeOut",
            scale:     { duration: 0.5, repeat: i === phaseIndex ? Infinity : 0, repeatDelay: 1 },
          }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "1rem",
            userSelect: "none",
            display:    "block",
          }}
        >
          {rune}
        </motion.span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ELAPSED DISPLAY
// ─────────────────────────────────────────────
function ElapsedDisplay({ label }) {
  if (!label) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 0.6 }}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "6px",
        justifyContent:"center",
      }}
    >
      <span style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.65rem",
        color:         "var(--star-dim)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}>
        Elapsed
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          style={{
            fontFamily:  "var(--font-mono)",
            fontSize:    "0.72rem",
            color:       "var(--nebula-glow)",
            letterSpacing:"0.1em",
          }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ABORT BUTTON — appears after 4s so user
// doesn't feel trapped
// ─────────────────────────────────────────────
function AbortButton({ onAbort }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={onAbort}
            style={{
              background:    "transparent",
              border:        "1px solid rgba(124, 92, 191, 0.2)",
              borderRadius:  "var(--radius-full)",
              color:         "var(--star-dim)",
              fontFamily:    "var(--font-display)",
              fontSize:      "0.62rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding:       "6px 16px",
              cursor:        "pointer",
              transition:    "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "rgba(196, 40, 40, 0.4)";
              e.target.style.color       = "var(--crimson-glow)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(124, 92, 191, 0.2)";
              e.target.style.color       = "var(--star-dim)";
            }}
          >
            Interrupt the Oracle
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// MAIN LOADER COMPONENT
// ─────────────────────────────────────────────
export default function Loader({ elapsedLabel, onAbort }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const runes = useRef(pickRunes(8)).current;

  // Cycle phases every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((i) => (i + 1) % ORACLE_PHASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const phase = ORACLE_PHASES[phaseIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{    opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{
        background:    "rgba(8, 8, 24, 0.6)",
        backdropFilter:"blur(20px)",
        border:        "1px solid rgba(124, 92, 191, 0.2)",
        borderRadius:  "var(--radius-xl)",
        padding:       "clamp(32px, 5vw, 56px) clamp(24px, 4vw, 48px)",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           "28px",
        position:      "relative",
        overflow:      "hidden",
      }}>

        {/* Corner ornaments */}
        {[
          { top: "12px",  left:  "12px",  borderWidth: "1px 0 0 1px" },
          { top: "12px",  right: "12px",  borderWidth: "1px 1px 0 0" },
          { bottom:"12px",left:  "12px",  borderWidth: "0 0 1px 1px" },
          { bottom:"12px",right: "12px",  borderWidth: "0 1px 1px 0" },
        ].map((style, i) => (
          <div key={i} style={{
            position:    "absolute",
            width:       "20px",
            height:      "20px",
            borderStyle: "solid",
            borderColor: "rgba(196, 144, 10, 0.25)",
            borderRadius:"2px",
            ...style,
          }} />
        ))}

        {/* Subtle background pulse */}
        <motion.div
          animate={{
            opacity: [0.03, 0.07, 0.03],
            scale:   [0.8, 1.1, 0.8],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position:     "absolute",
            inset:        0,
            background:   "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,92,191,1), transparent)",
            pointerEvents:"none",
            borderRadius: "inherit",
          }}
        />

        {/* ── ORBITAL SYSTEM ── */}
        <div style={{
          position:  "relative",
          width:     "200px",
          height:    "200px",
          display:   "flex",
          alignItems:"center",
          justifyContent:"center",
          flexShrink: 0,
        }}>
          {/* Outer orbit ring — visual guide */}
          <div style={{
            position:    "absolute",
            inset:       0,
            borderRadius:"50%",
            border:      "1px solid rgba(124, 92, 191, 0.08)",
          }} />
          <div style={{
            position:    "absolute",
            inset:       "20px",
            borderRadius:"50%",
            border:      "1px solid rgba(196, 144, 10, 0.06)",
          }} />

          {/* Outer orbit — 8 runes, slow clockwise */}
          {runes.map((rune, i) => (
            <OrbitingRune
              key={`outer-${i}`}
              rune={rune}
              index={i}
              total={runes.length}
              radius={96}
              duration={28}
              reverse={false}
            />
          ))}

          {/* Inner orbit — 5 symbols, faster counter-clockwise */}
          {["◈", "✦", "⟁", "⊕", "◉"].map((glyph, i) => (
            <OrbitingRune
              key={`inner-${i}`}
              rune={glyph}
              index={i}
              total={5}
              radius={60}
              duration={16}
              reverse={true}
            />
          ))}

          {/* Central orb */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <CentralOrb />
          </div>
        </div>

        {/* ── PHASE GLYPH ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase.glyph + phaseIndex}
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            animate={{ opacity: 1, scale: 1,   rotate: 0   }}
            exit={{    opacity: 0, scale: 0.8,  rotate: 15  }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              fontFamily:  "var(--font-display)",
              fontSize:    "1.4rem",
              color:       "var(--oracle-glow)",
              filter:      "drop-shadow(0 0 8px rgba(232,184,75,0.5))",
              userSelect:  "none",
              lineHeight:  1,
            }}
          >
            {phase.glyph}
          </motion.div>
        </AnimatePresence>

        {/* ── PHASE TEXT ── */}
        <PhaseText phase={phase} />

        {/* ── RUNE STRIP ── */}
        <RuneStrip
          phaseIndex={phaseIndex % 8}
          total={8}
        />

        {/* ── ELAPSED + ABORT ── */}
        <div style={{
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          gap:           "12px",
        }}>
          <ElapsedDisplay label={elapsedLabel} />
          {onAbort && <AbortButton onAbort={onAbort} />}
        </div>

        {/* ── BOTTOM LABEL ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.6rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:         "rgba(110,110,154,0.4)",
            marginTop:     "-8px",
          }}
        >
          qwen2.5:7b · local inference · no cloud
        </motion.p>

      </div>
    </motion.div>
  );
}