---
version: 1
slug: "src-app-locale-auth-app"
primary_target: "src/app/[locale]/(auth)/app"
related_targets: ["src/components/crm","src/app/[locale]/(auth)/(center)/invite"]
---

# Surface brief: the Aureon CRM app (`/app`)

Mode: **Operate**. Sales reps, managers, admins and owners of small and medium businesses work their pipeline, records and follow-ups here every day, at a desk or on a phone between meetings, in English, French and Thai.

Job: see what needs doing next and who owns it, find a record fast, move a deal and log what happened, without losing track of ownership.

Constraints: shadcn/ui primitives for every control; light and dark themes; WCAG 2.1 AA; dense but readable (36 px rows); Thai text must wrap and fit; the CRM shell also hosts settings and must survive tables, boards, forms and empty states.

Chosen direction: **Seal and circular** (user-picked on the decision page, 2026-10-18). Memorable moment: the stamp row on every deal — each pipeline stage a box, reached stages carrying the seal of the member who moved it, the open stage showing its exact days.

Unresolved: none; error colour must stay distinct from the seal vermilion (crimson + icon + words).

## Direction contract

THESIS: Every step of a relationship is signed. The pipeline reads as an approval circular stamped stage by stage; it refuses the default navy-sidebar, blue-button KPI-tile CRM.

OWN-WORLD: Vermilion seal rail (#c8361c, deep #9e2812), bond-paper panels (#fbfbf9) on a grey ground (#eff0ec), sumi ink text (#1c1d21 / #5b5e66), hairline rules (#d9dad4); people as round vermilion ink seals with initials; Anuphan for Latin and Thai; mono record numbers (D-0042); figures large, labels small; dark theme as lacquer black with the same seal.

STORY: The user sees what is theirs, what is late, and how far each deal has travelled, then acts in one click.

FIRST VIEWPORT: Rail left (workspace, nav); top bar with search, reminders, your seal; KPI strip; deals with stamp rows; follow-ups beside them.

FORM: Seal and circular, 6 of 7 on the grounded list; seed:175b75073d43f2aa. Raises: exact days in stage; focus reveals on board cards; density with one hairline system; record numbers; fixed-size stage boxes; hierarchy by scale.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
