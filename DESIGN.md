---
name: Aureon CRM
description: A work OS for the pipeline; one calm shell, every list a set of coloured status sections, every record a click away in a panel.
colors:
  violet: "#5a45e0"
  violet-hover: "#4a36c7"
  violet-tint: "#efedfd"
  on-violet: "#ffffff"
  rail: "#1d1a2e"
  rail-raised: "#2e2a45"
  sidebar: "#f7f7fa"
  canvas: "#ffffff"
  muted: "#f1f1f5"
  ink: "#1f2030"
  ink-2: "#5d6072"
  rule: "#e6e6ec"
  input-stroke: "#878b9f"
  status-blue: "#2f7de1"
  status-blue-tint: "#e4eefb"
  status-blue-ink: "#2769bd"
  status-teal: "#10929a"
  status-teal-tint: "#dff1f2"
  status-teal-ink: "#0b6f75"
  status-amber: "#e69a1c"
  status-amber-tint: "#fcf2e1"
  status-amber-ink: "#956412"
  status-green: "#1f9d63"
  status-green-tint: "#e2f2eb"
  status-green-ink: "#187a4d"
  status-red: "#d8433a"
  status-red-tint: "#fae7e5"
  status-red-ink: "#bc3a32"
  status-slate: "#8b8fa3"
  status-slate-tint: "#f0f0f3"
  status-slate-ink: "#686b7a"
  avatar-teal: "#0e7490"
  avatar-orchid: "#b4367a"
  chart-amber: "#c98410"
  dark-rail: "#120f1f"
  dark-rail-raised: "#262140"
  dark-sidebar: "#1b1925"
  dark-canvas: "#17151f"
  dark-card: "#1f1c2a"
  dark-muted: "#2a2737"
  dark-ink: "#ecebf2"
  dark-ink-2: "#a4a2b6"
  dark-rule: "#2f2c3d"
  dark-input-stroke: "#6f6c82"
  dark-violet: "#6956e3"
  dark-violet-tint: "#2e284f"
  dark-violet-ink: "#9689eb"
  dark-status-blue-tint: "#222f4f"
  dark-status-blue-ink: "#5f9be8"
  dark-status-teal-tint: "#1a3439"
  dark-status-teal-ink: "#3cb0b8"
  dark-status-amber-tint: "#473527"
  dark-status-green-tint: "#1f3635"
  dark-status-green-ink: "#45ae7e"
  dark-status-red-tint: "#44242d"
  dark-status-red-ink: "#e3766f"
  dark-status-slate-tint: "#353342"
  dark-status-slate-ink: "#9a9eaf"
typography:
  display:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "5rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  display-tablet:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  display-close-phone:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline-phone:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  language-sample:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  desk-statement:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.375
  record-title:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body-reading:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  row:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
  micro:
    fontFamily: "Inter, Anuphan, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  row: "36px"
  control: "32px"
  control-phone: "36px"
  landing-action: "44px"
  topbar: "48px"
  rail: "56px"
  sidebar: "240px"
  page-x: "28px"
  page-x-phone: "16px"
components:
  button-primary:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.on-violet}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "{spacing.control}"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.violet-hover}"
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "{spacing.control}"
  button-outline-hover:
    backgroundColor: "{colors.muted}"
  button-landing-primary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.violet}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "{spacing.landing-action}"
    typography: "{typography.body-reading}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "{spacing.control}"
  toolbar-chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "{spacing.control}"
    typography: "{typography.row}"
  toolbar-chip-on:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.violet}"
  status-pill:
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
    typography: "{typography.label}"
  status-pill-amber:
    backgroundColor: "{colors.status-amber-tint}"
    textColor: "{colors.status-amber-ink}"
  list-row:
    height: "{spacing.row}"
    padding: "6px 12px"
    typography: "{typography.body}"
  panel:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "20px"
  rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.on-violet}"
    width: "{spacing.rail}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.ink}"
    width: "{spacing.sidebar}"
  nav-item-current:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.violet}"
    rounded: "{rounded.md}"
---

