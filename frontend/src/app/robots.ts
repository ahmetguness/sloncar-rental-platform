import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/profil/',
          '/api/',
          '/rezervasyonum/',
          '/giris/',
          '/sifre-sifirla/',
          '/sifremi-unuttum/',
          '/eposta-dogrula/',
          '/rezervasyon/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/profil/',
          '/api/',
          '/rezervasyonum/',
          '/giris/',
          '/sifre-sifirla/',
          '/sifremi-unuttum/',
          '/eposta-dogrula/',
          '/rezervasyon/',
        ],
      },
    ],
    sitemap: 'https://yamanfilo.com/sitemap.xml',
    host: 'https://yamanfilo.com',
  };
}
