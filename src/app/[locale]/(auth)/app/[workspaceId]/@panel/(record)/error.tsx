'use client';

// A record that fails to load fails inside the panel, which stays closable: the workspace's own
// error boundary would replace the whole panel with it, after the list.
export { default } from '../../error';