# Design System: Aureon CRM

## Overview

**Creative North Star: "The Pipeline's Work OS"**

Aureon works like the tool a sales team already lives in: one calm shell (an ink-violet rail, a cool off-white sidebar holding a tree of saved views, a white canvas under a 48 px top bar), and inside it every list is a set of coloured status sections and every record opens in a side panel without losing the list. Its craft peers are ClickUp, Linear and Attio; its identity is Aureon's own, never ClickUp's: the Aureon violet, the ink-violet rail and the orbit mark, a ring broken at the upper right with one satellite dot beyond the gap.

Density is the work-OS kind: 13 to 14 px UI text, 36 px rows, 32 px controls on a desktop (36 px on phones), tabular figures, hairlines rather than boxes. Colour is spent on meaning. Violet means "act, selected, focused"; the status hues mean where a record stands, and they always sit beside the words that say it. Surfaces lie flat; only what floats (menus, popovers, tooltips, the record panel, dialogs) casts a shadow. Dark is the same structure on violet-black, every pair rechecked.

The status pill is the system's signature: a lead's status, a deal's stage or a task's state is one coloured pill that is also the control that changes it; grouped lists are headed by the same pill; the record's header draws the whole track with the current step filled and the satellite over it.

**Key Characteristics:**
- Ink-violet rail (56 px), off-white sidebar (240 px, folds into the rail), white canvas; dark is violet-black.
- Aureon violet for primary actions, selection and focus only.
- Seven status tones, each a hue, a tint and an ink, applied with `data-tone`.
- Inter for the UI, Anuphan for Thai; 13/14 px text, tabular figures.
- 6 px controls, 8 px panels, full-round pills and avatars; hairline borders.
- Flat panels; shadows only on floating layers.
- The orbit mark, and its satellite as the "current" marker.

## Colors

A neutral, slightly cool workspace where one violet acts and seven status tones inform.

### Primary
- **Aureon Violet** (violet): the primary button fill (white text at 6.25:1), the current rail item, focus rings, caret, the selection wash, the violet ink of links and active tabs, and the public pages' brand fields (header, hero and closing bands, the auth aside). Hover deepens to **Violet Pressed** (violet-hover). **Violet Haze** (violet-tint) fills a current sidebar item and a toolbar chip that is on. In dark the fill lifts to dark-violet, the tint deepens to dark-violet-tint (the landing's band in dark, carrying white at 13.7:1) and violet text becomes dark-violet-ink (6.1:1 on the canvas).

### Secondary
- **Ink Violet** (rail): the global rail, its raised item (rail-raised), and the deep field under the landing's developer commands. White on it is 16.9:1.

### Tertiary
The status tones. Each is a triplet: the hue (`--status-<tone>`) for dots, track segments and chart fills that sit beside their words; the tint for a pill's fill; the ink for text on the tint or the canvas (4.5:1 or more on both, in both themes). Any element with `data-tone="<tone>"` gets them as `--tone`, `--tone-tint` and `--tone-ink`.
- **Signal Blue** (status-blue): new leads, open tasks, the first open stage, Companies, the coming week.
- **Lagoon Teal** (status-teal): the second open stage of four or more, so neighbouring stages never share a tone. Hue 3.8:1 on white and 4.8:1 on the dark canvas; its ink 5.1:1 on its tint and 5.9:1 on white (dark: 5.1:1 and 7:1).
- **Aureon Violet** (as status-violet): contacted leads, the middle open stage, Deals, later dates.
- **Harvest Amber** (status-amber): qualified leads, the last open stage, Leads, due today, medium priority. Its hue is 2.3:1 on white; amber words are always status-amber-ink.
- **Won Green** (status-green): converted, won, completed, Contacts.
- **Signal Red** (status-red): lost, overdue, high priority, Tasks; as danger (the red ink) always with an icon and words.
- **Quiet Slate** (status-slate): unqualified, cancelled, no date, low priority, a stage the list doesn't hold.

