import {
  cibBehance,
  cibDribbble,
  cibFacebook,
  cibFlickr,
  cibGithub,
  cibInstagram,
  cibLinkedin,
  cibPinterest,
  cibReddit,
  cibStackoverflow,
  cibTumblr,
  cibTwitter,
  cibVimeo,
  cibVk,
  cibXing,
  cibYahoo,
  cibYoutube,
} from '@coreui/icons';

type Brand = {
  /** Kebab-case id, as the Vue app named them. */
  id: string;
  /** The brand's own name (not translated). */
  label: string;
  /** `@coreui/icons` entry: `[viewBox, markup]`. */
  icon: string[];
};

/** The brands of the Vue brand-button demo, in its order. */
export const BRANDS: Brand[] = [
  { id: 'facebook', label: 'Facebook', icon: cibFacebook },
  { id: 'twitter', label: 'Twitter', icon: cibTwitter },
  { id: 'linkedin', label: 'LinkedIn', icon: cibLinkedin },
  { id: 'flickr', label: 'Flickr', icon: cibFlickr },
  { id: 'tumblr', label: 'Tumblr', icon: cibTumblr },
  { id: 'xing', label: 'Xing', icon: cibXing },
  { id: 'github', label: 'GitHub', icon: cibGithub },
  { id: 'stack-overflow', label: 'Stack Overflow', icon: cibStackoverflow },
  { id: 'youtube', label: 'YouTube', icon: cibYoutube },
  { id: 'dribbble', label: 'Dribbble', icon: cibDribbble },
  { id: 'instagram', label: 'Instagram', icon: cibInstagram },
  { id: 'pinterest', label: 'Pinterest', icon: cibPinterest },
  { id: 'vk', label: 'VK', icon: cibVk },
  { id: 'yahoo', label: 'Yahoo', icon: cibYahoo },
  { id: 'behance', label: 'Behance', icon: cibBehance },
  { id: 'reddit', label: 'Reddit', icon: cibReddit },
  { id: 'vimeo', label: 'Vimeo', icon: cibVimeo },
];
