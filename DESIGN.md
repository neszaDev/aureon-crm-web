---
name: Aureon CRM
description: A CRM that reads as an approval circular; every step of a relationship is signed with a vermilion seal on bond paper.
colors:
  seal: "#c8361c"
  seal-deep: "#9e2812"
  seal-ink: "#b8321a"
  seal-tint: "#f6e3dc"
  on-seal: "#fff4f0"
  danger: "#b4123a"
  warning: "#8a5700"
  success: "#2f6b4f"
  info: "#1f5d8c"
  ground: "#eff0ec"
  paper: "#fbfbf9"
  field: "#ffffff"
  muted: "#e6e7e2"
  ink: "#1c1d21"
  ink-2: "#5b5e66"
  rule: "#d9dad4"
  input-stroke: "#84867f"
  lacquer-ground: "#141212"
  lacquer-paper: "#1c1a19"
  lacquer-field: "#252220"
  lacquer-muted: "#2c2826"
  lacquer-ink: "#eeece8"
  lacquer-ink-2: "#a9a49e"
  lacquer-rule: "#3a3533"
  lacquer-input-stroke: "#7a746e"
  lacquer-seal-ink: "#ec7357"
  lacquer-seal-tint: "#3d1a12"
  lacquer-danger: "#ff7a95"
typography:
  display:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.556
  title:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-dense:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.5
  small:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "normal"
  label-table:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.333
    letterSpacing: "normal"
  button:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  record-number:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.375
    fontFeature: "tnum"
  stamp:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  landing-display:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "5rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  landing-close:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  landing-headline:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  landing-close-sm:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  landing-headline-sm:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  landing-line:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  landing-subhead:
    fontFamily: "Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.375
rounded:
  stamp: "3px"
  sm: "3.6px"
  md: "4.8px"
  lg: "6px"
  xl: "8.4px"
  full: "9999px"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  page-x: "28px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.seal}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.seal-deep}"
  button-outline:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.muted}"
  button-ghost:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-landing:
    backgroundColor: "{colors.on-seal}"
    textColor: "{colors.seal-deep}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-outline-landing:
    textColor: "{colors.on-seal}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body-dense}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  label:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  rail:
    backgroundColor: "{colors.seal}"
    textColor: "{colors.on-seal}"
    width: "232px"
  rail-nav-item:
    textColor: "{colors.on-seal}"
    typography: "{typography.body-dense}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "36px"
  rail-nav-item-current:
    backgroundColor: "{colors.seal-deep}"
    textColor: "#ffffff"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  seal-sm:
    backgroundColor: "{colors.field}"
    textColor: "{colors.seal-ink}"
    rounded: "{rounded.full}"
    size: "24px"
  seal-md:
    backgroundColor: "{colors.field}"
    textColor: "{colors.seal-ink}"
    rounded: "{rounded.full}"
    size: "32px"
  seal-lg:
    backgroundColor: "{colors.field}"
    textColor: "{colors.seal-ink}"
    rounded: "{rounded.full}"
    size: "40px"
  workspace-mark:
    textColor: "{colors.seal-ink}"
    rounded: "{rounded.md}"
    size: "32px"
  stamp-box:
    backgroundColor: "{colors.field}"
    textColor: "{colors.seal-ink}"
    rounded: "{rounded.stamp}"
    size: "36px"
  stamp-box-signed:
    backgroundColor: "{colors.seal-tint}"
    textColor: "{colors.seal-ink}"
    rounded: "{rounded.stamp}"
    size: "36px"
  stamp-box-open:
    backgroundColor: "{colors.field}"
    textColor: "{colors.seal-ink}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    size: "36px"
---

# Design System: Aureon CRM

## Overview

**Creative North Star: "The Approval Circular"**

Aureon reads like a circular passed from desk to desk in an office: each step carries the seal of the person who moved it. A full-height vermilion rail holds the workspace and its sections; to its right, bond-paper panels sit on a cool grey ground, ruled with one hairline. Text is sumi ink. People appear only as round vermilion seals with their initials, workspaces as square chops. The memorable object is the stamp row: one fixed box per pipeline stage, the reached stages signed, the open stage showing its exact days.

The density is that of a working ledger: 36px controls and rows, small sentence-case labels in a second ink, figures set larger than their labels, hierarchy by scale and weight rather than decoration. Panels lie flat on the ground, separated by hairlines; depth is rare. The dark theme is lacquer: near-black warm surfaces under the same vermilion seal, never navy or cool grey.