Open stages take the walk blue → teal → violet → amber in pipeline order: up to four spread over it (the first blue, the last amber; three are blue, violet, amber), more cycle through it, so neighbouring open stages never share a tone. Then green (won) and red (lost). Semantic aliases follow the inks: danger = red ink, warning = amber ink, success = green ink, info = blue ink.

People take one of eight avatar colours by member id (violet, the blue, green, red, amber and slate inks, **Deep Teal** avatar-teal, **Orchid** avatar-orchid), white initials at 5:1 or more. Charts take five colours: violet, blue, green, **Chart Amber** (chart-amber, 3.1:1 on white) and red; in dark, the inks.

### Neutral
- **Canvas** (canvas): the page, panels, cards and controls (dark-canvas, and dark-card for panels and controls, in dark).
- **Cool Paper** (sidebar): the sidebar and the board's column wells.
- **Mist** (muted): hover and pressed fills, the secondary button, code chips, disabled fields.
- **Ink** (ink) and **Slate Ink** (ink-2): text and secondary text (ink-2 is 5.8:1 on the sidebar).
- **Hairline** (rule): every divider and panel border.
- **Control Stroke** (input-stroke): input and checkbox borders, 3:1 or more on canvas and sidebar in both themes (WCAG 1.4.11).

### Named Rules
**The Hue Beside Its Words Rule.** A status hue is only ever a dot, a track segment or a chart fill next to the words that name it. Light amber (2.2:1 on the sidebar) and slate (3:1) are accepted only that way, never alone as a bar, stripe, icon or text colour. Anything that must read alone takes the `-ink` token.

**The Violet Acts Rule.** Violet is for the primary action, what is selected or current, and focus. It never colours an error, and as a status it always comes with its pill's words.

**The Paired Theme Rule.** Every pair is checked in light and dark: text 4.5:1 or more, UI strokes and meaningful fills 3:1 or more. A new token lands with its dark value and both ratios.

## Typography

**Display Font:** Inter (Anuphan for Thai, then ui-sans-serif, system-ui)
**Body Font:** Inter (Anuphan for Thai)
**Label/Mono Font:** the system mono, only for record numbers, commands and code

**Character:** One neutral grotesk carries everything, set tight and bold only at landing scale; Anuphan takes over glyph by glyph for Thai, which gets looser line-heights and no tracking.

### Hierarchy
- **Display** (700, 80px on desktop, 60px tablet, 44px phones, 1.02, -0.035em): the landing's one thesis line. Nowhere in the app.
- **Display Tablet** (display-tablet, 700, 60px, 1.05): the thesis from 640 px and the closing band's heading from 1024 px; **Display Close Phone** (display-close-phone, 40px): the closing band's heading on phones, and the about page's h1 there.
- **Headline** (700, 44px desktop / 32px phones as **Headline Phone**, headline-phone, 1.1, -0.03em): landing section headings.
- **Record Title** (600, 24px, -0.01em): a record's name in its header, the record form's name input, and the auth aside's statement.
- **Title** (600, 20px, 28px leading): a page's h1 (lists, settings, a state that stands in for a page); the dashboard's line of figures.
- **Language Sample** (language-sample, 600, 26px): the landing's three language samples. **Desk Statement** (desk-statement, 500, 22px): the hero desks' statements from 1024 px (18px below).
- **Body Reading** (400, 15px, relaxed): landing prose and notes, card descriptions, a record header's figure (semibold); the landing lede at 18px.
- **Body** (400–500, 14px): table cells, buttons, forms, the default.
- **Row** (500, 13px): toolbar chips, view tabs, inline-add rows, property chips, captions, the panel's location line.
- **Label** (600, 12px): status pills, the track's stage names, badges; table heads at 500.
- **Micro** (500, 11px): bylines under a full track, counters, the "More" count, initials in 20 and 24 px avatars and workspace marks.

### Named Rules
**The Bracket Size Rule.** Off-scale sizes are written `text-[…rem]`, never as a custom named `text-<name>` utility: the project's `cn` reads an unknown `text-<name>` as a colour and drops the element's text colour. The app's ramp is 11/12/13/14/15/16/20/24 px.

