import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://doodee-future.com';
  const locales = ['th', 'en'];
  const currentDate = new Date();

  // Main pages
  const mainPages = [
    '',
    '/',
    '/analyse',
    '/course',
    '/faculty',
    '/points',
    '/courses',
    '/activities',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add main pages for each locale
  for (const locale of locales) {
    for (const page of mainPages) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: currentDate,
        changeFrequency: page === '' || page === '/' ? 'daily' : 'weekly',
        priority: page === '' || page === '/' ? 1.0 : page === '/faculty' ? 0.9 : 0.8,
      });
    }
  }

  // Add root URL
  sitemapEntries.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  return sitemapEntries;
}
