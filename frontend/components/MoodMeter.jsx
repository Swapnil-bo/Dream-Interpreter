import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { getMoodGradient, getMoodDescription } from "@utils/formatAnalysis";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const SVG_SIZE   = 220;
const CX         = SVG_SIZE / 2;       // 110
const CY         = SVG_SIZE / 2 + 10;  // 120 — slightly lower for arc gauge feel
const RADIUS     = 88;
const STROKE     = 8;

// Arc spans 210° — from -195° to 15° (bottom-left to bottom-right)
const START_DEG  = -195;
const END_DEG    = 15;
const TOTAL_DEG  = END_DEG - START_DEG; // 210

// Convert polar to cartesian
function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// Build an SVG arc path string
function arcPath(cx, cy, r, startDeg, endDeg) {
  const start    = polar(cx, cy, r, startDeg);
  const end      = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
  ].join(" ");
}

// Arc circumference for strokeDasharray
const ARC_LENGTH = (TOTAL_DEG / 360) * 2 * Math.PI * RADIUS; // ≈ 323px


// ─────────────────────────────────────────────
// MOOD SPECTRUM — 7 color stops across the arc
// Maps 0→1 score to crimson→nebula→verdant
// ─────────────────────────────────────────────
const SPECTRUM = [
  { stop: 0.00, hex: "#c42828" },  // abyss — deep crimson
  { stop: 0.18, hex: "#8b1a6b" },  // shadow — blood violet
  { stop: 0.35, hex: "#4a2fa0" },  // twilight — deep nebula
  { stop: 0.50, hex: "#7c5cbf" },  // liminal — nebula
  { stop: 0.65, hex: "#2a7a9a" },  // ascent — teal
  { stop: 0.82, hex: "#1e9950" },  // luminous — verdant
  { stop: 1.00, hex: "#3dd68c" },  // transcendent — bright verdant
];

function interpolateColor(score) {
  const s  = Math.max(0, Math.min(1, score));
  let lo   = SPECTRUM[0];
  let hi   = SPECTRUM[SPECTRUM.length - 1];

  for (let i = 0; i < SPECTRUM.length - 1; i++) {
    if (s >= SPECTRUM[i].stop && s <= SPECTRUM[i + 1].stop) {
      lo = SPECTRUM[i];
      hi = SPECTRUM[i + 1];
      break;
    }
  }

  const t  = lo.stop === hi.stop
    ? 0
    : (s - lo.stop) / (hi.stop - lo.stop);

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  const [lr, lg, lb] = hexToRgb(lo.hex);
  const [hr, hg, hb] = hexToRgb(hi.hex);

  const r = Math.round(lr + (hr - lr) * t);
  const g = Math.round(lg + (hg - lg) * t);
  const b = Math.round(lb + (hb - lb) * t);

  return {
    solid:    `rgb(${r},${g},${b})`,
    glow:     `rgba(${r},${g},${b},0.45)`,
    glowSoft: `rgba(${r},${g},${b},0.15)`,
    hex:      `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`,
  };
}


// ─────────────────────────────────────────────
// TICK MARKS — notches around the arc
// ─────────────────────────────────────────────
function TickMarks() {
  const ticks = [];
  const TICK_COUNT = 21; // one every 10°

  for (let i = 0; i <= TICK_COUNT; i++) {
    const pct    = i / TICK_COUNT;
    const deg    = START_DEG + pct * TOTAL_DEG;
    const isMajor = i % 5 === 0;
    const outerR = RADIUS + STROKE / 2 + (isMajor ? 6 : 3);
    const innerR = RADIUS + STROKE / 2 + 1;
    const outer  = polar(CX, CY, outerR, deg);
    const inner  = polar(CX, CY, innerR, deg);

    ticks.push(
      <line
        key={i}
        x1={inner.x} y1={inner.y}
        x2={outer.x} y2={outer.y}
        stroke={isMajor
          ? "rgba(196, 176, 245, 0.35)"
          : "rgba(124, 92, 191, 0.15)"}
        strokeWidth={isMajor ? 1.5 : 1}
        strokeLinecap="round"
      />
    );
  }

  return <>{ticks}</>;
}


