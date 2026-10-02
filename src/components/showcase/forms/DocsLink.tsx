import { ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A card-header link to a library's documentation, opened in a new tab.
 * @param props Component props.
 * @param props.href Documentation URL.
 * @param props.label Visible text, such as "Docs".
 * @param props.title Accessible name, naming the library.
 * @returns The link.
 */
export const DocsLink = (props: { href: string; label: string; title: string }) => (
  <Button asChild variant="ghost" size="xs">
    <a href={props.href} target="_blank" rel="noreferrer noopener" aria-label={props.title}>
      {props.label}
      <ExternalLinkIcon aria-hidden="true" />
    </a>
  </Button>
);
