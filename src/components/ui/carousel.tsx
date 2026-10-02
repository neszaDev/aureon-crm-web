'use client';

import { cn } from 'cn';
import useEmblaCarousel from 'embla-carousel-react';
import type { UseEmblaCarouselType } from 'embla-carousel-react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

// Themed for Marksheet: the arrows keep the square-cut button corners (no round shapes).
const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

/**
 * Subscribes to the embla events that can change whether the carousel can scroll.
 * @param api The embla API, once the carousel is mounted.
 * @returns A `useSyncExternalStore` subscribe function.
 */
function subscribeToScroll(api: CarouselApi) {
  return (onChange: () => void) => {
    api?.on('reInit', onChange);
    api?.on('select', onChange);
    return () => {
      api?.off('reInit', onChange);
      api?.off('select', onChange);
    };
  };
}

/**
 * Mounts embla and tracks whether it can scroll either way.
 * @param props The carousel's options.
 * @returns The value the carousel shares with its parts.
 */
function useCarouselController(props: CarouselProps & { orientation: 'horizontal' | 'vertical' }) {
  const { orientation, opts, setApi } = props;
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    props.plugins,
  );
  const subscribe = subscribeToScroll(api);
  const canScrollPrev = React.useSyncExternalStore(
    subscribe,
    () => api?.canScrollPrev() ?? false,
    () => false,
  );
  const canScrollNext = React.useSyncExternalStore(
    subscribe,
    () => api?.canScrollNext() ?? false,
    () => false,
  );

  React.useEffect(() => {
    if (api && setApi) {
      setApi(api);
    }
  }, [api, setApi]);

  return {
    carouselRef,
    api,
    opts,
    orientation,
    scrollPrev: () => {
      api?.scrollPrev();
    },
    scrollNext: () => {
      api?.scrollNext();
    },
    canScrollPrev,
    canScrollNext,
  } satisfies CarouselContextProps;
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<'section'> & CarouselProps & { 'aria-roledescription': string }) {
  const context = useCarouselController({ orientation, opts, setApi, plugins });

  return (
    <CarouselContext value={context}>
      <section
        onKeyDownCapture={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            context.scrollPrev();
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            context.scrollNext();
          }
        }}
        className={cn('relative', className)}
        data-slot="carousel"
        {...props}
      >
        {children}
      </section>
    </CarouselContext>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
      <div
        className={cn('flex', orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)}
        {...props}
      />
    </div>
  );
}

function CarouselItem({
  className,
  ...props
}: React.ComponentProps<'fieldset'> & { 'aria-roledescription': string }) {
  const { orientation } = useCarousel();

  // Embla measures the outer slide box; a fieldset inside gives the slide its `group` role
  // (as the measured box itself, a fieldset reports offsets embla cannot lay out in Chromium).
  return (
    <div
      data-slot="carousel-item"
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className,
      )}
    >
      <fieldset className="min-w-0" {...props} />
    </div>
  );
}

function CarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon-sm',
  label,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        'absolute touch-manipulation',
        orientation === 'horizontal'
          ? 'inset-y-0 -left-12 my-auto'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = 'outline',
  size = 'icon-sm',
  label,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        'absolute touch-manipulation',
        orientation === 'horizontal'
          ? 'inset-y-0 -right-12 my-auto'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRightIcon />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
