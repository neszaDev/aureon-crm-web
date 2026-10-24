# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People in small and medium-sized businesses who work their sales pipeline here every day, at a
desk or on a phone between meetings, in English, French or Thai. Each person has one role per
workspace (a workspace is the account of one business):

- **Owner**: created the workspace and manages everything, including other owners.
- **Admin**: runs the workspace day to day: members, roles, pipeline stages and lead sources.
- **Manager**: leads a sales team, works with every record, reassigns work and exports data.
- **Sales representative**: works their own leads, deals and tasks, and reads the rest of the
  workspace so the team can collaborate.

Developers are the second audience: they buy or clone this template to start their own CRM on top
of the [aureon-crm-api](https://github.com/neszaDev/aureon-crm-api) API (Spring, built from
[spring-postgres-boilerplate](https://github.com/neszaDev/spring-postgres-boilerplate)),
read the code, run it, and extend or rebrand it.

## Product Purpose

Aureon CRM is a multi-user CRM for small and medium-sized businesses: companies, contacts, leads,
deals, tasks and activities that link to each other, with a dashboard and reports computed from
the stored data. Its job is to show each person what needs doing next and who owns it, find a
record fast, move a deal and log what happened, without losing track of ownership.

Success means a sales team can run its pipeline in it without surprises, and a developer can go
from clone to a running, signed-in workspace against the real backend quickly, then extend it
without rediscovering the architecture.

## Positioning

A CRM that works like the team's work OS: one calm shell, every list a set of coloured status
sections, every record a click away in a side panel. Each record's status is one pill that is also
the control, and a deal's track shows how far it has come and who moved it at each stage. It
refuses the boilerplate admin page: a title and a paragraph, a stacked filter form, a table in a
card.

As a template, it is wired end to end to one specific Spring backend. The Next.js server holds the
backend's JWT and rotating refresh tokens in httpOnly cookies, API types are generated from the
backend's OpenAPI spec, and CI runs end-to-end tests of the real frontend against the real backend.

## Operating Context

- Local only for now: `make setup`, the backend's CRM branch on `http://localhost:8081`, then
  `pnpm dev`. No deployment, domain or paid service.
- The CRM lives at `/app`, one workspace per URL (`/app/{workspaceId}/...`). The boilerplate's
  demo pages stay at `/dashboard/**`, reachable from the account menu, as a component gallery.
- Repo flow: feature branch → PR into `dev` → release PR `dev` → `main`.
- Rules for agents and humans live in `AGENTS.md`; the CRM's specification lives in the backend
  repo (`docs/crm/`).

## Capabilities and Constraints

- Workspaces: any signed-in user can create one and becomes its owner; people join only through a
  single-use invitation link (7 days, invited email only) that an owner or admin copies and
  shares. A user can belong to several workspaces with a different role in each.
- Records: companies, contacts, leads (with conversion), deals on one pipeline with stage history,
  tasks and activities. Companies, contacts, leads and deals are archived and restored, never
  deleted; tasks are cancelled; activities can be deleted by their author or a manager. Money is
  decimal with an ISO 4217 currency and is never converted between currencies.
- Insights: a dashboard, reports and in-app reminders computed from stored data, in the
  workspace's time zone. No statistic implies history the data does not have.
- Permissions come from the backend (`GET /workspaces/{id}` → `permissions`); the UI hides actions
  the caller can't take and still handles the backend's 403.
- Languages: en (default), fr, th. Every user-visible string lives in `src/locales/*.json` and
  exists in all three.
- Only the server talks to the backend: server actions for writes and query modules for reads.
  Client components never call it.
- No SaaS integrations: no email sending, calendar sync, telephony, analytics or monitoring, and
  no frontend database. Adding one needs a recorded decision.
- Light and dark themes, WCAG 2.1 AA, Thai text that wraps and fits.

## Brand Commitments

- "Aureon CRM" is a placeholder name: derived products rename it in `AppConfig.name` and the
  `Brand` copy in `src/locales`.
- The chosen identity (user-pinned 2026-10-23, replacing "Seal and circular") is the work-OS
  canon at the craft level of ClickUp, Linear and Attio, in Aureon's own identity and never
  ClickUp's branding: an ink-violet rail beside a cool off-white sidebar and a white canvas, Aureon
  violet for actions, selection and focus, status colours that do the work (pills, sections, the
  track), people as initials on their member colour, the orbit mark (a ring with one satellite
  dot), Inter with Anuphan for Thai. The tokens live in `src/styles/global.css`; the system is
  documented in `DESIGN.md`.
- The landing page keeps the user's decisions: composition "A · Two desks", the main call to
  action "Create a workspace" (never "Start free"), 44 px actions on that page only.
- Upstream credit to ixartz's Next.js Boilerplate (MIT) stays on the about page.

## Evidence on Hand

- A product specification, permission matrix and API contract in the backend repo.
- No users, customers, testimonials, metrics or adoption numbers. Future work must not invent
  them.

## Product Principles

1. **Ownership is always visible.** Every record shows who owns it and who moved it; nothing
   changes hands silently.
2. **What persists is what shows.** No optimistic UI that hides a failed write; the backend is the
   source of truth for rules, permissions and errors.
3. **Dense but readable.** Rows, figures and stage stamps carry the information; hierarchy comes
   from scale, not decoration, in every language.
4. **Production-grade defaults.** Accessibility, i18n, error states and security stay at the level
   a real product needs, because developers copy whatever the template shows them.
5. **Easy to rebrand.** The name, copy and tokens are the only things a derived product has to
   change to make it its own.
