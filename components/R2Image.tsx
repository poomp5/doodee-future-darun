import Image, { ImageProps } from "next/image";

/**
 * Wrapper around next/image that skips Vercel Image Optimization
 * for images hosted on our R2 CDN (cdn.pranakorn.dev).
 *
 * These images are already served via Cloudflare CDN with edge caching,
 * so Vercel optimization is unnecessary and wastes the transformations quota.
 */
export default function R2Image(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const isR2 = src.includes("cdn.pranakorn.dev") || src.includes("r2.cloudflarestorage.com");

  return <Image {...props} unoptimized={isR2 || props.unoptimized} />;
}