The world refuses the default CRM: no navy sidebar, no blue primary button, no grid of KPI tiles with icons in coloured circles. Every visible person, signature and stage says who did what.

**Key Characteristics:**
- A full-bleed vermilion rail (`seal`) on the left edge; below 1024px it folds into a vermilion top bar that opens the rail as a drawer.
- Hairline paper panels (`paper` on `ground`, 1px `rule` border, 6px radius) as the only container.
- People are seals, workspaces are chops; both draw initials in `seal-ink`.
- The stamp row: fixed 36px boxes, signed, open (2px ink outline, exact days) or blank.
- Anuphan for Latin and Thai alike; mono only for record numbers and stamp days.
- Light (bond paper) and dark (lacquer) themes from the same token names.

## Colors

One loud colour, the seal vermilion, carried by one large field (the rail) and small signatures (seals, stamps, links); everything else is paper, ink and hairline.

### Primary
- **Seal Vermilion** (`seal`): the rail, the mobile top bar, the auth aside and the primary button fill. Carries white or `on-seal` text only; never used as text on paper.
- **Seal Deep** (`seal-deep`): the primary button's hover and the current item on the rail.
- **Seal Ink** (`seal-ink`; `lacquer-seal-ink` in dark): every seal-coloured mark drawn on paper: seal rings and initials, chop outlines, stamp text, link text, the caret. It holds AA contrast on paper and field in both themes, which `seal` itself does not.
- **Seal Tint** (`seal-tint`; `lacquer-seal-tint` in dark): the fill of a signed stamp box and of the current settings link.
- **On Seal** (`on-seal`): text, icons and outlines on the vermilion fills (4.9:1 on `seal`).

### Secondary
- **Crimson Danger** (`danger`; `lacquer-danger` in dark): errors, failed writes and destructive buttons. A cooler, bluer red than the seal, so an error never reads as a signature.

### Tertiary
- **Status inks** (`success` pine, `warning` ochre, `info` slate blue): status text and chart series only; they never fill large areas.

### Neutral
- **Ground** (`ground`; `lacquer-ground`): the page behind the panels; also the browser theme colour.
- **Bond Paper** (`paper`; `lacquer-paper`): panels, cards, list rows.
- **Field** (`field`; `lacquer-field`): controls (inputs, outline buttons, menus, popovers) and the inside of seals and blank stamp boxes; one step above paper.
- **Muted** (`muted`; `lacquer-muted`): hover and selected fills on rows, ghost and outline buttons.
- **Sumi Ink** (`ink`; `lacquer-ink`): body text and headings.
- **Second Ink** (`ink-2`; `lacquer-ink-2`): labels, secondary lines, counts, hints.
- **Hairline** (`rule`; `lacquer-rule`): every border and divider between paper areas.
- **Input Stroke** (`input-stroke`; `lacquer-input-stroke`): control borders only, at 3:1 against field, paper and ground.

### Named Rules
**The Seal Is a Signature Rule.** Vermilion marks the rail, the primary action and who signed what. It never decorates, never colours a status and never signals an error.

**The Crimson Is Not the Seal Rule.** Danger uses `danger`, never `seal` or `seal-ink`, and always arrives with an icon and words. Colour alone never signals an error.

**The Lacquer Rule.** Dark mode keeps the same seal fill on the rail and swaps paper, ink and seal-ink for their `lacquer-` values; it adds no new accents.

**Legacy note (scope only).** `src/styles/global.css` still carries the boilerplate's "Marksheet" tokens (`folder*`, `paper-card`, `ply`, `ink-950` to `ink-100`, `pass`, `pen`, `pencil`, `.form-label`, `.paper`, `shadow-paper`, the Kalam hand font, the button `inverse` variants). They exist only so the demo gallery under `/dashboard` (and, until it is redrawn, the not-found page) keeps rendering; the public landing and about pages no longer use them. They are not part of this system, and new UI must not use them.

## Typography

**Display Font:** Anuphan (with ui-sans-serif, system-ui)
**Body Font:** Anuphan (with ui-sans-serif, system-ui)
**Label/Mono Font:** the platform monospace stack, for record numbers and stamp days only

**Character:** One humanist sans sets Latin and Thai at the same weights, so a mixed English and Thai row keeps one texture. Hierarchy comes from size and weight; two inks do the rest.

