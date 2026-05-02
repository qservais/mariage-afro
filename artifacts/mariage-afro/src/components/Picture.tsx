import { type CSSProperties, type ImgHTMLAttributes } from "react";

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

/**
 * Renders a `<picture>` element that serves AVIF → WebP → original (JPG/PNG)
 * with explicit width/height + aspect-ratio CSS to eliminate CLS (Cumulative
 * Layout Shift). Modern variants are produced by `scripts/optimize-images.mjs`
 * and live next to the source asset (same basename, .avif/.webp ext).
 *
 * If the optimization script hasn't been run, the <source> tags will 404 and
 * browsers gracefully fall back to the original <img>. So this is safe to
 * deploy incrementally.
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
  // Vite asset URLs come back with a hashed filename + extension, e.g.
  //   "/assets/foo.GM-00756.jpg_xxx-AbCdEf12.jpeg"
  // We derive the AVIF/WebP siblings by replacing only the trailing extension.
  const lastDot = src.lastIndexOf(".");
  const stem = lastDot > 0 ? src.slice(0, lastDot) : src;
  const avif = `${stem}.avif`;
  const webp = `${stem}.webp`;

  const eager = loading === "eager";
  const aspectStyle: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
    ...style,
  };

  return (
    <picture>
      <source srcSet={avif} type="image/avif" />
      <source srcSet={webp} type="image/webp" />
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
        {...rest}
      />
    </picture>
  );
}

export default Picture;
