// ─────────────────────────────────────────────
// ONEIROS — formatAnalysis.js
// The bridge between raw API data and
// everything the UI needs to render.
// Pure functions. Zero side effects.
// ─────────────────────────────────────────────


// ═══════════════════════════════════════════════
// SECTION 1 — SAFETY + NORMALIZATION
// Raw API data is never fully trusted.
// These functions sanitize before anything renders.
// ═══════════════════════════════════════════════

/**
 * Sanitize a string from the API.
 * Trims whitespace, collapses internal runs of
 * whitespace/newlines, strips null/undefined.
 */
export function sanitizeText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value)
      .trim()
      .replace(/\n{3,}/g, "\n\n")     // max 2 consecutive newlines
      .replace(/[ \t]{2,}/g, " ")     // collapse horizontal whitespace
      || fallback;
  }
  
  /**
   * Clamp a number to [min, max]. Returns fallback
   * if value is not a finite number.
   */
  export function clampNumber(value, min, max, fallback = 0) {
    const n = Number(value);
    if (!isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }
  
  /**
   * Normalize a raw API analysis object into a
   * fully safe, fully typed shape the UI can trust.
   * Call this once on every response before storing.
   */
  export function normalizeAnalysis(raw) {
    if (!raw || typeof raw !== "object") return null;
  
    return {
      jungian:    sanitizeText(raw.jungian,    "The Jungian layer remains veiled."),
      freudian:   sanitizeText(raw.freudian,   "The Freudian undercurrents are subtle."),
      symbolic:   sanitizeText(raw.symbolic,   "Symbols weave through this dream like threads."),
      archetypal: sanitizeText(raw.archetypal, "Archetypal forces move beneath the surface."),
      symbols:    normalizeSymbols(raw.symbols),
      mood:       sanitizeText(raw.mood, "Unknown") || "Unknown",
      mood_score: clampNumber(raw.mood_score, 0, 1, 0.5),
      summary:    sanitizeText(raw.summary, "A dream that resists simple interpretation."),
    };
  }
  
  /**
   * Normalize the symbols array.
   * Handles missing fields, wrong types, empty arrays.
   */
  export function normalizeSymbols(raw) {
    if (!Array.isArray(raw) || raw.length === 0) {
      return [{
        name:    "The Dream Itself",
        meaning: "The unconscious speaks in ways that resist easy symbolization.",
      }];
    }
  
    return raw
      .filter((s) => s && typeof s === "object")
      .map((s) => ({
        name:    sanitizeText(s.name,    "Unknown Symbol").slice(0, 100),
        meaning: sanitizeText(s.meaning, "Meaning obscured.").slice(0, 500),
      }))
      .filter((s) => s.name.length > 0);
  }
  
  
  // ═══════════════════════════════════════════════
  // SECTION 2 — MOOD SYSTEM
  // Every dream has an emotional signature.
  // These functions translate mood_score (0–1)
  // into colors, labels, gradients, and icons.
  // ═══════════════════════════════════════════════
  
  /**
   * Mood tier thresholds.
   */
  const MOOD_TIERS = [
    { max: 0.20, key: "abyss",      label: "The Abyss",         emoji: "🕳️" },
    { max: 0.35, key: "shadow",     label: "Shadow Realm",      emoji: "🌑" },
    { max: 0.50, key: "twilight",   label: "Twilight",           emoji: "🌘" },
    { max: 0.60, key: "liminal",    label: "Liminal",            emoji: "🌗" },
    { max: 0.72, key: "ascent",     label: "Ascending",          emoji: "🌓" },
    { max: 0.85, key: "luminous",   label: "Luminous",           emoji: "🌕" },
    { max: 1.01, key: "transcendent",label: "Transcendent",     emoji: "✨" },
  ];
  
  /**
   * Get the mood tier object for a given score.
   */
  export function getMoodTier(score) {
    const s = clampNumber(score, 0, 1, 0.5);
    return MOOD_TIERS.find((t) => s < t.max) ?? MOOD_TIERS[MOOD_TIERS.length - 1];
  }
  
  /**
   * Get the CSS gradient string for the mood meter fill.
   * Interpolates across 3 color anchors:
   * 0.0 → crimson dark  |  0.5 → nebula  |  1.0 → verdant
   */
  export function getMoodGradient(score) {
    const s = clampNumber(score, 0, 1, 0.5);
  
    // Three anchor points
    const anchors = [
      { stop: 0.00, r: 196, g:  40, b:  40 },  // crimson
      { stop: 0.25, r: 140, g:  40, b: 160 },  // deep purple
      { stop: 0.50, r: 124, g:  92, b: 191 },  // nebula violet
      { stop: 0.75, r:  40, g: 140, b: 160 },  // teal
      { stop: 1.00, r:  61, g: 214, b: 140 },  // verdant
    ];
  
    // Find surrounding anchors and interpolate
    let lo = anchors[0], hi = anchors[anchors.length - 1];
    for (let i = 0; i < anchors.length - 1; i++) {
      if (s >= anchors[i].stop && s <= anchors[i + 1].stop) {
        lo = anchors[i];
        hi = anchors[i + 1];
        break;
      }
    }
  
    const t  = lo.stop === hi.stop ? 0 : (s - lo.stop) / (hi.stop - lo.stop);
    const r  = Math.round(lo.r + (hi.r - lo.r) * t);
    const g  = Math.round(lo.g + (hi.g - lo.g) * t);
    const b  = Math.round(lo.b + (hi.b - lo.b) * t);
  
    return {
      // Full gradient for the fill bar
      gradient: `linear-gradient(90deg,
        rgba(${r},${g},${b},0.7) 0%,
        rgba(${r},${g},${b},1.0) 100%
      )`,
      // Solid color for shadows and glows
      solid:  `rgb(${r},${g},${b})`,
      glow:   `rgba(${r},${g},${b},0.4)`,
      // CSS class suffix for static styles
      tier:   getMoodTier(s).key,
      // Percentage for the meter width
      pct:    Math.round(s * 100),
      // Human label
      label:  getMoodTier(s).label,
      emoji:  getMoodTier(s).emoji,
      score:  s,
    };
  }
  
  /**
   * Get a short poetic description of the mood zone.
   */
  export function getMoodDescription(score) {
    const s = clampNumber(score, 0, 1, 0.5);
    if (s <= 0.20) return "A dream from the darkest depths of the unconscious.";
    if (s <= 0.35) return "The shadow self speaks through this dream.";
    if (s <= 0.50) return "Tension and ambiguity define this dreamscape.";
    if (s <= 0.60) return "Caught between worlds — neither dark nor light.";
    if (s <= 0.72) return "The psyche reaches toward resolution and growth.";
    if (s <= 0.85) return "Light breaks through — a dream of clarity and hope.";
    return "A transcendent dream. The unconscious speaks with rare peace.";
  }
  
  
  // ═══════════════════════════════════════════════
  // SECTION 3 — TAB / FRAMEWORK CONFIG
  // Single source of truth for the analysis tabs.
  // Change one object here → everything updates.
  // ═══════════════════════════════════════════════
  
  export const ANALYSIS_TABS = [
    {
      key:         "jungian",
      label:       "Jungian",
      shortLabel:  "Jung",
      icon:        "◈",
      field:       "jungian",
      color:       "var(--nebula-glow)",
      accent:      "rgba(124, 92, 191, 0.15)",
      border:      "rgba(124, 92, 191, 0.35)",
      description: "Shadow, anima/animus, individuation & the collective unconscious",
      thinkers:    ["Carl Jung", "Marie-Louise von Franz", "James Hillman"],
    },
    {
      key:         "freudian",
      label:       "Freudian",
      shortLabel:  "Freud",
      icon:        "⊕",
      field:       "freudian",
      color:       "var(--oracle-glow)",
      accent:      "rgba(196, 144, 10, 0.12)",
      border:      "rgba(196, 144, 10, 0.3)",
      description: "Repressed desires, ego/id/superego dynamics & wish fulfillment",
      thinkers:    ["Sigmund Freud", "Anna Freud", "Jacques Lacan"],
    },
    {
      key:         "symbolic",
      label:       "Symbolic",
      shortLabel:  "Symbol",
      icon:        "✦",
      field:       "symbolic",
      color:       "var(--star-glow)",
      accent:      "rgba(212, 212, 238, 0.08)",
      border:      "rgba(212, 212, 238, 0.2)",
      description: "Universal & cultural symbol meanings woven through your dream",
      thinkers:    ["Gaston Bachelard", "Gilbert Durand", "Mircea Eliade"],
    },
    {
      key:         "archetypal",
      label:       "Archetypal",
      shortLabel:  "Archetype",
      icon:        "⟁",
      field:       "archetypal",
      color:       "var(--verdant-glow)",
      accent:      "rgba(61, 214, 140, 0.08)",
      border:      "rgba(61, 214, 140, 0.2)",
      description: "Mythological patterns — hero, shadow, trickster, great mother",
      thinkers:    ["Joseph Campbell", "Clarissa Pinkola Estés", "Robert A. Johnson"],
    },
  ];
  
  /**
   * Get tab config by key.
   */
  export function getTabConfig(key) {
    return ANALYSIS_TABS.find((t) => t.key === key) ?? ANALYSIS_TABS[0];
  }
  
  
  // ═══════════════════════════════════════════════
  // SECTION 4 — TEXT PROCESSING
  // Analysis text comes back as dense paragraphs.
  // These functions make it beautiful on screen.
  // ═══════════════════════════════════════════════
  
  /**
   * Split analysis text into sentences for
   * staggered typewriter animation.
   * Handles: "Dr. Jung said..." and "e.g., this" correctly.
   */
  export function splitIntoSentences(text) {
    if (!text) return [];
  
    // Split on ". " | "! " | "? " but not on abbreviations
    // like "Dr." "e.g." "i.e." "vs." "Mr." "Mrs." "etc."
    const abbrevPattern = /\b(Dr|Mr|Mrs|Ms|Prof|St|vs|etc|e\.g|i\.e|cf|ca|approx)\./gi;
    const placeholder   = "ABBREV_PLACEHOLDER";
  
    const protected_ = text.replace(abbrevPattern, (m) => m.replace(".", placeholder));
    const parts      = protected_.split(/(?<=[.!?])\s+(?=[A-Z"'])/);
  
    return parts
      .map((s) => s.replace(new RegExp(placeholder, "g"), ".").trim())
      .filter((s) => s.length > 0);
  }
  
  /**
   * Split text into paragraphs.
   * Two or more newlines = paragraph break.
   */
  export function splitIntoParagraphs(text) {
    if (!text) return [];
    return text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
  
  /**
   * Extract the first N sentences as a teaser/preview.
   */
  export function extractTeaser(text, sentenceCount = 2) {
    const sentences = splitIntoSentences(text);
    return sentences.slice(0, sentenceCount).join(" ");
  }
  
  /**
   * Count words in a string.
   */
  export function countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  
  /**
   * Estimate reading time in seconds.
   * Average reading speed ≈ 238 words/min for complex text.
   */
  export function estimateReadTime(text) {
    const words = countWords(text);
    const secs  = Math.ceil((words / 238) * 60);
    if (secs < 60) return `${secs}s read`;
    return `${Math.ceil(secs / 60)}m read`;
  }
  
  /**
   * Truncate to maxChars at a word boundary.
   */
  export function truncate(text, maxChars = 160) {
    if (!text || text.length <= maxChars) return text;
    return text.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
  }
  
  /**
   * Highlight occurrences of a search term in text.
   * Returns array of { text, highlight: bool } chunks
   * for rendering in JSX.
   */
  export function highlightMatches(text, query) {
    if (!query?.trim()) return [{ text, highlight: false }];
  
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex   = new RegExp(`(${escaped})`, "gi");
    const parts   = text.split(regex);
  
    return parts.map((part) => ({
      text:      part,
      highlight: regex.test(part),
    }));
  }
  
  
  // ═══════════════════════════════════════════════
  // SECTION 5 — SYMBOL PROCESSING
  // Symbols are the jewels of the analysis.
  // These helpers make them shine.
  // ═══════════════════════════════════════════════
  
  /**
   * Assign a visual "tier" to a symbol based on
   * how psychologically rich its meaning is
   * (proxy: length of meaning text).
   */
  export function symbolTier(symbol) {
    const len = symbol.meaning?.length ?? 0;
    if (len > 300) return "legendary";
    if (len > 180) return "rare";
    if (len > 80)  return "uncommon";
    return "common";
  }
  
  /**
   * Assign a color accent to each symbol by index.
   * Cycles through nebula, oracle, crimson, verdant, star.
   */
  const SYMBOL_COLORS = [
    { color: "var(--nebula-glow)",  accent: "rgba(124, 92, 191, 0.15)", border: "rgba(124, 92, 191, 0.35)" },
    { color: "var(--oracle-glow)",  accent: "rgba(196, 144, 10, 0.15)",  border: "rgba(196, 144, 10, 0.35)"  },
    { color: "var(--crimson-glow)", accent: "rgba(196, 40, 40, 0.12)",   border: "rgba(196, 40, 40, 0.3)"    },
    { color: "var(--verdant-glow)", accent: "rgba(61, 214, 140, 0.12)",  border: "rgba(61, 214, 140, 0.3)"   },
    { color: "var(--star-glow)",    accent: "rgba(212, 212, 238, 0.1)",  border: "rgba(212, 212, 238, 0.25)" },
  ];
  
  export function symbolColor(index) {
    return SYMBOL_COLORS[index % SYMBOL_COLORS.length];
  }
  
  /**
   * Format the full symbols list with metadata
   * attached — color, tier, index. Ready to map.
   */
  export function formatSymbols(symbols) {
    return normalizeSymbols(symbols).map((s, i) => ({
      ...s,
      index: i,
      tier:  symbolTier(s),
      ...symbolColor(i),
    }));
  }
  
  
  // ═══════════════════════════════════════════════
  // SECTION 6 — DATE + TIME FORMATTING
  // ═══════════════════════════════════════════════
  
  /**
   * Format a date as a relative label.
   * "Today", "Yesterday", "3 days ago", "Mar 12"
   */
  export function formatDateLabel(isoString) {
    if (!isoString) return "";
    const date  = new Date(isoString);
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff  = Math.round((today - d) / 86_400_000);
  
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff <  7)  return `${diff} days ago`;
    if (diff < 30)  return `${Math.floor(diff / 7)} weeks ago`;
  
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  
  /**
   * Format a date as a full readable string.
   * "Saturday, April 5 · 3:42 AM"
   */
  export function formatFullDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric"
    });
    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit"
    });
    return `${datePart} · ${timePart}`;
  }
  
  /**
   * Format elapsed milliseconds to a short label.
   * 2300 → "2s"  |  75000 → "1m 15s"
   */
  export function formatElapsed(ms) {
    if (!ms || ms < 0) return null;
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  }
  
  
  // ═══════════════════════════════════════════════
  // SECTION 7 — SHARE CARD FORMATTING
  // The share card is the viral element.
  // This builds the text layout for html2canvas.
  // ═══════════════════════════════════════════════
  
  /**
   * Build the complete share card data object.
   * Everything the ShareCard component needs.
   */
  export function buildShareCard(dreamText, analysis) {
    if (!analysis) return null;
  
    const norm     = normalizeAnalysis(analysis);
    const mood     = getMoodGradient(norm.mood_score);
    const symbols  = formatSymbols(norm.symbols).slice(0, 4); // top 4 on card
    const teaser   = extractTeaser(norm.jungian, 2);
  
    return {
      dreamSnippet: truncate(dreamText, 180),
      summary:      norm.summary,
      mood: {
        label:    norm.mood,
        tier:     mood.tier,
        emoji:    mood.emoji,
        pct:      mood.pct,
        gradient: mood.gradient,
        glow:     mood.glow,
      },
      symbols,
      jungianTeaser: teaser,
      generatedAt:   new Date().toLocaleString("en-US", {
        month:  "short",
        day:    "numeric",
        year:   "numeric",
        hour:   "numeric",
        minute: "2-digit",
      }),
      branding: "ONEIROS · Dream Interpreter",
    };
  }
  
  
  // ═══════════════════════════════════════════════
  // SECTION 8 — FULL FORMATTED ANALYSIS
  // The one function to call them all.
  // Returns everything the UI needs in one shot.
  // ═══════════════════════════════════════════════
  
  /**
   * Master formatter — takes raw API response,
   * returns a fully enriched object ready for
   * every component in the app.
   */
  export function formatAnalysis(raw, dreamText = "") {
    const norm    = normalizeAnalysis(raw);
    if (!norm) return null;
  
    const mood    = getMoodGradient(norm.mood_score);
    const symbols = formatSymbols(norm.symbols);
  
    // Per-tab enriched data
    const tabs = ANALYSIS_TABS.map((tab) => ({
      ...tab,
      content:    norm[tab.field],
      sentences:  splitIntoSentences(norm[tab.field]),
      paragraphs: splitIntoParagraphs(norm[tab.field]),
      teaser:     extractTeaser(norm[tab.field]),
      readTime:   estimateReadTime(norm[tab.field]),
      wordCount:  countWords(norm[tab.field]),
    }));
  
    return {
      // Raw normalized data
      raw: norm,
  
      // Mood
      mood: {
        label:       norm.mood,
        score:       norm.mood_score,
        pct:         mood.pct,
        tier:        mood.tier,
        tierLabel:   mood.label,
        emoji:       mood.emoji,
        gradient:    mood.gradient,
        solid:       mood.solid,
        glow:        mood.glow,
        description: getMoodDescription(norm.mood_score),
      },
  
      // Summary
      summary: norm.summary,
  
      // Symbols — fully decorated
      symbols,
  
      // Analysis tabs — fully enriched
      tabs,
  
      // Share card data
      shareCard: buildShareCard(dreamText, norm),
  
      // Meta
      meta: {
        totalWordCount: tabs.reduce((s, t) => s + t.wordCount, 0),
        symbolCount:    symbols.length,
        generatedAt:    new Date().toISOString(),
      },
    };
  }