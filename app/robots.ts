import type { MetadataRoute } from 'next';

// Internal company software: block every crawler from the entire site so it
// never appears in Google (or any) search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
