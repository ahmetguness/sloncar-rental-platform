import { Metadata } from 'next';
import { SecondHand } from '../../_pages/SecondHand';

export const metadata: Metadata = {
  title: 'Manisa 2. El Araç Fiyatları & İlanları | Satılık Otomobil',
  description: 'Yaman Filo güvencesiyle düşük kilometreli, ekspertiz onaylı güvenilir 2. el araç (satılık araba) ilanlarını Manisa bayimizde inceleyin.',
  alternates: {
    canonical: '/ikinci-el',
  },
};

const collectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Manisa 2. El Araç Fiyatları',
  description: 'Ekspertiz garantili satılık ikinci el arabalar.',
  url: 'https://yamanfilo.com/ikinci-el'
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <SecondHand />
    </>
  );
}
