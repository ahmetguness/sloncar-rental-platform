import { MetadataRoute } from 'next';
import { carSlug } from '../utils/slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://yamanfilo.com';
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const res = await fetch(`${apiUrl}/cars?page=1&limit=200`, { next: { revalidate: 3600 } });

    if (res.ok) {
      const { data } = await res.json();
      const cars = data?.items || data || [];

      dynamicRoutes = cars.map((car: any) => {
        const isRental = car.type === 'RENTAL' || !car.type;
        return {
          url: isRental ? `${baseUrl}/rezervasyon/${car.id}` : `${baseUrl}/arac/${car.id}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        };
      });
    }
  } catch (error) {
    console.error('Sitemap fetch failed:', error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ikinci-el`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
