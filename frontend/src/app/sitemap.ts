import { MetadataRoute } from 'next';

const BASE_URL = 'https://yamanfilo.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public routes with SEO priorities
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
  ];

  // Dynamic car detail pages
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://yamanfilo.com/api';
    const res = await fetch(`${apiUrl}/cars?page=1&limit=200`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const { data } = await res.json();
      const cars = data?.items || data || [];

      dynamicRoutes = cars
        .filter((car: any) => car.type === 'SALE' || car.category === 'SECOND_HAND' || car.salePrice)
        .map((car: any) => ({
          url: `${BASE_URL}/arac/${car.id}`,
          lastModified: new Date(car.updatedAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error('Sitemap: car fetch failed', error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