**The Thai Breathes Rule.** Under `:lang(th)` line-heights open (1.6 on small text, 1.65 body, 1.35 on display, 1.5 in a record form's name input, which would clip its marks) and letter-spacing returns to normal on headings, labels, table heads and badges.

**The Tabular Rule.** Tables, times and figures use tabular numerals; record numbers are mono and dimmed.

## Layout

The app is a three-column shell. The **rail** (56 px, ink violet) holds the mark, Home, the inbox, "+ New", the record search below 1024 px, and the account avatar at its foot. The **sidebar** (240 px, cool paper, hairline right edge) holds the workspace switcher, Spaces as a tree of saved views (each space on a 20 px tinted icon chip in its tone, expanding to its views), Insights and Settings; collapsed by the viewer, or by default from 768 to 1279 px, it folds into the rail so there is one strip. Below 768 px the sidebar lives in a drawer, always expanded. The **top bar** (48 px, hairline under) carries the location on the left and, from 1024 px, the "Search ⌘K" field centred (320 px, 384 px from 1280 px).

The canvas pads 28 px on a desktop and 16 px on phones. A list page is: the title with its primary action, view tabs (List · Board) on a hairline, one toolbar line (search, filter chips, More, Group, Sort, Me, archived; Export at the end; below 768 px all but the search move into a "Filters" sheet), then status sections of 36 px rows. The board lays stages as 224–320 px columns on cool-paper wells, scrolling sideways with a canvas-coloured fade at the right edge; Won and Lost start as 40 px strips. The record panel slides in from the right at min(920 px, 92vw), with its own 48 px header.

The landing is a 76 rem (1216 px) frame: a full-bleed violet band holding the nav, the sample deal, the thesis and two desks split by a white hairline; the board capture laid across the band's lower edge; then rows with an 800 px main column and a hairline developer margin beside each.

Spacing runs on the 4 px grid; 6 px gaps inside controls and between toolbar items; landing rows pad 64–88 px vertically.

### Named Rules
**The Control Height Rule.** Rows are 36 px. Controls (buttons, inputs, chips) are 32 px from 640 px and 36 px on phones. 44 px actions exist on the landing only (the hero's and the closing band's two buttons).

## Elevation & Depth

Flat by default, with depth from tone (rail, sidebar, canvas) and hairlines. Panels, cards, tables and controls carry no shadow; the demos' ply and sheet shadow tokens resolve to nothing. Shadows appear only on layers that float above the page.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 4px 12px -2px rgb(29 26 46 / 10%), 0 12px 28px -6px rgb(29 26 46 / 14%)`): menus, popovers, tooltips, the chart tooltip, the skip link, the bulk bar and its alert; a board card on hover (it can be picked up) and its dragged copy.
- **Overlay** (`box-shadow: 0 12px 32px -8px rgb(29 26 46 / 18%), 0 32px 64px -16px rgb(29 26 46 / 24%)`): the record panel and sheets, dialogs, and the landing's capture sheet that crosses the band.
- In dark both switch to black (35/45% and 45/55%).

### Named Rules
**The Only What Floats Rule.** A shadow means "this is above the page". Panels lie flat on hairlines; nothing at rest is lifted.

## Shapes

Gently rounded and consistent: 6 px for controls (buttons, inputs, chips, nav items, tooltips), 8 px for panels, cards, menus, popovers, dialogs and board columns, 12 px for the top of a phone's bottom sheet; full round for status pills, avatars, track segments and counters. Space icon chips have 5 px corners. Borders are 1 px hairlines; control borders take the 3:1 stroke. Unassigned is a dashed ring.

The orbit mark is a 290° arc (stroke 3 on a 24 grid) open at the upper right, with a solid satellite dot beyond the gap, drawn in `currentColor`: violet on light, white on the rail and brand fields, violet on white in the app icon.

### Named Rules
**The Satellite Rule.** The mark's satellite (a 6 px dot) marks what is current: the active rail item, the current sidebar item and the current stage on a track, at the upper right as in the mark. It is decorative and never the only cue: the item is also filled, set heavier or named.

## Components

### Buttons
- **Shape:** gently rounded (6 px), flat, 32 px tall (36 px on phones), 14 px medium, 12 px sides.
- **Primary:** violet fill, white text; hover violet-hover; pressed nudges down 1 px.
- **Hover / Focus:** 150 ms colour transitions; a 2 px violet ring with a 2 px offset in the background colour.
- **Outline / Ghost / Secondary:** a hairline on the canvas, a bare text button, or a mist fill; all hover to mist.
- **Destructive:** red-ink fill with white in light; in dark a 10% red tint with red-ink text (14% on hover, 4.58:1).
- **Landing:** on violet fields the main action is white with violet text (6.25:1 in both themes) and the second a white outline; both 44 px, 15 px text, ringed in white.

### Status Pill (signature)
A 24 px full-round pill: the tone's tint, its ink at 12 px semibold, an 8 px dot in the hue. With a menu it is the control: a chevron, the tone's border on hover and while open, read as "Status: Qualified". While a change is on its way (pending) a spinner replaces the dot and it is busy; pending or disabled, it keeps the focus but opens nothing (disabled at 60% opacity). Its look lives with the status colours so server-drawn pages (the landing, the sign-in sample, board headings) draw it without the menu code.

### Status Track
A deal's progress as 6 px full-round segments, one per open stage, filled in the stage's hue up to the current one (hairline grey after), the satellite over the current segment, and the stage's name in its ink with the days in it beside. Full (in a record header) writes each stage's name under its segment, and who moved the deal there and when. Every segment has a tooltip and screen-reader text; the track is named "Stage 2 of 4: Needs analysis".

### Status Section
A grouped list's group: a 36 px heading that is the collapse button (caret, the status pill or an owner, the count in muted tabular figures), a hairline, its rows, and "View all N" in violet ink when it shows only some.

### Lists and Rows
36 px rows on hairlines, 12 px cell padding, 12 px muted table heads. A 16 px select box leads each row (shown on the row's hover or focus, on touch, and while anything is selected; the head's box selects its section and shows a dash while only some is); a selected row takes the violet tint. The record's name is the link (underlined on hover), its number in dimmed mono beside it (hidden on phones), a "…" menu at the end. On a phone (below 640 px) the column heads go (sort lives under the toolbar), the select boxes always show (a 36 px target), a section's select-all box moves into its heading row before the pill (an ungrouped list gets a "Select all" line above it), the name wraps, and a second 13 px muted line under it says what the hidden columns would: a deal's amount (tabular, in ink), its owner's avatar and expected close; a lead's owner and source; a company's owner and industry; a contact's owner and company; a task's due time (short, "Oct 20, 4:40 PM", the year only outside the current one, never cut) and linked records. Its "…" is a 36 px control there. **Inline Add Row:** the last row of a list or group, a + over the select boxes and muted 13 px text where the names start; typed into, Enter creates, the row waits for the server (spinner), and an error stays under it with the text kept.

### Bulk Bar
While rows are selected, an ink-violet toolbar (rail; in dark the lighter rail-raised ink, dark-rail-raised, so it stands off the violet-black canvas by its fill, not only its ring; 8 px corners, the float shadow, a 10% white ring) stays 16 px above the foot of the screen, centred under the list: "N selected" in 13 px semibold, then only the actions every selected record allows as rail-style controls (white at 80%, a white wash on hover or open, the on-rail focus ring), menus opening upward, and × to clear. It keeps to one row: below 640 px each action is its icon alone (named for assistive technology, its name in a tooltip where there is hover), and should the actions still not fit they scroll inside the bar between the count and ×, never the page. While records are on their way it counts them ("Updating 3 of 7") with a spinner; refusals rise above it in a popover-coloured alert, a red-ink icon and the count, then each record by name with the server's reason.

### Chips (toolbar)
- **Style:** a 32 px control on a hairline over the canvas, 13 px medium. Filter Chip, Group, Sort and Me share it.
- **State:** on, it fills violet-tint with violet-ink text; a set **Filter Chip** shows its value (cut short, whole in its tooltip) and an × that clears it. **More Filters** gathers rare filters behind one chip with a violet count badge.

### View Tabs
List · Board as 36 px links, 13 px medium, muted until current; the current one is ink with a 2 px violet-ink underline on the tabs' hairline.

### Record Panel and Record Form
The panel is a right sheet at min(920 px, 92vw) with the overlay shadow, a 48 px hairline header (the location in 13 px muted, open-full-page and ×), and the record's page inside. A record form opens on the name as a 24 px semibold input with no field surface until hovered, then a wrapping row of **Property Chips**: 32 px hairline chips with an icon and the value (the property's name, muted, while empty) that open the field in a popover; an error turns the chip red and is written under the row.

