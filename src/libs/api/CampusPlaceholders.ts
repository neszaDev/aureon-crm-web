import 'server-only';

// Placeholder payloads for the campus screens, shaped like the Vue app's API responses
// (`{ _id, title: [{ key, value }] }`). The Spring API does not serve these yet; see
// docs/plans/0003-vue-ui-port.md for the endpoints to add. Replace each list with a backend read.

/** A title in one language, as the Vue API sends it. */
type LocalizedTitle = { key: string; value: string };

/** An organisation, agency or department. */
export type OrgUnit = { _id: string; title: LocalizedTitle[] };

/** The signed-in person's campus profile (Vue `system/profile`). */
export type CampusProfile = {
  name: string;
  avatar: string;
  agency: string;
  branch: string;
  position: string;
  mobile: string;
  email: string;
  gender: string;
  birthDate: string;
  address: string;
  links: { facebook: string | null; instagram: string | null; google: string | null };
};

const unit = (id: string, en: string, th: string): OrgUnit => ({
  _id: id,
  title: [
    { key: 'en', value: en },
    { key: 'th', value: th },
  ],
});

export const placeholderOrganizations: OrgUnit[] = [
  unit('org-1', 'Mae Fah Luang University', 'มหาวิทยาลัยแม่ฟ้าหลวง'),
];

export const placeholderAgencies: OrgUnit[] = [
  unit('agency-1', 'Service centre', 'ศูนย์บริการ'),
  unit('agency-2', 'Personnel division', 'ส่วนการเจ้าหน้าที่'),
];

export const placeholderDepartments: OrgUnit[] = [
  unit('dept-1', 'Information technology centre', 'ศูนย์เทคโนโลยีสารสนเทศ'),
  unit('dept-2', 'School of management', 'สำนักวิชาการจัดการ'),
];

export const placeholderProfile: CampusProfile = {
  name: 'Pattaradanai Prommanee',
  avatar: '/assets/images/avatars/1.jpg',
  agency: 'ศูนย์บริการ',
  branch: 'ศูนย์เทคโนโลยีสารสนเทศ',
  position: 'นักศึกษา',
  mobile: '+66 092 9923653',
  email: '6531501001@lamduan.mfu.ac.th',
  gender: 'Male',
  birthDate: '25/01/2004',
  address: '406, M',
  links: { facebook: 'xxxx', instagram: 'xxxx', google: 'xxxx' },
};
