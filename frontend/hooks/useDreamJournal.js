import { create } from "zustand";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const STORAGE_KEY   = "oneiros:journal:v1";
const MAX_ENTRIES   = 100;       // cap so localStorage never bloats
const CURRENT_VERSION = 1;       // schema version for future migrations


// ─────────────────────────────────────────────
// HELPERS — localStorage I/O with full safety
// ─────────────────────────────────────────────

/** Read raw journal data from localStorage. Never throws. */
function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate it's the shape we expect
    if (!parsed || !Array.isArray(parsed.entries)) return null;
    return parsed;
  } catch {
    console.warn("[ONEIROS Journal] localStorage read failed — returning null.");
    return null;
  }
}

/** Write journal data to localStorage. Never throws. Returns success bool. */
function writeStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    // QuotaExceededError — storage full
    console.error("[ONEIROS Journal] localStorage write failed:", e.message);
    return false;
  }
}

/** Generate a collision-resistant ID without crypto dependency. */
function generateId() {
  return `dream_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Deep clone via JSON — safe for our plain data structures. */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Compute word count from a string. */
function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Format a Date or ISO string into a human label like "Today", "Yesterday", "Mar 12". */
function formatDateLabel(isoString) {
  const date  = new Date(isoString);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Compute mood category from score float. */
function moodCategory(score) {
  if (score <= 0.33) return "dark";
  if (score <= 0.66) return "ambivalent";
  return "peaceful";
}

/** Truncate dream text to a preview snippet. */
function dreamSnippet(text, maxChars = 120) {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
}


// ─────────────────────────────────────────────
// SCHEMA MIGRATION — future-proof the journal
// ─────────────────────────────────────────────

/**
 * If we ever change the entry shape in v2, v3, etc.,
 * this function handles upgrading old stored data.
 * Currently just validates v1 shape.
 */
function migrateSchema(stored) {
  const version = stored.version ?? 0;

  // v0 → v1: no migration needed yet, just stamp version
  if (version < 1) {
    stored.version = CURRENT_VERSION;
    stored.entries = (stored.entries ?? []).map((e) => ({
      id:          e.id          ?? generateId(),
      dreamText:   e.dreamText   ?? e.dream ?? "",
      analysis:    e.analysis    ?? null,
      createdAt:   e.createdAt   ?? new Date().toISOString(),
      updatedAt:   e.updatedAt   ?? new Date().toISOString(),
      tags:        e.tags        ?? [],
      starred:     e.starred     ?? false,
      wordCount:   e.wordCount   ?? wordCount(e.dreamText ?? e.dream ?? ""),
      moodScore:   e.moodScore   ?? e.analysis?.mood_score ?? 0.5,
      moodLabel:   e.moodLabel   ?? e.analysis?.mood ?? "Unknown",
    }));
  }

  return stored;
}


// ─────────────────────────────────────────────
// INITIAL STATE LOADER
// ─────────────────────────────────────────────
function loadInitialState() {
  const stored = readStorage();

  if (!stored) {
    return {
      entries:     [],
      version:     CURRENT_VERSION,
      totalDreams: 0,
    };
  }

  const migrated = migrateSchema(clone(stored));
  return {
    entries:     migrated.entries,
    version:     migrated.version,
    totalDreams: migrated.entries.length,
  };
}


// ─────────────────────────────────────────────
// ZUSTAND STORE
// ─────────────────────────────────────────────
export const useDreamJournal = create((set, get) => ({

  // ── State ──
  ...loadInitialState(),
  selectedId:  null,    // currently expanded entry
  searchQuery: "",      // live search filter
  sortBy:      "newest", // "newest" | "oldest" | "mood_dark" | "mood_light" | "starred"
  filterMood:  "all",   // "all" | "dark" | "ambivalent" | "peaceful"

  // ────────────────────────────────────────────
  // PRIVATE — persist entire state to storage
  // ────────────────────────────────────────────
  _persist() {
    const { entries, version } = get();
    writeStorage({ entries, version, savedAt: new Date().toISOString() });
  },


  // ────────────────────────────────────────────
  // ADD ENTRY — called after successful analysis
  // ────────────────────────────────────────────
  addEntry(dreamText, analysis) {
    const now = new Date().toISOString();

    const newEntry = {
      id:        generateId(),
      dreamText: dreamText.trim(),
      analysis:  clone(analysis),
      createdAt: now,
      updatedAt: now,
      tags:      [],
      starred:   false,
      wordCount: wordCount(dreamText),
      moodScore: analysis.mood_score ?? 0.5,
      moodLabel: analysis.mood       ?? "Unknown",
    };

    set((state) => {
      // Prepend new entry, cap at MAX_ENTRIES
      const entries = [newEntry, ...state.entries].slice(0, MAX_ENTRIES);
      return { entries, totalDreams: entries.length };
    });

    get()._persist();
    return newEntry.id;
  },


  // ────────────────────────────────────────────
  // DELETE ENTRY
  // ────────────────────────────────────────────
  deleteEntry(id) {
    set((state) => {
      const entries = state.entries.filter((e) => e.id !== id);
      const selectedId = state.selectedId === id ? null : state.selectedId;
      return { entries, selectedId, totalDreams: entries.length };
    });
    get()._persist();
  },


  // ────────────────────────────────────────────
  // TOGGLE STAR
  // ────────────────────────────────────────────
  toggleStar(id) {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, starred: !e.starred, updatedAt: new Date().toISOString() }
          : e
      ),
    }));
    get()._persist();
  },


  // ────────────────────────────────────────────
  // ADD TAG
  // ────────────────────────────────────────────
  addTag(id, tag) {
    const clean = tag.trim().toLowerCase().slice(0, 30);
    if (!clean) return;

    set((state) => ({
      entries: state.entries.map((e) => {
        if (e.id !== id) return e;
        if (e.tags.includes(clean)) return e; // no dupes
        return {
          ...e,
          tags:      [...e.tags, clean],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    get()._persist();
  },


  // ────────────────────────────────────────────
  // REMOVE TAG
  // ────────────────────────────────────────────
  removeTag(id, tag) {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              tags:      e.tags.filter((t) => t !== tag),
              updatedAt: new Date().toISOString(),
            }
          : e
      ),
    }));
    get()._persist();
  },


  // ────────────────────────────────────────────
  // SELECT / DESELECT
  // ────────────────────────────────────────────
  selectEntry(id) {
    set({ selectedId: id });
  },

  clearSelection() {
    set({ selectedId: null });
  },


  // ────────────────────────────────────────────
  // SEARCH
  // ────────────────────────────────────────────
  setSearchQuery(query) {
    set({ searchQuery: query });
  },

  clearSearch() {
    set({ searchQuery: "" });
  },


  // ────────────────────────────────────────────
  // SORT
  // ────────────────────────────────────────────
  setSortBy(sortBy) {
    set({ sortBy });
  },


  // ────────────────────────────────────────────
  // FILTER BY MOOD
  // ────────────────────────────────────────────
  setFilterMood(filterMood) {
    set({ filterMood });
  },


  // ────────────────────────────────────────────
  // COMPUTED — filtered + sorted + searched list
  // This is the main list the UI renders from.
  // ────────────────────────────────────────────
  getFilteredEntries() {
    const { entries, searchQuery, sortBy, filterMood } = get();
    let result = [...entries];

    // ── Filter by mood ──
    if (filterMood !== "all") {
      result = result.filter(
        (e) => moodCategory(e.moodScore) === filterMood
      );
    }

    // ── Filter by search query ──
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.dreamText.toLowerCase().includes(q)  ||
          e.moodLabel.toLowerCase().includes(q)  ||
          e.tags.some((t) => t.includes(q))      ||
          e.analysis?.summary?.toLowerCase().includes(q)
      );
    }

    // ── Sort ──
    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "mood_dark":
        result.sort((a, b) => a.moodScore - b.moodScore);
        break;
      case "mood_light":
        result.sort((a, b) => b.moodScore - a.moodScore);
        break;
      case "starred":
        result.sort((a, b) => Number(b.starred) - Number(a.starred));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return result;
  },


  // ────────────────────────────────────────────
  // COMPUTED — single entry by ID
  // ────────────────────────────────────────────
  getEntryById(id) {
    return get().entries.find((e) => e.id === id) ?? null;
  },


  // ────────────────────────────────────────────
  // COMPUTED — currently selected entry object
  // ────────────────────────────────────────────
  getSelectedEntry() {
    const { selectedId, entries } = get();
    if (!selectedId) return null;
    return entries.find((e) => e.id === selectedId) ?? null;
  },


  // ────────────────────────────────────────────
  // COMPUTED — journal statistics
  // Rich data for a future "Journal Insights" panel
  // ────────────────────────────────────────────
  getStats() {
    const { entries } = get();
    if (!entries.length) return null;

    const totalWords   = entries.reduce((s, e) => s + e.wordCount, 0);
    const avgMood      = entries.reduce((s, e) => s + e.moodScore, 0) / entries.length;
    const starred      = entries.filter((e) => e.starred).length;
    const darkDreams   = entries.filter((e) => moodCategory(e.moodScore) === "dark").length;
    const lightDreams  = entries.filter((e) => moodCategory(e.moodScore) === "peaceful").length;
    const ambivDreams  = entries.filter((e) => moodCategory(e.moodScore) === "ambivalent").length;

    // Most frequent symbol across all dreams
    const symbolFreq = {};
    entries.forEach((e) => {
      (e.analysis?.symbols ?? []).forEach((s) => {
        const name = s.name?.toLowerCase();
        if (name) symbolFreq[name] = (symbolFreq[name] ?? 0) + 1;
      });
    });

    const topSymbols = Object.entries(symbolFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Most used tags
    const tagFreq = {};
    entries.forEach((e) => {
      e.tags.forEach((t) => {
        tagFreq[t] = (tagFreq[t] ?? 0) + 1;
      });
    });

    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));

    // Streak — consecutive days with at least one dream
    const dreamDays = new Set(
      entries.map((e) => new Date(e.createdAt).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dreamDays.has(d.toDateString())) {
        streak++;
      } else {
        break;
      }
    }

    return {
      totalEntries: entries.length,
      totalWords,
      avgWordsPerDream: Math.round(totalWords / entries.length),
      avgMoodScore:     Math.round(avgMood * 100) / 100,
      avgMoodCategory:  moodCategory(avgMood),
      starred,
      darkDreams,
      lightDreams,
      ambivDreams,
      topSymbols,
      topTags,
      streak,
      firstDreamDate: entries[entries.length - 1]?.createdAt ?? null,
      lastDreamDate:  entries[0]?.createdAt ?? null,
    };
  },


  // ────────────────────────────────────────────
  // EXPORT — download journal as JSON file
  // ────────────────────────────────────────────
  exportJournal() {
    const { entries, version } = get();
    const data = JSON.stringify(
      { version, exportedAt: new Date().toISOString(), entries },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `oneiros-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },


  // ────────────────────────────────────────────
  // IMPORT — load journal from JSON file
  // Returns { success, count, error }
  // ────────────────────────────────────────────
  async importJournal(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data.entries)) {
        return { success: false, error: "Invalid journal file format." };
      }

      const migrated = migrateSchema(clone(data));
      const incoming = migrated.entries;

      set((state) => {
        // Merge — deduplicate by ID
        const existingIds = new Set(state.entries.map((e) => e.id));
        const newEntries  = incoming.filter((e) => !existingIds.has(e.id));
        const merged      = [...newEntries, ...state.entries].slice(0, MAX_ENTRIES);
        return { entries: merged, totalDreams: merged.length };
      });

      get()._persist();
      return { success: true, count: incoming.length };

    } catch (e) {
      return { success: false, error: e.message };
    }
  },


  // ────────────────────────────────────────────
  // CLEAR ALL — nuclear option
  // ────────────────────────────────────────────
  clearAll() {
    set({ entries: [], selectedId: null, totalDreams: 0 });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

}));


