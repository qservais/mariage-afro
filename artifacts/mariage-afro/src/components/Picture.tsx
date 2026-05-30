import { type CSSProperties, type ImgHTMLAttributes, useState } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "loading"> & {
  /** The original asset URL (JPG/JPEG/PNG) imported via `@assets/...` */
  src: string;
  /** REQUIRED for CLS prevention — intrinsic image dimensions in pixels */
  width: number;
  height: number;
  alt: string;
  /**
   * `eager` for above-the-fold/hero images (also adds fetchpriority=high),
   * `lazy` for everything else. Default: lazy.
   */
  loading?: "lazy" | "eager";
};

function ImagePlaceholder({
  className,
  style,
  alt,
}: {
  className?: string;
  style?: CSSProperties;
  alt: string;
}) {
  return (
    <div
      className={`bg-wine-deep/[0.06] flex items-center justify-center overflow-hidden ${className ?? ""}`}
      style={style}
      role="img"
      aria-label={alt || undefined}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-8 h-8 text-wine-deep/20"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

/**
 * Renders a `<picture>` element that serves AVIF → WebP → original (JPG/PNG)
 * with explicit width/height + aspect-ratio CSS to eliminate CLS (Cumulative
 * Layout Shift). Modern variants are produced by `scripts/optimize-images.mjs`
 * and live next to the source asset (same basename, .avif/.webp ext).
 *
 * If the optimization script hasn't been run, the <source> tags will 404 and
 * browsers gracefully fall back to the original <img>. So this is safe to
 * deploy incrementally.
 *
 * If the image fails to load for any reason, a branded cream/wine-deep
 * placeholder is shown instead of the broken-image browser icon.
 */
export function Picture({
  src,
  width,
  height,
  alt,
  loading = "lazy",
  className,
  style,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);

  const lastDot = src.lastIndexOf(".");
  const ext = lastDot > 0 ? src.slice(lastDot).toLowerCase() : "";
  const isLocalAsset = !/^(?:https?:|data:|blob:)/i.test(src);
  const isStaticImageExt = [".jpg", ".jpeg", ".png"].includes(ext);
  const enableModernSources = isLocalAsset && isStaticImageExt;
  const stem = lastDot > 0 ? src.slice(0, lastDot) : src;
  const avif = `${stem}.avif`;
  const webp = `${stem}.webp`;

  const eager = loading === "eager";
  const aspectStyle: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
    ...style,
  };

  if (failed) {
    return (
      <ImagePlaceholder className={className} style={aspectStyle} alt={alt} />
    );
  }

  return (
    <picture>
      {enableModernSources && (
        <>
          <source srcSet={avif} type="image/avif" />
          <source srcSet={webp} type="image/webp" />
        </>
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "auto"}
        className={className}
        style={aspectStyle}
        onError={() => setFailed(true)}
        {...rest}
      />
    </picture>
  );
}

/**
 * Drop-in wrapper for raw <img> tags showing user-generated content
 * (storage images, vendor logos, gallery photos, etc.).
 * Shows the same branded placeholder on load failure.
 */
export function ImgWithFallback({
  src,
  alt,
  className,
  style,
  width,
  height,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <ImagePlaceholder
        className={className}
        style={style as CSSProperties}
        alt={alt}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

export default Picture;
