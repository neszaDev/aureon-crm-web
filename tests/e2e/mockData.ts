import { randomBytes } from 'node:crypto';

// The data the e2e tests create: fictional but realistic teams, people, companies, contacts and
// deals, so that what a test leaves in the database reads like a small business's CRM. Every test
// still seeds its own workspace with them. Domains are `.example` only (RFC 2606), never real.

/** The workspaces the tests name, with the email domain of their people. */
export const TEAMS = {
  // Every test's own workspace, unless it needs another.
  default: { name: 'Northwind Supply', domain: 'northwind.example' },
  // A second workspace: one to switch to, or the outsider's.
  other: { name: 'Harbor & Pine Outfitters', domain: 'harborpine.example' },
  // What the default workspace is renamed to.
  renamed: { name: 'Northwind Trading', domain: 'northwind.example' },
  // The workspace another site tries to frame.
  framed: { name: 'Lakeside Dental Group', domain: 'lakesidedental.example' },
};

/** Members' display names, by the role they play in the tests. */
export const PEOPLE = {
  owner: 'Olivia Bennett',
  otherOwner: 'Avery Collins',
  admin: 'Hana Sato',
  manager: 'Mia Rossi',
  otherManager: 'Morgan Reyes',
  rep: 'Riley Chen',
  otherRep: 'Ravi Patel',
  // The member who leaves the workspace.
  leaver: 'Lee Novak',
  // The owner of another workspace.
  outsider: 'Oscar Berg',
  // Who joins through an invitation link.
  invitee: 'Ana Lima',
};

/** Companies the tests create by name. */
export const COMPANIES = {
  // The customer most tests work with.
  brightwater: {
    name: 'Brightwater Logistics',
    industry: 'Logistics',
    website: 'https://brightwater.example',
    phone: '+33 1 84 88 12 40',
  },
  // Its name before a rebrand: an archived record, or one an edit renames.
  brightwaterFreight: {
    name: 'Brightwater Freight',
    industry: 'Logistics',
    website: 'https://brightwaterfreight.example',
    phone: '+33 1 84 88 12 41',
  },
  kestrel: {
    name: 'Kestrel Analytics',
    industry: 'Software',
    website: 'https://kestrel.example',
    phone: '+44 20 7946 0321',
  },
  solano: {
    name: 'Solano Energy',
    industry: 'Energy',
    website: 'https://solano.example',
    phone: '+34 910 555 218',
  },
  fernhill: {
    name: 'Fernhill Grocers',
    industry: 'Retail',
    website: 'https://fernhill.example',
    phone: '+44 161 496 0754',
  },
  maple: {
    name: 'Maple Street Market',
    industry: 'Retail',
    website: 'https://maplestreet.example',
    phone: '+1 415 555 0142',
  },
  // After every name in MORE_COMPANIES.
  zephyr: {
    name: 'Zephyr Couriers',
    industry: 'Logistics',
    website: 'https://zephyr.example',
    phone: '+49 30 555 0193',
  },
};

/**
 * 24 more company names for the list tests, A to Z (as the API sorts them, by lower case): after
 * Brightwater Logistics and before Zephyr Couriers. The 10th to the 19th, and only they, have
 * "Foods" in their name.
 */
export const MORE_COMPANIES = [
  'Cobalt Print Works',
  'Copperleaf Studio',
  'Dunford Hardware',
  'Elmwood Pharmacy',
  'Fairview Garden Centre',
  'Glenrock Outdoor',
  'Greyfield Books',
  'Hollis Tailoring',
  'Ivybridge Opticians',
  'Juniper Foods',
  'Kilnworth Foods',
  'Larkspur Foods',
  'Merrow Foods',
  'Nettlebed Foods',
  'Oakhurst Foods',
  'Pennant Foods',
  'Quillon Foods',
  'Redbank Foods',
  'Saltmarsh Foods',
  'Thornbury Joinery',
  'Underhill Cycles',
  'Vale Street Dairy',
  'Westbrook Plumbing',
  'Yarrow Florists',
] as const;

/** People the tests create as contacts and leads. */
export const CONTACTS = {
  // A buyer at Brightwater Logistics.
  buyer: { firstName: 'Sofia', lastName: 'Martins', email: 'sofia.martins@brightwater.example' },
  // A lead who is converted into a contact.
  lead: { firstName: 'Daniel', lastName: 'Okafor' },
};

/** Deals the tests create by name. */
export const DEALS = {
  tablets: 'Brightwater fleet tablets',
  rollout: 'Brightwater depot rollout',
  usExpansion: 'Brightwater US expansion',
  renewal: 'Brightwater support renewal',
  retrofit: 'Solano panel retrofit',
  starterKit: 'Fernhill starter kit',
  won: 'Maple Street shelving',
  lost: 'Fernhill cold room',
};

/** Tasks the tests create by title. */
export const TASKS = {
  call: `Call ${COMPANIES.solano.name}`,
};

/**
 * A new email address for a person, as their workplace would give it.
 * @param name Their full name.
 * @param domain Their workplace's domain.
 * @returns Such as `olivia.bennett.3fa9c2@northwind.example`: lower-case ASCII, unique per call.
 */
export const emailFor = (name: string, domain = TEAMS.default.domain) => {
  // Accents dropped, then each run of letters a part: "José Núñez" is jose.nunez.
  const parts =
    name
      .normalize('NFD')
      .replaceAll(/\p{M}/gu, '')
      .toLowerCase()
      .match(/[a-z]+/gu) ?? [];

  return `${[...parts, randomBytes(3).toString('hex')].join('.')}@${domain}`;
};
