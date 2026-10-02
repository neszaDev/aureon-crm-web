---
name: Marksheet
description: A school report card for test results; folder-green cover, ruled card stock, navy form ink, red pen kept for failures.
colors:
  folder: "#1f5c45"
  folder-deep: "#164433"
  folder-ink: "#f1f5ef"
  folder-ink-soft: "#bcd3c5"
  paper: "#e8eee6"
  paper-card: "#f5f8f3"
  ply: "#ffffff"
  ink-950: "#111b30"
  ink-900: "#1b2b4b"
  ink-700: "#33436a"
  ink-600: "#4a5878"
  ink-400: "#8a94a9"
  ink-300: "#b3bccb"
  ink-200: "#cfd7de"
  ink-100: "#dfe5e6"
  pass: "#1f6b4e"
  pen: "#c42f2a"
  pencil: "#5f666e"
typography:
  display:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 4.25rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.11
    letterSpacing: "-0.025em"
  page-title:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  table:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "\"tnum\""
  figure:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  label:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.12em"
  button:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  hand-remark:
    fontFamily: "Kalam, Bradley Hand, cursive"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.375
  hand-note:
    fontFamily: "Kalam, Bradley Hand, cursive"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.375
rounded:
  sm: "3.6px"
  md: "4.8px"
  lg: "6px"
  xl: "8.4px"
spacing:
  hairline: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  card: "20px"
  lg: "24px"
  xl: "32px"
  section: "80px"
  section-lg: "112px"
components:
  button-primary:
    backgroundColor: "{colors.folder}"
    textColor: "{colors.folder-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.folder-deep}"
  button-inverse:
    backgroundColor: "{colors.folder-ink}"
    textColor: "{colors.folder}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-inverse-hover:
    backgroundColor: "{colors.ply}"
  button-inverse-ghost:
    textColor: "{colors.folder-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.ply}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.paper-card}"
  button-ghost:
    textColor: "{colors.ink-700}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.ink-900}"
  button-destructive:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.ply}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.ply}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  badge-tag:
    backgroundColor: "{colors.ply}"
    textColor: "{colors.ink-700}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    height: "24px"
  card-sheet:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.sm}"
    padding: "20px"
  paper:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.lg}"
  nav-item:
    textColor: "{colors.folder-ink-soft}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  nav-item-current:
    backgroundColor: "{colors.folder-deep}"
    textColor: "{colors.folder-ink}"
  table-row:
    textColor: "{colors.ink-900}"
    typography: "{typography.table}"
    padding: "12px"
---

# Design System: Marksheet

## Overview

**Creative North Star: "The Report Card"**

Every surface is a page of a school report card lying on a desk in daylight. Folder green is the cover: it owns the large fields (marketing header and hero, the app sidebar, the auth aside, the closing band and footer). Inside, pale card stock is the working ground, printed in navy form ink on one stepped ramp. Results are written onto ruled rows; status is a drawn mark, never a pill: a green tick for passed, a red pen circle for failed, a graphite pencil box for pending.

The type is a printed form. Libre Franklin carries everything printed: tight, heavy headlines, tracked small caps for field labels and column heads, tabular figures in every table and total. Kalam is the hand that fills the form in: remarks, row notes, and the few entries a person writes onto a printed field. Controls do not belong to the print; they sit on their own white ply, a sheet above the card with a hairline shadow. Density is that of a form: compact rows, generous section breathing room around them.

Motion is a pen. Marks draw on as strokes in sequence (on the landing card, on the key as it scrolls into view, and on a result created in the last 20 seconds), then the remark writes on left to right. Nothing else moves beyond 150-200ms state transitions and overlay fades. Under reduced motion everything is static. The scene is daylight only; there is no dark mode.

**Key Characteristics:**
- Folder green for large fields only; card stock for work.
- One navy neutral ramp; no grays outside it except pencil.
- Status as a drawn SVG mark paired with its name.
- Double-rule header bands on every card and page head.
- Controls on a white ply above the printed card.
- Empty tables keep their ruled rows.
- Pen-stroke motion, static under reduced motion.

### Reskinning a derived product

The system is built to be swapped, not extended forever. A derived product reskins it in this order:

