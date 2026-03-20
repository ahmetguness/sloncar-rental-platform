import { Metadata } from 'next';
import { MyBooking } from '../../_pages/MyBooking';

export const metadata: Metadata = {
  title: 'Rezervasyon Sorgula | Yaman Filo Manisa',
  description: 'Mevcut rezervasyonunuzu sorgulayın ve detaylarını inceleyin.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <MyBooking />;
}
