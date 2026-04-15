import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence }        from "framer-motion";
import {
  useDreamJournal,
  useJournalEntries,
  useJournalStats,
  useJournalControls,
  formatDateLabel,
  dreamSnippet,
  moodCategory,
} from "@hooks/useDreamJournal";
import SymbolTags from "@components/SymbolTags";

// ─────────────────────────────────────────────
// MOOD DOT — colored indicator by score
// ─────────────────────────────────────────────
function MoodDot({ score, size = 8 }) {
  const color =
    score <= 0.33 ? "var(--crimson-full)" :
    score <= 0.66 ? "var(--nebula-full)"  :
                    "var(--verdant-full)";

  const glow =
    score <= 0.33 ? "rgba(196,40,40,0.5)"   :
    score <= 0.66 ? "rgba(124,92,191,0.5)"  :
                    "rgba(61,214,140,0.5)";

  return (
    <div style={{
      width:        size,
      height:       size,
      borderRadius: "50%",
      background:   color,
      boxShadow:    `0 0 ${size}px ${glow}`,
      flexShrink:   0,
    }} />
  );
}


// ─────────────────────────────────────────────
// STREAK BADGE
// ─────────────────────────────────────────────
function StreakBadge({ streak }) {
  if (!streak || streak < 2) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "5px",
        background:    "rgba(196, 144, 10, 0.12)",
        border:        "1px solid rgba(196, 144, 10, 0.3)",
        borderRadius:  "var(--radius-full)",
        padding:       "4px 10px",
      }}
    >
      <span style={{ fontSize: "0.75rem" }}>🔥</span>
      <span style={{
        fontFamily:    "var(--font-display)",
        fontSize:      "0.62rem",
        fontWeight:    600,
        letterSpacing: "0.12em",
        color:         "var(--oracle-glow)",
      }}>
        {streak} day streak
      </span>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// STATS PANEL — insights from your dream data
