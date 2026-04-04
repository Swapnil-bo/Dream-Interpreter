import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ─────────────────────────────────────────────
// CONSTELLATION BACKGROUND — pure JS, no lib
// Spawns star particles into the DOM on load
// ─────────────────────────────────────────────
function spawnConstellation() {
  const container = document.createElement("div");
  container.className = "constellation";
  container.setAttribute("aria-hidden", "true");

  const STAR_COUNT = 80;

  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement("div");
    star.className = "star-particle";

    const size   = Math.random() * 2.5 + 0.5;         // 0.5px – 3px
    const x      = Math.random() * 100;                // % across
    const y      = Math.random() * 100;                // % down
    const dur    = (Math.random() * 4 + 2).toFixed(1); // 2s – 6s twinkle
    const delay  = (Math.random() * 6).toFixed(1);     // 0s – 6s stagger
    const drift  = (Math.random() * 8 + 4).toFixed(1); // 4s – 12s drift
    const opacity = (Math.random() * 0.4 + 0.1).toFixed(2);

    // Occasionally make a slightly larger, oracle-gold star
    const isGold = Math.random() < 0.12;

    Object.assign(star.style, {
      width:     `${size}px`,
      height:    `${size}px`,
      left:      `${x}%`,
      top:       `${y}%`,
      background: isGold
        ? `rgba(232, 184, 75, ${opacity})`
        : `rgba(196, 196, 220, ${opacity})`,
      boxShadow: isGold
        ? `0 0 ${size * 3}px rgba(232, 184, 75, 0.4)`
        : `0 0 ${size * 2}px rgba(167, 141, 232, 0.3)`,
      "--duration": `${dur}s`,
      "--delay":    `${delay}s`,
      animation: [
        `star-twinkle ${dur}s ${delay}s ease-in-out infinite alternate`,
        `star-drift   ${drift}s ${delay}s ease-in-out infinite`,
      ].join(", "),
    });

    container.appendChild(star);
  }

  // Insert before everything else in body
  document.body.insertBefore(container, document.body.firstChild);
}


// ─────────────────────────────────────────────
// DOCUMENT META — set title + theme-color
// (index.html is bare, we own meta from JS)
// ─────────────────────────────────────────────
function initDocumentMeta() {
  document.title = "ONEIROS — Dream Interpreter";

  const metaTheme = document.createElement("meta");
  metaTheme.name    = "theme-color";
  metaTheme.content = "#04040f";
  document.head.appendChild(metaTheme);

  const metaDesc = document.createElement("meta");
  metaDesc.name    = "description";
  metaDesc.content =
    "ONEIROS — A local-first AI dream interpreter. " +
    "Jungian, Freudian & symbolic analysis powered by qwen2.5:7b.";
  document.head.appendChild(metaDesc);
}


// ─────────────────────────────────────────────
// BOOT SEQUENCE
// ─────────────────────────────────────────────
function boot() {
  initDocumentMeta();
  spawnConstellation();

  const container = document.getElementById("root");

  if (!container) {
    console.error("[ONEIROS] Root element #root not found. Cannot mount.");
    return;
  }

  const root = createRoot(container);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Log the ONEIROS banner to console — a small signature
  console.log(
    "%c 🌙 ONEIROS ",
    "background:#0d0d24;color:#a78de8;font-size:18px;" +
    "font-family:'Cinzel',serif;padding:8px 16px;" +
    "border:1px solid rgba(124,92,191,0.4);border-radius:4px;",
  );
  console.log(
    "%cDream Interpreter — powered by qwen2.5:7b",
    "color:#6e6e9a;font-size:11px;font-family:monospace;"
  );
}

boot();