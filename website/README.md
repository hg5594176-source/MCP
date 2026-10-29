# Agent Safety Gate — Website

A cinematic, scroll-driven 3D explainer website for **Agent Safety Gate**, built with React + Vite + TypeScript, Three.js via `@react-three/fiber`, GSAP + ScrollTrigger, Lenis, and Tailwind CSS.

> **"The seatbelt for AI agents."**

---

## Quick Start

```bash
# from the project root
cd website
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview the production build locally
```

---

## Scroll Timeline

Each section occupies a band of the full page scroll (0 = top, 1 = bottom):

| # | Section | Scroll range | Scene mode |
|---|---------|-------------|------------|
| 1 | **Hero** | 0 – 7% | `hero` — wide shot, slow rotate |
| 2 | **The Problem** | 7 – 15% | `problem` — gate disappears, tools turn red |
| 3 | **Why single checks fail** | 15 – 23% | `single-check` — camera shifts side, chain forms |
| 4 | **Enter the Gate** | 23 – 31% | `enter-gate` — camera pushes through |
| 5 | **Policy engine** | 31 – 40% | `policy` — packets sorted into lanes |
| 6 | **Session detection** ⭐ | 40 – 54% | `sessions` — trail forms, red chain |
| 7 | **Human approval** | 54 – 62% | `approval` — amber packet freezes, gate pulses |
| 8 | **Sandbox & output scanning** | 62 – 70% | `sandbox` — glass cube, scanner beam |
| 9 | **Audit chain** | 70 – 78% | `audit` — hash chain, tamper propagation |
| 10 | **Live demo** | 78 – 86% | `demo` — split scene, step-by-step |
| 11 | **Results** | 86 – 91% | `results` — benchmark stats |
| 12 | **How to use** | 91 – 96% | `howto` — three code steps |
| 13 | **Closing / CTA** | 96 – 100% | `closing` — full pullback |

---

## Project Structure

```
website/
├── index.html                    # entry point, Google Fonts preload
├── vite.config.ts                # Vite + Tailwind plugin config
├── tailwind.config.ts            # (Tailwind v4 — config in vite plugin)
├── src/
│   ├── main.tsx                  # React mount
│   ├── App.tsx                   # root: scroll → mode mapping, device checks
│   ├── index.css                 # global styles, Tailwind import, CSS vars
│   ├── config.ts                 # ← EDIT TEXT HERE (all copy, links, team)
│   ├── data/
│   │   └── results.json          # ← EDIT BENCHMARK NUMBERS HERE
│   ├── scene/
│   │   ├── Scene.tsx             # R3F Canvas, lights, post-processing
│   │   ├── CameraController.tsx  # scroll-driven camera path (waypoints)
│   │   └── objects/
│   │       ├── Agent.tsx         # pulsing orb on the left
│   │       ├── Gate.tsx          # translucent ring/shield in the middle
│   │       ├── Tools.tsx         # cluster of labeled glowing cubes
│   │       ├── Packets.tsx       # instanced particles, coloured by decision
│   │       └── ParticleField.tsx # ambient star-field background
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── ProblemSection.tsx
│   │   ├── SingleCheckSection.tsx
│   │   ├── EnterGateSection.tsx
│   │   ├── PolicySection.tsx
│   │   ├── SessionsSection.tsx
│   │   ├── ApprovalSection.tsx
│   │   ├── SandboxSection.tsx
│   │   ├── AuditSection.tsx
│   │   ├── DemoSection.tsx
│   │   ├── ResultsSection.tsx
│   │   ├── HowToUseSection.tsx
│   │   └── ClosingSection.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── ProgressIndicator.tsx
│   ├── hooks/
│   │   ├── useLenis.ts           # smooth scroll (Lenis)
│   │   └── useScrollProgress.ts  # page + element scroll progress
│   └── utils/
│       └── device.ts             # isLowEnd, hasWebGL, prefersReducedMotion
└── screenshots/                  # Playwright screenshots (see below)
```

---

## How to Edit Copy and Links

All text content is centralised in **[`src/config.ts`](src/config.ts)**. Edit it to change:

