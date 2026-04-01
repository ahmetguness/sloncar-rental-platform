import { MetadataRoute } from 'next';

const BASE_URL = 'https://yamanfilo.com';
const API_URL = 'https://yamanfilo.com/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/ikinci-el`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/bayilik`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/manisa-arac-kiralama`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    {
      url: `${BASE_URL}/gunluk-arac-kiralama`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamic car detail pages
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${API_URL}/cars?page=1&limit=100`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Cars fetch failed: ${res.status}`);
    }

    const json = await res.json();

    // farklı response formatlarına karşı güvenli parse
    const cars =
      json?.data?.items ||
      json?.data ||
      json?.cars ||
      [];

    dynamicRoutes = cars
      .filter(
        (car: any) =>
          car?.id &&
          (car?.type === 'SALE' ||
            car?.category === 'SECOND_HAND' ||
            car?.salePrice)
      )
      .map((car: any) => ({
        url: `${BASE_URL}/arac/${car.id}`,
        lastModified: new Date(car?.updatedAt || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch (error) {
    console.error('Sitemap: car fetch failed', error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
