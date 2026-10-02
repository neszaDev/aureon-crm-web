'use client';

import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  InfoWindow,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLinkIcon, MapPinOffIcon } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MAP_CENTER, MAP_PLACES } from './data';

type LatLng = { lat: number; lng: number };
// The part of google.maps.GeocoderResponse this demo reads.
type GeocodeResponse = { results: { formatted_address?: string }[] };
// The part of the map's click event this demo reads.
type MapClick = { detail: { latLng: LatLng | null } };
type ClickedPoint = { position: LatLng; address?: string; lookup: 'pending' | 'done' | 'failed' };

/**
 * A place's one-letter label, as drawn on its marker.
 * @param props Component props.
 * @param props.label The letter.
 * @returns The badge.
 */
const MarkerBadge = (props: { label: string }) => (
  <span
    aria-hidden="true"
    className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-folder-ink bg-folder text-sm font-bold text-folder-ink shadow-ply"
  >
    {props.label}
  </span>
);

/**
 * The places as a list: the map's accessible counterpart, and all there is without a key.
 * @param props Component props.
 * @param props.openLabel Label of the place whose info window is open.
 * @param props.onShow Opens or closes a place's info window; omitted when there is no map.
 * @returns The list.
 */
const PlaceList = (props: { openLabel?: string | null; onShow?: (label: string) => void }) => {
  const t = useTranslations('GoogleMapDemo');

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {MAP_PLACES.map((place) => (
        <li
          key={place.label}
          className="flex items-center gap-3 rounded-sm border border-ink-200 bg-paper-card px-3 py-2"
        >
          <MarkerBadge label={place.label} />
          <span className="min-w-0 flex-1 truncate font-semibold text-ink-950">{place.name}</span>
          {props.onShow && (
            <Button
              variant="ghost"
              size="xs"
              aria-pressed={props.openLabel === place.label}
              onClick={() => props.onShow?.(place.label)}
            >
              {t('show_on_map')}
            </Button>
          )}
          <Button asChild variant="link" size="xs">
            <a
              href={place.website}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t('website_of', { name: place.name })}
            >
              {t('website')}
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
};

/**
 * The map itself, inside the API provider: markers, the info window, and the last click
 * (with its address when the Geocoding API answers).
 * @param props Component props.
 * @param props.openLabel Label of the place whose info window is open.
 * @param props.onToggle Opens or closes a place's info window.
 * @returns The map and the clicked point.
 */
const PlacesMap = (props: { openLabel: string | null; onToggle: (label: string) => void }) => {
  const t = useTranslations('GoogleMapDemo');
  const format = useFormatter();
  const geocoding = useMapsLibrary('geocoding');
  const [clicked, setClicked] = useState<ClickedPoint | null>(null);
  const open = MAP_PLACES.find((place) => place.label === props.openLabel);
  const coordinate = (value: number) => format.number(value, { maximumFractionDigits: 5 });

  const lookUp = async (position: LatLng) => {
    setClicked({ position, lookup: geocoding ? 'pending' : 'failed' });
    if (!geocoding) {
      return;
    }
    let next: ClickedPoint = { position, lookup: 'failed' };
    try {
      const response: GeocodeResponse = await new geocoding.Geocoder().geocode({
        location: position,
      });
      const address = response.results[0]?.formatted_address;
      if (address) {
        next = { position, address, lookup: 'done' };
      }
    } catch {
      // Geocoding API off for this key, or no network: keep the coordinates only.
    }
    // A later click wins over a slow answer for an earlier one.
    setClicked((current) => (current?.position === position ? next : current));
  };

  return (
    <>
      <div className="h-[400px] overflow-hidden rounded-sm border border-ink-300 shadow-ply">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={MAP_CENTER}
          defaultZoom={11}
          gestureHandling="cooperative"
          onClick={(event: MapClick) => {
            if (event.detail.latLng) {
              void lookUp(event.detail.latLng);
            }
          }}
        >
          {MAP_PLACES.map((place) => (
            <AdvancedMarker
              key={place.label}
              position={place.position}
              title={place.name}
              onClick={() => {
                props.onToggle(place.label);
              }}
            >
              <MarkerBadge label={place.label} />
            </AdvancedMarker>
          ))}
          {open && (
            <InfoWindow
              position={open.position}
              pixelOffset={[0, -36]}
              headerContent={<strong className="text-ink-950">{open.name}</strong>}
              onCloseClick={() => {
                props.onToggle(open.label);
              }}
            >
              <a
                href={open.website}
                target="_blank"
                rel="noreferrer noopener"
                className="text-folder underline"
              >
                {open.website}
              </a>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      <output className="block min-h-5 text-[0.9375rem] text-ink-700">
        {clicked &&
          t('clicked_at', {
            lat: coordinate(clicked.position.lat),
            lng: coordinate(clicked.position.lng),
          })}{' '}
        {clicked?.lookup === 'pending' && t('address_pending')}
        {clicked?.lookup === 'done' && clicked.address}
        {clicked?.lookup === 'failed' && t('address_failed')}
      </output>
    </>
  );
};

/**
 * The Google Maps demo: the Vue page's four places as markers with info windows, and a click
 * anywhere to see its coordinates and address. Without an API key it explains how to set one.
 * @param props Component props.
 * @param props.apiKey The browser key, if configured.
 * @returns The map, or the setup notice, followed by the list of places.
 */
export const GoogleMapDemo = (props: { apiKey?: string }) => {
  const t = useTranslations('GoogleMapDemo');
  const locale = useLocale();
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const toggle = (label: string) => {
    setOpenLabel(openLabel === label ? null : label);
  };

  if (!props.apiKey) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex min-h-[400px] flex-col items-start justify-center gap-4 rounded-sm border border-dashed border-ink-300 bg-paper px-6 py-10 sm:px-10">
          <MapPinOffIcon aria-hidden="true" className="size-10 text-ink-600" />
          <h3 className="text-lg font-bold text-ink-950">{t('missing_title')}</h3>
          <p className="max-w-prose leading-relaxed text-ink-700">
            {t.rich('missing_text', {
              code: (chunks) => (
                <code className="rounded-sm bg-ink-100 px-1 py-0.5 font-mono text-[0.8125rem] text-ink-950">
                  {chunks}
                </code>
              ),
            })}
          </p>
          <p className="max-w-prose text-[0.9375rem] leading-relaxed text-ink-600">
            {t('missing_hint')}
          </p>
          <Button asChild variant="outline">
            <a
              href="https://developers.google.com/maps/documentation/javascript/get-api-key"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('get_key')}
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
        <PlaceList />
      </div>
    );
  }

  return (
    <APIProvider apiKey={props.apiKey} language={locale}>
      <div className="flex flex-col gap-4">
        <PlacesMap openLabel={openLabel} onToggle={toggle} />
        <PlaceList openLabel={openLabel} onShow={toggle} />
      </div>
    </APIProvider>
  );
};
