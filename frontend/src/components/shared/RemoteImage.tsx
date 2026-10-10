'use client';

import Image from 'next/image';
import { useState } from 'react';

// Hosts allowed by `images.remotePatterns` in next.config.ts. next/image refuses any
// other host, so everything else (legacy URLs, the backend image proxy, SVG/GIF) keeps
// rendering through a plain <img> exactly as it did before.
const OPTIMIZABLE_HOSTS = new Set(['pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev']);

function canOptimize(src: string): boolean {
  try {
    const u = new URL(src);
    return (
      u.protocol === 'https:' &&
      OPTIMIZABLE_HOSTS.has(u.hostname) &&
      !/\.(svg|gif)$/i.test(u.pathname)
    );
  } catch {
    return false;
  }
}

interface RemoteImageProps {
  src: string;
  alt: string;
  /** Rendered width at each breakpoint — lets the browser pick a small variant. */
  sizes: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Drop-in for a `<img className="w-full h-full object-cover">` that fills a positioned
 * parent. Serves a resized/WebP copy through Next's image optimizer instead of the
 * original upload (admin photos are often 3–5 MB). If the optimizer ever fails for any
 * reason, it falls back to the original image, so a photo can never go missing because
 * of this component.
 */
export default function RemoteImage({ src, alt, sizes, className, loading = 'lazy' }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);

  if (!failed && canOptimize(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={loading}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={loading} className={className} />;
}
