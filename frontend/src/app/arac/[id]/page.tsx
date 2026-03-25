import { Metadata } from 'next';
import { CarDetail } from '../../../_pages/CarDetail';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const res = await fetch(`${apiUrl}/cars/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Not found');
    const { data } = await res.json();
    
    const isForSale = data.category === 'SECOND_HAND' || data.salePrice;
    
    return {
      title: isForSale 
        ? `${data.brand} ${data.model} 2. El Satılık Manisa | Yaman Filo`
        : `${data.brand} ${data.model} Kiralama Manisa | Yaman Filo`,
      description: isForSale
        ? `Manisa'da Yaman Filo güvencesiyle satılık ${data.brand} ${data.model}. Ekspertiz raporlu, güvenilir 2. el araç fiyatları ve detaylarını hemen inceleyin.`
        : `Manisa'da ${data.brand} ${data.model} modeli kiralık aracımız! Ekonomik günlük kiralama fırsatları Yaman Filo'da. Hemen rezervasyon yapın.`,
    };
  } catch (e) {
    return {
      title: 'Araç Detayı | Yaman Filo',
    };
  }
}

// Generate Schema dynamically
async function SchemaComponent({ id }: { id: string }) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const res = await fetch(`${apiUrl}/cars/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const { data } = await res.json();

    const isForSale = data.category === 'SECOND_HAND' || data.salePrice;

    const schema = {
      '@context': 'https://schema.org',
      '@type': isForSale ? 'Product' : 'CarRental',
      name: `${data.brand} ${data.model}`,
      image: data.images?.[0] || 'https://yamanfilo.com/logo.png',
      description: data.description || `${data.brand} ${data.model} model aracımız Yaman Filo'da.`,
      brand: {
        '@type': 'Brand',
        name: data.brand
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TRY',
        price: isForSale ? data.salePrice : data.dailyPrice,
        itemCondition: 'https://schema.org/UsedCondition',
        availability: 'https://schema.org/InStock',
      }
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  } catch (e) {
    return null;
  }
}

export default function Page({ params }: Props) {
  return (
    <>
      {/* Server Component fetches and injects JSON-LD without affecting UI */}
      <SchemaComponent id={params.id} />
      <CarDetail />
    </>
  );
}
