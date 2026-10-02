// The Vue demo's markers: four places around Palo Alto, each with a one-letter label.

/** A place pinned on the map. */
type MapPlace = {
  label: string;
  name: string;
  position: { lat: number; lng: number };
  website: string;
};

export const MAP_CENTER = { lat: 37.431489, lng: -122.163719 };

export const MAP_PLACES: readonly MapPlace[] = [
  {
    label: 'S',
    name: 'Stanford',
    position: { lat: 37.431489, lng: -122.163719 },
    website: 'https://www.stanford.edu/',
  },
  {
    label: 'T',
    name: 'Tesla',
    position: { lat: 37.394694, lng: -122.150333 },
    website: 'https://www.tesla.com/',
  },
  {
    label: 'A',
    name: 'Apple',
    position: { lat: 37.331681, lng: -122.0301 },
    website: 'https://www.apple.com/',
  },
  {
    label: 'F',
    name: 'Facebook',
    position: { lat: 37.484722, lng: -122.148333 },
    website: 'https://www.facebook.com/',
  },
];
