/** Account states of the sample users. */
export type UserStatus = 'active' | 'inactive' | 'pending' | 'banned';

type UserRole = 'member' | 'staff' | 'admin';

/** A sample user, shaped like a row of the Vue `UsersData`. */
export type User = {
  /** One-based position in the list, used in `/dashboard/users/<id>`. */
  id: number;
  username: string;
  /** Registration day, ISO `yyyy-mm-dd`. */
  registered: string;
  role: UserRole;
  status: UserStatus;
  /** Row tint the Vue data set through `_classes` (`table-success`, `table-danger`). */
  highlight?: 'success' | 'danger';
};

/** Rows per page of the users list, as in the Vue app. */
export const USERS_PAGE_SIZE = 5;

/** The 25 sample users of the Vue app. */
export const USERS: User[] = [
  { id: 1, username: 'Samppa Nori', registered: '2012-01-01', role: 'member', status: 'active' },
  { id: 2, username: 'Estavan Lykos', registered: '2012-02-01', role: 'staff', status: 'banned' },
  {
    id: 3,
    username: 'Chetan Mohamed',
    registered: '2012-02-01',
    role: 'admin',
    status: 'inactive',
  },
  {
    id: 4,
    username: 'Derick Maximinus',
    registered: '2012-03-01',
    role: 'member',
    status: 'pending',
  },
  { id: 5, username: 'Friderik Dávid', registered: '2012-01-21', role: 'staff', status: 'active' },
  {
    id: 6,
    username: 'Yiorgos Avraamu',
    registered: '2012-01-01',
    role: 'member',
    status: 'active',
  },
  {
    id: 7,
    username: 'Avram Tarasios',
    registered: '2012-02-01',
    role: 'staff',
    status: 'banned',
    highlight: 'success',
  },
  { id: 8, username: 'Quintin Ed', registered: '2012-02-01', role: 'admin', status: 'inactive' },
  { id: 9, username: 'Enéas Kwadwo', registered: '2012-03-01', role: 'member', status: 'pending' },
  {
    id: 10,
    username: 'Agapetus Tadeáš',
    registered: '2012-01-21',
    role: 'staff',
    status: 'active',
  },
  {
    id: 11,
    username: 'Carwyn Fachtna',
    registered: '2012-01-01',
    role: 'member',
    status: 'active',
    highlight: 'success',
  },
  {
    id: 12,
    username: 'Nehemiah Tatius',
    registered: '2012-02-01',
    role: 'staff',
    status: 'banned',
  },
  {
    id: 13,
    username: 'Ebbe Gemariah',
    registered: '2012-02-01',
    role: 'admin',
    status: 'inactive',
  },
  {
    id: 14,
    username: 'Eustorgios Amulius',
    registered: '2012-03-01',
    role: 'member',
    status: 'pending',
  },
  { id: 15, username: 'Leopold Gáspár', registered: '2012-01-21', role: 'staff', status: 'active' },
  { id: 16, username: 'Pompeius René', registered: '2012-01-01', role: 'member', status: 'active' },
  { id: 17, username: 'Paĉjo Jadon', registered: '2012-02-01', role: 'staff', status: 'banned' },
  {
    id: 18,
    username: 'Micheal Mercurius',
    registered: '2012-02-01',
    role: 'admin',
    status: 'inactive',
  },
  {
    id: 19,
    username: 'Ganesha Dubhghall',
    registered: '2012-03-01',
    role: 'member',
    status: 'pending',
  },
  { id: 20, username: 'Hiroto Šimun', registered: '2012-01-21', role: 'staff', status: 'active' },
  {
    id: 21,
    username: 'Vishnu Serghei',
    registered: '2012-01-01',
    role: 'member',
    status: 'active',
  },
  { id: 22, username: 'Zbyněk Phoibos', registered: '2012-02-01', role: 'staff', status: 'banned' },
  {
    id: 23,
    username: 'Einar Randall',
    registered: '2012-02-01',
    role: 'admin',
    status: 'inactive',
    highlight: 'danger',
  },
  { id: 24, username: 'Félix Troels', registered: '2012-03-21', role: 'staff', status: 'active' },
  {
    id: 25,
    username: 'Aulus Agmundr',
    registered: '2012-01-01',
    role: 'member',
    status: 'pending',
  },
];

/**
 * Finds a sample user by the id in the URL.
 * @param id The `[id]` route segment.
 * @returns The user, or `undefined` when no user has that id.
 */
export const findUser = (id: string) => USERS.find((user) => String(user.id) === id);

/**
 * A copy of the users in random order, like the Vue basic tables page (one shuffle per request).
 * @returns The shuffled copy.
 */
export const shuffledUsers = () => {
  const copy = [...USERS];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const picked = copy[j];
    const current = copy[i];
    if (picked && current) {
      copy[i] = picked;
      copy[j] = current;
    }
  }
  return copy;
};
