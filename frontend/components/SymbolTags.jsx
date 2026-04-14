import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatSymbols } from "@utils/formatAnalysis";

// ─────────────────────────────────────────────
// TIER CONFIG — each tier has its own visual
// treatment. Rarer symbols look more arcane.
// ─────────────────────────────────────────────
const TIER_CONFIG = {
  legendary: {
    prefix:     "◈",
    suffix:     "◈",
    labelColor: "var(--oracle-pure)",
    glowColor:  "rgba(245, 217, 140, 0.5)",
    glowSoft:   "rgba(245, 217, 140, 0.08)",
    border:     "rgba(245, 217, 140, 0.45)",
    bg:         "rgba(61, 42, 0, 0.35)",
    badge:      "LEGENDARY",
    badgeColor: "var(--oracle-glow)",
    animate:    true,
  },
  rare: {
    prefix:     "✦",
    suffix:     "",
    labelColor: "var(--nebula-pure)",
    glowColor:  "rgba(196, 176, 245, 0.45)",
    glowSoft:   "rgba(124, 92, 191, 0.08)",
    border:     "rgba(167, 141, 232, 0.4)",
    bg:         "rgba(30, 20, 60, 0.4)",
    badge:      "RARE",
    badgeColor: "var(--nebula-glow)",
    animate:    false,
  },
  uncommon: {
    prefix:     "⟁",
    suffix:     "",
    labelColor: "var(--star-glow)",
    glowColor:  "rgba(212, 212, 238, 0.3)",
    glowSoft:   "rgba(212, 212, 238, 0.05)",
    border:     "rgba(168, 168, 204, 0.3)",
    bg:         "rgba(20, 20, 40, 0.4)",
    badge:      "UNCOMMON",
    badgeColor: "var(--star-full)",
    animate:    false,
  },
  common: {
    prefix:     "·",
    suffix:     "",
    labelColor: "var(--star-full)",
    glowColor:  "rgba(168, 168, 204, 0.2)",
    glowSoft:   "rgba(168, 168, 204, 0.04)",
    border:     "rgba(124, 92, 191, 0.2)",
    bg:         "rgba(13, 13, 36, 0.3)",
    badge:      null,
    badgeColor: null,
    animate:    false,
  },
};


