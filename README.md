# PSG Performance — Suivi du cycle menstruel

A two-screen web app for daily athlete menstrual-cycle and symptom tracking, built on the PSG Performance design system.

- **Check-in du jour** — daily entries for Menstruations / Mal de tête / Mal de ventre / Sensation de fatigue, each with a Oui/Non presence toggle, a 1–10 severity chip scale, and an optional comment.
- **Calendrier** — a one-column-per-day, one-row-per-symptom heatmap for the current month, cells shaded on the sequential blue severity ramp, with a per-row average.

## Status

Static HTML/CSS/JS, no build step, no backend. State lives in memory only and resets on reload — there is **no data layer yet**: nothing is persisted, and the per-player access control described in the sidebar ("Accès individuel... visibles par la joueuse et le staff médical") is not enforced by this app; it's UI copy only. Add persistence and real auth before using this with real athlete health data.

## Run locally

No install needed — it's plain static files.

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Structure

```
index.html          shell: sidebar, header, both screens
css/tokens.css       PSG design tokens (colors, type, radius, elevation) + self-hosted fonts
css/app.css          app layout and components
js/app.js            state + rendering (vanilla JS, no framework)
fonts/                Geist, Geist Mono, Virage Semibold (self-hosted, PSG brand assets)
assets/                PSG crest
```

## Design source

Derived pixel-for-pixel from the Claude Design handoff (`project/Cycle Monitoring.dc.html`) for the "Athlete Cycle Monitoring Framework" project — see that project's `chats/chat1.md` for design intent.