1. **Primitives.** Replace the `:root` values in `src/styles/global.css` (folder, paper, ink ramp, pass/pen/pencil). The shadcn semantic tokens (`--primary`, `--background`, `--destructive`, `--ring`, ...) are mapped onto those primitives and need no edits unless the role changes. Keep one neutral ramp and one field color, or rename them consistently in both `:root` and `@theme inline`.
2. **Faces.** Swap the two `next/font/google` imports in `src/app/[locale]/layout.tsx`; `--font-franklin` feeds `--font-sans`/`--font-heading`, `--font-kalam` feeds `--font-hand`. If the new world has no handwritten voice, delete `font-hand` usages rather than mapping it to a sans.
3. **Loose literals.** Update `themeColor` in the layout metadata and the destructive hover literal in `src/components/ui/button.tsx`; they are not token-bound.
4. **Domain.** `src/components/report/*` (Mark, StatusMark, TotalsStrip, ResultsTable, SampleCard) is the grading metaphor. A product without pass/fail status replaces the mark strokes or deletes the folder; the ui primitives, PageHeader, FormField and the templates survive.
5. **This file.** Re-run the documenter once the new world is built; do not hand-edit tokens here ahead of the code.

## Colors

A daylight desk palette: one deep green cover, pale green-grey card stock, navy form ink, and three marking colors.