// ─────────────────────────────────────────────
// SYMBOL MEANING CARD — expands below a tag
// Full meaning with decorative treatment
// ─────────────────────────────────────────────
function MeaningCard({ symbol, tierCfg, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{    opacity: 0, height: 0, y: -4 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ overflow: "hidden", width: "100%" }}
    >
      <div style={{
        marginTop:     "8px",
        background:    tierCfg.glowSoft,
        border:        `1px solid ${tierCfg.border}`,
        borderRadius:  "var(--radius-md)",
        padding:       "14px 16px",
        position:      "relative",
        overflow:      "hidden",
      }}>
        {/* Left accent stripe */}
        <div style={{
          position:   "absolute",
          left:       0, top: 0, bottom: 0,
          width:      "2px",
          background: `linear-gradient(180deg, ${tierCfg.glowColor}, transparent)`,
          borderRadius: "var(--radius-full)",
        }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position:   "absolute",
            top:        "8px",
            right:      "10px",
            background: "none",
            border:     "none",
            color:      "var(--star-dim)",
            cursor:     "pointer",
            fontSize:   "0.7rem",
            opacity:    0.5,
            padding:    "2px 5px",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.target.style.opacity = 1; }}
          onMouseLeave={(e) => { e.target.style.opacity = 0.5; }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Symbol name header */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "8px",
          marginBottom: "8px",
          paddingLeft:  "10px",
          paddingRight: "24px",
        }}>
          <span style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "0.65rem",
            fontWeight:    600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:         tierCfg.labelColor,
            filter:        `drop-shadow(0 0 4px ${tierCfg.glowColor})`,
          }}>
            {tierCfg.prefix} {symbol.name}
          </span>

          {/* Tier badge */}
          {tierCfg.badge && (
            <span style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.5rem",
              letterSpacing: "0.15em",
              color:         tierCfg.badgeColor,
              background:    `${tierCfg.glowSoft}`,
              border:        `1px solid ${tierCfg.border}`,
              borderRadius:  "var(--radius-full)",
              padding:       "1px 6px",
              opacity:       0.8,
            }}>
              {tierCfg.badge}
            </span>
          )}
        </div>

        {/* Meaning text */}
        <p style={{
          fontFamily:  "var(--font-body)",
          fontStyle:   "italic",
          fontWeight:  300,
          fontSize:    "0.88rem",
          lineHeight:  1.75,
          color:       "var(--star-full)",
          margin:      0,
          paddingLeft: "10px",
        }}>
          {symbol.meaning}
        </p>

        {/* Bottom ornament */}
        <div style={{
          display:        "flex",
          justifyContent: "flex-end",
          marginTop:      "8px",
          paddingLeft:    "10px",
        }}>
          <span style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.5rem",
            letterSpacing: "0.18em",
            color:         "var(--star-dim)",
            textTransform: "uppercase",
            opacity:       0.5,
          }}>
            {symbol.meaning.split(/\s+/).length} words · symbol {symbol.index + 1}
          </span>
        </div>
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// SINGLE SYMBOL TAG
// ─────────────────────────────────────────────
function SymbolTag({ symbol, index, isExpanded, onToggle }) {
  const tierCfg  = TIER_CONFIG[symbol.tier] ?? TIER_CONFIG.common;
  const isLegendary = symbol.tier === "legendary";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1,    y: 0 }}
      transition={{
        delay:    index * 0.07,
        duration: 0.4,
        ease:     [0.34, 1.56, 0.64, 1],
      }}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* The tag button */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{   scale: 0.97 }}
        aria-expanded={isExpanded}
        aria-label={`${symbol.name}: ${symbol.meaning}`}
        style={{
          display:       "inline-flex",
          alignItems:    "center",
          gap:           "6px",
          padding:       "6px 14px",
          background:    isExpanded
            ? `${tierCfg.glowSoft}`
            : tierCfg.bg,
          border:        `1px solid ${isExpanded
            ? tierCfg.border
            : tierCfg.border.replace(/[\d.]+\)$/, "0.25)")}`,
          borderBottom:  isExpanded
            ? "1px solid transparent"
            : undefined,
          borderRadius:  isExpanded
            ? "var(--radius-sm) var(--radius-sm) 0 0"
            : "var(--radius-full)",
          cursor:        "pointer",
          transition:    "all 220ms ease",
          boxShadow:     isExpanded
            ? `0 0 16px ${tierCfg.glowColor.replace("0.5","0.2")}, inset 0 1px 0 rgba(255,255,255,0.05)`
            : "none",
          alignSelf:     "flex-start",
          position:      "relative",
          overflow:      "hidden",
        }}
      >
        {/* Legendary shimmer */}
        {isLegendary && (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration:    2.4,
              repeat:      Infinity,
              ease:        "easeInOut",
              repeatDelay: 3,
            }}
            style={{
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(90deg, transparent, rgba(245,217,140,0.12), transparent)",
              pointerEvents:"none",
              transform:  "skewX(-20deg)",
            }}
          />
        )}

        {/* Prefix glyph */}
        <motion.span
          animate={isLegendary ? {
            opacity:    [0.7, 1, 0.7],
            textShadow: [
              `0 0 4px ${tierCfg.glowColor}`,
              `0 0 10px ${tierCfg.glowColor}`,
              `0 0 4px ${tierCfg.glowColor}`,
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize:    "0.6rem",
            color:       tierCfg.labelColor,
            lineHeight:  1,
            flexShrink:  0,
            filter:      isExpanded
              ? `drop-shadow(0 0 4px ${tierCfg.glowColor})`
              : "none",
          }}
        >
          {tierCfg.prefix}
        </motion.span>

        {/* Symbol name */}
        <span style={{
          fontFamily:    "var(--font-display)",
          fontSize:      "0.65rem",
          fontWeight:    isLegendary ? 600 : 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:         isExpanded
            ? tierCfg.labelColor
            : tierCfg.labelColor.replace("pure", "full"),
          whiteSpace:    "nowrap",
          position:      "relative",
          zIndex:        1,
          transition:    "color 200ms ease",
        }}>
          {symbol.name}
        </span>

        {/* Expand chevron */}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0, opacity: isExpanded ? 0.9 : 0.4 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize:   "0.5rem",
            color:      tierCfg.labelColor,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ▾
        </motion.span>
      </motion.button>

      {/* Meaning card */}
      <AnimatePresence>
        {isExpanded && (
          <MeaningCard
            symbol={symbol}
            tierCfg={tierCfg}
            onClose={onToggle}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// SYMBOL LEGEND — compact tier guide
// ─────────────────────────────────────────────
function SymbolLegend() {
  const tiers = [
    { key: "legendary", prefix: "◈", label: "Legendary" },
    { key: "rare",      prefix: "✦", label: "Rare"      },
    { key: "uncommon",  prefix: "⟁", label: "Uncommon"  },
    { key: "common",    prefix: "·", label: "Common"    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      style={{
        display:    "flex",
        gap:        "10px",
        flexWrap:   "wrap",
        alignItems: "center",
        marginTop:  "10px",
        paddingTop: "8px",
        borderTop:  "1px solid rgba(124,92,191,0.1)",
      }}
    >
      <span style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.52rem",
        letterSpacing: "0.15em",
        color:         "var(--star-dim)",
        textTransform: "uppercase",
        opacity:       0.6,
      }}>
        Rarity:
      </span>
      {tiers.map(({ key, prefix, label }) => {
        const cfg = TIER_CONFIG[key];
        return (
          <span key={key} style={{
            display:    "flex",
            alignItems: "center",
            gap:        "4px",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "0.6rem",
              color:      cfg.labelColor,
              opacity:    0.7,
            }}>
              {prefix}
            </span>
            <span style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.52rem",
              letterSpacing: "0.08em",
              color:         "var(--star-dim)",
              textTransform: "uppercase",
              opacity:       0.5,
            }}>
              {label}
            </span>
          </span>
        );
      })}
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        textAlign:  "center",
        padding:    "16px",
        fontFamily: "var(--font-body)",
        fontStyle:  "italic",
        fontSize:   "0.82rem",
        color:      "var(--star-dim)",
      }}
    >
      The oracle found no symbols to extract from this dream.
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function SymbolTags({
  symbols,
  compact    = false,
  showLegend = true,
}) {
  const [expandedId, setExpandedId] = useState(null);

  // Accept raw or pre-formatted symbols
  const formatted = symbols?.[0]?.tier
    ? symbols
    : formatSymbols(symbols ?? []);

  if (!formatted?.length) return <EmptyState />;

  const handleToggle = (index) => {
    setExpandedId((prev) => (prev === index ? null : index));
  };

  return (
    <div>
      {/* Tags grid */}
      <motion.div
        style={{
          display:   "flex",
          flexWrap:  "wrap",
          gap:       compact ? "6px" : "8px",
          alignItems:"flex-start",
        }}
      >
        {formatted.map((symbol, i) => (
          <SymbolTag
            key={`${symbol.name}-${i}`}
            symbol={{ ...symbol, index: i }}
            index={i}
            isExpanded={expandedId === i}
            onToggle={() => handleToggle(i)}
          />
        ))}
      </motion.div>

      {/* Legend */}
      {showLegend && !compact && formatted.length > 1 && (
        <SymbolLegend />
      )}
    </div>
  );
}