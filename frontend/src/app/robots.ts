import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/profil/',
        '/api/',
        '/rezervasyonum/',
        '/rezervasyon/',
        '/giris/',
      ],
    },
    sitemap: 'https://yamanfilo.com/sitemap.xml',
  };
}