// ─────────────────────────────────────────────
function StatsPanel({ stats }) {
  const [open, setOpen] = useState(false);

  if (!stats) return null;

  const moodColor =
    stats.avgMoodCategory === "dark"       ? "var(--crimson-glow)"  :
    stats.avgMoodCategory === "peaceful"   ? "var(--verdant-glow)"  :
                                             "var(--nebula-glow)";

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.01 }}
        whileTap={{   scale: 0.99 }}
        style={{
          width:         "100%",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"space-between",
          background:    open
            ? "rgba(124,92,191,0.1)"
            : "rgba(8,8,24,0.5)",
          border:        "1px solid rgba(124,92,191,0.2)",
          borderRadius:  open
            ? "var(--radius-lg) var(--radius-lg) 0 0"
            : "var(--radius-lg)",
          padding:       "12px 16px",
          cursor:        "pointer",
          transition:    "all 250ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.85rem" }}>✦</span>
          <span style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "0.65rem",
            fontWeight:    600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         "var(--nebula-glow)",
          }}>
            Journal Insights
          </span>
          <StreakBadge streak={stats.streak} />
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ fontSize: "0.6rem", color: "var(--star-dim)" }}
        >
          ▾
        </motion.span>
      </motion.button>

      {/* Stats body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{    opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background:   "rgba(8,8,24,0.6)",
              border:       "1px solid rgba(124,92,191,0.2)",
              borderTop:    "none",
              borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
              padding:      "16px",
            }}>

              {/* Core stats grid */}
              <div style={{
                display:             "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap:                 "10px",
                marginBottom:        "16px",
              }}>
                {[
                  { val: stats.totalEntries,         label: "Dreams",       color: "var(--nebula-glow)"  },
                  { val: stats.totalWords,            label: "Total Words",  color: "var(--star-glow)"    },
                  { val: stats.avgWordsPerDream,      label: "Avg Words",    color: "var(--oracle-glow)"  },
                  { val: stats.darkDreams,            label: "Dark",         color: "var(--crimson-glow)" },
                  { val: stats.ambivDreams,           label: "Liminal",      color: "var(--nebula-glow)"  },
                  { val: stats.lightDreams,           label: "Peaceful",     color: "var(--verdant-glow)" },
                ].map(({ val, label, color }) => (
                  <div key={label} style={{
                    background:   "rgba(13,13,36,0.5)",
                    border:       "1px solid rgba(124,92,191,0.12)",
                    borderRadius: "var(--radius-md)",
                    padding:      "10px",
                    textAlign:    "center",
                  }}>
                    <div style={{
                      fontFamily:    "var(--font-mono)",
                      fontSize:      "1.1rem",
                      fontWeight:    400,
                      color,
                      lineHeight:    1,
                      marginBottom:  "4px",
                      filter:        `drop-shadow(0 0 4px ${color})`,
                    }}>
                      {val}
                    </div>
                    <div style={{
                      fontFamily:    "var(--font-display)",
                      fontSize:      "0.52rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color:         "var(--star-dim)",
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Avg mood bar */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  marginBottom:   "6px",
                }}>
                  <span style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "0.55rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color:         "var(--star-dim)",
                  }}>
                    Average Emotional Tone
                  </span>
                  <span style={{
                    fontFamily:  "var(--font-mono)",
                    fontSize:    "0.6rem",
                    color:       moodColor,
                  }}>
                    {Math.round(stats.avgMoodScore * 100)}% · {stats.avgMoodCategory}
                  </span>
                </div>
                <div style={{
                  height:       "4px",
                  background:   "var(--ink-2)",
                  borderRadius: "var(--radius-full)",
                  overflow:     "hidden",
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.avgMoodScore * 100}%` }}
                    transition={{ duration: 0.9, ease: [0.16,1,0.3,1], delay: 0.2 }}
                    style={{
                      height:       "100%",
                      background:   moodColor,
                      borderRadius: "var(--radius-full)",
                      boxShadow:    `0 0 6px ${moodColor}`,
                    }}
                  />
                </div>
              </div>

              {/* Top symbols */}
              {stats.topSymbols?.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "0.55rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color:         "var(--star-dim)",
                    marginBottom:  "8px",
                  }}>
                    Recurring Symbols
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {stats.topSymbols.map(({ name, count }) => (
                      <span key={name} style={{
                        display:       "flex",
                        alignItems:    "center",
                        gap:           "4px",
                        background:    "rgba(74,47,160,0.12)",
                        border:        "1px solid rgba(124,92,191,0.2)",
                        borderRadius:  "var(--radius-full)",
                        padding:       "3px 10px",
                        fontFamily:    "var(--font-body)",
                        fontStyle:     "italic",
                        fontSize:      "0.72rem",
                        color:         "var(--nebula-pure)",
                      }}>
                        {name}
                        <span style={{
                          fontFamily:  "var(--font-mono)",
                          fontSize:    "0.52rem",
                          color:       "var(--star-dim)",
                          background:  "rgba(124,92,191,0.15)",
                          borderRadius:"var(--radius-full)",
                          padding:     "0 4px",
                        }}>
                          ×{count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top tags */}
              {stats.topTags?.length > 0 && (
                <div>
                  <div style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "0.55rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color:         "var(--star-dim)",
                    marginBottom:  "8px",
                  }}>
                    Your Tags
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {stats.topTags.map(({ tag, count }) => (
                      <span key={tag} style={{
                        background:    "rgba(13,13,36,0.6)",
                        border:        "1px solid rgba(124,92,191,0.15)",
                        borderRadius:  "var(--radius-full)",
                        padding:       "3px 8px",
                        fontFamily:    "var(--font-mono)",
                        fontSize:      "0.58rem",
                        color:         "var(--star-mid)",
                        letterSpacing: "0.08em",
                      }}>
                        #{tag} {count > 1 && `(${count})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ─────────────────────────────────────────────
// TOOLBAR — search, sort, filter, actions
// ─────────────────────────────────────────────
function Toolbar({ onExport, onImportClick, importRef }) {
  const {
    searchQuery, sortBy, filterMood,
    setSearchQuery, clearSearch,
    setSortBy, setFilterMood,
  } = useJournalControls();

  const SORTS = [
    { key: "newest",     label: "Newest"    },
    { key: "oldest",     label: "Oldest"    },
    { key: "mood_dark",  label: "Darkest"   },
    { key: "mood_light", label: "Lightest"  },
    { key: "starred",    label: "Starred"   },
  ];

  const MOODS = [
    { key: "all",        label: "All Moods", dot: null             },
    { key: "dark",       label: "Dark",      dot: "var(--crimson-full)" },
    { key: "ambivalent", label: "Liminal",   dot: "var(--nebula-full)"  },
    { key: "peaceful",   label: "Peaceful",  dot: "var(--verdant-full)" },
  ];

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Search */}
      <div style={{
        position:     "relative",
        marginBottom: "10px",
      }}>
        <span style={{
          position:  "absolute",
          left:      "12px",
          top:       "50%",
          transform: "translateY(-50%)",
          color:     "var(--star-dim)",
          fontSize:  "0.75rem",
          pointerEvents:"none",
        }}>
          ◎
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dreams, symbols, moods…"
          style={{
            width:         "100%",
            padding:       "9px 36px 9px 32px",
            background:    "rgba(8,8,24,0.7)",
            border:        "1px solid rgba(124,92,191,0.2)",
            borderRadius:  "var(--radius-md)",
            color:         "var(--star-glow)",
            fontFamily:    "var(--font-body)",
            fontStyle:     searchQuery ? "normal" : "italic",
            fontSize:      "0.85rem",
            outline:       "none",
            transition:    "border-color 0.25s ease",
          }}
          onFocus={(e)  => { e.target.style.borderColor = "rgba(124,92,191,0.45)"; }}
          onBlur={(e)   => { e.target.style.borderColor = "rgba(124,92,191,0.2)";  }}
        />
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity:0, scale:0.8 }}
              animate={{ opacity:1, scale:1   }}
              exit={{    opacity:0, scale:0.8 }}
              onClick={clearSearch}
              style={{
                position:   "absolute",
                right:      "10px",
                top:        "50%",
                transform:  "translateY(-50%)",
                background: "none",
                border:     "none",
                color:      "var(--star-dim)",
                cursor:     "pointer",
                fontSize:   "0.7rem",
                padding:    "2px 4px",
              }}
            >
              ✕
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Sort + filter row */}
      <div style={{
        display:   "flex",
        gap:       "8px",
        flexWrap:  "wrap",
        alignItems:"center",
      }}>
        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            background:    "rgba(8,8,24,0.7)",
            border:        "1px solid rgba(124,92,191,0.2)",
            borderRadius:  "var(--radius-md)",
            color:         "var(--star-full)",
            fontFamily:    "var(--font-display)",
            fontSize:      "0.6rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding:       "6px 10px",
            cursor:        "pointer",
            outline:       "none",
          }}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        {/* Mood filter pills */}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setFilterMood(m.key)}
              style={{
                display:       "flex",
                alignItems:    "center",
                gap:           "5px",
                background:    filterMood === m.key
                  ? "rgba(124,92,191,0.15)"
                  : "transparent",
                border:        `1px solid ${filterMood === m.key
                  ? "rgba(124,92,191,0.4)"
                  : "rgba(124,92,191,0.15)"}`,
                borderRadius:  "var(--radius-full)",
                color:         filterMood === m.key
                  ? "var(--nebula-pure)"
                  : "var(--star-dim)",
                fontFamily:    "var(--font-display)",
                fontSize:      "0.58rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding:       "5px 10px",
                cursor:        "pointer",
                transition:    "all 200ms ease",
              }}
            >
              {m.dot && (
                <span style={{
                  width:        "5px",
                  height:       "5px",
                  borderRadius: "50%",
                  background:   m.dot,
                  flexShrink:   0,
                  display:      "inline-block",
                }} />
              )}
              {m.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Export / Import */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={onExport}
            title="Export journal as JSON"
            style={{
              background:    "transparent",
              border:        "1px solid rgba(124,92,191,0.2)",
              borderRadius:  "var(--radius-md)",
              color:         "var(--star-dim)",
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.58rem",
              letterSpacing: "0.1em",
              padding:       "5px 10px",
              cursor:        "pointer",
              transition:    "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.color       = "var(--nebula-pure)";
              e.target.style.borderColor = "rgba(124,92,191,0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color       = "var(--star-dim)";
              e.target.style.borderColor = "rgba(124,92,191,0.2)";
            }}
          >
            ↓ Export
          </button>
          <button
            onClick={onImportClick}
            title="Import journal from JSON"
            style={{
              background:    "transparent",
              border:        "1px solid rgba(124,92,191,0.2)",
              borderRadius:  "var(--radius-md)",
              color:         "var(--star-dim)",
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.58rem",
              letterSpacing: "0.1em",
              padding:       "5px 10px",
              cursor:        "pointer",
              transition:    "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.color       = "var(--nebula-pure)";
              e.target.style.borderColor = "rgba(124,92,191,0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color       = "var(--star-dim)";
              e.target.style.borderColor = "rgba(124,92,191,0.2)";
            }}
          >
            ↑ Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// TAG INPUT — add tags to an entry inline
// ─────────────────────────────────────────────
function TagInput({ entryId }) {
  const [value,   setValue]   = useState("");
  const [visible, setVisible] = useState(false);
  const addTag    = useDreamJournal((s) => s.addTag);
  const removeTag = useDreamJournal((s) => s.removeTag);
  const entry     = useDreamJournal((s) => s.getEntryById(entryId));

  const handleAdd = () => {
    const clean = value.trim();
    if (!clean) return;
    addTag(entryId, clean);
    setValue("");
  };

  return (
    <div style={{ marginTop: "8px" }}>
      {/* Existing tags */}
      {entry?.tags?.length > 0 && (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "6px" }}>
          {entry.tags.map((tag) => (
            <span key={tag} style={{
              display:    "flex",
              alignItems: "center",
              gap:        "4px",
              background: "rgba(13,13,36,0.6)",
              border:     "1px solid rgba(124,92,191,0.2)",
              borderRadius:"var(--radius-full)",
              padding:    "2px 8px",
              fontFamily: "var(--font-mono)",
              fontSize:   "0.58rem",
              color:      "var(--star-mid)",
            }}>
              #{tag}
              <button
                onClick={() => removeTag(entryId, tag)}
                style={{
                  background: "none", border: "none",
                  color: "var(--star-dim)", cursor: "pointer",
                  fontSize: "0.55rem", padding: "0 2px", lineHeight: 1,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Toggle + input */}
      {!visible ? (
        <button
          onClick={() => setVisible(true)}
          style={{
            background:    "none",
            border:        "1px dashed rgba(124,92,191,0.2)",
            borderRadius:  "var(--radius-full)",
            color:         "var(--star-dim)",
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.55rem",
            letterSpacing: "0.1em",
            padding:       "3px 8px",
            cursor:        "pointer",
          }}
        >
          + tag
        </button>
      ) : (
        <div style={{ display: "flex", gap: "5px" }}>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter")  { handleAdd(); }
              if (e.key === "Escape") { setVisible(false); setValue(""); }
            }}
            placeholder="tag name…"
            maxLength={30}
            style={{
              background:   "rgba(8,8,24,0.7)",
              border:       "1px solid rgba(124,92,191,0.3)",
              borderRadius: "var(--radius-sm)",
              color:        "var(--star-glow)",
              fontFamily:   "var(--font-mono)",
              fontSize:     "0.65rem",
              padding:      "4px 8px",
              outline:      "none",
              width:        "120px",
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              background:   "rgba(124,92,191,0.15)",
              border:       "1px solid rgba(124,92,191,0.3)",
              borderRadius: "var(--radius-sm)",
              color:        "var(--nebula-pure)",
              fontFamily:   "var(--font-mono)",
              fontSize:     "0.6rem",
              padding:      "4px 8px",
              cursor:       "pointer",
            }}
          >
            Add
          </button>
          <button
            onClick={() => { setVisible(false); setValue(""); }}
            style={{
              background: "none", border: "none",
              color: "var(--star-dim)", cursor: "pointer",
              fontSize: "0.65rem", padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// DELETE CONFIRM — inline confirmation
// ─────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1    }}
      exit={{    opacity: 0, scale: 0.95 }}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "8px",
        background:   "rgba(61,10,10,0.5)",
        border:       "1px solid rgba(196,40,40,0.3)",
        borderRadius: "var(--radius-md)",
        padding:      "8px 12px",
      }}
    >
      <span style={{
        fontFamily:  "var(--font-body)",
        fontStyle:   "italic",
        fontSize:    "0.75rem",
        color:       "var(--crimson-glow)",
        flex:        1,
      }}>
        Banish this dream forever?
      </span>
      <button
        onClick={onConfirm}
        style={{
          background:   "var(--crimson-full)",
          border:       "none",
          borderRadius: "var(--radius-sm)",
          color:        "white",
          fontFamily:   "var(--font-display)",
          fontSize:     "0.58rem",
          letterSpacing:"0.1em",
          textTransform:"uppercase",
          padding:      "4px 10px",
          cursor:       "pointer",
        }}
      >
        Banish
      </button>
      <button
        onClick={onCancel}
        style={{
          background:   "transparent",
          border:       "1px solid rgba(124,92,191,0.3)",
          borderRadius: "var(--radius-sm)",
          color:        "var(--star-dim)",
          fontFamily:   "var(--font-display)",
          fontSize:     "0.58rem",
          letterSpacing:"0.1em",
          textTransform:"uppercase",
          padding:      "4px 10px",
          cursor:       "pointer",
        }}
      >
        Keep
      </button>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// ENTRY CARD
// ─────────────────────────────────────────────
function EntryCard({ entry, index, onSelect }) {
  const [expanded,      setExpanded]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleStar  = useDreamJournal((s) => s.toggleStar);
  const deleteEntry = useDreamJournal((s) => s.deleteEntry);

  const snippet    = dreamSnippet(entry.dreamText, 130);
  const dateLabel  = formatDateLabel(entry.createdAt);
  const fullDate   = new Date(entry.createdAt).toLocaleDateString("en-US", {
    weekday:"long", month:"long", day:"numeric"
  });

  const moodColor =
    entry.moodScore <= 0.33 ? "var(--crimson-glow)"  :
    entry.moodScore <= 0.66 ? "var(--nebula-glow)"   :
                               "var(--verdant-glow)";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, x: -20, transition: { duration: 0.25 } }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16,1,0.3,1] }}
    >
      <div style={{
        background:    expanded
          ? "rgba(16,16,36,0.8)"
          : "rgba(10,10,26,0.6)",
        border:        `1px solid ${expanded
          ? "rgba(124,92,191,0.3)"
          : "rgba(124,92,191,0.12)"}`,
        borderRadius:  "var(--radius-lg)",
        overflow:      "hidden",
        transition:    "border-color 250ms ease, background 250ms ease",
        position:      "relative",
      }}>

        {/* Left mood stripe */}
        <div style={{
          position:   "absolute",
          left:       0, top: 0, bottom: 0,
          width:      "3px",
          background: moodColor,
          opacity:    expanded ? 0.8 : 0.4,
          transition: "opacity 250ms ease",
        }} />

        {/* ── CARD HEADER ── */}
        <div
          onClick={() => setExpanded((v) => !v)}
          style={{
            padding:   "14px 14px 14px 18px",
            cursor:    "pointer",
            userSelect:"none",
          }}
        >
          <div style={{
            display:        "flex",
            alignItems:     "flex-start",
            justifyContent: "space-between",
            gap:            "10px",
            marginBottom:   "8px",
          }}>
            {/* Date + mood */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap:"wrap" }}>
              <span style={{
                fontFamily:    "var(--font-display)",
                fontSize:      "0.6rem",
                fontWeight:    600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color:         "var(--star-dim)",
              }}>
                {dateLabel}
              </span>
              <span style={{ color: "var(--star-dim)", fontSize: "0.5rem" }}>·</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <MoodDot score={entry.moodScore} size={6} />
                <span style={{
                  fontFamily:  "var(--font-body)",
                  fontStyle:   "italic",
                  fontSize:    "0.68rem",
                  color:       moodColor,
                }}>
                  {entry.moodLabel}
                </span>
              </div>
              {entry.starred && (
                <span style={{ fontSize: "0.7rem", lineHeight: 1 }}>⭐</span>
              )}
            </div>

            {/* Actions */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", gap: "4px", flexShrink: 0 }}
            >
              {/* Star */}
              <button
                onClick={() => toggleStar(entry.id)}
                title={entry.starred ? "Unstar" : "Star"}
                style={{
                  background: "none",
                  border:     "none",
                  fontSize:   "0.75rem",
                  cursor:     "pointer",
                  opacity:    entry.starred ? 1 : 0.3,
                  padding:    "2px 4px",
                  transition: "opacity 200ms",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => { e.target.style.opacity = 1; }}
                onMouseLeave={(e) => { e.target.style.opacity = entry.starred ? 1 : 0.3; }}
              >
                ⭐
              </button>

              {/* Open full result */}
              <button
                onClick={() => onSelect(entry)}
                title="View full analysis"
                style={{
                  background:    "rgba(124,92,191,0.08)",
                  border:        "1px solid rgba(124,92,191,0.2)",
                  borderRadius:  "var(--radius-sm)",
                  color:         "var(--star-mid)",
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.55rem",
                  letterSpacing: "0.1em",
                  padding:       "3px 7px",
                  cursor:        "pointer",
                  transition:    "all 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color       = "var(--nebula-pure)";
                  e.target.style.borderColor = "rgba(124,92,191,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color       = "var(--star-mid)";
                  e.target.style.borderColor = "rgba(124,92,191,0.2)";
                }}
              >
                Open ↗
              </button>

              {/* Delete */}
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                style={{
                  background: "none",
                  border:     "none",
                  color:      "var(--star-dim)",
                  cursor:     "pointer",
                  fontSize:   "0.65rem",
                  padding:    "2px 4px",
                  opacity:    0.4,
                  transition: "opacity 200ms",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = 1;
                  e.target.style.color   = "var(--crimson-glow)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = 0.4;
                  e.target.style.color   = "var(--star-dim)";
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Dream snippet */}
          <p style={{
            fontFamily:  "var(--font-body)",
            fontStyle:   "italic",
            fontWeight:  300,
            fontSize:    "0.9rem",
            lineHeight:  1.65,
            color:       expanded ? "var(--star-glow)" : "var(--star-full)",
            margin:      0,
            transition:  "color 250ms ease",
          }}>
            {snippet}
            {entry.dreamText.length > 130 && !expanded && (
              <span style={{ color: "var(--star-dim)", marginLeft: "3px" }}>…</span>
            )}
          </p>

          {/* Expand chevron row */}
          <div style={{
            display:     "flex",
            alignItems:  "center",
            gap:         "8px",
            marginTop:   "8px",
          }}>
            <span style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.55rem",
              color:         "var(--star-dim)",
              letterSpacing: "0.08em",
            }}>
              {entry.wordCount}w · {fullDate}
            </span>
            <div style={{ flex: 1 }} />
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: "0.55rem", color: "var(--star-dim)", opacity: 0.5 }}
            >
              ▾
            </motion.span>
          </div>
        </div>

        {/* ── DELETE CONFIRM ── */}
        <AnimatePresence>
          {confirmDelete && (
            <div style={{ padding: "0 14px 12px 18px" }}>
              <DeleteConfirm
                onConfirm={() => deleteEntry(entry.id)}
                onCancel={()  => setConfirmDelete(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── EXPANDED BODY ── */}
        <AnimatePresence>
          {expanded && !confirmDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{    opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                borderTop: "1px solid rgba(124,92,191,0.12)",
                padding:   "14px 14px 14px 18px",
              }}>
                {/* Full dream text */}
                {entry.dreamText.length > 130 && (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{
                      fontFamily:    "var(--font-display)",
                      fontSize:      "0.55rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color:         "var(--star-dim)",
                      marginBottom:  "6px",
                    }}>
                      Full Dream
                    </div>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontStyle:  "italic",
                      fontWeight: 300,
                      fontSize:   "0.88rem",
                      lineHeight: 1.75,
                      color:      "var(--star-full)",
                      margin:     0,
                    }}>
                      {entry.dreamText}
                    </p>
                  </div>
                )}

                {/* Oracle summary */}
                {entry.analysis?.summary && (
                  <div style={{
                    background:   "rgba(61,42,0,0.2)",
                    border:       "1px solid rgba(196,144,10,0.2)",
                    borderRadius: "var(--radius-md)",
                    padding:      "10px 12px",
                    marginBottom: "12px",
                  }}>
                    <div style={{
                      fontFamily:    "var(--font-display)",
                      fontSize:      "0.52rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color:         "var(--oracle-glow)",
                      marginBottom:  "5px",
                      opacity:       0.8,
                    }}>
                      Oracle
                    </div>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontStyle:  "italic",
                      fontSize:   "0.82rem",
                      lineHeight: 1.6,
                      color:      "var(--oracle-pure)",
                      margin:     0,
                    }}>
                      "{entry.analysis.summary}"
                    </p>
                  </div>
                )}

                {/* Symbols */}
                {entry.analysis?.symbols?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{
                      fontFamily:    "var(--font-display)",
                      fontSize:      "0.55rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color:         "var(--star-dim)",
                      marginBottom:  "7px",
                    }}>
                      Symbols
                    </div>
                    <SymbolTags
                      symbols={entry.analysis.symbols}
                      compact={true}
                      showLegend={false}
                    />
                  </div>
                )}

                {/* Tags */}
                <div>
                  <div style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "0.55rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color:         "var(--star-dim)",
                    marginBottom:  "5px",
                  }}>
                    Tags
                  </div>
                  <TagInput entryId={entry.id} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({ hasFilter }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      style={{
        textAlign:  "center",
        padding:    "clamp(32px, 6vw, 56px) 24px",
      }}
    >
      <div style={{
        fontSize:     "2.5rem",
        marginBottom: "16px",
        filter:       "drop-shadow(0 0 16px rgba(124,92,191,0.3))",
        animation:    "float 4s ease-in-out infinite",
      }}>
        {hasFilter ? "◎" : "🌙"}
      </div>
      <p style={{
        fontFamily:  "var(--font-display)",
        fontSize:    "0.9rem",
        letterSpacing:"0.1em",
        color:       "var(--star-mid)",
        marginBottom:"8px",
      }}>
        {hasFilter ? "No dreams match your search" : "The journal awaits its first dream"}
      </p>
      <p style={{
        fontFamily: "var(--font-body)",
        fontStyle:  "italic",
        fontSize:   "0.78rem",
        color:      "var(--star-dim)",
      }}>
        {hasFilter
          ? "Try clearing your filters or searching for something else"
          : "Your dreams will be recorded here automatically after each interpretation"}
      </p>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// IMPORT TOAST
// ─────────────────────────────────────────────
function ImportToast({ result, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 10, scale: 0.97 }}
      style={{
        position:     "fixed",
        bottom:       "24px",
        right:        "24px",
        zIndex:       "var(--z-toast)",
        background:   result.success
          ? "rgba(10,45,26,0.95)"
          : "rgba(61,10,10,0.95)",
        border:       `1px solid ${result.success
          ? "rgba(30,153,80,0.4)"
          : "rgba(196,40,40,0.4)"}`,
        borderRadius: "var(--radius-md)",
        padding:      "12px 16px",
        display:      "flex",
        alignItems:   "center",
        gap:          "10px",
        backdropFilter:"blur(16px)",
        boxShadow:    "var(--shadow-lg)",
        maxWidth:     "320px",
      }}
    >
      <span style={{ fontSize: "1rem" }}>
        {result.success ? "✓" : "✕"}
      </span>
      <span style={{
        fontFamily:  "var(--font-body)",
        fontSize:    "0.82rem",
        color:       result.success
          ? "var(--verdant-glow)"
          : "var(--crimson-glow)",
        flex:        1,
      }}>
        {result.success
          ? `Imported ${result.count} dream${result.count !== 1 ? "s" : ""} successfully`
          : result.error}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: "none", border: "none",
          color: "var(--star-dim)", cursor: "pointer",
          fontSize: "0.7rem", padding: "2px",
        }}
      >
        ✕
      </button>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function DreamJournal({ onSelectEntry }) {
  const entries     = useJournalEntries();
  const stats       = useJournalStats();
  const { searchQuery, filterMood } = useJournalControls();
  const exportJournal = useDreamJournal((s) => s.exportJournal);
  const importJournal = useDreamJournal((s) => s.importJournal);

  const importRef          = useRef(null);
  const [importResult, setImportResult] = useState(null);

  const hasFilter = !!(searchQuery || filterMood !== "all");

  // Wire up file input
  const handleImportClick = useCallback(() => {
    importRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importJournal(file);
    setImportResult(result);
    e.target.value = ""; // reset so same file can be re-imported
    setTimeout(() => setImportResult(null), 4000);
  }, [importJournal]);

  // Wire ref onChange
  if (importRef.current) {
    importRef.current.onchange = handleFileChange;
  }

  return (
    <div style={{ position: "relative" }}>

      {/* Stats panel */}
      <StatsPanel stats={stats} />

      {/* Toolbar */}
      <Toolbar
        onExport={exportJournal}
        onImportClick={handleImportClick}
        importRef={importRef}
      />

      {/* Entry list */}
      <AnimatePresence mode="popLayout">
        {entries.length === 0 ? (
          <EmptyState key="empty" hasFilter={hasFilter} />
        ) : (
          <motion.div
            key="list"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {entries.map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                index={i}
                onSelect={onSelectEntry}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import toast */}
      <AnimatePresence>
        {importResult && (
          <ImportToast
            key="toast"
            result={importResult}
            onDismiss={() => setImportResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}