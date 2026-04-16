import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence }        from "framer-motion";
import { formatAnalysis, getMoodGradient } from "@utils/formatAnalysis";

// ─────────────────────────────────────────────
// COPY TEXT TO CLIPBOARD
// ─────────────────────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// BUILD SHARE TEXT — plain text version for
// Twitter / X / clipboard
// ─────────────────────────────────────────────
function buildShareText(formatted, dreamText) {
  const symbols = formatted.symbols
    .slice(0, 4)
    .map((s) => s.name)
    .join(" · ");

  return [
    `🌙 My dream was interpreted by ONEIROS`,
    ``,
    `"${formatted.summary}"`,
    ``,
    `Mood: ${formatted.mood.emoji} ${formatted.mood.tierLabel} (${formatted.mood.pct}%)`,
    symbols ? `Symbols: ${symbols}` : "",
    ``,
    `#DreamInterpreter #ONEIROS #Jungian`,
  ]
    .filter((l) => l !== null)
    .join("\n")
    .trim();
}

// ─────────────────────────────────────────────
// CAPTURE CARD — html2canvas screenshot
// ─────────────────────────────────────────────
async function captureCard(ref) {
  const html2canvas = (await import("html2canvas")).default;

  return html2canvas(ref, {
    backgroundColor: null,
    scale:           2,          // 2× for retina sharpness
    useCORS:         true,
    logging:         false,
    allowTaint:      true,
    removeContainer: true,
  });
}

// ─────────────────────────────────────────────
// CORNER ORNAMENT — decorative bracket corner
// ─────────────────────────────────────────────
function CornerOrnament({ position, color = "rgba(196,144,10,0.35)" }) {
  const styles = {
    tl: { top:    "10px", left:  "10px", borderWidth: "1px 0 0 1px" },
    tr: { top:    "10px", right: "10px", borderWidth: "1px 1px 0 0" },
    bl: { bottom: "10px", left:  "10px", borderWidth: "0 0 1px 1px" },
    br: { bottom: "10px", right: "10px", borderWidth: "0 1px 1px 0" },
  };

  return (
    <div style={{
      position:    "absolute",
      width:       "20px",
      height:      "20px",
      borderStyle: "solid",
      borderColor: color,
      borderRadius:"2px",
      ...styles[position],
    }} />
  );
}

