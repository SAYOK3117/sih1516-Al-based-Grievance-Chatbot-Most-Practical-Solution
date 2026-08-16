# AI Agent Standing Instructions (AGENTS.md)

This file acts as the strict, standing instructions for any AI coding agent (Claude Code, Cursor, Copilot, or similar) working in this repository.

**These rules apply to every file and every task in this project for the full duration of the project.**

---

## 1. CORE WORKFLOW

You must follow this exact sequence for every single task, no matter how small:

1. **Walkthrough / Discovery**
   * Before making *any* changes or writing any code, you must read and fully understand the relevant existing files, folder structure, and logic related to the current task.
2. **Implementation Plan**
   * Write a short, clear plan covering:
     * What will be changed and why.
     * Which specific files will be created, edited, or deleted.
     * Any assumptions, trade-offs, or risks.
   * **Present this plan in the chat only.** Do not write any code or output final text yet.
3. **Permission Gate**
   * You must **NEVER** write, edit, or finalize any code or text until the user explicitly approves your plan (e.g., "yes", "go ahead").
   * If the plan changes or the scope shifts mid-task, you must **STOP** and re-confirm before proceeding.
4. **Implementation**
   * Once approved, implement *exactly* what was agreed upon. Do not silently expand the scope.
5. **Verification & Handoff**
   * Briefly explain what was changed, why, and what the user should test or verify.
   * If you notice extra improvements beyond the current scope, flag them as a separate task needing its own approval.

---

## 2. CODE EFFICIENCY STANDARDS

When writing or modifying code, you must ensure it is clean, efficient, and well-structured:

* **Efficiency:** Avoid unnecessary loops, re-computations, or duplicate calls.
* **Reusability:** Reuse existing utilities and components instead of duplicating logic.
* **Appropriateness:** Choose data structures and algorithms suited for the scale of the operations involved.
* **Clean Up:** Actively remove dead code and unused imports in any file you touch.
* **Readability:** Keep the code readable and straightforward. Prioritize clarity over unnecessary cleverness.

---

## 3. COMMUNICATION RULES

* **No Code Dumps:** Do not provide large, unexplained dumps of code.
* **State Assumptions:** If requirements are ambiguous, state your assumptions clearly before proceeding.
* **Flag Inconsistencies:** If you spot inconsistencies or errors in the existing codebase, **flag them** to the user instead of silently fixing them outside of the current task's scope.

---

## 4. SCOPE & ENFORCEMENT

* These rules apply universally to **all files and tasks** across the entire project (frontend, backend, config, docs, scripts, infra).
* This workflow is active for the **full duration** of the project, not just the initial task.
* **Exception:** A one-time bypass is only allowed if the user explicitly says `"skip the plan"` for a specific task. Once that task is completed, this rule resumes automatically for the next task.

---

## 5. PROJECT CONTEXT

* **Project Name:** Nagrik Setu (internal package name: `suvas`) — AI-assisted citizen grievance redressal platform, built for Smart India Hackathon (SIH1516).

* **Tech Stack:**
  * React 19 + TypeScript, bundled with Vite 8
  * Tailwind CSS v4 (via `@tailwindcss/vite`), dark mode supported throughout via `dark:` classes
  * React Router v7 for routing
  * Leaflet + react-leaflet for maps (see Key Conventions — only the raw/imperative Leaflet API is actually used)
  * Recharts for analytics charts, Framer Motion + GSAP + Lenis for animation/smooth scroll
  * lucide-react for icons
  * No backend currently exists. There is no database, no auth server, and no LLM/API integration wired up — all "AI" behavior (department routing, duplicate detection, chatbot) runs entirely client-side in the browser.

* **Architecture:**
  * Single-page React application (Vite SPA), client-side routing only.
  * Global state lives in a single React Context (`StoreContext` in `src/lib/store.tsx`), consumed via the `useStore()` hook — there is no Redux/Zustand/other state library.
  * Login/role is a demo-only flow: role is decided by which fixed dummy phone number is entered, and stored in `localStorage` (`suvas_user_role`, `loggedInAdmin`). There is no real authentication, session expiry, or backend verification.
  * Seed/demo data lives in `src/lib/demoData.ts`; nothing persists across a page refresh beyond what's cached in `localStorage` (geocode cache, role, logged-in admin).

* **Key Conventions:**
  * Functional components with hooks only — no class components.
  * Domain model types (`Grievance`, `Admin`, `MasterIssue`, `GrievanceEscalation`, etc.) are defined as TypeScript interfaces directly in `src/lib/store.tsx` — extend these rather than creating parallel type definitions elsewhere.
  * All geocoding (forward and reverse) goes through Nominatim/OpenStreetMap, following the existing pattern in `src/lib/geocode.ts` (`geocodeLocation`) — do not introduce a different geocoding provider or an API key–based service without explicit approval.
  * Maps use the **raw imperative Leaflet API** as implemented in `src/components/ui/LeafletMap.tsx` (`new L.Map(...)`, manual marker/layer management). `src/components/ui/LocationPicker.tsx` exists in the codebase using react-leaflet's declarative `<MapContainer>` API instead, but it is **dead code — not imported anywhere**. Do not wire it in or copy its pattern; mixing the two Leaflet approaches in the same app has previously broken the site (duplicate map initialization). Treat this as a standing project-specific rule, not just a one-off task note.
  * Tailwind utility classes are used directly in JSX (no CSS modules/styled-components); every visual component should support both light and dark mode via `dark:` variants, matching existing components.

* **Folder Structure Overview:**
  * `/src/pages` — Route-level page components (one file per route: LandingPage, LoginPage, FileGrievancePage, CitizenDashboard, GrievanceTrackingPage, AdminDashboard, the SuperAdmin* pages, PublicTransparencyPage).
  * `/src/components/ui` — Reusable UI primitives and shared widgets (Button, Card, Badge, Textarea, LeafletMap, LocationPicker [dead/unused — see above], MasterIssueCard, EscalationBadge, ScrollProgress, etc.).
  * `/src/components/superadmin` — Super-admin-only dashboard widgets: India map, analytics charts, grievance/escalation lists, detail drawers, KPI cards.
  * `/src/components/layout` — App shell components: Navbar, Footer, MobileTabNav, ChatbotWidget.
  * `/src/lib` — Business logic and utilities, not UI: `store.tsx` (global state/context + domain types), `demoData.ts` (seed/mock data), `departmentClassifier.ts` (keyword-based routing + priority logic), `duplicateDetector.ts` (Haversine distance + Jaccard text similarity duplicate detection), `geocode.ts` (Nominatim geocoding + caching), `slaConfig.ts` / `slaUtils.ts` (SLA deadline rules), `adminConfig.ts` (department → admin ID mapping), `useVoiceInput.ts` (Web Speech API hook), `superAdminAlerts.ts`.
  * `/public` — Static assets, including `public/geo/india-states.geojson` (~13MB — large; used by the Super Admin India map. Flag before further growing this file or fetching it more than once per session.)
  * `/docs`, `/scripts` — Do not currently exist in this repo. If a task needs one, flag it and confirm before creating it, per the Communication Rules above.
