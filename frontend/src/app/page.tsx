import { Metadata } from 'next';
import { Layout } from '../components/layout/Layout';
import { Home } from '../_pages/Home';

export const metadata: Metadata = {
  title: 'Manisa Araç Kiralama, Rent A Car & 2. El Araç | Yaman Filo',
  description: 'Manisa araç kiralama (rent a car) hizmetinde güvenilir adres Yaman Filo. Günlük, uzun dönem filo kiralama ve 2. el araç fiyatlarını inceleyin.',
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Yaman Filo',
  image: 'https://yamanfilo.com/logo.png',
  '@id': 'https://yamanfilo.com',
  url: 'https://yamanfilo.com',
  telephone: '+90000000000', // Update with actual phone
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Manisa Merkez',
    addressLocality: 'Manisa',
    addressRegion: 'MAN',
    addressCountry: 'TR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 38.614,
    longitude: 27.4296,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ],
    opens: '09:00',
    closes: '19:00',
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Layout>
        <Home />
      </Layout>
    </>
  );
}
