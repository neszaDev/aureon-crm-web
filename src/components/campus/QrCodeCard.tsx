'use client';

import { CloudDownloadIcon, QrCodeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MFU_LOGO, qrDefaults } from './data';
import { qrFileName } from './labels';

const QR_SIZE = 200;
const LOGO_CIRCLE = 50;
const RING_WIDTH = 3;

/**
 * Saves the code as a PNG with the logo drawn in, as it shows on screen.
 * @param canvas The rendered QR code.
 * @param fileName Name of the downloaded file.
 */
const downloadPng = async (canvas: HTMLCanvasElement, fileName: string) => {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const context = out.getContext('2d');
  if (!context) {
    return;
  }
  context.drawImage(canvas, 0, 0);

  const logo = document.createElement('img');
  logo.src = MFU_LOGO;
  await logo.decode();
  const scale = canvas.width / QR_SIZE;
  const center = out.width / 2;
  const radius = (LOGO_CIRCLE / 2) * scale;
  const tokens = getComputedStyle(document.documentElement);
  context.beginPath();
  context.arc(center, center, radius - (RING_WIDTH * scale) / 2, 0, 2 * Math.PI);
  context.fillStyle = tokens.getPropertyValue('--ply').trim();
  context.fill();
  context.lineWidth = RING_WIDTH * scale;
  context.strokeStyle = tokens.getPropertyValue('--pen').trim();
  context.stroke();
  const height = radius * 1.4;
  const width = (height * logo.naturalWidth) / logo.naturalHeight;
  context.drawImage(logo, center - width / 2, center - height / 2, width, height);

  const link = document.createElement('a');
  link.download = fileName;
  link.href = out.toDataURL('image/png');
  link.click();
};

/**
 * The campus QR code card (Vue `QRCodes`): a level-H code with the MFU logo in a red-ringed
 * circle, a label under it, fields to change both, and a download as PNG.
 * @returns The card.
 */
export const QrCodeCard = () => {
  const t = useTranslations('CampusQrCode');
  const canvas = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(qrDefaults.text);
  const [label, setLabel] = useState(qrDefaults.label);

  return (
    <Card className="gap-0">
      <CardHeader className="border-b border-ink-200 pb-4">
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <QrCodeIcon aria-hidden="true" className="size-5 text-folder" />
            {t('title')}
          </h2>
        </CardTitle>
        <CardAction>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  aria-label={t('download')}
                  disabled={text === ''}
                  onClick={async () => {
                    if (canvas.current) {
                      await downloadPng(canvas.current, qrFileName(label));
                    }
                  }}
                >
                  <CloudDownloadIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('download')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 pt-6">
        <figure className="flex flex-col items-center gap-3">
          <div className="relative rounded-sm bg-ply p-3 shadow-ply">
            <QRCodeCanvas
              ref={canvas}
              value={text}
              size={QR_SIZE}
              level="H"
              marginSize={2}
              aria-hidden="true"
            />
            <span className="sr-only">{t('code_alt', { text })}</span>
            <span
              className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-3 border-pen bg-ply shadow-ply"
              style={{ width: LOGO_CIRCLE, height: LOGO_CIRCLE }}
            >
              <Image src={MFU_LOGO} alt="" width={20} height={34} className="h-8.5 w-auto" />
            </span>
          </div>
          <figcaption className="text-2xl font-bold break-all text-ink-950">{label}</figcaption>
        </figure>

        <div className="grid w-full gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="qr-text">{t('text_label')}</Label>
            <Input
              id="qr-text"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="qr-label">{t('label_label')}</Label>
            <Input
              id="qr-label"
              value={label}
              onChange={(event) => {
                setLabel(event.target.value);
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
