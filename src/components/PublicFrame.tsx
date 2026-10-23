import { Wordmark } from '@/components/Wordmark';

/**
 * A public page that is only a card: the ink-violet bar with the wordmark, and the card on the
 * ground (the not-found and error pages).
 * @param props Component props.
 * @param props.children The card.
 * @returns The page.
 */
export const PublicFrame = (props: { children: React.ReactNode }) => (
  <div className="flex min-h-dvh flex-col">
    <header className="bg-seal text-on-seal">
      <div className="mx-auto flex h-16 max-w-[76rem] items-center px-4 sm:px-7 lg:h-18">
        <Wordmark tone="seal" />
      </div>
    </header>
    <main className="flex flex-1 items-start justify-center px-4 pt-12 pb-16 sm:items-center sm:pt-16">
      {props.children}
    </main>
  </div>
);