// ─────────────────────────────────────────────
// NAMED SELECTOR HOOKS — prevent unnecessary
// re-renders by subscribing to slices only
// ─────────────────────────────────────────────

/** Just the entry list — for the journal sidebar. */
export const useJournalEntries = () =>
  useDreamJournal((s) => s.getFilteredEntries());

/** Just the stats object — for the insights panel. */
export const useJournalStats = () =>
  useDreamJournal((s) => s.getStats());

/** Just the selected entry — for the detail view. */
export const useSelectedEntry = () =>
  useDreamJournal((s) => s.getSelectedEntry());

/** Just the search/filter/sort state — for the toolbar. */
export const useJournalControls = () =>
  useDreamJournal((s) => ({
    searchQuery: s.searchQuery,
    sortBy:      s.sortBy,
    filterMood:  s.filterMood,
    setSearchQuery: s.setSearchQuery,
    clearSearch:    s.clearSearch,
    setSortBy:      s.setSortBy,
    setFilterMood:  s.setFilterMood,
  }));

/** Just the entry count — for badges/indicators. */
export const useJournalCount = () =>
  useDreamJournal((s) => s.totalDreams);


// ─────────────────────────────────────────────
// UTILITY EXPORTS — used by components directly
// ─────────────────────────────────────────────
export { formatDateLabel, dreamSnippet, moodCategory, wordCount };