/* eslint-disable react-refresh/only-export-components */
import { Metadata } from 'next';
import { About } from '../../_pages/About';

export const metadata: Metadata = {
  title: 'Hakkımızda | Yaman Filo - Manisa Araç Kiralama',
  description:
    'Manisa araç kiralama sektöründe yılların tecrübesiyle Yaman Filo. Müşteri memnuniyeti odaklı, güvenilir ve şeffaf hizmet anlayışımızı keşfedin.',
  alternates: {
    canonical: '/hakkimizda',
  },
  openGraph: {
    title: 'Hakkımızda | Yaman Filo Manisa',
    description:
      'Yaman Filo hakkında bilgi edinin. 2013 yılından beri Manisa araç kiralama sektöründe güvenilir hizmet.',
    url: 'https://yamanfilo.com/hakkimizda',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
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
        name: 'Hakkımızda',
        item: 'https://yamanfilo.com/hakkimizda',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <About />
    </>
  );
}