### Primary
- **Folder Green** (#1f5c45): the report card's cover. Hero, marketing header, app sidebar and mobile app bar, auth aside, closing band; also the default button, focus ring, caret and links on card stock. Never a small accent sprinkled on paper.
- **Folder Deep** (#164433): the inside of the cover. Footer band, primary-button hover, the current item in the sidebar nav.
- **Folder Ink** (#f1f5ef): text and the inverse button on folder fields.
- **Folder Ink Soft** (#bcd3c5): secondary text on folder fields, the wordmark tick on green, nav items at rest.

### Secondary (marks)
- **Pass Green** (#1f6b4e): the tick. Used only for the passed mark and the wordmark tick on paper.
- **Red Pen** (#c42f2a): the failed circle, failed status text, a non-zero failed total, field and form errors, the destructive delete action, and the 404 "Absent" stamp.
- **Graphite Pencil** (#5f666e): the pending box.

### Neutral
- **Desk Card Stock** (#e8eee6): page background (`--background`).
- **Card Face** (#f5f8f3): cards, the paper surface, the alert dialog, the "row taken apart" band.
- **White Ply** (#ffffff): every control surface (inputs, selects, textareas, outline buttons, the sample tag) and popovers/sheets.
- **Navy Form Ink ramp**: 950 (#111b30) headings and figures; 900 (#1b2b4b) body text; 700 (#33436a) labels, hand-written text, ghost buttons; 600 (#4a5878) muted text and column heads; 400 (#8a94a9) placeholders, hovered control borders; 300 (#b3bccb) control borders, double rules, table-head rule; 200 (#cfd7de) row rules and card borders; 100 (#dfe5e6) muted fills, hover rows.

### Named Rules
**The Red Pen Rule.** Red pen marks what went wrong and nothing else: a failed result, an error, a destructive act. It is never decoration, never a highlight, never a brand accent.

**The One Ramp Rule.** Every neutral is a step of the navy ink ramp. Do not introduce Tailwind grays or slates; pencil is the single exception and it is reserved for the pending mark.

**The Cover Rule.** Folder green is a field color. It fills whole bands and columns; on card stock it appears only as the primary button, focus ring and link.

## Typography

**Display Font:** Libre Franklin (with ui-sans-serif, system-ui)
**Body Font:** Libre Franklin
**Hand Font:** Kalam 400/700 (with Bradley Hand, cursive)

**Character:** A printed school form filled in by hand. Franklin is set heavy and tight for headings and small, tracked and capitalized for labels; Kalam is loose and human, and appears only where a person has written on the form.

### Hierarchy
- **Display** (800, 2.75rem to 3.75rem to 4.25rem, 1.02, -0.035em): the hero headline on folder green. The 404 title and closing band use 800 at 1.875-3rem.
- **Headline** (700, 1.875rem to 2.25rem, -0.025em): marketing section heads on card stock.
- **Page title** (700, 1.75rem to 2rem, 1.25, -0.02em): the single h1 of an app page in PageHeader.
- **Title** (600, 1.125rem, 1.375, -0.01em, ink-950): card titles; the sample card title runs 700 at 1.25-1.5rem.
- **Lead** (400, 1.125rem, 1.625): intro paragraphs, max 34-40ch on marketing, 62ch on About.
- **Body** (400, 0.9375rem-1rem): descriptions, hints (0.8125rem), sidebar nav (500).
- **Table** (400, 0.875rem; compact 0.8125rem; tabular): results rows; test names 600 ink-950, scores 600 at 1rem right-aligned.
- **Figure** (600, 1.875rem, -0.025em, tabular): totals.
- **Label** (600, 0.6875rem, 0.12em, uppercase, ink-600/700): field labels, column heads, definition terms, the totals captions. Badges use the same cut at 0.1em.
- **Hand remark** (Kalam 400, 1.25rem to 1.375rem, 1.375, ink-700): the card's remark. **Hand note** (Kalam 400, 0.9375rem, ink-600): row notes and the notes textarea.

### Named Rules
**The Printed Label Rule.** Small tracked caps are a form's field labels: they sit beside or above a value, a control or a column. They never sit above a heading as a section kicker.

**The Hand Rule.** Kalam is the hand that fills the form: remarks, notes, and a value written onto a printed field (the sample card's name, the 404 stamp). Headings, labels, buttons, navigation and figures are always printed Franklin.

**The Tabular Rule.** Tables, `time` and totals use tabular figures; scores align right.

## Layout

Marketing pages run in a 1280px container (`max-w-7xl`) with 16/24/32px side padding and a 12-column grid at `lg` (copy on 5 columns, the card on 7). Sections breathe at 80px vertical (112px at `lg`); the hero card hangs 112-176px below the folder band so its lower edge crosses into card stock, and tilts -1.5deg only at `lg`.

The app is a 264px folder-green sidebar beside content at `lg`; below `lg` a 56px folder app bar opens the same sidebar in a left sheet. Content sits in a 1152px column with 16/32/48px padding, 32px vertical gaps between blocks. Auth pages split 5:7 with a folder aside (hidden below `lg`) and a 400px form column.

Rhythm is Tailwind's 4px base: 8px inside label/control pairs, 12px row padding (10px compact), 20px card padding (12px small cards), 24px in key and field lists, 32px between page blocks. Breakpoints are Tailwind defaults (640/768/1024/1280px).

## Elevation & Depth

Depth is physical and shallow: a card lying on a desk, a control ply on the card, and the hero card lifted off the folder. Three shadows only; everything else is flat with ruled borders.

### Shadow Vocabulary
- **Paper** (`box-shadow: 0 1px 0 rgb(17 27 48 / 6%), 0 2px 4px -2px rgb(17 27 48 / 10%), 0 24px 48px -24px rgb(10 32 22 / 45%)`): the lifted card: the landing sample card, the 404 card, alert dialog, sheets, the mark tiles on the auth aside.
- **Sheet** (`box-shadow: 0 1px 0 rgb(17 27 48 / 5%), 0 1px 3px rgb(17 27 48 / 8%)`): app cards and the totals strip, lying flat.
- **Ply** (`box-shadow: 0 1px 2px rgb(17 27 48 / 10%)`): every control: inputs, selects, textareas, filled and outline buttons.

### Named Rules
**The White Ply Rule.** Controls sit on their own white ply (#ffffff, ply shadow, ink-300 border) above the printed card. A control never takes the card's face color, and printed content never takes the ply.

## Shapes

Corners are barely softened, like trimmed card: 3.6px for app cards, badges and the totals strip; 4.8px for buttons, inputs and nav items; 6px for the lifted paper and dialogs. The only round shape is the 404 stamp's pen ellipse.

Structure comes from rules, not boxes. Row rules are 1px ink-200; the table head and section edges are 1px ink-300. **The Double Rule Rule.** Every header band (card headers in the app, PageHeader, the About header, the loading card, the sample card head, the edge of the key and the row breakdown) closes with a 3px double rule in ink-300; it is the system's signature line and is not used mid-content.

## Components

### Buttons
Printed tabs on a ply: firm, flat, small.
- **Shape:** 4.8px radius; heights 28/32/36/44px (xs/sm/default/lg), 600 weight, a 1px press-down on active.
- **Primary:** folder green on folder ink with the ply shadow; hover goes to folder deep.
- **Inverse / Inverse ghost:** for folder fields only. Inverse is folder ink with green text (hover to white); inverse ghost is text-only folder ink with a 10% white hover.
- **Outline:** white ply, ink-300 border, ink-900 text; hover to ink-400 border and card face.
- **Ghost / Secondary / Link:** ink-700 text with ink-100 hover; ink-100 fill; folder-green underlined text.
- **Destructive:** red pen fill, white text, deeper red hover; only in the delete confirmation.
- **Focus:** 2px ring in folder green (folder ink on green fields) offset 2px.

### Badges
- **Style:** the "Sample data" tag: ply fill, ink-300 border, tracked caps label, 3.6px radius, 24px high. Status is never a badge; it is a mark.

### Cards / Containers
- **Corner Style:** 3.6px (app card), 6px (paper).
- **Background:** card face (#f5f8f3).
- **Shadow Strategy:** sheet for app cards, paper for lifted surfaces.
- **Border:** 1px ink-200 on app cards; paper has none.
- **Internal Padding:** 20px (12px small); headers close with the double rule.

### Inputs / Fields
- **Style:** white ply, 1px ink-300 border, ply shadow, 4.8px radius, 40px high, 15px text on `sm+`, ink-400 placeholder.
- **Focus:** border to folder green plus a 3px folder ring at 20%.
- **Error / Disabled:** red pen border with a 3px pen ring at 15%, message below in red pen 13px 500; disabled fills ink-100 at 60% opacity.
- **FormField:** printed label (tracked caps) with an optional aside on the same line, the control, then a hint or the error. Form-level failures use FormAlert: a pen-tinted box (6% fill, 30% border) at the top of the form, never a toast. The notes textarea is set in the hand face.

### Navigation
- **Marketing:** a 64px folder header: wordmark left, About as inverse ghost, Sign in (inverse ghost) and Create account (inverse) right, language switcher; on phones About and language move to the footer.
- **App:** sidebar items 40px, 15px 500, Lucide icon at 18px; rest in folder ink soft, hover 8% white, current item on folder deep with an inner top highlight. Signed-in email and sign-out sit under a 12% white rule at the bottom.

### Report Card (signature)
- **Mark:** a 24px-viewbox SVG stroke with round caps (tick 2.6, circle 2.2, box 1.8 stroke width) in pass, pen or pencil. Decorative; always paired with the status text (hidden visually on phones in tables).
- **ResultsTable:** columns test (with hand note below), status, score, tested at (date folds under the name on phones). Empty state keeps three blank ruled 48px rows under the message.
- **TotalsStrip:** a 4-cell ruled box (2x2 on phones) of label plus 30px tabular figure; the failed count turns red pen only when above zero.
- **SampleCard:** paper surface with double-rule head, a name line filled in by hand, compact rows, and a remark that writes on after the marks.
- **Motion:** stroke draw 700ms on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 220ms on the landing (from 500ms) and 150ms for fresh app rows; remark write-on 900ms at 1.6s; key marks draw on scroll via `animation-timeline: view()` where supported.

## Do's and Don'ts

### Do:
- **Do** fill whole bands and columns with folder green (#1f5c45) and keep work on card stock (#e8eee6 / #f5f8f3).
- **Do** put every control on the white ply (#ffffff, ply shadow, ink-300 border).
- **Do** close every card and page header with the 3px double rule in ink-300.
- **Do** show status as the drawn Mark plus its name, and keep empty tables ruled.
- **Do** use tabular figures for every score, date and total.
- **Do** keep marks static under `prefers-reduced-motion`.

### Don't:
- **Don't** use red pen (#c42f2a) for anything but failed marks, errors and destructive actions.
- **Don't** set headings, labels, buttons, navigation or figures in Kalam; the hand face is for remarks, notes and written-in entries.
- **Don't** put a tracked-caps kicker or eyebrow above a heading; tracked caps are field labels only.
- **Don't** render status as colored pills or badges.
- **Don't** add neutrals outside the navy ink ramp.
- **Don't** add shadows beyond paper, sheet and ply, or a dark theme.
