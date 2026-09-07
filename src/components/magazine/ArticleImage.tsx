'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { ArticleCover } from '@/components/magazine/ArticleCover';

interface Props {
  imageUrl?: string | null;
  imageCredit?: string | null;
  imageCreditUrl?: string | null;
  category: string;
  seed: string;
  alt: string;
  /** Class for the <img> / fallback SVG (behaves like ArticleCover's className) */
  className?: string;
  eager?: boolean;
  /** Show the photo credit chip (article page) */
  showCredit?: boolean;
}

/**
 * Real photo when available, generative cover art as graceful fallback.
 * - Shows the original article photo (or CC archive photo / AI illustration)
 * - Falls back automatically on missing URL or load error
 * - Optional credit chip with attribution and license link
 */
export function ArticleImage({
  imageUrl,
  imageCredit,
  imageCreditUrl,
  category,
  seed,
  alt,
  className = '',
  eager = false,
  showCredit = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const usePhoto = !!imageUrl && !failed;

  if (!usePhoto) {
    return <ArticleCover category={category} seed={seed} className={className} />;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl as string}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
      {showCredit && imageCredit && (
        <div className="absolute bottom-2 right-2 z-10 max-w-[70%]">
          {imageCreditUrl ? (
            <a
              href={imageCreditUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] leading-tight text-white/85 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white"
            >
              <Camera className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{imageCredit}</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] leading-tight text-white/85 backdrop-blur-sm">
              <Camera className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{imageCredit}</span>
            </span>
          )}
        </div>
      )}
    </>
  );
}
