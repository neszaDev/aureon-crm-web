// A mistyped path in a workspace is a page not found, in the shell (`not-found.tsx` here), not
// a workspace not found (the panel's catch-all would leave this slot to its default, which says so).
export { default } from '@/app/[locale]/[...rest]/page';
