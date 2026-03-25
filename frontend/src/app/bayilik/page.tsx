import { Metadata } from 'next';
import { Franchise } from '../../_pages/Franchise';

export const metadata: Metadata = {
  title: 'Franchise & Bayilik Başvurusu | Yaman Filo Manisa',
  description: 'Yaman Filo ailesine katılın! Manisa ve çevre iller için araç kiralama franchise (bayilik) başvuru formunu doldurarak kendi işinizin sahibi olun.',
  alternates: {
    canonical: '/bayilik',
  },
};

export default function Page() {
  return <Franchise />;
}
