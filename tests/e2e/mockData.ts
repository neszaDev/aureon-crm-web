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