### Hierarchy
- **Display** (800, 30px, 1.2, −0.03em): the one heading of a standalone page (sign in, sign up, invitation).
- **Headline** (700, 24px, 1.333, −0.01em): the page `h1` inside the CRM shell and on the workspace picker.
- **Figure** (600, 18px): a value in a fact strip, larger than its label.
- **Title** (600, 16px): a panel's heading.
- **Body** (400, 16px, 1.5): running text; descriptions cap at 65ch.
- **Body dense** (500, 15px): navigation items, names in list rows, control text from 640px up.
- **Small** (400, 14px): secondary lines, emails under names, counts.
- **Label** (500, 13px, sentence case, `ink-2`): form and fact labels. **Label table** (500, 12px, `ink-2`) for table heads.
- **Record number** (mono, 13px, tabular figures): a record's identifier.
- **Stamp** (mono, 700, 11px, tabular): the days inside an open stamp box.

Under `lang="th"` line heights open (1.6 at 12–14px, 1.65 for body) and negative tracking on headings resets to normal, so stacked vowels and tone marks never touch or clip.

### Named Rules
**The Quiet Label Rule.** Labels are sentence case, 12–13px, weight 500, in `ink-2`, with no uppercase and no letter-spacing. A label never competes with the value under it.

**The Figure Over Label Rule.** Values are set larger and heavier than their labels (18px/600 under a 13px label); tables, times and record numbers use tabular figures.

**The Record Number Rule.** A record's number is a type letter, a hyphen and a zero-padded number (`D-0042` for a deal), set in the record-number style, so it can be read aloud and scanned down a column.

## Layout

From 1024px the CRM shell is a two-column grid: a 232px vermilion rail, sticky and full height, then the work area on `ground`. The rail holds the workspace switcher at the top and the section list under it. The work area opens with a 56px top bar carrying, at the right, the record search, the reminders bell and your seal; pages sit under it in a column up to 1152px wide, with 28px side padding (16px below 640px).

Below 1024px the rail becomes a 56px vermilion top bar (menu button, workspace chop and name, your seal) that opens the rail as a 288px drawer from the left.

Page blocks stack 24px apart; panel grids use 20px gaps. Settings put a 192px link column beside the page from 1280px and a wrapping row of links above it below that. Standalone pages centre one column (576px for the workspace picker, 400px for auth forms). The auth pages split 5:7 on large screens, with a vermilion aside carrying the wordmark and a stamp row; on smaller screens the aside folds into a vermilion band with the same two.

Rows are dense: 36px minimum for controls and navigation, 48px for list rows with a seal, 12px cell padding in tables, 20px side padding in panels.

## Elevation & Depth

Aureon is flat. Inside the shell, panels lie on the ground with a hairline border and no shadow; separation comes from paper against ground and from the rule between rows. Two small shadows exist: a one-pixel ply under controls, so they read as raised from the paper, and a soft sheet under a card that stands alone on a page (the picker list, the create form, the auth form, the invitation card, error states) or under a row being dragged.

### Shadow Vocabulary
- **Ply** (`box-shadow: 0 1px 2px rgb(17 27 48 / 10%)`): controls only (primary, outline and destructive buttons, inputs, selects).
- **Sheet** (`box-shadow: 0 1px 0 rgb(17 27 48 / 5%), 0 1px 3px rgb(17 27 48 / 8%)`): a standalone card on a page, a dragged row, the skip link.

### Named Rules
**The One Hairline Rule.** Every division between paper areas is the same 1px `rule`. No double borders, no tinted section backgrounds, no shadows on panels inside the shell.

## Shapes

Corners are slightly softened and consistent: 6px on panels and cards, 4.8px on buttons, inputs and navigation items, 3px on stamp boxes. Seals are perfect circles; workspace chops are squares with 4.8px corners, so a circle means a person and a square means an organisation. The seal inside a stamp box and the brand seal are tilted −8°, as if pressed by hand.

**The Circle Is a Person Rule.** A circle with initials is always a person and a rounded square with initials is always a workspace. Nothing else takes either shape.

## Components

