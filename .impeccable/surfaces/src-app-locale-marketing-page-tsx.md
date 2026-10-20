---
version: 1
slug: "src-app-locale-marketing-page-tsx"
primary_target: "src/app/[locale]/(marketing)/page.tsx"
related_targets: ["src/app/[locale]/(marketing)/about/page.tsx","src/templates/MarketingTemplate.tsx","src/components/marketing"]
---

# Surface brief: the public landing page (`/[locale]`)

Mode: **Persuade**. Two audiences, both named in PRODUCT.md: people in small and medium-sized sales teams deciding whether to start a workspace, and developers deciding whether to clone the template.

Job: make the offer clear in one viewport (a CRM where every step is signed, and who owns what), prove it with real screenshots of the demo workspace, and get the visitor to Create a workspace (sign-up) or Sign in; developers to the run commands and the code.

Proof: real captures only (demo workspace, labelled), the stamp row as the product's own mechanism, and facts traceable to PRODUCT.md. No customers, logos, metrics, testimonials, security or compliance claims; reminders are in-app only; the sample-product note stays visible.

Constraints: the committed Seal and circular world as it stands (no new colour, face or component family); primary actions 44px on this page only (hero and final call to action — user decision 2026-10-18; the app keeps 36px, and DESIGN.md records the exception); light and lacquer themes; en/fr/th with Thai that wraps; static rendering; Lighthouse performance and accessibility at least 90 on mobile.

Composition: **A · Two desks** (user decision 2026-10-18). The decision page with the full-page mock the build matches: `.superpowers/sdd/2026-10-18-crm-f3-insights/landing-comps/index.html` (git-ignored). Build path: code-led (no image generation on this machine).

Decided (user, 2026-10-18): main call to action **"Create a workspace"** (sign-up, then create the first workspace; en/fr/th) — never "Start free", which implies paid plans that don't exist; secondary "Sign in"; 44px landing buttons.

## Direction contract

THESIS: Every step of a relationship is signed: the landing page proves it with the product's own stamp row and real screens, and refuses the SaaS template of a gradient hero, logo wall, metric tiles and icon cards.

OWN-WORLD: The Seal and circular world unchanged: vermilion fields (band, bar or rail) carrying on-seal text, bond-paper panels on the grey ground, one hairline, sumi ink and ink-2, people only as demo-member seals, 36px stamp boxes, Anuphan at display scale for headlines, mono only for record numbers, stamp days and code.

STORY: A sales visitor understands within one viewport what Aureon does and that every move is signed by a person, sees it in a real screenshot, and creates a workspace; a developer sees the stack and the two commands and opens the code.

FIRST VIEWPORT (A · Two desks): full-bleed vermilion band; nav row; a five-box stamp row; the thesis at 80px over two desks split by an on-seal hairline (team: subhead, Create a workspace, Sign in; developers: one line, `make setup` / `pnpm dev`, Read the code); the deals board laid as a paper sheet across the band's lower edge, cropped so stamp rows show above the fold. Below it, an 800px main column with a hairline developer margin beside every section; hovering a note rings its spot on the screenshot.

FORM: Whole surface inside the established world; dealt structure 5 (A) of seven on the ordered list; seed:9b6516acc9b48b93.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