- `SITE_CONFIG.title` — site title
- `SITE_CONFIG.tagline` — "The seatbelt for AI agents."
- `SITE_CONFIG.sections.*` — every section's heading, body copy, and sub-text
- `SITE_CONFIG.links.github` — your GitHub repo URL
- `SITE_CONFIG.links.demo` — demo video URL or `#demo`
- `SITE_CONFIG.links.docs` — docs link
- `SITE_CONFIG.team.name` — your team name
- `SITE_CONFIG.team.tagline` — one-line team description
- `SITE_CONFIG.nav` — navbar links
- `SITE_CONFIG.demoButton` — "Watch demo" button

---

## How to Update Benchmark Numbers

Edit **[`src/data/results.json`](src/data/results.json)**. Set `"placeholder": false` once your numbers are real.

Fields:
```json
{
  "_note": "human-readable description of the benchmark",
  "placeholder": true,          // set false when real
  "scenarios": 25,
  "malicious": 15,
  "harmless": 10,
  "policyOnly": {
    "blockRate": 0.733,
    "falsePositiveRate": 0.0,
    "precision": 1.0,
    "recall": 0.733,
    "avgLatencyMs": 0.03,
    "approvalsPerTask": 0.933
  },
  "fullGate": {
    "blockRate": 1.0,
    "falsePositiveRate": 0.0,
    "precision": 1.0,
    "recall": 1.0,
    "avgLatencyMs": 1.03,
    "approvalsPerTask": 0.0
  },
  "missedByPolicyOnly": [
    "Description of attack caught only by session detection"
  ]
}
```

Run your benchmark: `python -m demo.benchmark` from the project root.

---

## Technology Stack

| Concern | Library |
|---------|---------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| 3D rendering | Three.js + `@react-three/fiber` v9 |
| 3D helpers | `@react-three/drei` v10 |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| Scroll animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| Styling | Tailwind CSS v4 |
| Fonts | Inter + JetBrains Mono (Google Fonts) |

**No external 3D model or image downloads** — all objects are built procedurally.

---

## Performance

| Target | Strategy |
|--------|---------|
| 60 fps | Instanced meshes for packets and particles |
| Pixel ratio | Capped at 2 (`dpr={[1, 2]}`) |
| Low-end devices | Detected via `navigator.hardwareConcurrency` / `deviceMemory`; fewer particles, no Bloom |
| `prefers-reduced-motion` | Detected; animations replaced with simple opacity transitions |
| WebGL unavailable | 2D CSS fallback with same copy and static diagrams |
| Bundle size | Three.js is large (~1.4 MB minified, ~396 kB gzipped); consider lazy-loading Scene on first scroll if lighthouse flags it |

---

## Deployment

### Vercel

```bash
# From project root (monorepo style)
vercel --cwd website
# or set "Root Directory" to `website` in Vercel project settings
```

### Netlify

```toml
# netlify.toml (in website/ folder)
[build]
  command = "npm run build"
  publish = "dist"
```

Or drag-and-drop the `website/dist/` folder into Netlify's UI.

### GitHub Pages

```bash
npm run build
# copy dist/ to gh-pages branch
```

---

## Playwright Screenshots

```bash
# Install Playwright once
npm install --save-dev @playwright/test
npx playwright install chromium

# Run the screenshot script
npx playwright test screenshots.spec.ts
```

Screenshots are saved to `website/screenshots/`.

---

## Accessibility

- **Skip to content** link at page top (`#hero`)
- Keyboard-navigable navbar with visible focus rings
- Section progress dots have `aria-label` attributes
- `prefers-reduced-motion` respected: no scroll-scrubbed animation
- WebGL fallback for canvas-incapable environments
- All colour contrasts pass WCAG AA against the dark background

---

## Honest Limitations

This site makes the following claims, all of which are honest and verifiable:

- Agent Safety Gate **reduces risk** and **adds visibility** for AI agents
- Session-level detection **catches multi-step attacks** that single-call rules miss
- The YAML policy engine is **deterministic** (the LLM is advisory only)
- Human approval **defaults to DENY** on timeout
- The audit log is **hash-chained** (tamper-evident)

The site does **not** claim 100% safety, invent statistics, or name fake customers.
All benchmark numbers come from `src/data/results.json`, which you control.

---

## License

MIT — see `../LICENSE` in the project root.
