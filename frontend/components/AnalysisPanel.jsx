import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence }  from "framer-motion";
import { formatAnalysis, ANALYSIS_TABS } from "@utils/formatAnalysis";

// ─────────────────────────────────────────────
// TYPEWRITER HOOK
// Reveals text character by character.
// Respects punctuation pauses.
// Returns { displayed, isDone }
// ─────────────────────────────────────────────
function useTypewriter(text, active, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [isDone,    setIsDone]    = useState(false);
  const indexRef  = useRef(0);
  const timerRef  = useRef(null);

  useEffect(() => {
    if (!active || !text) {
      setDisplayed(text || "");
      setIsDone(true);
      return;
    }

    // Reset on new text
    setDisplayed("");
    setIsDone(false);
    indexRef.current = 0;

    function tick() {
      const i   = indexRef.current;
      const ch  = text[i];

      if (i >= text.length) {
        setIsDone(true);
        return;
      }

      setDisplayed(text.slice(0, i + 1));
      indexRef.current = i + 1;

      // Pause on punctuation — feels like the oracle thinking
      const pause =
        ch === "."  ? speed * 18 :
        ch === "!"  ? speed * 14 :
        ch === "?"  ? speed * 14 :
        ch === ","  ? speed * 6  :
        ch === ";"  ? speed * 8  :
        ch === "—"  ? speed * 10 :
        ch === "\n" ? speed * 12 :
        speed;

      timerRef.current = setTimeout(tick, pause);
    }

    timerRef.current = setTimeout(tick, 300); // brief pause before starting

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [text, active, speed]);

  // Skip-to-end on click
  const skipToEnd = useCallback(() => {
    clearTimeout(timerRef.current);
    setDisplayed(text);
    setIsDone(true);
    indexRef.current = text?.length ?? 0;
  }, [text]);

  return { displayed, isDone, skipToEnd };
}


// ─────────────────────────────────────────────
// TAB BUTTON
// ─────────────────────────────────────────────
function TabButton({ tab, isActive, onClick, isRevealed }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{   scale: 0.97 }}
      style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           "4px",
        padding:       "10px 8px",
        background:    isActive
          ? tab.accent
          : "transparent",
        border:        "none",
        borderBottom:  isActive
          ? `2px solid ${tab.color}`
          : "2px solid transparent",
        cursor:        "pointer",
        transition:    "all 250ms ease",
        position:      "relative",
        minWidth:      0,
      }}
    >
      {/* Glyph icon */}
      <motion.span
        animate={{
          color:  isActive ? tab.color : "var(--star-dim)",
          scale:  isActive ? 1.15 : 1,
          filter: isActive
            ? `drop-shadow(0 0 6px ${tab.color})`
            : "none",
        }}
        transition={{ duration: 0.25 }}
        style={{
          fontSize:   "1rem",
          lineHeight: 1,
          display:    "block",
        }}
      >
        {tab.icon}
      </motion.span>

      {/* Label */}
      <motion.span
        animate={{ color: isActive ? tab.color : "var(--star-mid)" }}
        transition={{ duration: 0.25 }}
        style={{
          fontFamily:    "var(--font-display)",
          fontSize:      "clamp(0.55rem, 1.2vw, 0.68rem)",
          fontWeight:    isActive ? 600 : 400,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          whiteSpace:    "nowrap",
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          maxWidth:      "100%",
        }}
      >
        {tab.shortLabel}
      </motion.span>

      {/* Revealed dot — shows tab has been read */}
      {isRevealed && !isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position:     "absolute",
            top:          "6px",
            right:        "6px",
            width:        "4px",
            height:       "4px",
            borderRadius: "50%",
            background:   tab.color,
            opacity:      0.6,
          }}
        />
      )}

      {/* Active indicator glow */}
      {isActive && (
        <motion.div
          layoutId="tab-glow"
          style={{
            position:  "absolute",
            bottom:    "-2px",
            left:      "20%",
            right:     "20%",
            height:    "2px",
            background:`linear-gradient(90deg, transparent, ${tab.color}, transparent)`,
            filter:    `blur(3px)`,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </motion.button>
  );
}


// ─────────────────────────────────────────────
// THINKERS STRIP — bottom attribution bar
// ─────────────────────────────────────────────
function ThinkersStrip({ thinkers, color }) {
  return (
    <div style={{
      display:    "flex",
      gap:        "6px",
      flexWrap:   "wrap",
      alignItems: "center",
    }}>
      <span style={{
        fontFamily:    "var(--font-display)",
        fontSize:      "0.55rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color:         "var(--star-dim)",
        marginRight:   "2px",
      }}>
        Informed by
      </span>
      {thinkers.map((name, i) => (
        <span key={name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            fontFamily: "var(--font-body)",
            fontStyle:  "italic",
            fontSize:   "0.72rem",
            color,
            opacity:    0.7,
          }}>
            {name}
          </span>
          {i < thinkers.length - 1 && (
            <span style={{ color: "var(--star-dim)", fontSize: "0.5rem" }}>·</span>
          )}
        </span>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────
// READ TIME + WORD COUNT BADGE
// ─────────────────────────────────────────────
function TabMeta({ readTime, wordCount, color }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      {[
        { label: readTime  },
        { label: `${wordCount} words` },
      ].map(({ label }) => (
        <span key={label} style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.58rem",
          letterSpacing: "0.1em",
          color:         "var(--star-dim)",
          background:    "rgba(255,255,255,0.04)",
          border:        "1px solid rgba(255,255,255,0.06)",
          borderRadius:  "var(--radius-sm)",
          padding:       "2px 7px",
        }}>
          {label}
        </span>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────
// SKIP BUTTON — reveals full text instantly
// ─────────────────────────────────────────────
function SkipButton({ onSkip, isDone }) {
  return (
    <AnimatePresence>
      {!isDone && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          onClick={onSkip}
          style={{
            background:    "transparent",
            border:        "1px solid rgba(124,92,191,0.2)",
            borderRadius:  "var(--radius-full)",
            color:         "var(--star-dim)",
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.58rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding:       "3px 10px",
            cursor:        "pointer",
            transition:    "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.color       = "var(--nebula-pure)";
            e.target.style.borderColor = "rgba(124,92,191,0.45)";
          }}
          onMouseLeave={(e) => {
            e.target.style.color       = "var(--star-dim)";
            e.target.style.borderColor = "rgba(124,92,191,0.2)";
          }}
        >
          Skip ⟶
        </motion.button>
      )}
    </AnimatePresence>
  );
}


// ─────────────────────────────────────────────
// ANALYSIS TEXT BODY
// The core typewriter display with cursor
// ─────────────────────────────────────────────
function AnalysisBody({ content, color, accent, isActive }) {
  const { displayed, isDone, skipToEnd } = useTypewriter(
    content,
    isActive,
    16
  );

  // Parse into paragraphs for proper rendering
  const paragraphs = displayed
    ? displayed.split(/\n{2,}/).filter(Boolean)
    : [displayed];

  return (
    <div style={{ position: "relative" }}>
      {/* Decorative left accent bar */}
      <div style={{
        position:     "absolute",
        left:         0,
        top:          "4px",
        bottom:       "4px",
        width:        "2px",
        background:   `linear-gradient(180deg, ${color}, transparent)`,
        borderRadius: "var(--radius-full)",
        opacity:      0.5,
      }} />

      <div style={{ paddingLeft: "20px" }}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{
            fontFamily:   "var(--font-body)",
            fontSize:     "clamp(0.95rem, 2vw, 1.05rem)",
            fontWeight:   300,
            lineHeight:   1.9,
            letterSpacing:"0.01em",
            color:        "var(--star-full)",
            marginBottom: i < paragraphs.length - 1 ? "1.2em" : 0,
          }}>
            {para}
            {/* Blinking cursor on last paragraph, last character */}
            {i === paragraphs.length - 1 && !isDone && (
              <span className="typewriter-cursor" />
            )}
          </p>
        ))}

        {/* Done indicator */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        "6px",
                marginTop:  "16px",
              }}
            >
              <div style={{
                width:        "16px",
                height:       "1px",
                background:   color,
                opacity:      0.5,
              }} />
              <span style={{
                fontFamily:    "var(--font-display)",
                fontSize:      "0.58rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color,
                opacity:       0.6,
              }}>
                Analysis complete
              </span>
              <div style={{
                flex:       1,
                height:     "1px",
                background: `linear-gradient(90deg, ${color}, transparent)`,
                opacity:    0.3,
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip button — top right */}
      <div style={{ position: "absolute", top: 0, right: 0 }}>
        <SkipButton onSkip={skipToEnd} isDone={isDone} />
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// TAB PANEL CONTENT
// Full content area for one framework tab
// ─────────────────────────────────────────────
function TabPanel({ tab, tabData, isActive }) {
  return (
    <motion.div
      key={tab.key}
      initial={{ opacity: 0, x: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0,  filter: "blur(0px)" }}
      exit={{    opacity: 0, x: -8, filter: "blur(3px)" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background:    tab.accent,
        border:        `1px solid ${tab.border}`,
        borderRadius:  "0 0 var(--radius-lg) var(--radius-lg)",
        borderTop:     "none",
        padding:       "clamp(20px, 3vw, 28px)",
        minHeight:     "280px",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Decorative corner glyph */}
      <div style={{
        position:    "absolute",
        bottom:      "16px",
        right:       "20px",
        fontFamily:  "var(--font-display)",
        fontSize:    "4rem",
        color:       tab.color,
        opacity:     0.04,
        userSelect:  "none",
        lineHeight:  1,
        pointerEvents:"none",
      }}>
        {tab.icon}
      </div>

      {/* Top meta row */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        flexWrap:       "wrap",
        gap:            "8px",
        marginBottom:   "20px",
      }}>
        {/* Framework label */}
        <div>
          <div style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "0.62rem",
            fontWeight:    600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:         tab.color,
            marginBottom:  "3px",
          }}>
            {tab.icon} {tab.label} Analysis
          </div>
          <p style={{
            fontFamily: "var(--font-body)",
            fontStyle:  "italic",
            fontSize:   "0.75rem",
            color:      "var(--star-dim)",
            margin:     0,
          }}>
            {tab.description}
          </p>
        </div>

        <TabMeta
          readTime={tabData.readTime}
          wordCount={tabData.wordCount}
          color={tab.color}
        />
      </div>

      {/* Thin separator */}
      <div style={{
        height:       "1px",
        background:   `linear-gradient(90deg, ${tab.color}40, transparent)`,
        marginBottom: "20px",
        opacity:      0.5,
      }} />

      {/* The analysis text with typewriter */}
      <AnalysisBody
        content={tabData.content}
        color={tab.color}
        accent={tab.accent}
        isActive={isActive}
      />

      {/* Bottom thinkers strip */}
      <div style={{
        marginTop:  "24px",
        paddingTop: "16px",
        borderTop:  `1px solid ${tab.border}`,
        opacity:    0.7,
      }}>
        <ThinkersStrip thinkers={tab.thinkers} color={tab.color} />
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// ALL TABS VIEW — shows all 4 panels stacked
// for users who want the full picture at once
// ─────────────────────────────────────────────
function AllTabsView({ formatted }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {ANALYSIS_TABS.map((tab, i) => {
        const tabData = formatted.tabs.find((t) => t.key === tab.key);
        if (!tabData) return null;

        return (
          <motion.div
            key={tab.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{
              background:    tab.accent,
              border:        `1px solid ${tab.border}`,
              borderRadius:  "var(--radius-lg)",
              padding:       "clamp(16px, 3vw, 24px)",
              position:      "relative",
              overflow:      "hidden",
            }}>
              {/* Header */}
              <div style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "10px",
                marginBottom: "16px",
              }}>
                <span style={{
                  fontSize: "1.1rem",
                  color:    tab.color,
                  filter:   `drop-shadow(0 0 4px ${tab.color})`,
                }}>
                  {tab.icon}
                </span>
                <div>
                  <div style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "0.65rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color:         tab.color,
                    fontWeight:    600,
                  }}>
                    {tab.label}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <TabMeta
                    readTime={tabData.readTime}
                    wordCount={tabData.wordCount}
                    color={tab.color}
                  />
                </div>
              </div>

              {/* Text — no typewriter in all-view, just render */}
              <div style={{ paddingLeft: "16px", borderLeft: `2px solid ${tab.color}40` }}>
                {tabData.content.split(/\n{2,}/).filter(Boolean).map((para, j) => (
                  <p key={j} style={{
                    fontFamily:   "var(--font-body)",
                    fontSize:     "clamp(0.92rem, 2vw, 1rem)",
                    fontWeight:   300,
                    lineHeight:   1.85,
                    color:        "var(--star-full)",
                    marginBottom: "1em",
                  }}>
                    {para}
                  </p>
                ))}
              </div>

              <div style={{
                paddingTop: "12px",
                borderTop:  `1px solid ${tab.border}`,
                marginTop:  "4px",
              }}>
                <ThinkersStrip thinkers={tab.thinkers} color={tab.color} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function AnalysisPanel({ analysis, dreamText = "" }) {
  const [activeTab,    setActiveTab]    = useState(ANALYSIS_TABS[0].key);
  const [revealedTabs, setRevealedTabs] = useState(new Set([ANALYSIS_TABS[0].key]));
  const [showAll,      setShowAll]      = useState(false);
  const panelRef = useRef(null);

  // Format the analysis once
  const formatted = formatAnalysis(analysis, dreamText);
  if (!formatted) return null;

  // Mark tab as revealed when visited
  const handleTabClick = useCallback((key) => {
    setActiveTab(key);
    setRevealedTabs((prev) => new Set([...prev, key]));
    setShowAll(false);
  }, []);

  const activeTabConfig = ANALYSIS_TABS.find((t) => t.key === activeTab);
  const activeTabData   = formatted.tabs.find((t) => t.key === activeTab);

  const allRead = ANALYSIS_TABS.every((t) => revealedTabs.has(t.key));

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── PANEL HEADER ── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginBottom:   "12px",
        flexWrap:       "wrap",
        gap:            "8px",
      }}>
        <div className="label-nebula">
          Psychological Analysis
        </div>

        {/* View all toggle */}
        <motion.button
          onClick={() => setShowAll((v) => !v)}
          whileHover={{ scale: 1.03 }}
          whileTap={{   scale: 0.97 }}
          style={{
            background:    showAll
              ? "rgba(124,92,191,0.15)"
              : "transparent",
            border:        `1px solid ${showAll
              ? "rgba(124,92,191,0.4)"
              : "rgba(124,92,191,0.2)"}`,
            borderRadius:  "var(--radius-full)",
            color:         showAll
              ? "var(--nebula-pure)"
              : "var(--star-dim)",
            fontFamily:    "var(--font-display)",
            fontSize:      "0.6rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding:       "5px 14px",
            cursor:        "pointer",
            transition:    "all 200ms ease",
            display:       "flex",
            alignItems:    "center",
            gap:           "6px",
          }}
        >
          {showAll ? "◈ Tabbed View" : "⟁ View All"}
          {/* All-read indicator */}
          {allRead && !showAll && (
            <span style={{
              width:        "5px",
              height:       "5px",
              borderRadius: "50%",
              background:   "var(--verdant-glow)",
              display:      "inline-block",
            }} />
          )}
        </motion.button>
      </div>

      {/* ── TABS / ALL VIEW ── */}
      <AnimatePresence mode="wait">
        {showAll ? (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <AllTabsView formatted={formatted} />
          </motion.div>
        ) : (
          <motion.div
            key="tabbed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Tab bar */}
            <div style={{
              display:         "flex",
              background:      "rgba(6, 6, 20, 0.7)",
              backdropFilter:  "blur(16px)",
              border:          "1px solid rgba(124, 92, 191, 0.18)",
              borderBottom:    "none",
              borderRadius:    "var(--radius-lg) var(--radius-lg) 0 0",
              overflow:        "hidden",
            }}>
              {ANALYSIS_TABS.map((tab) => (
                <TabButton
                  key={tab.key}
                  tab={tab}
                  isActive={activeTab === tab.key}
                  isRevealed={revealedTabs.has(tab.key) && activeTab !== tab.key}
                  onClick={() => handleTabClick(tab.key)}
                />
              ))}
            </div>

            {/* Tab panel */}
            <AnimatePresence mode="wait">
              {activeTabConfig && activeTabData && (
                <TabPanel
                  key={activeTab}
                  tab={activeTabConfig}
                  tabData={activeTabData}
                  isActive={true}
                />
              )}
            </AnimatePresence>

            {/* Unread hint */}
            <AnimatePresence>
              {!allRead && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{    opacity: 0 }}
                  style={{
                    display:        "flex",
                    justifyContent: "center",
                    gap:            "8px",
                    marginTop:      "12px",
                    alignItems:     "center",
                  }}
                >
                  {ANALYSIS_TABS.map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => handleTabClick(tab.key)}
                      title={`Go to ${tab.label}`}
                      style={{
                        width:        "6px",
                        height:       "6px",
                        borderRadius: "50%",
                        border:       "none",
                        cursor:       "pointer",
                        padding:      0,
                        background:   revealedTabs.has(tab.key)
                          ? tab.color
                          : "var(--star-dim)",
                        opacity:      activeTab === tab.key ? 1 : 0.5,
                        transition:   "all 200ms ease",
                      }}
                      whileHover={{ scale: 1.5, opacity: 1 }}
                    />
                  ))}
                  <span style={{
                    fontFamily:    "var(--font-body)",
                    fontStyle:     "italic",
                    fontSize:      "0.68rem",
                    color:         "var(--star-dim)",
                    marginLeft:    "4px",
                  }}>
                    {4 - revealedTabs.size} framework{4 - revealedTabs.size !== 1 ? "s" : ""} unread
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}