### Cards / Containers
- **Corner Style:** 8 px.
- **Background:** canvas (dark-card in dark); board wells in cool paper.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1 px hairline.
- **Internal Padding:** 20 px (12 px for small and board cards).

### Inputs / Fields
- **Style:** canvas fill, 1 px control stroke deepening to slate ink on hover, 6 px corners, 32 px (36 px on phones), 16 px text on phones (no zoom on focus) and 14 px from 640 px.
- **Focus:** the page's 2 px violet outline with a 2 px offset.
- **Error / Disabled:** red-ink border; disabled on mist at 60%.

### Navigation
Rail items are 40 px, white at 75% on ink violet, hovering to white on a 10% white wash; the current one is filled violet with an inset white hairline and the satellite. Sidebar items are ink on cool paper; the current page is violet-tint with semibold violet ink and the satellite; a space holding the current view is set semibold in violet ink. "+ New" is a 36 px white disc on the rail. On phones the rail and sidebar move into a drawer; the top bar keeps the search and the inbox as icons.

### Person Avatar
Round, white semibold initials on the member's colour (20, 24 or 32 px); unassigned is a dashed ring in the control stroke. With a title it is an image of the name with a tooltip.

### Crm State
What stands in for a page or panel (an error, no access, nothing found): a 40 px icon tile (mist, or the red tint and ink for an error), a 20 px semibold title, one or two sentences in muted text (60ch), then the ways on as buttons.

