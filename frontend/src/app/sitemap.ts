import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://yamanfilo.com';
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    // Add pagination or grab all if API supports it
    const res = await fetch(`${apiUrl}/cars?page=1&limit=100`, { next: { revalidate: 3600 } });
    
    if (res.ok) {
      const { data } = await res.json();
      const cars = data?.items || data || [];
      
      dynamicRoutes = cars.map((car: any) => ({
        url: `${baseUrl}/car/${car.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
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
      url: `${baseUrl}/second-hand`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
