/* eslint-disable react-refresh/only-export-components */
import { Metadata } from 'next';
import { Layout } from '../components/layout/Layout';
import { Home } from '../_pages/Home';

export const metadata: Metadata = {
  title: 'Manisa Araç Kiralama, Rent A Car & 2. El Araç | Yaman Filo',
  description:
    'Manisa araç kiralama (rent a car) hizmetinde güvenilir adres Yaman Filo. Günlük, uzun dönem filo kiralama ve 2. el araç fiyatlarını inceleyin.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Manisa Araç Kiralama, Rent A Car & 2. El Araç | Yaman Filo',
    description:
      'Manisa araç kiralama hizmetinde güvenilir adres Yaman Filo. Günlük ve uzun dönem filo kiralama fırsatları.',
    url: 'https://yamanfilo.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Yaman Filo',
  image: 'https://yamanfilo.com/logo.png',
  '@id': 'https://yamanfilo.com',
  url: 'https://yamanfilo.com',
  telephone: '+902362573232',
  email: 'info@yamanfilo.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Arda Mah. 3202 Sk. 7/C',
    addressLocality: 'Şehzadeler',
    addressRegion: 'Manisa',
    postalCode: '45020',
    addressCountry: 'TR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 38.614,
    longitude: 27.4296,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '09:00',
      closes: '19:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/yamanfilotr',
    'https://www.facebook.com/yamanfilo',
  ],
  priceRange: '₺₺',
};

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Yaman Filo',
  url: 'https://yamanfilo.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://yamanfilo.com/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([localBusinessSchema, webSiteSchema]),
        }}
      />
      <Layout>
        <Home />
      </Layout>
    </>
  );
}