### Buttons
Firm and compact: one height for every primary action.
- **Shape:** 4.8px corners, 1px border, semibold 14px text, 16px side padding, 36px tall.
- **Primary:** seal fill, white text, ply shadow; hover moves to seal-deep; pressing nudges it down 1px.
- **Outline:** field fill, input-stroke border, ink text; hover deepens the border and fills muted.
- **Ghost:** no fill until hover (muted).
- **Destructive:** crimson fill with white text in light; in lacquer a crimson tint with crimson text, because the dark crimson cannot carry white.
- **Link:** seal-ink text, underlined on hover.
- **Focus:** a 2px seal ring with a 2px offset. On the vermilion rail and bars the ring is `on-seal`.
- **Sizes:** 36px is the one height for primary actions. 32px and 28px serve inline tools in rows (reorder, reload, copy).
- **The landing exception:** on the public landing page only, the two primary actions of the hero and of the closing band are 44px (`lg`, 15px text, 20px sides): an on-seal button with seal-deep text (in both themes: the lacquer seal-ink would not hold contrast on on-seal) and an on-seal outline button, both on the vermilion band; the header's Create a workspace takes the same fill at 32px. User decision, 2026-10-18; the app keeps 36px.

### Cards / Containers (panels)
- **Corner Style:** 6px.
- **Background:** paper.
- **Shadow Strategy:** none inside the shell; sheet for a standalone card (see Elevation & Depth).
- **Border:** 1px rule.
- **Internal Padding:** 20px at the sides; a heading row (title left, count right in `ink-2`) over rows divided by the same rule. A fact strip is one panel split into cells by rules, each a label over a figure.

### Inputs / Fields
- **Style:** field fill, 1px input-stroke border, 4.8px corners, ply shadow, 40px tall, 16px text (15px from 640px).
- **Focus:** the border turns seal, with a 3px seal ring at 20%.
- **Error:** crimson border and ring; the message under the field in crimson, with an icon and words (the Crimson Is Not the Seal Rule). A form-level failure is a crimson-tinted alert with an icon at the top of the form, never a toast.
- **Labels:** the Quiet Label Rule, 8px above the control.

### Navigation
- **Rail items:** 36px rows, 15px medium `on-seal` text with a 16px icon; hover darkens by 10% black; the current item fills seal-deep and turns semibold white (weight is the cue besides colour).
- **Settings links:** a column from 1280px, a wrapping row of bordered paper links below it; the current link fills seal-tint with seal-ink text.
- **Account:** your seal in the top bar opens the account menu (profile, theme, language, sign out).
- **Record search:** from 768px a field-like button in the top bar ("Search records" and the shortcut, ⌘K or Ctrl K); below that an icon button. It opens a palette near the top of the screen (up to 512px wide) with 5 hits per kind under their headings, each a record number in mono, the name and a detail line.
- **Reminders bell:** an icon button with a badge (white on the vermilion bar, ink on paper: vermilion never colours a count) counting overdue tasks, tasks due within 24 hours and leads whose follow-up is due; hidden at none, "20+" for a list the API may have cut. Its popover is a field sheet, 352px at most, with the three groups and a line saying reminders live in the app. The layout's read is the first paint; the bell asks again on each navigation and when the tab returns, since a soft navigation keeps the layout.

