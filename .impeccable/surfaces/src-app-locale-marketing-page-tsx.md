---
version: 1
slug: "src-app-locale-marketing-page-tsx"
primary_target: "src/app/[locale]/(marketing)/page.tsx"
related_targets: ["src/app/[locale]/(marketing)/about/page.tsx","src/templates/MarketingTemplate.tsx","src/components/marketing"]
---

# Surface brief: the public landing page (`/[locale]`)

Mode: **Persuade**. Two audiences, both named in PRODUCT.md: people in small and medium-sized sales teams deciding whether to start a workspace, and developers deciding whether to clone the template.

Job: make the offer clear in one viewport (a CRM that shows where every deal stands, who owns it and who moved it, each status one coloured pill you change in place), prove it with real screenshots of the demo workspace, and get the visitor to Create a workspace (sign-up) or Sign in; developers to the run commands and the code.

Proof: real captures only (demo workspace, labelled), the status pill and track as the product's own mechanism (drawn in HTML from the app's own styles, an illustration hidden from assistive technology behind a short description), and facts traceable to PRODUCT.md. No customers, logos, metrics, testimonials, security or compliance claims; reminders are in-app only; the sample-product note stays visible.

Constraints: the app's established world as it stands (work-OS canon in Aureon's identity, `.impeccable/surfaces/src-app-locale-auth-app.md`; no new colour, face or component family); primary actions 44px on this page only (hero and final call to action — user decision 2026-10-18; the app keeps 36px, and DESIGN.md records the exception); light and dark themes; en/fr/th with Thai that wraps; static rendering without the pill's menu or the avatar's tooltip code (their looks come from `libs/crm`); Lighthouse performance and accessibility at least 90 on mobile, English and Thai.

Composition: **A · Two desks** (user decision 2026-10-18), kept in the 2026-10-23 rework. Build path: code-led (no image generation on this machine).

Decided (user, 2026-10-18): main call to action **"Create a workspace"** (sign-up, then create the first workspace; en/fr/th) — never "Start free", which implies paid plans that don't exist; secondary "Sign in"; 44px landing buttons.

## Direction contract

THESIS: Every record's status is one coloured pill that is also the control: lists group into status sections, the side panel shows the whole track, and every move keeps who owns the record and who moved it. The landing page proves it with that pill and track, drawn from the app's own styles, and real screens; it refuses the SaaS template of a gradient hero, logo wall, metric tiles and icon cards.

OWN-WORLD: The app's world on a public page: Aureon violet (#5a45e0) brand fields (header, hero band, closing band) carrying white text at 6.25:1, its deep tint (#2e284f) in dark; the ink-violet (#1d1a2e) as the second deep field, under the developers' commands; white canvas, #e6e6ec hairlines, flat 8px panels, soft offset shadows only on the sheet that crosses the band; status colours only as pills, dots and track segments beside their words; people as initials on their member colour; the orbit mark; Inter, Anuphan for Thai, display at 80px; mono only for commands and code.

STORY: A sales visitor understands within one viewport that Aureon shows where every deal stands, who owns it and who moved it, watches a deal's track fill up to its current pill, finds the same pills and sections in a real screenshot, and creates a workspace; a developer sees the stack and the two commands and opens the code.

FIRST VIEWPORT (A · Two desks): full-bleed violet band; nav row (mark, sections, language, Sign in, Create a workspace); a deal of the demo workspace as the app draws it: its pill, its track, its owner, in HTML (with its name and amount; the track fills up to the current stage; who moved it is the side panel's, shown in the captures); the thesis at 80px over two desks split by a white hairline (team: subhead, Create a workspace and Sign in at 44px; developers: one line, `make setup` / `pnpm dev` on ink-violet, Read the code); the deals board capture laid as a sheet across the band's lower edge, cropped so its stage pills and first cards show above the fold. Below it, an 800px main column with a hairline developer margin beside every section; hovering a note rings its spot on the screenshot.

FORM: Whole surface inside the established world (work-OS canon, Aureon identity), user-pinned 2026-10-23; composition A · Two desks kept; seed: none (unavailable); the composition is pinned by the user, so no roll applies

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
