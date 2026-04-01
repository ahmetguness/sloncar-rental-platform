/* eslint-disable react-refresh/only-export-components */
import { Metadata } from 'next';
import { Layout } from '../components/layout/Layout';
import { Home } from '../_pages/Home';

export const metadata: Metadata = {
  title: 'Yaman Filo | Manisa Araç Kiralama & Rent A Car',
  description:
    'Yaman Filo, Manisa\'da güvenilir araç kiralama hizmeti sunar. Günlük ve uzun dönem rent a car çözümlerini hemen inceleyin.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Yaman Filo | Manisa Araç Kiralama & Rent A Car',
    description:
      'Yaman Filo, Manisa\'da güvenilir araç kiralama hizmeti sunar. Günlük ve uzun dönem rent a car çözümlerini hemen inceleyin.',
    url: 'https://yamanfilo.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yaman Filo | Manisa Araç Kiralama & Rent A Car',
    description:
      'Yaman Filo, Manisa\'da güvenilir araç kiralama hizmeti sunar. Günlük ve uzun dönem rent a car çözümlerini hemen inceleyin.',
    images: ['/og-image.jpg'],
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
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '120',
    bestRating: '5',
    worstRating: '1',
  },
};

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Yaman Filo',
  url: 'https://yamanfilo.com',
  inLanguage: 'tr-TR',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://yamanfilo.com/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Yaman Filo',
  legalName: 'Yaman Filo Otomotiv İnşaat Turizm İth. ve İhr. San. Tic. Ltd. Şti.',
  url: 'https://yamanfilo.com',
  logo: 'https://yamanfilo.com/logo.png',
  foundingDate: '2013',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+902362573232',
    contactType: 'customer service',
    areaServed: 'TR',
    availableLanguage: 'Turkish',
  },
  sameAs: [
    'https://www.instagram.com/yamanfilotr',
    'https://www.facebook.com/yamanfilo',
  ],
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Araç Kiralama',
  provider: {
    '@type': 'Organization',
    name: 'Yaman Filo',
  },
  areaServed: {
    '@type': 'City',
    name: 'Manisa',
  },
  description:
    'Yaman Filo, Manisa\'da günlük, haftalık ve uzun dönem araç kiralama hizmeti sunan güvenilir bir firmadır.',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'TRY',
    availability: 'https://schema.org/InStock',
  },
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
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            localBusinessSchema,
            webSiteSchema,
            organizationSchema,
            serviceSchema,
            breadcrumbSchema,
          ]),
        }}
      />
      <Layout>
        <Home />
      </Layout>
    </>
  );
}