### Landing
The app's world on a public page: violet bands (header, hero, closing) carrying white, the deep violet tint in dark; commands in mono on ink violet; a sample deal drawn in HTML from the app's own pill and track (its track fills in 600 ms, already filled under reduced motion); real captures of the demo workspace as sheets with the overlay shadow, each beside a hairline developer note whose hover rings its spot on the capture. Every shipping raster carries a `.webp.json` provenance sidecar saying how it was made (real capture, by which script, when).

## Do's and Don'ts

### Do:
- **Do** apply status colour through `data-tone` and its hue, tint and ink; write status words in the ink.
- **Do** put a status hue only beside the words that name it (dots, track segments, chart fills).
- **Do** keep rows at 36 px and controls at 32 px (36 px on phones); keep 44 px for the landing's two main actions.
- **Do** separate with 1 px hairlines and lie panels flat; give shadows only to menus, popovers, tooltips, the record panel, sheets and dialogs.
- **Do** mark the current item with the satellite plus a fill, weight or name.
- **Do** write off-scale sizes as `text-[…rem]`.
- **Do** check every new pair in light and dark: 4.5:1 for text, 3:1 for strokes and meaningful fills.
- **Do** give every shipping raster a `.webp.json` provenance sidecar.

### Don't:
- **Don't** use light amber or slate alone as a bar, stripe, icon or text colour.
- **Don't** add a custom named `text-<size>` utility; `cn` drops the element's colour.
- **Don't** shadow a panel, card or table at rest.
- **Don't** let the satellite or a colour be the only cue for what is current or what a status is.
- **Don't** use ClickUp's name, logo, violet or gradient.
- **Don't** use the boilerplate demo's Marksheet tokens (`paper`, `folder`, `ink-*`, `pass`, `pen`, `pencil`, `.form-label`, `.paper`) in new UI; they exist for the /dashboard demos only.
