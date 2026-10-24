# User guide

How to work in Aureon CRM: the workspace and its members, companies and contacts, leads, the
pipeline, tasks and the inbox, Home, the dashboard and reports, exports, the audit trail and
languages.
Each section says who may do what; the [roles](#roles-at-a-glance) table sums it up. The server
checks every action against the same rules, so a button you don't see is one your role can't use.

## Getting started

1. **Sign up** at `/sign-up` with an email address and a password (or **Sign in** at `/sign-in`).
   Someone who invited you sends a link instead: see [Members](#invite-people).
2. **Create a workspace**: its name, the default currency new deals start in, and its time zone
   (the browser's is suggested). Due times, reminders and report periods use that time zone, wherever
   you are. You become its owner. Create more from the workspace switcher; with several, `/app`
   lists them.
3. The workspace opens on its **Home**: what is yours (see [Home](#home-dashboard-and-reports)).
   A new one offers to create your first records and to invite your team.

The dark rail on the far left has:

- **Home**: your work, your open deals and the workspace's latest activity.
- **Inbox**: your reminders, see [The inbox](#the-inbox).
- **Search records** (`⌘K` or `Ctrl+K`): type at least 2 characters to find active companies,
  contacts, leads and deals; Enter opens the highlighted one. From 1024 px wide it is the
  **Search ⌘K** field in the middle of the bar above the page instead.
- **+ New**: a company, contact, lead or deal (its form, in the side panel), or a task (the task
  list, its dialog open).
- **Your avatar**, at the foot: your profile, the theme (light, dark or the system's), the
  language, and sign out.

Beside it, the sidebar has the workspace switcher, the **Spaces**, **Insights** (Dashboard,
Reports) and **Settings** at the foot. The spaces are a tree of saved views: each space's › opens
its views, each its list at an address of its own:

- Companies and Contacts: **All**, **Mine** (owned by you), **Archived**;
- Leads: **All**, **Mine**, **To follow up** (open leads whose follow-up day has come);
- Deals: **Board**, **List**, **Mine**;
- Tasks: **My tasks**, **Overdue**, **Next 7 days**, **Completed**.

Your browser remembers which spaces are open. The view you are on is marked, and the orbit's
satellite (the dot of the Aureon mark) sits on the current section's icon. The « button (or `⌘\` /
`Ctrl+\`) folds the sidebar into the rail, which then carries the sections as icons (Settings too)
and » to bring it back; your browser remembers that too. The bar above the page says where you
are: the workspace, the section and the record's number. On a phone the rail and the sidebar are
one drawer behind the menu button, and search and the inbox are in the bar.

## Workspace and members

**Settings** holds the workspace's pages:

| Page | What it does | Who can change it |
|---|---|---|
| Workspace | Name, default currency, time zone | Owners and admins (others read it) |
| Members | Who is in, their roles, invitation links | Owners and admins; only owners manage owners |
| Roles | The permission table, and the rules beyond it | Read-only, for everyone |
| Pipeline | The deal stages: add, rename, set the win probability, reorder, delete | Owners and admins |
| Lead sources | Where leads come from: add, rename, archive, delete an unused one | Owners and admins |
| Audit | The workspace's trail of changes and exports | Owners and admins only see it |
| Your profile | Your display name (on your avatar and in history) and your password | You |

Won and Lost are always the last two stages. Changing your password signs you out on every other
device.

### Invite people

**Members → Invite member** asks for an email address and a role and gives you a link. Nothing is
emailed: send the link yourself, privately. It works once, for 7 days, and only for that email
address. The person opens it and creates an account or signs in with that address, and joins with
that role. Pending invitations are listed under the members until they are used or expire; revoke
one to stop its link.

Owners and admins change roles and remove members (an admin can't touch an owner, and the last
owner can't be demoted or removed). Anyone can **leave** a workspace from the Members page, except
its last owner. A removed member's records stay, shown as **Unassigned**, so a manager can hand
them on.

## Companies and contacts

**Companies** are the organisations you sell to; **contacts** are the people, each linked to a
company if you like. Create one from its list (**Add company**, **Add contact**, or the **Add**
row at the end of the list or of a group: a company from its name alone, on Enter; a contact
through its form, filled in with the group's owner and the list's company; a lead from its name and
company (its name alone on a phone: add the company in its panel), in its section's status; a deal through its form, in its section's stage; a task from its
title, due today in Today or without a due date), from the rail's **+ New**, or, in a new
workspace, from Home's first steps. Once you have entered a company's name or website, or a contact's
email or phone, the records that look like it are listed, so the same one isn't entered twice;
saving stays possible.

A record opens in a **side panel** over the list it was opened from, at its own address (a
reload, or the panel's **Open as a full page**, shows it as a full page; ×, Escape or a click
beside it closes it, back to the list where you were). A record's page shows its number (`C-0001` for a company, `P-…` for a contact, `L-…` a lead, `D-…`
a deal, `T-…` a task), its owner, its details, and below them its tasks, its activity timeline and
its **History** (every change, by whom). A company's page also lists its contacts and deals, and
its timeline includes theirs.

- **Log an activity** (a call, an email, a meeting or a note) on any record. Its author can edit or
  delete it; so can managers, admins and owners.
- **Edit** saves only if nobody else saved the record since you opened it; otherwise you are told
  "Someone else changed this" and can reload to see their version.
- **Archive** hides a record from the lists and the search, keeping its history; the list's
  **Archived** view shows archived records, ready to **Restore**. A list row's **…** menu does the
  same. Records are never deleted; only an activity can be.

**The lists** (companies, contacts, leads, deals, tasks) search, filter, sort and page on the
server, and keep all of it in the address, so a view can be bookmarked or shared with a member:

- Companies: search (name, website, phone), industry, owner, active or archived.
- Contacts: search (name, email, phone, company), company, source, tag, owner, active or archived.
- Leads: search, status, source, priority, follow-up on or before a day, owner, active or archived.
- Deals: on the board, search, owner and company; in the list view also contact, stage, status,
  the expected close range, and active or archived.

The rarely used ones (a deal's contact, source and expected close range; a lead's source and
follow-up day) wait behind **More**, which counts those that are on.

- Tasks: search (title), when they are due (overdue, today, the next 7 days, later, no due date,
  completed or cancelled), assignee.

Every list keeps it on one line: the search, a chip per filter (an active one shows its value and
an × that clears it), **Group**, the sort, **Me** (only yours; for tasks, assigned to you) and the
archived view; on a phone all but the search are behind **Filters**. A grouped list shows a section
per group, headed by its status pill or its owner, each with its count and at most 50 rows, then
**View all** for the rest; a section folds away from its heading. Leads are grouped by status,
the deal list by stage (the pipeline's order, then Won and Lost) and tasks by when they are due
(completed and cancelled ones folded at the end), unless **Group** says otherwise (owner, or none);
companies and contacts aren't, unless you group them by owner.

On leads, deals and tasks the **status pill** in each row is also the control: click it for the
statuses the record can move to. The pill waits for the server: if the change is refused (your role,
or someone changed the record first), the old status stays and the reason shows under it, with a
reload when needed. A lead moved to Unqualified asks why; a deal moved to Lost asks why; a task
cancelled asks to confirm. On a phone, a list grouped by status or stage shows no pill in its rows
(each section's heading names the status): change the status from the pill in the record's header.

Click a column heading to sort by it (again to reverse it), or use **Sort by** where a list has
one; choose 20, 50 or 100 rows a page.

Who may change a record: its owner, or a manager, admin or owner of the workspace. A **sales rep**
reads everything in the workspace but edits, archives and moves only the records they own (and the
tasks assigned to them or that they created). Every role can create records; a sales rep owns what
they create and can't give it to someone else.

## Leads and conversion

A **lead** is someone who may become a customer. Its status pill, in the list or at the top of its
page, moves it between **New**,
**Contacted**, **Qualified** and **Unqualified** (which asks why; the reason stays on the lead). A
**follow-up date** puts it in its owner's reminders from that day on, for as long as it is New,
Contacted or Qualified (a lead without an owner is in nobody's).

A qualified lead can be **converted**: the dialog creates a company from the lead's company name,
links an existing company, or uses none; creates a contact from the lead or links an existing one;
and can open a deal (name, amount, currency, stage, expected close date). The new records belong to
the lead's owner. The lead then reads **Converted** and links what it became; its activities and
tasks follow the contact. A converted lead can't be edited, and converting twice (a double click,
a retry) makes nothing new.

## The pipeline

**Deals** opens on the **board**: one column per stage, headed by its coloured pill with its
count and total value per currency, ending with **Add deal** (the form, in that stage). Each card
shows the deal's status track, one segment per open stage filled up to its own; hover a segment to
see who moved the deal there and when. Move a deal to another stage:

- **drag** its card by the handle;
- with the **keyboard**: focus the handle, press Space, move with the arrow keys, Space to drop
  (Escape cancels);
- or open the card's menu: **Move to…**;
- or click its stage pill: in the **List** view, or at the top of the deal's page.

Dropping on **Lost** asks for the reason first; cancelling leaves the deal where it was. **Won**
and **Lost** close the deal and take it off the board: they start as narrow strips that count it
and link to the list, and expand into whole columns with a click; a closed deal can be moved back
to an open stage later. A move the server refuses puts the
card back and says why. On a phone the board shows one stage at a time, and the menu moves cards.

The **List** view filters and sorts all deals, open and closed. A deal's page shows its **status
track** (whoever moved the deal into each stage, and when; the current stage with its days; a
closed deal's Won or Lost) and the **stage history** with every move, by whom and when. A lost deal's page also says why it was lost.

Only a deal's owner, or a manager, admin or owner, gets the handle, the menu and a stage pill that
opens.

## Tasks and reminders

Create a task from **Tasks → Add task** (or **+ New → Task** on the rail), its list's add row, or
**Add task** on a record (it is
then linked to that record and shows on its page; a task on a contact or deal shows on its company
too). A task has a title, a due date and time (in the workspace's time zone), a priority and an
assignee: you, unless you choose someone else, which managers, admins and owners can.

**Tasks** lists the workspace's tasks by when they are due: **Overdue**, **Today**, **Next 7
days**, **Later** and **No due date**, then **Completed** and **Cancelled**, folded. **Me** keeps
yours (what the old **My tasks** tab showed); the **Due** chip keeps one of those sections. Tick a
task's box to **complete** it; its status pill also completes, **cancels** or **reopens** it. Tasks
are never deleted. A task can be changed by its assignee, its creator, or a manager, admin or owner.

### The inbox

The **Inbox** on the rail (in the top bar on a phone) counts your reminders, what needs you now:
your open tasks that are overdue, those due in the next 24 hours, and your open leads whose
follow-up day has come. Its popover lists them by **Overdue**, **Today** and **Upcoming**,
completes a task in place, and links to **All tasks**. The count is refreshed on every page you
open. Reminders appear in the app only: nothing is sent by email, push notification or calendar.

## Home, dashboard and reports

**Home** is yours:

- **My work**: your open tasks that are overdue, due today or in the next 7 days, each section
  headed by its pill (tick a box to complete one), and the leads you should follow up;
- **My deals**: your most recently updated open deals, each with its status track;
- the workspace's **recent activity**.

**Insights › Dashboard** is the workspace's:

- its totals: companies, contacts, open leads, open deals and overdue tasks, each a link to that
  list;
- the **open pipeline** per currency (the amount, and the amount weighted by each deal's
  probability), **won and lost** deals in the period, and the open deals **by stage**;
- **recent activity** and **recent changes**.

The **period** button picks the last 7, 30 (the default) or 90 days, this month, last month, or a
custom range of up to 366 days; days run in the workspace's time zone. On the dashboard only won
and lost follow the period; everything else is as of now.

**Reports** has five tabs: **Pipeline** (open deals by stage and by owner), **Won and lost** (by
month of the period), **Funnel** (the deals created in the period and how far they got),
**Activities** (what each member logged and the tasks they completed in the period) and
**Follow-ups** (the
workspace's overdue tasks, tasks due in the next 7 days and leads to follow up). Each chart has
its data in a table under it (**Table** hides it). Amounts are never converted or added across
currencies: each currency has its own line. When a period starts before the workspace began
recording stage changes, the funnel says so.

Every member sees the dashboard and the reports, for the whole workspace.

## Export

**Export CSV** on the companies, contacts, leads and deals lists downloads the list as it is
filtered (its search, filters and archived view; every page, in the list's default order). The file
is named after the list and the day, such as `companies-2026-10-20.csv`, opens in a spreadsheet
(Thai text included), and holds at most 10,000 rows: narrow the filters if there are more. Every
export is recorded in the audit trail.

Owners, admins and managers can export; sales reps don't see the button.

## The audit trail

**Settings → Audit** lists who changed what in the workspace, newest first: records, members,
invitations, stages, sources and settings, with each changed field from its old value to the new
one, and every export. Filter it by record type and by member. Only owners and admins see it.

Every record's page has its own **History**, which every member can read.

## Languages and themes

The app is in **English**, **French** and **Thai**: choose one from your avatar's menu (or the public
pages' language switch). Dates, numbers and amounts follow the language; Thai dates use the
Buddhist year. The language is part of the address (`/fr/app/…`, `/th/app/…`), so a shared link
opens in its language. The theme is light, dark or the system's, from the same menu.

## Roles at a glance

| | Owner | Admin | Manager | Sales rep |
|---|:-:|:-:|:-:|:-:|
| Read records, dashboard, reports, a record's history | ✓ | ✓ | ✓ | ✓ |
| Create companies, contacts, leads, deals, tasks, activities | ✓ | ✓ | ✓ | ✓ |
| Edit, archive, convert or move their own records | ✓ | ✓ | ✓ | ✓ |
| Edit, archive, convert or move anyone's records | ✓ | ✓ | ✓ | |
| Assign records and tasks to someone else | ✓ | ✓ | ✓ | |
| Export CSV | ✓ | ✓ | ✓ | |
| Workspace settings, stages, lead sources | ✓ | ✓ | | |
| Invite, change roles, remove members | ✓ | ✓ (not owners) | | |
| Read the audit trail | ✓ | ✓ | | |

Someone who isn't a member of a workspace gets "Workspace not found" for every one of its pages,
the same as for a workspace that doesn't exist.
