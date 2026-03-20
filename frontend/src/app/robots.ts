import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/profile/',
        '/api/',
        '/my-booking/'
      ],
    },
    sitemap: 'https://yamanfilo.com/sitemap.xml',
  };
}
