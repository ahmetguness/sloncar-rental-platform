/* eslint-disable react-refresh/only-export-components */
import { Metadata } from 'next';
import { Layout } from '../../components/layout/Layout';
import { Franchise } from '../../_pages/Franchise';

export const metadata: Metadata = {
  title: 'Franchise & Bayilik Başvurusu | Yaman Filo Manisa',
  description:
    'Yaman Filo ailesine katılın! Manisa ve çevre iller için araç kiralama franchise (bayilik) başvuru formunu doldurarak kendi işinizin sahibi olun.',
  alternates: {
    canonical: '/bayilik',
  },
  openGraph: {
    title: 'Franchise & Bayilik Başvurusu | Yaman Filo',
    description:
      'Yaman Filo araç kiralama franchise fırsatı. Bayilik başvurusu yapın.',
    url: 'https://yamanfilo.com/bayilik',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <Layout>
      <Franchise />
    </Layout>
  );
}
