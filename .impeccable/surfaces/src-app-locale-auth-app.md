---
version: 1
slug: "src-app-locale-auth-app"
primary_target: "src/app/[locale]/(auth)/app"
related_targets: ["src/components/crm","src/app/[locale]/(auth)/(center)"]
---

# Surface brief: the Aureon CRM app (`/app`)

Mode: **Operate**. Sales reps, managers, admins and owners of small and medium businesses work their pipeline, records and follow-ups here every day, at a desk or on a phone between meetings, in English, French and Thai.

Job: see what needs doing next and who owns it, find a record fast, move a deal or a lead along and log what happened, without losing track of ownership.

Constraints: shadcn/ui primitives restyled for every control; light and dark themes; WCAG 2.1 AA; 36 px rows; Thai text must wrap and fit; the shell also hosts settings, tables, boards, forms and empty states; reads only through query modules, writes only through server actions; no optimistic UI that hides a failed write.

Chosen direction (user-pinned 2026-10-23, replacing "Seal and circular"): **work-OS canon at ClickUp's craft level, in Aureon's own identity.** The user asked for the app to work and look like ClickUp, with four must-haves: sidebar with a workspace tree, view tabs plus a one-line toolbar, grouped lists with inline add, and a record side panel. Craft peers: ClickUp, Linear, Attio. No ClickUp branding (name, logo, its exact violet or gradient).

Memorable moment: the status pill. Every record's status (lead status, deal stage, task state) is one coloured pill that is also the control; lists group into sections headed by the same pill; the side panel's header shows the whole track with the current step filled.

Unresolved: none.

## Direction contract

THESIS: A CRM that works like the user's work OS: one calm shell, every list a set of coloured status sections, every record a click away in a panel. It refuses the boilerplate admin page (title, description, stacked filter form, table in a card).

OWN-WORLD: Ink-violet global rail (#1d1a2e) beside a cool off-white sidebar (#f7f7fa) and a white canvas; Aureon violet (#5a45e0, hover #4a36c7, tint #efedfd) for primary actions, selection and focus; status colours do the work (blue #2f7de1, amber #e69a1c, green #1f9d63, red #d8433a, slate #8b8fa3, violet); Inter for UI, Anuphan for Thai; 13–14 px UI text, tabular figures; 6 px radii, hairline #e6e6ec borders, soft offset shadows only on floating layers; Aureon orbit mark (a ring with one satellite dot).

STORY: The user lands on Home, sees what is overdue and what is theirs, jumps into Deals, regroups by stage, changes a stage from the pill, opens a deal in the panel, logs a call, closes the panel, and never loses the list.

FIRST VIEWPORT: Rail (56 px) far left: Aureon mark, Home, Inbox, Search, + New, then the user's avatar at the bottom. Sidebar (240 px): workspace switcher, Spaces as a tree of saved views (Companies, Contacts, Leads, Deals, Tasks on coloured icon chips, each expanding to its views, e.g. Deals ▸ Board · List · My deals), Insights (Dashboard, Reports), Settings; collapsed, the sidebar folds into the rail so there is one strip. Top bar (48 px): location on the left, a search field "Search ⌘K" in the centre. Canvas: title with view tabs (List · Board), toolbar (Search, Filter chips, Group, Sort, Me, Export, + Add on the right), then status sections with 36 px rows. The orbit's satellite marks what is current: the active nav item and the current stage on a track.

FORM: work-OS canon (ClickUp-class), user-pinned, no roll; seed: none (pinned by the user). The identity axis inside the canon was delegated ("Claude decide which look best") and decided as the Aureon violet, the ink-violet rail and the orbit mark; a roll would have re-opened the direction the user fixed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