// ─────────────────────────────────────────────
// MOOD ARC — mini SVG arc for the share card
// ─────────────────────────────────────────────
function MoodArc({ score, color }) {
  const R   = 28;
  const CX  = 36;
  const CY  = 36;
  const pct = Math.max(0, Math.min(1, score));

  // 180° arc — semicircle gauge
  function polar(r, deg) {
    const rad = (deg * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }

  const startDeg  = -180;
  const endDeg    = 0;
  const arcLen    = Math.PI * R; // half circumference

  const start = polar(R, startDeg);
  const end   = polar(R, endDeg);
  const needleDeg = startDeg + pct * 180;
  const needleTip = polar(R - 4, needleDeg);
  const needleBase= polar(8, needleDeg);

  return (
    <svg width="72" height="44" viewBox="0 0 72 44" style={{ overflow: "visible" }}>
      {/* Track */}
      <path
        d={`M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke="rgba(124,92,191,0.15)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Fill */}
      <motion.path
        d={`M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke={color.solid}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={arcLen}
        initial={{ strokeDashoffset: arcLen }}
        animate={{ strokeDashoffset: arcLen * (1 - pct) }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        style={{ filter: `drop-shadow(0 0 3px ${color.glow})` }}
      />
      {/* Needle */}
      <motion.line
        x1={needleBase.x} y1={needleBase.y}
        x2={needleTip.x}  y2={needleTip.y}
        stroke={color.solid}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 1 }}
      />
      {/* Pivot */}
      <circle cx={CX} cy={CY} r={3} fill="var(--ink-2)" stroke={color.solid} strokeWidth="1" />
      <circle cx={CX} cy={CY} r={1.5} fill={color.solid} />
      {/* Score label */}
      <text
        x={CX} y={CY + 14}
        textAnchor="middle"
        fill={color.solid}
        fontSize="8"
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.05em"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// THE CARD — the actual shareable artifact
// This is what html2canvas captures.
// Every pixel is intentional.
// ─────────────────────────────────────────────
const CardFace = ({ formatted, dreamText, cardRef }) => {
  const mood      = formatted.mood;
  const moodColor = getMoodGradient(mood.score);
  const symbols   = formatted.symbols.slice(0, 5);
  const summary   = formatted.summary;
  const snippet   = dreamText.trim().slice(0, 160);
  const date      = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div
      ref={cardRef}
      style={{
        width:         "520px",
        background:    "linear-gradient(145deg, #080818 0%, #0d0d24 40%, #060614 100%)",
        border:        "1px solid rgba(124,92,191,0.35)",
        borderRadius:  "16px",
        padding:       "32px",
        position:      "relative",
        overflow:      "hidden",
        fontSmoothing: "antialiased",
      }}
    >
      {/* ── BACKGROUND LAYERS ── */}

      {/* Mood-tinted radial */}
      <div style={{
        position:     "absolute",
        inset:        0,
        background:   `radial-gradient(ellipse 70% 50% at 20% 20%, ${moodColor.glow.replace("0.4","0.12")}, transparent)`,
        pointerEvents:"none",
      }} />

      {/* Nebula core */}
      <div style={{
        position:     "absolute",
        inset:        0,
        background:   "radial-gradient(ellipse 50% 40% at 80% 80%, rgba(74,47,160,0.1), transparent)",
        pointerEvents:"none",
      }} />

      {/* Corner ornaments */}
      <CornerOrnament position="tl" color={`${moodColor.solid}55`} />
      <CornerOrnament position="tr" color="rgba(196,144,10,0.3)"  />
      <CornerOrnament position="bl" color="rgba(196,144,10,0.3)"  />
      <CornerOrnament position="br" color={`${moodColor.solid}55`} />

      {/* ── HEADER ROW ── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginBottom:   "24px",
      }}>
        {/* ONEIROS brand */}
        <div>
          <div style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "0.95rem",
            fontWeight:    700,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            background:    "linear-gradient(135deg, #e8b84b, #f0f0ff, #c4b0f5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            backgroundClip: "text",
            marginBottom:  "2px",
          }}>
            ONEIROS
          </div>
          <div style={{
            fontFamily:    "'Crimson Pro', Georgia, serif",
            fontStyle:     "italic",
            fontSize:      "0.62rem",
            letterSpacing: "0.15em",
            color:         "rgba(110,110,154,0.7)",
          }}>
            Dream Interpreter
          </div>
        </div>

        {/* Moon glyph */}
        <div style={{
          width:        "44px",
          height:       "44px",
          borderRadius: "50%",
          background:   "radial-gradient(circle at 35% 35%, rgba(196,176,245,0.9), rgba(74,47,160,0.85))",
          border:       "1px solid rgba(196,176,245,0.3)",
          display:      "flex",
          alignItems:   "center",
          justifyContent:"center",
          fontSize:     "1.2rem",
          boxShadow:    "0 0 16px rgba(124,92,191,0.4)",
        }}>
          ☽
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{
        height:       "1px",
        background:   `linear-gradient(90deg, transparent, ${moodColor.solid}60, rgba(196,144,10,0.4), ${moodColor.solid}60, transparent)`,
        marginBottom: "20px",
      }} />

      {/* ── DREAM SNIPPET ── */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      "0.5rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color:         "rgba(110,110,154,0.6)",
          marginBottom:  "8px",
        }}>
          The Dream
        </div>
        <p style={{
          fontFamily:  "'Crimson Pro', Georgia, serif",
          fontStyle:   "italic",
          fontWeight:  300,
          fontSize:    "0.9rem",
          lineHeight:  1.75,
          color:       "rgba(212,212,238,0.8)",
          margin:      0,
          borderLeft:  `2px solid ${moodColor.solid}50`,
          paddingLeft: "12px",
        }}>
          {snippet}{dreamText.trim().length > 160 ? "…" : ""}
        </p>
      </div>

      {/* ── ORACLE SUMMARY ── */}
      <div style={{
        background:    "rgba(61,42,0,0.3)",
        border:        "1px solid rgba(196,144,10,0.25)",
        borderRadius:  "8px",
        padding:       "14px 16px",
        marginBottom:  "20px",
        position:      "relative",
        overflow:      "hidden",
      }}>
        <div style={{
          position:   "absolute",
          left:       0, top: 0, bottom: 0,
          width:      "2px",
          background: "linear-gradient(180deg, rgba(196,144,10,0.8), transparent)",
        }} />
        <div style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      "0.48rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color:         "rgba(196,144,10,0.7)",
          marginBottom:  "6px",
          paddingLeft:   "8px",
        }}>
          ✦ The Oracle Speaks
        </div>
        <p style={{
          fontFamily:  "'Crimson Pro', Georgia, serif",
          fontStyle:   "italic",
          fontSize:    "0.88rem",
          lineHeight:  1.65,
          color:       "rgba(245,217,140,0.9)",
          margin:      0,
          paddingLeft: "8px",
        }}>
          "{summary}"
        </p>
      </div>

      {/* ── MOOD + SYMBOLS ROW ── */}
      <div style={{
        display:   "grid",
        gridTemplateColumns: "auto 1fr",
        gap:       "16px",
        marginBottom: "20px",
        alignItems:"start",
      }}>
        {/* Mood arc gauge */}
        <div style={{
          background:    "rgba(8,8,24,0.5)",
          border:        `1px solid ${moodColor.glow.replace("0.45","0.2")}`,
          borderRadius:  "10px",
          padding:       "12px 14px 8px",
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          gap:           "4px",
        }}>
          <MoodArc score={mood.score} color={moodColor} />
          <div style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "0.52rem",
            fontWeight:    600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color:         moodColor.solid,
            textAlign:     "center",
            marginTop:     "2px",
          }}>
            {mood.tierLabel}
          </div>
          <div style={{
            fontFamily:  "'Crimson Pro', Georgia, serif",
            fontStyle:   "italic",
            fontSize:    "0.62rem",
            color:       "rgba(168,168,204,0.6)",
            textAlign:   "center",
            maxWidth:    "80px",
            lineHeight:  1.3,
          }}>
            {mood.label}
          </div>
        </div>

        {/* Symbols */}
        <div>
          <div style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      "0.48rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color:         "rgba(110,110,154,0.6)",
            marginBottom:  "8px",
          }}>
            Dream Symbols
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {symbols.map((sym, i) => (
              <div key={i} style={{
                display:       "flex",
                alignItems:    "center",
                gap:           "4px",
                background:    sym.accent ?? "rgba(74,47,160,0.12)",
                border:        `1px solid ${sym.border ?? "rgba(124,92,191,0.25)"}`,
                borderRadius:  "999px",
                padding:       "3px 9px",
                fontFamily:    "'Cinzel', serif",
                fontSize:      "0.52rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color:         sym.color ?? "var(--nebula-pure)",
              }}>
                <span style={{ fontSize: "0.45rem", opacity: 0.8 }}>✦</span>
                {sym.name}
              </div>
            ))}
          </div>

          {/* Jungian teaser */}
          {formatted.tabs?.[0]?.teaser && (
            <p style={{
              fontFamily:  "'Crimson Pro', Georgia, serif",
              fontStyle:   "italic",
              fontWeight:  300,
              fontSize:    "0.72rem",
              lineHeight:  1.6,
              color:       "rgba(168,168,204,0.55)",
              margin:      "10px 0 0",
              borderTop:   "1px solid rgba(124,92,191,0.1)",
              paddingTop:  "8px",
            }}>
              {formatted.tabs[0].teaser.slice(0, 140)}{formatted.tabs[0].teaser.length > 140 ? "…" : ""}
            </p>
          )}
        </div>
      </div>

      {/* ── FRAMEWORK BADGES ── */}
      <div style={{
        display:       "flex",
        gap:           "6px",
        flexWrap:      "wrap",
        marginBottom:  "20px",
      }}>
        {[
          { icon: "◈", label: "Jungian",    color: "rgba(124,92,191,0.7)"  },
          { icon: "⊕", label: "Freudian",   color: "rgba(196,144,10,0.7)"  },
          { icon: "✦", label: "Symbolic",   color: "rgba(168,168,204,0.7)" },
          { icon: "⟁", label: "Archetypal", color: "rgba(61,214,140,0.7)"  },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{
            display:       "flex",
            alignItems:    "center",
            gap:           "4px",
            background:    "rgba(13,13,36,0.6)",
            border:        "1px solid rgba(124,92,191,0.12)",
            borderRadius:  "4px",
            padding:       "3px 8px",
          }}>
            <span style={{ fontSize: "0.55rem", color }}>{icon}</span>
            <span style={{
              fontFamily:    "'Cinzel', serif",
              fontSize:      "0.48rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color:         "rgba(168,168,204,0.5)",
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        height:       "1px",
        background:   "linear-gradient(90deg, transparent, rgba(124,92,191,0.2), transparent)",
        marginBottom: "14px",
      }} />

      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      "0.48rem",
          letterSpacing: "0.12em",
          color:         "rgba(110,110,154,0.4)",
          textTransform: "uppercase",
        }}>
          qwen2.5:7b · local · {date}
        </div>
        <div style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      "0.48rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color:         "rgba(110,110,154,0.4)",
        }}>
          oneiros.local
        </div>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────
