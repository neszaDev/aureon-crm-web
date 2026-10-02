# Vue UI port: every screen of the CoreUI Vue app, in the Marksheet theme

## Context

An older admin frontend was built in Vue 2 on the CoreUI Pro Vue template. It has a MFU campus
layer: an app launcher, a profile card, sign-in help, a 2FA code step, organisation filters,
multi-language content editors and a QR code card. It also has the ~45 demo pages of the
template itself. The owner asked for all of its functions in this repo, on branch `feature/ui`.

## Decisions (made with the owner, 2026-10-02)

| Question | Decision | Why |
|---|---|---|
| Look | **The Marksheet theme** (`DESIGN.md`, shadcn/ui + Tailwind). The CoreUI/Bootstrap look is not carried over | One design system across the app; Bootstrap 4 SCSS would fight Tailwind's base layer |
| Scope | **Everything**: the campus layer and every template demo page, plus the API layer behind them | The demos double as a component gallery for derived products |
| Base branch | `feature/ui` from `feat/report-card-redesign` | It builds on the shadcn redesign, which is not merged yet |
| Backend | **The Spring backend.** Sign-in/out stay on the existing server-side auth. Data the Spring API does not serve yet is read through `Queries.ts` from typed placeholder data | Keeps the rule that only the server talks to the backend; pages will not change when the endpoints land |

## Route map

Everything lives behind sign-in, under `/dashboard` (locale prefix as usual). Vue paths keep their
shape, so `/base/cards` becomes `/dashboard/base/cards`.

| Vue route | Here |
|---|---|
| `/dashboard` (CoreUI demo dashboard) | `/dashboard/analytics` (the Marksheet overview keeps `/dashboard`) |
| `/theme/*`, `/base/*`, `/buttons/*`, `/charts`, `/editors/*`, `/forms/*`, `/google-maps`, `/icons/*`, `/notifications/*`, `/plugins/*`, `/tables/*`, `/widgets`, `/users`, `/users/:id`, `/apps/invoicing/invoice`, `/apps/email/*` | same path under `/dashboard` |
| `/pages/login`, `/pages/register` | the real `/sign-in`, `/sign-up` (not in the app nav: signed-in users are sent to the dashboard) |
| `/pages/404`, `/pages/500` | `/dashboard/pages/404`, `/dashboard/pages/500` (previews of the error pages) |
| campus layer (`src/projects`, unrouted in Vue) | `/dashboard/campus` (launcher, profile, sign-in help, 2FA, error and loading dialogs), `/dashboard/campus/filters`, `/dashboard/campus/content`, `/dashboard/campus/qr-code` |

The sidebar (`AppNav`) gains the Vue sidebar's sections (Campus, Theme, Components, Extras) as
collapsible groups under the existing Overview / Test results / Account links.

## Library mapping

| Vue | Here | Note |
|---|---|---|
| CoreUI components | `src/components/ui` (shadcn) | added: accordion, alert, avatar, breadcrumb, calendar, carousel, chart, checkbox, collapsible, command, dialog, dropdown-menu, hover-card, input-group, input-otp, kbd, navigation-menu, pagination, popover, progress, radio-group, scroll-area, select, separator, slider, sonner, spinner, switch, tabs, toggle, toggle-group, tooltip |
| `@coreui/vue-chartjs` | shadcn chart (`recharts`) | |
| `CDataTable` | `@tanstack/react-table` | sort, filter, pagination, row details |
| `vue-quill-editor` | Tiptap (`@tiptap/react`, `starter-kit`) | headless, so it takes the theme |
| `vue-codemirror` | `@uiw/react-codemirror` + language packs | |
| `vue-grid-layout` | `@dnd-kit` (sortable cards) | |
| `vue-multiselect`, `vue-select` | shadcn combobox (command + popover) | |
| `v-calendar`, `vue-simple-calendar` | shadcn calendar (`react-day-picker`) + a month grid | |
| `vue-text-mask` | `react-imask` | |
| `vuelidate` | `zod` + `react-hook-form` | already in the repo |
| `vue-qrcode-component` | `qrcode.react` | |
| `vue2-google-maps` | `@vis.gl/react-google-maps` | needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional; the page explains how to enable it) |
| CoreUI icons | `lucide-react`; `@coreui/icons` only for the brand and flag galleries | |
| spinkit, CoreUI toasts | shadcn spinner, `sonner` | |

## Left out, on purpose

- **Google sign-in** (`vue-google-oauth2`): the Spring API has no Google login. The sign-in help
  dialog keeps the contact and manual links; a Google button needs a backend endpoint first.
- **Google Analytics tag** from the Vue `index.html`: it was the CoreUI demo's ID; no analytics
  without a separate decision.
- **socket.io service**: it was never connected in the Vue app (all calls commented out).
- **Desktop notification on every app load**: it is a button on the notifications demo page instead.
- **`xlsx` export** (SheetJS 0.18 from npm has unpatched advisories): the download table exports CSV.

## Backend endpoints the screens expect

Read through `src/libs/api/Queries.ts`; each function returns placeholder data typed like the
Vue API's payloads until the Spring API serves it. When an endpoint lands: add it to the backend,
run `make api-types`, and replace the placeholder in that one function.

| Vue call | Used by | Spring endpoint to add |
|---|---|---|
| `POST /api/v1/organization/explorers`, `.../agencies/explorers`, `.../department/explorers` | campus filters | `GET /api/v1/organizations`, `/agencies`, `/departments` |
| `POST /api/v1/2fa`, `PUT /api/v1/2fa` | 2FA step | `POST /api/v1/auth/2fa/send`, `POST /api/v1/auth/2fa/verify` |
| `POST /api/v1/system/profile` | profile card | `GET /api/v1/users/me/profile` |
| settings (`message`, `status`, `verification`, `auth/message`), `role`, `payment/method`, `payment/transaction` | no screen in the Vue app | add with the screen that needs them |

## Copy

All interface text is in `src/locales/*.json` (en + fr). Sample records (people in tables, mail
senders, invoice lines) are data and live with the component that shows them, like rows from an API.
