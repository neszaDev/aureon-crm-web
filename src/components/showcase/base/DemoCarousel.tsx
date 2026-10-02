'use client';

import { cn } from 'cn';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import type { CarouselApi } from '@/components/ui/carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

// CoreUI's carousel moves on every 6 seconds.
const INTERVAL_MS = 6000;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
};

/**
 * The Vue carousel: three slides (two with captions, one a blank placeholder), arrows,
 * indicators and autoplay. Autoplay pauses while the pointer or focus is inside, can be
 * stopped with its own button, and is off by default under reduced motion.
 * @param props Component props.
 * @param props.picture The picture on the third slide (a `next/image` from the page).
 * @returns The carousel.
 */
export const DemoCarousel = (props: { picture: React.ReactNode }) => {
  const t = useTranslations('CarouselsPage');
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [held, setHeld] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const playing = choice ?? !reducedMotion;

  const slides = [
    { id: 'first', title: t('slide_first_title'), text: t('slide_first_text') },
    { id: 'blank', title: t('slide_blank_title'), text: t('slide_blank_text') },
    { id: 'logo' },
  ] as const;
  const onDark = slides[selected]?.id === 'first';

  // Follow the slide embla settles on (arrows, swipes, keys and autoplay all end up here).
  useEffect(() => {
    const onSelect = () => {
      if (api) {
        setSelected(api.selectedScrollSnap());
      }
    };
    api?.on('select', onSelect);
    api?.on('reInit', onSelect);
    return () => {
      api?.off('select', onSelect);
      api?.off('reInit', onSelect);
    };
  }, [api]);

  useEffect(() => {
    const timer =
      api && playing && !held
        ? window.setInterval(() => {
            api.scrollNext();
          }, INTERVAL_MS)
        : undefined;
    return () => {
      window.clearInterval(timer);
    };
  }, [api, playing, held]);

  return (
    <div className="flex flex-col gap-3">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        aria-label={t('carousel_label')}
        aria-roledescription={t('carousel_role')}
        className="overflow-hidden rounded-lg"
        onPointerEnter={() => {
          setHeld(true);
        }}
        onPointerLeave={() => {
          setHeld(false);
        }}
        onFocus={() => {
          setHeld(true);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setHeld(false);
          }
        }}
      >
        <CarouselContent className="ml-0">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              aria-label={t('slide_label', { index: index + 1, count: slides.length })}
              aria-roledescription={t('slide_role')}
              className="pl-0"
            >
              <div
                className={cn(
                  'relative flex h-64 items-end sm:h-100',
                  slide.id === 'first' && 'bg-folder text-folder-ink',
                  slide.id === 'blank' && 'bg-ink-200 text-ink-950',
                  slide.id === 'logo' && 'items-center justify-center bg-paper-card',
                )}
              >
                {slide.id === 'first' && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,color-mix(in_oklab,var(--folder-ink)_14%,transparent)_31px,color-mix(in_oklab,var(--folder-ink)_14%,transparent)_32px)]"
                  />
                )}
                {slide.id === 'logo' && props.picture}
                {'title' in slide && (
                  <div className="relative w-full px-14 pb-12 text-center">
                    <h3 className="text-xl font-bold tracking-[-0.01em] sm:text-2xl">
                      {slide.title}
                    </h3>
                    <p className="mt-1 text-sm opacity-85 sm:text-base">{slide.text}</p>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-3" label={t('previous')} />
        <CarouselNext className="right-3" label={t('next')} />
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={t('go_to', { index: index + 1 })}
              aria-current={index === selected ? 'true' : undefined}
              onClick={() => api?.scrollTo(index)}
              className="group/dot px-1 py-3"
            >
              <span
                className={cn(
                  'block h-1 w-8 rounded-full transition-colors duration-150',
                  onDark
                    ? 'bg-folder-ink/45 group-hover/dot:bg-folder-ink/75'
                    : 'bg-ink-400 group-hover/dot:bg-ink-600',
                  index === selected && (onDark ? 'bg-folder-ink' : 'bg-ink-950'),
                )}
              />
            </button>
          ))}
        </div>
      </Carousel>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-600" aria-live={playing ? 'off' : 'polite'}>
          {t('slide_label', { index: selected + 1, count: slides.length })}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setChoice(!playing);
          }}
        >
          {playing ? <PauseIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
          {playing ? t('pause') : t('play')}
        </Button>
      </div>
    </div>
  );
};
