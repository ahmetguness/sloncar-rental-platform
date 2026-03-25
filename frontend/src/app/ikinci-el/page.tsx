/* eslint-disable react-refresh/only-export-components */
import { Metadata } from 'next';
import { SecondHand } from '../../_pages/SecondHand';

export const metadata: Metadata = {
  title: 'Manisa 2. El Araç Fiyatları & İlanları | Satılık Otomobil',
  description:
    'Yaman Filo güvencesiyle düşük kilometreli, ekspertiz onaylı güvenilir 2. el araç (satılık araba) ilanlarını Manisa bayimizde inceleyin.',
  alternates: {
    canonical: '/ikinci-el',
  },
  openGraph: {
    title: '2. El Araç Fiyatları Manisa | Yaman Filo',
    description:
      'Ekspertiz garantili satılık ikinci el arabalar. Yaman Filo güvencesiyle.',
    url: 'https://yamanfilo.com/ikinci-el',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Manisa 2. El Araç Fiyatları',
    description: 'Ekspertiz garantili satılık ikinci el arabalar.',
    url: 'https://yamanfilo.com/ikinci-el',
  };

  const breadcrumbSchema = {
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
        name: '2. El Araçlar',
        item: 'https://yamanfilo.com/ikinci-el',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([collectionSchema, breadcrumbSchema]),
        }}
      />
      <SecondHand />
    </>
  );
}