// ACTION BUTTON
// ─────────────────────────────────────────────
function ActionBtn({ onClick, loading, icon, label, variant = "ghost" }) {
  const isPrimary = variant === "primary";
  const isOracle  = variant === "oracle";

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={!loading ? { scale: 1.03, y: -1 } : {}}
      whileTap={!loading   ? { scale: 0.97 }        : {}}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "7px",
        padding:       "9px 18px",
        background:    isPrimary
          ? "linear-gradient(135deg, var(--nebula-mid), var(--nebula-full))"
          : isOracle
          ? "linear-gradient(135deg, var(--oracle-mid), var(--oracle-full))"
          : "rgba(13,13,36,0.7)",
        border:        isPrimary
          ? "none"
          : isOracle
          ? "none"
          : "1px solid rgba(124,92,191,0.25)",
        borderRadius:  "var(--radius-md)",
        color:         isOracle ? "var(--void-1)" : "var(--star-pure)",
        fontFamily:    "var(--font-display)",
        fontSize:      "0.65rem",
        fontWeight:    isOracle ? 700 : 500,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor:        loading ? "not-allowed" : "pointer",
        opacity:       loading ? 0.6 : 1,
        boxShadow:     isPrimary
          ? "0 4px 16px rgba(74,47,160,0.4)"
          : isOracle
          ? "0 4px 16px rgba(196,144,10,0.3)"
          : "none",
        transition:    "box-shadow 0.25s ease",
        whiteSpace:    "nowrap",
      }}
    >
      <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>
        {loading ? "⟳" : icon}
      </span>
      {loading ? "Processing…" : label}
    </motion.button>
  );
}