// ─────────────────────────────────────────────
// SPECTRUM ARC — the colored background track
// Built as gradient SVG linearGradient
// ─────────────────────────────────────────────
function SpectrumArc() {
  const gradId = "mood-spectrum-grad";
  const trackPath = arcPath(CX, CY, RADIUS, START_DEG, END_DEG);

  return (
    <>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse"
          x1={polar(CX, CY, RADIUS, START_DEG).x}
          y1={polar(CX, CY, RADIUS, START_DEG).y}
          x2={polar(CX, CY, RADIUS, END_DEG).x}
          y2={polar(CX, CY, RADIUS, END_DEG).y}
        >
          {SPECTRUM.map(({ stop, hex }) => (
            <stop key={stop} offset={`${stop * 100}%`} stopColor={hex} stopOpacity="0.25" />
          ))}
        </linearGradient>
      </defs>

      {/* Ghost track */}
      <path
        d={trackPath}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={STROKE + 2}
        strokeLinecap="round"
      />

      {/* Faint track border */}
      <path
        d={trackPath}
        fill="none"
        stroke="rgba(124, 92, 191, 0.08)"
        strokeWidth={STROKE + 6}
        strokeLinecap="round"
      />
    </>
  );
}


// ─────────────────────────────────────────────
// ANIMATED FILL ARC
// ─────────────────────────────────────────────
function FillArc({ score, color }) {
  const fillPct    = Math.max(0, Math.min(1, score));
  const fillLength = fillPct * ARC_LENGTH;
  const trackPath  = arcPath(CX, CY, RADIUS, START_DEG, END_DEG);
  const glowId     = "mood-fill-glow";

  return (
    <>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow layer */}
      <motion.path
        d={trackPath}
        fill="none"
        stroke={color.solid}
        strokeWidth={STROKE + 4}
        strokeLinecap="round"
        strokeDasharray={`${ARC_LENGTH}`}
        initial={{ strokeDashoffset: ARC_LENGTH }}
        animate={{ strokeDashoffset: ARC_LENGTH - fillLength }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        opacity={0.25}
        filter={`url(#${glowId})`}
      />

      {/* Main fill */}
      <motion.path
        d={trackPath}
        fill="none"
        stroke={color.solid}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${ARC_LENGTH}`}
        initial={{ strokeDashoffset: ARC_LENGTH }}
        animate={{ strokeDashoffset: ARC_LENGTH - fillLength }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        filter={`url(#${glowId})`}
      />
    </>
  );
}


// ─────────────────────────────────────────────
// NEEDLE + TIP ORB
// ─────────────────────────────────────────────
function Needle({ score, color }) {
  const fillPct  = Math.max(0, Math.min(1, score));
  const needleDeg = START_DEG + fillPct * TOTAL_DEG;
  const tipR      = RADIUS;
  const baseR     = 12;
  const tip       = polar(CX, CY, tipR, needleDeg);
  const base      = polar(CX, CY, -baseR, needleDeg);

  return (
    <motion.g
      initial={{ rotate: START_DEG - needleDeg, originX: `${CX}px`, originY: `${CY}px` }}
      animate={{ rotate: 0 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      style={{ transformOrigin: `${CX}px ${CY}px` }}
    >
      {/* Needle line */}
      <line
        x1={base.x} y1={base.y}
        x2={tip.x}  y2={tip.y}
        stroke={color.solid}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.8}
      />

      {/* Tip orb — pulsing */}
      <motion.circle
        cx={tip.x} cy={tip.y} r={5}
        fill={color.solid}
        animate={{
          r:       [4.5, 6, 4.5],
          opacity: [0.9, 1, 0.9],
          filter:  [
            `drop-shadow(0 0 4px ${color.solid})`,
            `drop-shadow(0 0 10px ${color.solid})`,
            `drop-shadow(0 0 4px ${color.solid})`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Centre pivot */}
      <circle
        cx={CX} cy={CY} r={6}
        fill="var(--ink-2)"
        stroke={color.solid}
        strokeWidth={1.5}
        opacity={0.9}
      />
      <circle cx={CX} cy={CY} r={2.5} fill={color.solid} />
    </motion.g>
  );
}


// ─────────────────────────────────────────────
// TIER LABELS — anchor labels at key positions
// ─────────────────────────────────────────────
function TierLabels() {
  const labels = [
    { pct: 0.00, text: "Dark",        side: "left"   },
    { pct: 0.50, text: "Liminal",     side: "center" },
    { pct: 1.00, text: "Transcendent",side: "right"  },
  ];

  return (
    <>
      {labels.map(({ pct, text, side }) => {
        const deg  = START_DEG + pct * TOTAL_DEG;
        const pos  = polar(CX, CY, RADIUS - 22, deg);
        const anchor = side === "left" ? "end" : side === "right" ? "start" : "middle";

        return (
          <text
            key={text}
            x={pos.x}
            y={pos.y + 4}
            textAnchor={anchor}
            fill="rgba(110,110,154,0.45)"
            fontSize="6.5"
            fontFamily="var(--font-display)"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {text.toUpperCase()}
          </text>
        );
      })}
    </>
  );
}


// ─────────────────────────────────────────────
// SCORE DISPLAY — centre of the gauge
// ─────────────────────────────────────────────
function ScoreDisplay({ score, emoji, label, color, tierLabel }) {
  const pct = Math.round(score * 100);

  return (
    <div style={{
      position:       "absolute",
      bottom:         "24px",
      left:           "50%",
      transform:      "translateX(-50%)",
      textAlign:      "center",
      width:          "140px",
      pointerEvents:  "none",
    }}>
      {/* Emoji */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          fontSize:     "1.6rem",
          lineHeight:   1,
          marginBottom: "4px",
          filter:       `drop-shadow(0 0 8px ${color.glow})`,
        }}
      >
        {emoji}
      </motion.div>

      {/* Tier label */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        style={{
          fontFamily:    "var(--font-display)",
          fontSize:      "0.62rem",
          fontWeight:    600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color:         color.solid,
          filter:        `drop-shadow(0 0 4px ${color.glow})`,
          marginBottom:  "2px",
          whiteSpace:    "nowrap",
        }}
      >
        {tierLabel}
      </motion.div>

      {/* Mood label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.4 }}
        style={{
          fontFamily:  "var(--font-body)",
          fontStyle:   "italic",
          fontSize:    "0.72rem",
          color:       "var(--star-mid)",
          whiteSpace:  "nowrap",
          overflow:    "hidden",
          textOverflow:"ellipsis",
          maxWidth:    "140px",
        }}
      >
        {label}
      </motion.div>
    </div>
  );
}


// ─────────────────────────────────────────────
// PERCENTAGE COUNTER — counts up on mount
// ─────────────────────────────────────────────
function PctCounter({ score, color }) {
  const [displayed, setDisplayed] = useState(0);
  const target = Math.round(score * 100);

  useEffect(() => {
    let start     = 0;
    const step    = Math.ceil(target / 40);
    const timer   = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplayed(start);
      if (start >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      style={{
        position:   "absolute",
        top:        "32px",
        right:      "28px",
        textAlign:  "right",
      }}
    >
      <span style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "1.1rem",
        fontWeight:    400,
        color:         color.solid,
        letterSpacing: "0.02em",
        filter:        `drop-shadow(0 0 6px ${color.glow})`,
      }}>
        {displayed}
      </span>
      <span style={{
        fontFamily:  "var(--font-mono)",
        fontSize:    "0.55rem",
        color:       "var(--star-dim)",
        marginLeft:  "1px",
      }}>
        %
      </span>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// DESCRIPTION PANEL
// ─────────────────────────────────────────────
function DescriptionPanel({ description, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.5 }}
      style={{
        marginTop:     "12px",
        padding:       "10px 14px",
        background:    color.glowSoft,
        border:        `1px solid ${color.glow}`,
        borderColor:   color.glow.replace("0.45", "0.2"),
        borderRadius:  "var(--radius-md)",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Left accent */}
      <div style={{
        position:   "absolute",
        left:       0, top: 0, bottom: 0,
        width:      "2px",
        background: color.solid,
        opacity:    0.5,
      }} />

      <p style={{
        fontFamily:  "var(--font-body)",
        fontStyle:   "italic",
        fontSize:    "0.78rem",
        lineHeight:  1.65,
        color:       "var(--star-full)",
        margin:      0,
        paddingLeft: "10px",
      }}>
        {description}
      </p>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// SPECTRUM BAR — thin horizontal bar below gauge
// showing the full emotional range with marker
// ─────────────────────────────────────────────
function SpectrumBar({ score }) {
  const pct   = Math.max(0, Math.min(1, score)) * 100;

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{
        position:     "relative",
        height:       "4px",
        borderRadius: "var(--radius-full)",
        background:   `linear-gradient(90deg, ${
          SPECTRUM.map((s) => `${s.hex} ${s.stop * 100}%`).join(", ")
        })`,
        opacity:      0.4,
        overflow:     "visible",
      }}>
        {/* Marker */}
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{
            position:     "absolute",
            top:          "50%",
            transform:    "translate(-50%, -50%)",
            width:        "10px",
            height:       "10px",
            borderRadius: "50%",
            background:   interpolateColor(score).solid,
            border:       "1.5px solid rgba(255,255,255,0.5)",
            boxShadow:    `0 0 8px ${interpolateColor(score).glow}`,
          }}
        />
      </div>

      {/* Scale labels */}
      <div style={{
        display:        "flex",
        justifyContent: "space-between",
        marginTop:      "5px",
      }}>
        {["Shadow", "Twilight", "Liminal", "Luminous", "Transcendent"].map((l) => (
          <span key={l} style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.5rem",
            letterSpacing: "0.06em",
            color:         "rgba(110,110,154,0.35)",
            textTransform: "uppercase",
          }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// AMBIENT GLOW — background radial glow
// that matches the current mood color
// ─────────────────────────────────────────────
function AmbientGlow({ color }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 1 }}
      style={{
        position:     "absolute",
        inset:        0,
        borderRadius: "inherit",
        background:   `radial-gradient(ellipse 70% 50% at 50% 30%, ${color.glowSoft}, transparent)`,
        pointerEvents:"none",
        zIndex:       0,
      }}
    />
  );
}


// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function MoodMeter({
  score       = 0.5,
  label       = "Unknown",
  tier        = "liminal",
  tierLabel   = "Liminal",
  emoji       = "🌗",
  description,
}) {
  const clampedScore = Math.max(0, Math.min(1, score));
  const color        = interpolateColor(clampedScore);
  const desc         = description ?? getMoodDescription(clampedScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1   }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background:    "rgba(8, 8, 24, 0.65)",
        backdropFilter:"blur(20px)",
        border:        "1px solid rgba(124, 92, 191, 0.2)",
        borderRadius:  "var(--radius-lg)",
        padding:       "clamp(16px, 3vw, 24px)",
        position:      "relative",
        overflow:      "hidden",
        borderColor:   color.glow.replace("0.45", "0.25"),
      }}
    >
      <AmbientGlow color={color} />

      {/* Header */}
      <div style={{
        position: "relative",
        zIndex:   1,
        display:  "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "4px",
      }}>
        <div className="label-oracle">
          Emotional Signature
        </div>
        <PctCounter score={clampedScore} color={color} />
      </div>

      {/* SVG Gauge */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <svg
          width="100%"
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE * 0.72}`}
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Spectrum background arc */}
          <SpectrumArc />

          {/* Tick marks */}
          <TickMarks />

          {/* Tier labels */}
          <TierLabels />

          {/* Animated fill arc */}
          <FillArc score={clampedScore} color={color} />

          {/* Needle */}
          <Needle score={clampedScore} color={color} />
        </svg>

        {/* Score display overlaid in gauge centre */}
        <ScoreDisplay
          score={clampedScore}
          emoji={emoji}
          label={label}
          color={color}
          tierLabel={tierLabel}
        />
      </div>

      {/* Spectrum bar */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <SpectrumBar score={clampedScore} />
      </div>

      {/* Description */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <DescriptionPanel description={desc} color={color} />
      </div>
    </motion.div>
  );
}