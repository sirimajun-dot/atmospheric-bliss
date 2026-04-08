# 🌤️ Atmospheric Bliss (White Bliss Hub v5.0)

## 📌 Project Overview
**Atmospheric Bliss** is a premium, AI-driven situational awareness dashboard and intelligence stream. It dynamically interprets global events (Geopolitics, Cyber, Climate, AI) using Gemini 1.5 Pro and renders them via an interactive, pristine glassmorphism UI.

## 🏗️ Core Architecture (The Single Hub)
We use a **Unified Express + Vite Architecture** running strictly on **Port 3333**.
- **Backend (`server.ts`):** Acts as the primary brain. It manages the global state in-memory (`globalState`), queries the Gemini AI SDK for intelligence synthesis, and features an **Absolute API Guard** (`/api/*`) that intercepts logic to prevent Vite from returning incorrect HTML.
- **Frontend (`React` + `Vite`):** The View layer. Uses `useRiskData.ts` to poll `/api/state` with active anti-cache parameters.
- **Why Port 3333?:** To avoid persistent HMR and process conflict errors on Port 3000. 

## 🎨 Design System (White Bliss)
- **Concept:** Bright, pristine, premium, transparent (Glassmorphism).
- **Core CSS (`index.css`):**
  - Uses Tailwind CSS v4 styling standards.
  - Custom variables mapped in `@theme` (e.g., `--shadow-soft`).
  - Strict avoidance of legacy dot-notation class definitions directly mapping to `@apply` to prevent Vite crash loops.
- **Colors:**
  - Background is soft pastel radials (Lightness: 92-95%) mimicking lavender, sky blue, and soft rose to keep the top-edge extremely soft and bright.
  - White glass panes with varying opacity (`bg-white/40`, `bg-white/60`).

## 🌍 Bilingual Intelligence
- Data from the backend emits bilingual objects: `label: { th: 'ปัญญาประดิษฐ์', en: 'AI' }`.
- **Frontend Law:** React components MUST resolve these objects into strings strictly using `object[language]` before rendering to prevent fatal `Objects are not valid as a React child` errors.

## 🚀 Deployment Law
- The code is set to run `.dist/` static files internally ONLY during physical deployment (`isProduction = true`).
- For local development, **always use `npm run dev`**. The HMR port strictly scrambles its binding (via `hmr: { port: 3334 + random }`) to circumvent ghost processes.

## 📡 External feeds (implemented in `fetchDataFeeds`)

| `connectionStatus` label | Fetched? | Notes |
|--------------------------|----------|--------|
| USGS Earthquake API | Yes | GeoJSON `all_hour` |
| CISA KEV (API) | Yes | JSON feed |
| GDACS (UN/EU) | Yes | RSS (may fail behind some networks) |
| Open-Meteo (weather/air · Bangkok) | Yes | Forecast + air-quality; Bangkok coords — not a direct TMD API |
| All other names in `AUTHORIZED_SOURCES` | `idle` | Placeholder until wired; see `DATA_LICENSE_AUDIT.md` before adding |

Optional env: **`INSIGHTS_BUFFER_MAX`** (10–500, default 50) caps `globalState.insights` and is echoed as **`insightsBufferMax`** on `/api/state`.

## 💂‍♂️ AI System Prompt Defaults
*When continuing work on this project, adhere strictly to the following parameters:*
1. Maintain the "Visual Alchemist" aesthetic (Light, Airy, White Bliss).
2. Never revert the API port logic back to Vite's default proxy configuration.
3. Validate all variables for bilingual objects before passing to Recharts or generic text nodes.