// ─────────────────────────────────────────────
// COPY FEEDBACK TOAST
// ─────────────────────────────────────────────
function CopyToast({ message, success }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1    }}
      exit={{    opacity: 0, y: -6, scale: 0.97 }}
      style={{
        position:     "absolute",
        bottom:       "calc(100% + 10px)",
        left:         "50%",
        transform:    "translateX(-50%)",
        background:   success
          ? "rgba(10,45,26,0.95)"
          : "rgba(61,10,10,0.95)",
        border:       `1px solid ${success
          ? "rgba(30,153,80,0.4)"
          : "rgba(196,40,40,0.4)"}`,
        borderRadius: "var(--radius-md)",
        padding:      "7px 14px",
        fontFamily:   "var(--font-body)",
        fontSize:     "0.75rem",
        color:        success ? "var(--verdant-glow)" : "var(--crimson-glow)",
        whiteSpace:   "nowrap",
        backdropFilter:"blur(12px)",
        boxShadow:    "var(--shadow-md)",
        pointerEvents:"none",
      }}
    >
      {message}
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ShareCard({ analysis, dreamText = "" }) {
  const cardRef    = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copying,     setCopying]     = useState(false);
  const [toast,       setToast]       = useState(null);  // { message, success }

  const formatted = formatAnalysis(analysis, dreamText);
  if (!formatted) return null;

  // ── Show toast briefly ──
  const showToast = useCallback((message, success = true) => {
    setToast({ message, success });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── DOWNLOAD as PNG ──
  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);

    try {
      const canvas   = await captureCard(cardRef.current);
      const dataUrl  = canvas.toDataURL("image/png", 1.0);
      const link     = document.createElement("a");
      const date     = new Date().toISOString().slice(0, 10);
      link.download  = `oneiros-dream-${date}.png`;
      link.href      = dataUrl;
      link.click();
      showToast("✓ Dream card saved as PNG");
    } catch (e) {
      console.error("[ONEIROS] Screenshot failed:", e);
      showToast("Screenshot failed — try again", false);
    } finally {
      setDownloading(false);
    }
  }, [downloading, showToast]);

  // ── COPY image to clipboard ──
  const handleCopyImage = useCallback(async () => {
    if (!cardRef.current || copying) return;
    setCopying(true);

    try {
      const canvas = await captureCard(cardRef.current);
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          showToast("✓ Card copied to clipboard");
        } catch {
          showToast("Clipboard write blocked by browser", false);
        }
      }, "image/png", 1.0);
    } catch (e) {
      showToast("Copy failed — try Download instead", false);
    } finally {
      setCopying(false);
    }
  }, [copying, showToast]);

  // ── COPY share text ──
  const handleCopyText = useCallback(async () => {
    const text    = buildShareText(formatted, dreamText);
    const success = await copyToClipboard(text);
    showToast(success ? "✓ Share text copied" : "Copy failed", success);
  }, [formatted, dreamText, showToast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── SECTION LABEL ── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginBottom:   "14px",
        flexWrap:       "wrap",
        gap:            "8px",
      }}>
        <div className="label-oracle">
          ✦ Share Your Dream
        </div>
        <p style={{
          fontFamily: "var(--font-body)",
          fontStyle:  "italic",
          fontSize:   "0.75rem",
          color:      "var(--star-dim)",
          margin:     0,
        }}>
          Screenshot the card or copy the share text
        </p>
      </div>

      {/* ── CARD WRAPPER ── */}
      {/* Outer wrapper — centered, with subtle drop shadow */}
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          display:        "flex",
          justifyContent: "center",
          marginBottom:   "20px",
          filter:         "drop-shadow(0 16px 48px rgba(0,0,7,0.8)) drop-shadow(0 0 32px rgba(124,92,191,0.15))",
        }}
      >
        {/* Scroll wrapper for small screens */}
        <div style={{
          overflowX:     "auto",
          overflowY:     "hidden",
          borderRadius:  "16px",
          maxWidth:      "100%",
          WebkitOverflowScrolling: "touch",
        }}>
          <CardFace
            formatted={formatted}
            dreamText={dreamText}
            cardRef={cardRef}
          />
        </div>
      </motion.div>

      {/* ── ACTION ROW ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          display:        "flex",
          gap:            "10px",
          justifyContent: "center",
          flexWrap:       "wrap",
          position:       "relative",
        }}
      >
        {/* Toast above buttons */}
        <AnimatePresence>
          {toast && (
            <CopyToast
              key="toast"
              message={toast.message}
              success={toast.success}
            />
          )}
        </AnimatePresence>

        <ActionBtn
          onClick={handleDownload}
          loading={downloading}
          icon="↓"
          label="Download PNG"
          variant="primary"
        />
        <ActionBtn
          onClick={handleCopyImage}
          loading={copying}
          icon="⎘"
          label="Copy Image"
          variant="ghost"
        />
        <ActionBtn
          onClick={handleCopyText}
          loading={false}
          icon="✦"
          label="Copy Share Text"
          variant="oracle"
        />
      </motion.div>

      {/* ── HINT ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          textAlign:     "center",
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.58rem",
          letterSpacing: "0.12em",
          color:         "rgba(110,110,154,0.35)",
          textTransform: "uppercase",
          marginTop:     "14px",
        }}
      >
        Powered by qwen2.5:7b running locally · No data sent to any cloud
      </motion.p>
    </motion.div>
  );
}