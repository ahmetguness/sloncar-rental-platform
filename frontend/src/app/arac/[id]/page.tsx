import { Metadata } from 'next';
import { CarDetail } from '../../../_pages/CarDetail';

type Props = {
  params: Promise<{ id: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://yamanfilo.com/api';

async function fetchCar(id: string) {
  try {
    const res = await fetch(`${API_URL}/cars/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchCar(id);

  if (!data) {
    return { title: 'Araç Detayı | Yaman Filo' };
  }

  const isForSale = data.category === 'SECOND_HAND' || data.salePrice;
  const title = isForSale
    ? `${data.brand} ${data.model} 2. El Satılık Manisa | Yaman Filo`
    : `${data.brand} ${data.model} Kiralama Manisa | Yaman Filo`;
  const description = isForSale
    ? `Manisa'da Yaman Filo güvencesiyle satılık ${data.brand} ${data.model}. Ekspertiz raporlu, güvenilir 2. el araç fiyatları ve detaylarını inceleyin.`
    : `Manisa'da ${data.brand} ${data.model} kiralık araç. Ekonomik günlük kiralama fırsatları Yaman Filo'da.`;
  const ogImage = data.images?.[0] || '/og-image.jpg';

  return {
    title,
    description,
    alternates: { canonical: `/arac/${id}` },
    openGraph: {
      title,
      description,
      url: `https://yamanfilo.com/arac/${id}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
  };
}

async function SchemaComponent({ id }: { id: string }) {
  const data = await fetchCar(id);
  if (!data) return null;

  const isForSale = data.category === 'SECOND_HAND' || data.salePrice;

  const schema = {
    '@context': 'https://schema.org',
    '@type': isForSale ? 'Product' : 'Product',
    name: `${data.brand} ${data.model}`,
    image: data.images?.[0] || 'https://yamanfilo.com/logo.png',
    description:
      data.description ||
      `${data.brand} ${data.model} model aracımız Yaman Filo'da.`,
    brand: { '@type': 'Brand', name: data.brand },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'TRY',
      price: isForSale ? data.salePrice : data.dailyPrice,
      itemCondition: isForSale
        ? 'https://schema.org/UsedCondition'
        : 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      url: `https://yamanfilo.com/arac/${id}`,
    },
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: 'https://yamanfilo.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isForSale ? '2. El Araçlar' : 'Araçlar',
        item: isForSale
          ? 'https://yamanfilo.com/ikinci-el'
          : 'https://yamanfilo.com',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${data.brand} ${data.model}`,
        item: `https://yamanfilo.com/arac/${id}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([schema, breadcrumb]),
      }}
    />
  );
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <SchemaComponent id={id} />
      <CarDetail />
    </>
  );
}
