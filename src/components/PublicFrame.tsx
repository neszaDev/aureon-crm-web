import { Wordmark } from '@/components/Wordmark';

/** The one card a public page holds (`CrmState` in a hairline panel). */
export const PUBLIC_CARD = 'w-full max-w-lg rounded-lg border border-rule bg-card p-6 sm:p-8';

/**
 * A public page that is only a card (the not-found and error pages), framed as the sign-in page
 * is on a phone: the wordmark over the canvas, and the card centred on it.
 * @param props Component props.
 * @param props.children The card.
 * @returns The page.
 */
export const PublicFrame = (props: { children: React.ReactNode }) => (
  <div className="flex min-h-dvh flex-col">
    <header className="flex h-16 items-center px-4 sm:px-8">
      <Wordmark />
    </header>
    <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-16 sm:items-center sm:pt-16">
      {props.children}
    </main>
  </div>
);