### Dashboard
The workspace home, in this order: a header (the page `h1`, a line naming the workspace, the five "New ..." actions); the KPI strip (one panel split into cells, a small label over a 28px figure, each cell a link to the list it counts; overdue tasks in crimson with an icon); my deals beside my follow-ups (each deal a record number, name, amount and a compact stamp row signed by whoever moved it; tasks with the list's complete box); the open pipeline (per currency, open over weighted), won and lost (with the period picker) and the open stages (bars and their table); recent activity beside recent changes. Every figure is the API's, as sent: nothing is added across currencies, every amount carries its currency, and the period label is the response's `period`. Only won and lost follow the period; the panel says the rest is as of now. An empty workspace shows "Get started" (the create actions, no seals) instead.
- **Charts** use `--chart-2..5` (never the seal's `--chart-1` for a plain series), name each bar with its stage and its count, and always sit above their table, which is the text equivalent: the chart itself is hidden from assistive technology and takes no focus. Animation is off under reduced motion.
- **History entries** (`AuditEventItem`): the actor's seal (none for a former member), "Riley Rep changed Acme Trading" with the record as a link, the time in the workspace zone, and the changed fields as "Field: from → to". Money carries its currency only when the event names it; ids read "changed".

### Reports
The reports page opens with its `h1` and a row of tab links (`?tab=pipeline|won-lost|funnel|activities|follow-ups`; the pipeline without one): the current tab is `bg-muted` and semibold with `aria-current="page"`, the one just followed shows a spinner until its report arrives. A line under the tabs says what the figures cover (the pipeline and the follow-ups are as of now; the other three follow a period, with the period picker at its right, which keeps the tab and the range when either changes). Every figure is the API's, as sent: no sum across currencies, owners or months, every amount in its currency, each currency on its own line, the period label from the response's `period`.
- **Charts** draw their series in `--chart-2..5` and never in the seal's `--chart-1`; the one exception is Lost, which is ink (`--foreground`) by decision, as on the stamp row. Won is a solid pine (`--chart-3`) bar and Lost a hatched ink bar (diagonal stripes with an ink outline), so they read apart without their colours; the counts sit on the bars while there is room (up to six months). The chart is hidden from assistive technology and its text equivalent is `ChartTable`: the table, open at every width (the money and the months that are only in it are on the page and in find-in-page), under a ghost button named "Table" with `aria-expanded` that hides it.
- **Funnel**: a table, one row per stage, "reached of created" beside a bar (open stages `--chart-2`, Won `--chart-3`); when the stage history starts after the period does, or there is none, a caution with a warning icon says so above it and the counts are never presented as complete.
- **Activities**: a table per member (seal, calls, emails, meetings, notes, tasks completed, total of the row); the members who left are one row without a seal. On a phone it scrolls inside a focusable region, the member column staying in view.

### Tables
- Heads in the label-table style, 40px tall, sentence case; rows divided by rule, 12px cell padding, muted on hover; tabular figures.

### Seal (`Seal`)
A person as a round seal: field fill, a seal-ink ring (1.5px at 24px, 2px at 32px and 40px), bold initials in seal-ink. Initials are the first character of the first two words of the name, else the first two characters of the email. Sizes: 24px in lists and tables, 32px in the top bar, 40px in headers and menus.

**The Signed by the Actor Rule.** Seals are the only way a person appears: no photos, no generic avatars, no initials in coloured squares. A seal signs an action only for the member recorded as having done it, never the viewer because they are the one looking.

### Workspace Mark (`WorkspaceMark`)
A workspace as a square chop: 32px, 2px seal-ink outline, bold initials; on the vermilion rail it draws in `on-seal`. Always beside the written name, and decorative.

### Stamp Box and Stamp Row (`StampBox`)
The signature of the system. A stamp row is a line of `StampBox`es, 4px apart, one per pipeline stage in order. Each box is a fixed 36px square with 3px corners.
- **Signed** (a stage the deal has passed): seal-tint fill holding a 28px seal of the member who moved the deal, tilted −8°.
- **Open** (the current stage): field fill, a 2px ink outline, and the exact days in the stage in the stamp style ("8d"), never a rounded "about a week".
- **Blank** (not reached): field fill, a 1px seal-ink outline at 40%.
- **Reached, unsigned:** a stage passed over without a signature (a deal created further along, a move whose member has left) is filled with the seal tint and ticked, with no seal: a seal is only ever someone's.
- **Won:** the WON stage, once reached, fills solid with the seal and its impression (the winner's seal, or a tick) draws in `on-seal`. It is the `won` state of `StampBox`; never build a second box.
- **Lost:** the LOST stage, once reached, is marked in solid ink with the word "Lost", never in the seal colour and never with a seal (`lost` state).
- **Press:** the box that becomes current after a move plays a 220 ms stamp-press (scale 1.06 to 1, the ink settling); none under reduced motion.

**The Fixed Box Rule.** Stamp boxes are always 36px, whatever the stage name or language. Stage names live outside the box.

## Landing

The public landing page (`src/app/[locale]/(marketing)/page.tsx`) is composition **Two desks**: one page for the two audiences PRODUCT.md names, the sales team in a wide column and the developer in a hairline margin beside it. It lives in this world unchanged: no new colour, face or component family, only a display scale for headlines.

- **Chrome:** the public header is the vermilion bar (64px, 72px from 1024px): the wordmark, the section links from 1280px, the language picker in its `seal` tone, Sign in (on-seal outline) and Create a workspace (field fill, from 640px), both 32px. A skip link comes first. The footer lies on the ground under a hairline: the wordmark and the sample-product note, About and the boilerplate link in seal-ink.
- **The band:** the header's vermilion runs on into the hero. A five-box stamp row (three demo members' seals, the open stage's days, a blank) presses one box after another on load (the 220ms stamp-press, 140ms apart; none under reduced motion). The headline is `landing-display` (2.75rem on phones, 3.75rem from 640px, 5rem from 1024px). Under an on-seal hairline at 45% the band splits into two desks: the team's (a 13px label, `landing-subhead`, the two 44px actions) and the developer's (a label, one line, `make setup` and `pnpm dev` in mono on seal-deep, Read the code underlined in on-seal), stacked below 768px, where the team's label and the developer's line give way (the commands stay) so the sheet's signed card reaches the first screen.
- **The sheet across the edge:** the deals board, captured, lies as a paper sheet (sheet shadow) across the band's lower edge; the band ends at 45% of the sheet's block, so the stamp rows of the cards show in the first viewport at 1440 by 900. From 768px it shows the board's columns at a 2:1 crop from the top left; below that the phone's board from the stage whose first card is the most signed, from that card down (the Thai page shows the Thai board).
- **Sections:** a 1160px content column on the ground (1216px with its 28px sides). Each section is an 800px story column (`landing-headline`, 2rem on phones; an 18px lede in ink-2, 56ch) beside the developer note in the rest of the column (312px after the 48px gap) (15px ink-2 on a hairline left rule; the first carries "For developers" in ink); below 1024px the note follows the story. Sections are 88px apart on the one hairline. More space above a headline than below it.
- **Captures:** only real screenshots of the demo workspace (`scripts/capture-landing.ts`, provenance in `public/landing/README.md`), in paper sheets with the hairline and a 13px caption ending "demo workspace, fictional data". Each has a light and a lacquer capture; the page shows the one its theme matches. Below 768px each section shows a narrow crop of its part (the signed card, the won deal's stamp row and history, the reminders popover, My deals, the chart) at a phone's density instead of the whole screen. Clips end on a row's or a panel's edge, never through a line of text. The dashboard and the report are two sheets on the desk from 768px: the report (97%, sheet shadow) covers exactly the dashboard's last whole row, leaving only the page's margin beside it.
- **The signature:** a developer note about a part of its capture names it in 13px seal-ink beside a small outlined box, and the capture rings that part: a 2px seal-ink ring at 55% at rest, full with a 4px seal halo while the note is hovered (200ms, ease-out-expo; no transition under reduced motion).
- **Illustrations:** the how-it-works steps draw the product's own rows with `StampBox` (a lead's lifecycle, then converted with ticks and no seals; a deal signed by two members, eight days open), hidden from assistive technology under a caption saying they are samples. The roles panel is a paper panel of the four roles, each beside a demo member's seal. The languages section sets each locale file's own headline (`landing-line`) under its endonym, beside the Thai phone capture.
- **Developers:** a full-width row: the commands for both repositories in a field-coloured block (mono 13px, comments in ink-2) and a facts panel split by rules.
- **Close:** a vermilion band with `landing-close` (2.5rem on phones), the two 44px actions and a won deal's stamp row; its Won box carries a 1px on-seal outline so the seal's fill still reads on the seal.
- **Thai:** display headings open to a 1.35 line height and drop their negative tracking.

The about page uses the same header and footer: one 768px column on the ground, the title at `landing-headline`, and a paper panel of what the template holds.

## Do's and Don'ts

### Do:
- **Do** run the vermilion rail full-bleed down the left edge, on the ground, with hairline paper panels beside it.
- **Do** write labels in sentence case, 12–13px, weight 500, `ink-2`.
- **Do** use the 36px button height for every primary action (the landing page's hero and closing band take 44px, and nothing else does).
- **Do** show people only as `Seal`s, signed by the member who actually did the action.
- **Do** draw pipeline progress as a stamp row of fixed 36px `StampBox`es, with exact days on the open stage and the WON stage filled with the seal.
- **Do** set record numbers in mono with tabular figures (`D-0042`).
- **Do** pair every crimson error with an icon and words.
- **Do** check every screen in Thai and in the lacquer theme.

### Don't:
- **Don't** use uppercase or letter-spacing on labels, table heads or badges.
- **Don't** use the seal vermilion for errors, or crimson for anything but danger.
- **Don't** stamp the viewer's seal on an action someone else recorded.
- **Don't** use photos, generic avatars or a second avatar style.
- **Don't** add shadows to panels inside the shell, or a second border colour.
- **Don't** use a navy sidebar, blue primary buttons or KPI tiles with icons in coloured circles.
- **Don't** use the Marksheet tokens, `.form-label`, `.paper` or Kalam outside the `/dashboard` demo pages.
